// API Service for Production
const API_BASE_URL = '/api';

class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async refreshAccessToken() {
        try {
            // Refresh token is in httpOnly cookie — no body needed
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) return null;

            const data = await response.json().catch(() => null);
            if (!data?.token) return null;

            localStorage.setItem('token', data.token);
            if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

            return data.token;
        } catch {
            return null;
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('token');

        const headers = {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        };

        if (!('Content-Type' in headers)) {
            headers['Content-Type'] = 'application/json';
        }
        Object.keys(headers).forEach(key => {
            if (headers[key] === undefined) delete headers[key];
        });

        const config = {
            ...options,
            credentials: 'include',
            headers,
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401 && !options._retry && endpoint !== '/auth/refresh') {
                const newToken = await this.refreshAccessToken();
                if (newToken) {
                    // Only auto-retry safe (idempotent) methods.
                    // POST/PUT/DELETE must NOT be retried — they can cause
                    // duplicate creates/updates.
                    const method = (options.method || 'GET').toUpperCase();
                    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
                        return this.request(endpoint, { ...options, _retry: true });
                    }
                    // For mutation requests: token was refreshed silently,
                    // reject so the user can retry manually.
                    throw new Error('Session yangilandi. Iltimos, qayta urinib ko\'ring.');
                }
            }

            if (response.status === 401) {
                console.error('Unauthorized - clearing auth data');
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                console.error('API Error:', error);
                throw new Error(error.message || 'Request failed');
            }

            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');

            if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
                return null;
            }

            const text = await response.text();
            if (!text || text.trim() === '') {
                return null;
            }

            return JSON.parse(text);
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint, data, isFormData = false) {
        if (isFormData) {
            return this.request(endpoint, {
                method: 'POST',
                body: data,
                headers: { 'Content-Type': undefined },
            });
        }
        return this.request(endpoint, {
            method: 'POST',
            body: data !== undefined ? JSON.stringify(data) : undefined,
        });
    }

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

const api = new ApiClient(API_BASE_URL);

export default api;

export const apiGet = (endpoint) => api.get(endpoint);
export const apiPost = (endpoint, data) => api.post(endpoint, data);
export const apiPut = (endpoint, data) => api.put(endpoint, data);
export const apiPatch = (endpoint, data) => api.patch(endpoint, data);
export const apiDelete = (endpoint) => api.delete(endpoint);
