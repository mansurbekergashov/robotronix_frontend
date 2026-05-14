// API Service for Production
const API_BASE_URL = '/api';

class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async refreshAccessToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return null;

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) return null;

            const data = await response.json().catch(() => null);
            if (!data?.token) return null;

            localStorage.setItem('token', data.token);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
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

        // Only set Content-Type for non-FormData requests
        // If Content-Type is explicitly set to undefined (FormData), skip it
        // Otherwise, default to application/json
        if (!('Content-Type' in headers)) {
            headers['Content-Type'] = 'application/json';
        }
        // Remove explicitly undefined headers (for FormData)
        Object.keys(headers).forEach(key => {
            if (headers[key] === undefined) delete headers[key];
        });

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401 && !options._retry && endpoint !== '/auth/refresh') {
                const newToken = await this.refreshAccessToken();
                if (newToken) {
                    return this.request(endpoint, { ...options, _retry: true });
                }
            }

            if (response.status === 401) {
                console.error('Unauthorized - clearing auth data');
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                
                // Prevent infinite loop if already on login page
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

            // Check if response has content
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');

            // If no content or empty response, return null
            if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
                return null;
            }

            // Try to parse JSON, return null if empty
            const text = await response.text();
            if (!text || text.trim() === '') {
                return null;
            }

            const data = JSON.parse(text);
            return data;
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
            body: JSON.stringify(data),
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

// Export API client
export default api;

// Export convenience methods
export const apiGet = (endpoint) => api.get(endpoint);
export const apiPost = (endpoint, data) => api.post(endpoint, data);
export const apiPut = (endpoint, data) => api.put(endpoint, data);
export const apiPatch = (endpoint, data) => api.patch(endpoint, data);
export const apiDelete = (endpoint) => api.delete(endpoint);
