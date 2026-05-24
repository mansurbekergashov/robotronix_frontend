import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
    _idempotencyKey?: string;
};

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    try {
        // Refresh token is in httpOnly cookie — no body needed
        const response = await axios.post('/api/auth/refresh', {}, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
        });

        const { token, user } = response.data || {};

        if (token) localStorage.setItem('token', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));

        return token || null;
    } catch {
        return null;
    }
}

// Generate a unique idempotency key for mutation requests
export function generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Attach JWT token to every request + idempotency key for mutations
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // When sending FormData, remove the default Content-Type
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        // Add idempotency key for mutation requests to prevent duplicates
        const method = (config.method || 'GET').toUpperCase();
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            const retryableConfig = config as RetryableRequestConfig;
            if (!retryableConfig._idempotencyKey) {
                // Preserve a caller-supplied key (per-form session key) so that
                // duplicate requests from the same form open use the same key.
                const callerKey = config.headers?.['X-Idempotency-Key'];
                retryableConfig._idempotencyKey = typeof callerKey === 'string' && callerKey
                    ? callerKey
                    : generateIdempotencyKey();
            }
            config.headers['X-Idempotency-Key'] = retryableConfig._idempotencyKey;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Auto-refresh token on 401 and retry once
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const status = error.response?.status;
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        if (status === 401 && originalRequest && !originalRequest._retry) {
            const url = String(originalRequest.url || '');
            if (!url.includes('/auth/login') && !url.includes('/auth/refresh')) {
                originalRequest._retry = true;

                if (!refreshInFlight) {
                    refreshInFlight = refreshAccessToken().finally(() => {
                        refreshInFlight = null;
                    });
                }

                const newToken = await refreshInFlight;
                if (newToken) {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    // Retry is safe: Spring WebFlux security filter rejects
                    // 401 BEFORE processing the request body, so the mutation
                    // was never applied. The idempotency key header ensures
                    // duplicate protection on the server side.
                    return api(originalRequest);
                }
            }
        }

        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        // 409 Conflict = duplicate request (idempotency key already used) — silently ignore
        if (status === 409) {
            console.warn('Duplicate request blocked by server (409 Conflict)');
            return Promise.resolve({ data: null, status: 409, headers: {}, config: error.config!, statusText: 'Conflict' } as any);
        }

        // 429 Too Many Requests = rate limited — show user-friendly message
        if (status === 429) {
            console.warn('Rate limited by server (429 Too Many Requests)');
            return Promise.reject(new Error('Iltimos, bir oz kuting va qayta urinib ko\'ring'));
        }

        if (status && status >= 500) {
            console.error('Server xatosi:', status, error.response?.data)
        } else if (!error.response && error.message === 'Network Error') {
            console.error('Tarmoq xatosi: server yoki internet muammosi')
        }

        return Promise.reject(error);
    }
);

export default api;
