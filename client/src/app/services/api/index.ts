import { createHttpClient } from './http';

let accessToken: string | null = null;

export const api = createHttpClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  getAccessToken: () => accessToken,
  setAccessToken: (t) => {
    accessToken = t;
  },
});

export function setAccessToken(t: string | null) {
  accessToken = t;
}

export function getAccessToken() {
  return accessToken;
}
