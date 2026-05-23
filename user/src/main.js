// Main Application Entry Point
import { AuthService } from './services/auth.js';
import { Router } from './services/router.js';
import { Sidebar } from './components/Sidebar.js';
import api from './services/api.js';
import { syncService } from './services/sync.js';


class App {
    constructor() {
        this.auth = new AuthService();
        this.router = new Router();
        this.sidebar = null;
        this.inactivityTimer = null;
        this.isInitializing = true;
        this.initTheme();
        this.init();
    }

    initTheme() {
    const savedTheme = localStorage.getItem("theme");

        if (savedTheme === "dark") {
            document.documentElement.classList.add("dark");
            this.dark = true;
        } else {
            this.dark = false;
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle("dark");

        this.dark = isDark;
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }

    

    async init() {
        const loadingOverlay = this.createLoadingOverlay();
        document.body.appendChild(loadingOverlay);

        // In local dev the main site (localhost:3000) and user panel (localhost:3002)
        // are different origins and cannot share localStorage. The main site passes
        // tokens via URL params after login so we can bootstrap this origin's storage.
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
            localStorage.setItem('token', urlToken);
            // Remove token from URL without triggering navigation
            const cleanUrl = window.location.pathname + window.location.hash;
            history.replaceState(null, '', cleanUrl);
        }

        try {
            // Check basic authentication (presence of token)
            if (!this.auth.isAuthenticated()) {
                this.redirectToMainSite();
                return;
            }

            // Mark this tab as "user-panel"
            sessionStorage.setItem('robotronix_active_app', 'user-panel');

            // Verify session with backend strictly
            try {
                const response = await api.get('/profile');
                if (!response || !response.id) {
                    throw new Error('Sessiya yaroqsiz');
                }
                
                let user = response; // response IS the user object
                if (user.role === 'ADMIN') {
                    window.location.href = `${window.location.origin}/admin-panel/`;
                    return;
                }
                
                this.auth.login(this.auth.getToken(), user);
            } catch (error) {
                console.error('Session verification failed:', error);
                this.auth.logout();
                return;
            }

            // If we get here, session is verified
            this.sidebar = new Sidebar();
            this.sidebar.render();
            this.router.init();
            syncService.init();

            const hash = window.location.hash.substring(1) || 'dashboard';
            this.router.navigate(hash);
            this.setupAutoLogout();

        } finally {
            this.isInitializing = false;
            if (loadingOverlay.parentNode) {
                loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
        }
    }

    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'app-init-loading';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '99999',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        });

        overlay.innerHTML = `
            <div class="loader" style="width: 45px; height: 45px; border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <div style="margin-top: 20px; font-weight: 500; letter-spacing: 0.5px; font-size: 14px; opacity: 0.8; text-transform: uppercase;">Sessiya tekshirilmoqda...</div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
        return overlay;
    }

    setupAutoLogout() {
        this._resetInactivityTimer = () => {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = setTimeout(() => {
                this.auth.logout();
            }, 5 * 60 * 1000); // 5 minutes
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, this._resetInactivityTimer);
        });

        this._resetInactivityTimer();
    }

    teardownAutoLogout() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.removeEventListener(event, this._resetInactivityTimer);
        });
        clearTimeout(this.inactivityTimer);
    }

    redirectToMainSite() {
        window.location.href = `${window.location.origin}/login`;
    }
}

const app = new App();

document.addEventListener("click", (e) => {
  const btn = e.target.closest("#themeBtn");

  if (btn) {
    app.toggleTheme();
  }
});

