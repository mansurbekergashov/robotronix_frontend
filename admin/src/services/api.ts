import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
        const response = await axios.post('/api/auth/refresh', { refreshToken }, {
            headers: { 'Content-Type': 'application/json' },
        });

        const { token, refreshToken: newRefreshToken, user } = response.data || {};

        if (token) localStorage.setItem('token', token);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
        if (user) localStorage.setItem('user', JSON.stringify(user));

        return token || null;
    } catch {
        return null;
    }
}

// Attach JWT token to every request
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
                    return api(originalRequest);
                }
            }
        }

        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            // Prevent infinite loop if already on login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        // Global check for Internal Server Error or Network Down
        if (status && status >= 500) {
            alert("Server xatosi: Iltimos, birozdan so'ng qayta urinib ko'ring yoki administratorga murojaat qiling.");
        } else if (!error.response && error.message === 'Network Error') {
            alert("Internetga ulanishda xatolik! Server ishlamayapti yoki tarmoq uzildi.");
        }

        return Promise.reject(error);
    }
);

export default api;
