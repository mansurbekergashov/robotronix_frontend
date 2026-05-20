// Authentication Service
import { API_BASE_URL } from '../config.js';

export class AuthService {
    constructor() {
        this.tokenKey = 'token';  // Changed from 'userToken' to 'token'
        this.userKey = 'user';    // Changed from 'userData' to 'user'
    }

    isAuthenticated() {
        return !!localStorage.getItem(this.tokenKey);
    }

    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    login(token, user) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));

        // Dispatch event for other components to update
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: user }));
    }

    getAvatarUrl(user) {
        if (!user) return `https://ui-avatars.com/api/?name=User&background=0066ff&color=fff`;

        if (user.avatarUrl) {
            if (user.avatarUrl.startsWith('http')) {
                return user.avatarUrl;
            }
            // Add timestamp for cache busting
            const baseUrl = user.avatarUrl.startsWith('/') ? user.avatarUrl : `/${user.avatarUrl}`;
            return `${API_BASE_URL}${baseUrl}?t=${new Date().getTime()}`;
        }

        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=0066ff&color=fff`;
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch { /* ignore */ }
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem('userCart');
        sessionStorage.removeItem('robotronix_active_app');

        window.location.href = '/';
    }
}
