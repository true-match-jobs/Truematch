import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '/api/v1';
const COLD_START_IDLE_THRESHOLD_MS = 12 * 60 * 1000;
const WARMUP_TIMEOUT_MS = 8_000;
const WARMUP_COOLDOWN_MS = 60_000;

let lastApiActivityAt = Date.now();
let warmupPromise: Promise<void> | null = null;
let lastWarmupAttemptAt = 0;
let hasSuccessfulApiResponse = false;

const buildHealthUrl = (rawBaseUrl: string): string => {
  const trimmedBaseUrl = rawBaseUrl.replace(/\/+$/, '');

  if (trimmedBaseUrl === '/api/v1') {
    return '/health';
  }

  if (trimmedBaseUrl.endsWith('/api/v1')) {
    return `${trimmedBaseUrl.slice(0, -7)}/health`;
  }

  if (trimmedBaseUrl.startsWith('http://') || trimmedBaseUrl.startsWith('https://')) {
    return `${trimmedBaseUrl}/health`;
  }

  return '/health';
};

const healthUrl = buildHealthUrl(baseURL);

const shouldWarmupBeforeRequest = (method?: string, url?: string): boolean => {
  if (!method) {
    return false;
  }

  const normalizedMethod = method.toUpperCase();

  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalizedMethod)) {
    return false;
  }

  if (url?.includes('/auth/refresh')) {
    return false;
  }

  if (!hasSuccessfulApiResponse) {
    return true;
  }

  return Date.now() - lastApiActivityAt > COLD_START_IDLE_THRESHOLD_MS;
};

const warmupBackend = async (force = false): Promise<void> => {
  const now = Date.now();

  if (!force && now - lastWarmupAttemptAt < WARMUP_COOLDOWN_MS) {
    return;
  }

  lastWarmupAttemptAt = now;

  if (!warmupPromise) {
    warmupPromise = axios
      .get(healthUrl, {
        timeout: WARMUP_TIMEOUT_MS,
        withCredentials: true
      })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        warmupPromise = null;
      });
  }

  await warmupPromise;
};

export const prewarmBackend = async (): Promise<void> => {
  await warmupBackend(true);
};

export const api = axios.create({
  baseURL,
  withCredentials: true
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.request.use(async (config) => {
  if (shouldWarmupBeforeRequest(config.method, config.url)) {
    await warmupBackend();
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    lastApiActivityAt = Date.now();
    hasSuccessfulApiResponse = true;
    return response;
  },
  async (error: AxiosError) => {
    lastApiActivityAt = Date.now();
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !(originalRequest as { _retry?: boolean })._retry
    ) {
      (originalRequest as { _retry?: boolean })._retry = true;

      if (!refreshPromise) {
        refreshPromise = api
          .post('/auth/refresh')
          .then(() => undefined)
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        return api(originalRequest);
      } catch (_refreshError) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
