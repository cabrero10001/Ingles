import { createHttpClient } from './http';

let accessToken: string | null = null;
const defaultBaseUrl = import.meta.env.PROD
  ? 'https://linguapath-api.onrender.com/api'
  : 'http://localhost:4000/api';

function normalizeApiBaseUrl(url: string) {
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL
  ? normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
  : defaultBaseUrl;

export const api = createHttpClient({
  baseUrl: configuredBaseUrl,
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
