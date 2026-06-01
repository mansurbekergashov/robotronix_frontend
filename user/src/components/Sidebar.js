import { AuthService } from '../services/auth.js';
import { API_BASE_URL, getFileUrl } from '../config.js';
import showConfirm from '../services/confirm.js';

export class Sidebar {
    constructor() {
        this.auth = new AuthService();
        this.user = this.auth.getUser();

        // Fetch fresh user data from API to sync avatar and other profile changes
        this.fetchFreshUserData();

        // Listen for profile updates
        this._onProfileUpdated = (e) => this.updateUserInfo(e.detail);
        window.addEventListener('userProfileUpdated', this._onProfileUpdated);
    }


    async fetchFreshUserData() {
        try {
            const { default: api } = await import('../services/api.js');
            const freshUser = await api.get('/profile');
            if (freshUser) {
                // Update localStorage with fresh data
                localStorage.setItem('user', JSON.stringify(freshUser));
                this.updateUserInfo(freshUser);
            }
        } catch (error) {
            // Silently fail â€” use cached data from localStorage
            console.error('Failed to fetch fresh user data:', error);
        }
    }


    render() {
        const sidebar = document.getElementById('sidebar');
        sidebar.innerHTML = this.getHTML();
        this.attachEvents();
        this.addMobileHeader();
    }

    addMobileHeader() {
        // Create mobile header if it doesn't exist
        if (!document.querySelector('.mobile-header')) {
            const header = document.createElement('div');
            header.className = 'mobile-header';
            header.innerHTML = `
                <button class="mobile-toggle" id="mobileToggle">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="mobile-logo-text">Robotronix</div>
            `;
            document.body.prepend(header);

            const overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            overlay.id = 'mobileOverlay';
            document.body.appendChild(overlay);

            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.getElementById('mobileToggle');

            const toggleSidebar = () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('show');
                toggleBtn.innerHTML = sidebar.classList.contains('open')
                    ? '<i class="fas fa-times"></i>'
                    : '<i class="fas fa-bars"></i>';
                localStorage.setItem('sidebarOpen', sidebar.classList.contains('open'));
            };

            // Restore sidebar state from localStorage
            const isSidebarOpen = localStorage.getItem('sidebarOpen') === 'true';
            if (isSidebarOpen) {
                sidebar.classList.add('open');
                overlay.classList.add('show');
                toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
            }

            toggleBtn.addEventListener('click', toggleSidebar);
            overlay.addEventListener('click', toggleSidebar);

            // Close sidebar when clicking nav items on mobile
            const navItems = sidebar.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                        toggleSidebar();
                    }
                });
            });
        }
    }

    getHTML() {
        const avatarUrl = this.auth.getAvatarUrl(this.user);

        return `
            <!-- Brand -->
            <div class="sidebar-brand">
                <div class="brand-logo">
                    <img src="/robologo.png" alt="Robotronix" style="border-radius: 8px;">
                </div>
                <div class="brand-text">
                    <h2>Robotronix</h2>
                    <p>Foydalanuvchi Panel</p>
                </div>
            </div>

            <!-- User Info -->
            <div class="sidebar-header">
                <div class="user-avatar">
                    <img src="${avatarUrl}" alt="User">
                </div>
                <h3 class="user-name">${this.user?.fullName || 'Foydalanuvchi'}</h3>
                <p class="user-email">${this.user?.email || ''}</p>
            </div>

            <!-- Navigation -->
            <nav class="sidebar-nav">
                <a href="#dashboard" class="nav-item active" data-page="dashboard">
                    <span class="nav-icon"><i class="fas fa-home"></i></span>
                    <span class="nav-label">Dashboard</span>
                </a>

                <a href="#news" class="nav-item" data-page="news">
                    <span class="nav-icon"><i class="fas fa-newspaper"></i></span>
                    <span class="nav-label">Yangiliklar</span>
                </a>
                
                <a href="#courses" class="nav-item" data-page="courses">
                    <span class="nav-icon"><i class="fas fa-book"></i></span>
                    <span class="nav-label">Kurslar</span>
                </a>

                <a href="#my-courses" class="nav-item" data-page="my-courses">
                    <span class="nav-icon"><i class="fas fa-graduation-cap"></i></span>
                    <span class="nav-label">Kurslarim</span>
                </a>

                <a href="#my-certificates" class="nav-item" data-page="my-certificates">
                    <span class="nav-icon"><i class="fas fa-certificate"></i></span>
                    <span class="nav-label">Sertifikatlarim</span>
                </a>
                
                <a href="#orders" class="nav-item" data-page="orders">
                    <span class="nav-icon"><i class="fas fa-shopping-bag"></i></span>
                    <span class="nav-label">Buyurtmalarim</span>
                </a>
                
                <a href="#products" class="nav-item" data-page="products">
                    <span class="nav-icon"><i class="fas fa-store"></i></span>
                    <span class="nav-label">Do'kon</span>
                </a>
                
                <a href="#cart" class="nav-item" data-page="cart">
                    <span class="nav-icon"><i class="fas fa-shopping-cart"></i></span>
                    <span class="nav-label">Savat</span>
                    <span class="nav-badge" id="cartBadge">0</span>
                </a>
                
                <a href="#chat" class="nav-item" data-page="chat">
                    <span class="nav-icon"><i class="fas fa-comments"></i></span>
                    <span class="nav-label">Chat</span>
                    <span class="chat-badge" id="chatBadge" style="display: none;">0</span>
                </a>
                
                <a href="#guide" class="nav-item" data-page="guide">
                    <span class="nav-icon"><i class="fas fa-book-open"></i></span>
                    <span class="nav-label">Yo'riqnoma</span>
                </a>
                
                <a href="#help" class="nav-item" data-page="help">
                    <span class="nav-icon"><i class="fas fa-headset"></i></span>
                    <span class="nav-label">Yordam</span>
                </a>
                
                <a href="#profile" class="nav-item" data-page="profile">
                    <span class="nav-icon"><i class="fas fa-user"></i></span>
                    <span class="nav-label">Profil</span>
                </a>
            </nav>

            <!-- Footer -->
            <div class="sidebar-footer">
                <button class="nav-item" id="themeBtn">
                    <span class="nav-icon"><i class="fas fa-sun"></i></span>
                    <span class="nav-label">Rejim</span>
                </button>
                <button class="nav-item" id="backToSiteBtn">
                    <span class="nav-icon"><i class="fas fa-globe"></i></span>
                    <span class="nav-label">Saytga qaytish</span>
                </button>
                <button class="nav-item logout" id="logoutBtn">
                    <span class="nav-icon"><i class="fas fa-sign-out-alt"></i></span>
                    <span class="nav-label">Chiqish</span>
                </button>
            </div>
        `;
    }

    attachEvents() {
        // Back to site button
        const backToSiteBtn = document.getElementById('backToSiteBtn');
        if (backToSiteBtn) {
            backToSiteBtn.addEventListener('click', () => {
                // Clear auth data (logout)
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('userCart');
                sessionStorage.removeItem('robotronix_active_app');

                // Redirect to main site
                const mainSiteUrl = '/';
                window.location.href = mainSiteUrl;
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const ok = await showConfirm({ message: 'Haqiqatan ham chiqmoqchimisiz?' });
                if (!ok) return;
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('userCart');
                sessionStorage.removeItem('robotronix_active_app');
                window.location.href = '/';
            });
        }

        // Update badges
        this.updateCartBadge();
        this.updateChatBadge();

        // Refresh badge on real-time CHAT events
        this._onChatUpdate = (event) => {
            const update = event.detail;
            if (update?.entityType === 'CHAT') {
                this.updateChatBadge();
            }
        };
        window.addEventListener('robotronix-update', this._onChatUpdate);

        // Also refresh on the unread-update event dispatched by the chat page itself
        this._onUnreadUpdate = () => this.updateChatBadge();
        window.addEventListener('robotronix:chat-unread-update', this._onUnreadUpdate);
    }

    async updateChatBadge() {
        try {
            const { default: api } = await import('../services/api.js');
            const response = await api.get('/chat/unread-count');
            const badge = document.getElementById('chatBadge');
            if (badge) {
                const count = response?.count || 0;
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }

    updateCartBadge() {
        const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = cart.length;
        }
    }

    updateUserInfo(user) {
        if (!user) return;
        this.user = user;

        const avatarUrl = this.auth.getAvatarUrl(user);
        const sidebarName = document.querySelector('.user-name');
        const sidebarEmail = document.querySelector('.user-email');
        const sidebarImg = document.querySelector('.user-avatar img');

        if (sidebarName) sidebarName.textContent = user.fullName || 'Foydalanuvchi';
        if (sidebarEmail) sidebarEmail.textContent = user.email || '';
        if (sidebarImg) {
            sidebarImg.src = avatarUrl;
        }
    }

    destroy() {
        if (this._onProfileUpdated) window.removeEventListener('userProfileUpdated', this._onProfileUpdated);
        if (this._onChatUpdate) window.removeEventListener('robotronix-update', this._onChatUpdate);
        if (this._onUnreadUpdate) window.removeEventListener('robotronix:chat-unread-update', this._onUnreadUpdate);
    }
}

