import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

let refreshInFlight = null;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const isNetworkError = (error) => !error.response && (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ERR_NETWORK_CHANGED' ||
    error.message === 'Network Error'
);

const refreshAccessToken = async () => {
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
};

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // For FormData requests, let browser set the boundary.
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor: refresh token on 401 and retry once
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const originalRequest = error?.config;

        // Retry up to 2 times on transient network errors (ERR_NETWORK_CHANGED, etc.)
        if (isNetworkError(error) && originalRequest && (originalRequest._retryCount || 0) < 2) {
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
            await delay(originalRequest._retryCount * 800);
            return api(originalRequest);
        }

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
                    return api(originalRequest);
                }
            }
        }

        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
            if (!isAuthPage) {
                window.location.href = '/login';
            }
        }

        if (status && status >= 500) {
            console.error('Server xatosi:', status, error?.response?.data)
        } else if (!error.response && error.message === 'Network Error') {
            console.error('Tarmoq xatosi: server yoki internet muammosi')
        }

        return Promise.reject(error);
    }
);

export default api;
