export type ApiOk<T> = { status: 'ok'; data: T };
export type ApiErr = { status: 'error'; error: { code: string; message: string } };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export type HttpClientOptions = {
  baseUrl: string;
  getAccessToken: () => string | null;
  setAccessToken: (t: string | null) => void;
};

function joinUrl(baseUrl: string, path: string) {
  const b = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export function createHttpClient(opts: HttpClientOptions) {
  let refreshing: Promise<void> | null = null;

  async function refreshOnce() {
    if (!refreshing) {
      refreshing = (async () => {
        const res = await fetch(joinUrl(opts.baseUrl, '/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
        });
        const body = (await parseJsonSafe(res)) as ApiResponse<{ accessToken: string }> | null;
        if (!res.ok || !body || body.status !== 'ok') {
          opts.setAccessToken(null);
          return;
        }
        opts.setAccessToken(body.data.accessToken);
      })().finally(() => {
        refreshing = null;
      });
    }
    await refreshing;
  }

  async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');

    const token = opts.getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let body: BodyInit | undefined;
    if (init.json !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(init.json);
    } else {
      body = init.body as any;
    }

    const doFetch = () =>
      fetch(joinUrl(opts.baseUrl, path), {
        ...init,
        body,
        headers,
        credentials: 'include',
      });

    let res = await doFetch();
    if (res.status === 401) {
      await refreshOnce();
      res = await doFetch();
    }

    const parsed = (await parseJsonSafe(res)) as ApiResponse<T> | null;
    if (!res.ok) {
      const msg = parsed && parsed.status === 'error' ? parsed.error.message : 'Request failed';
      throw new Error(msg);
    }
    if (!parsed || parsed.status !== 'ok') throw new Error('Invalid response');
    return parsed.data;
  }

  return {
    get<T>(path: string) {
      return request<T>(path, { method: 'GET' });
    },
    post<T>(path: string, json?: unknown) {
      return request<T>(path, { method: 'POST', json });
    },
  };
}
