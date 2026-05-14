import { API_BASE_URL } from '../config.js';
import { AuthService } from '../services/auth.js';
import { ProfileService } from '../services/profile.js';

export default class Profile {
    constructor() {
        this.container = document.getElementById('main-content');
        this.auth = new AuthService();
        this.profileService = new ProfileService();
        this.user = this.auth.getUser();
        this.loading = false;
        this.isEditing = false;
        this.showPasswordModal = false;
        this.notification = null;
    }

    formatDate(dateString) {
        if (!dateString) return 'Noma\'lum';
        // Backend returns "dd.MM.yyyy HH:mm"
        if (dateString.includes('.')) {
            return dateString;
        }
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    async render() {
        try {
            // Har doim serverdan yangilab olish
            this.user = await this.profileService.getProfile();
            // LocalStorage ni yangilash
            const token = this.auth.getToken();
            this.auth.login(token, this.user);

            this.renderContent();
        } catch (error) {
            console.error('Profil yuklashda xatolik:', error);
            if (!this.user) {
                this.container.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Profil ma'lumotlarini yuklashda xatolik yuz berdi</p>
                    </div>
                `;
            } else {
                this.renderContent();
            }
        }
    }

    renderContent() {
        const avatarUrl = this.auth.getAvatarUrl(this.user);

        this.container.innerHTML = `
            <div class="page-header">
                <div class="header-title-section">
                    <h1><i class="fas fa-user-circle"></i> Profil</h1>
                    <p>Shaxsiy ma'lumotlaringizni boshqaring</p>
                </div>
            </div>

            <div class="profile-layout">
                <!-- Profile Card -->
                <div class="profile-main-card">
                    <div class="profile-cover">
                        <div class="profile-cover-gradient"></div>
                    </div>
                    <div class="profile-avatar-section">
                        <div class="profile-avatar-wrapper">
                            <img src="${avatarUrl}" alt="Avatar" class="profile-avatar-img" id="avatarImg">
                            <button class="avatar-edit-btn" id="avatarEditBtn" title="Rasmni o'zgartirish">
                                <i class="fas fa-camera"></i>
                            </button>
                            <input type="file" id="avatarInput" accept="image/*" style="display: none;">
                        </div>
                        <div class="profile-header-info">
                            <h2 class="profile-name" id="profileHeaderName">${this.user.fullName}</h2>
                            <p class="profile-email"><i class="fas fa-envelope"></i> ${this.user.email}</p>
                            <span class="profile-role-badge">
                                <i class="fas fa-shield-alt"></i> ${this.user.role || 'USER'}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Info Cards Grid -->
                <div class="profile-info-grid">
                    <!-- Personal Info Card -->
                    <div class="info-card">
                        <div class="info-card-header">
                            <h3><i class="fas fa-user"></i> Shaxsiy Ma'lumotlar</h3>
                            <button class="btn-icon-edit" id="toggleEditBtn" title="Tahrirlash">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                        <div class="info-card-body">
                            <div id="profileDisplayMode">
                                <div class="info-display-row">
                                    <div class="info-display-label">
                                        <i class="fas fa-id-card"></i>
                                        <span>To'liq ism</span>
                                    </div>
                                    <div class="info-display-value">${this.user.fullName}</div>
                                </div>
                                <div class="info-display-row">
                                    <div class="info-display-label">
                                        <i class="fas fa-envelope"></i>
                                        <span>Email</span>
                                    </div>
                                    <div class="info-display-value">${this.user.email}</div>
                                </div>
                                <div class="info-display-row">
                                    <div class="info-display-label">
                                        <i class="fas fa-phone"></i>
                                        <span>Telefon</span>
                                    </div>
                                    <div class="info-display-value">${this.user.phone || 'Kiritilmagan'}</div>
                                </div>
                            </div>
                            <form id="editProfileForm" class="profile-form" style="display: none;">
                                <div class="form-group">
                                    <label>To'liq ism</label>
                                    <input type="text" name="fullName" value="${this.user.fullName}" required class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" name="email" value="${this.user.email}" required class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Telefon</label>
                                    <input type="tel" name="phone" value="${this.user.phone || ''}" 
                                           pattern="^\\+998[0-9]{9}$" placeholder="+998901234567" class="form-control">
                                </div>
                                <div class="form-footer">
                                    <button type="submit" class="btn-primary btn-sm" id="saveProfileBtn">
                                        <i class="fas fa-save"></i> Saqlash
                                    </button>
                                    <button type="button" class="btn-secondary btn-sm" id="cancelEditBtn">
                                        Bekor qilish
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Account Info Card -->
                    <div class="info-card">
                        <div class="info-card-header">
                            <h3><i class="fas fa-user-cog"></i> Hisob Ma'lumotlari</h3>
                        </div>
                        <div class="info-card-body">
                            <div class="info-display-row">
                                <div class="info-display-label">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>Ro'yxatdan o'tgan</span>
                                </div>
                                <div class="info-display-value">${this.formatDate(this.user.createdAt)}</div>
                            </div>
                            <div class="info-display-row">
                                <div class="info-display-label">
                                    <i class="fas fa-history"></i>
                                    <span>Oxirgi yangilanish</span>
                                </div>
                                <div class="info-display-value">${this.formatDate(this.user.updatedAt || this.user.createdAt)}</div>
                            </div>
                            <div class="info-display-row">
                                <div class="info-display-label">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>Hisob holati</span>
                                </div>
                                <div class="info-display-value">
                                    <span class="status-badge status-active">
                                        <i class="fas fa-check-circle"></i> Faol
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions Card -->
                    <div class="info-card">
                        <div class="info-card-header">
                            <h3><i class="fas fa-bolt"></i> Tezkor Amallar</h3>
                        </div>
                        <div class="info-card-body">
                            <div class="quick-action-row" id="changePasswordBtn">
                                <div class="action-icon">
                                    <i class="fas fa-lock"></i>
                                </div>
                                <div class="action-text">Parolni o'zgartirish</div>
                            </div>
                            ${(this.user.avatarUrl && !this.user.avatarUrl.includes('ui-avatars.com')) ? `
                                <div class="quick-action-row danger" id="deleteAvatarBtn" style="margin-top: 15px;">
                                    <div class="action-icon">
                                        <i class="fas fa-trash-alt"></i>
                                    </div>
                                    <div class="action-text">Profil rasmini o'chirish</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Password Modal -->
            <div id="passwordModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Parolni O'zgartirish</h3>
                        <button class="modal-close" id="closePasswordModal">&times;</button>
                    </div>
                    <form id="changePasswordForm">
                        <div class="form-group">
                            <label>Joriy parol</label>
                            <input type="password" name="currentPassword" required class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Yangi parol</label>
                            <input type="password" name="newPassword" required class="form-control">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" id="cancelPasswordBtn">Bekor qilish</button>
                            <button type="submit" class="btn-primary">Saqlash</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="profileNotification" class="notification"></div>
        `;

        this.attachEvents();
    }

    attachEvents() {
        // Avatar upload
        const avatarEditBtn = document.getElementById('avatarEditBtn');
        const avatarInput = document.getElementById('avatarInput');
        avatarEditBtn?.addEventListener('click', () => avatarInput.click());
        avatarInput?.addEventListener('change', (e) => this.handleAvatarUpload(e));

        // Edit Mode Toggle
        const toggleEditBtn = document.getElementById('toggleEditBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const displayMode = document.getElementById('profileDisplayMode');
        const editForm = document.getElementById('editProfileForm');

        toggleEditBtn?.addEventListener('click', () => {
            displayMode.style.display = 'none';
            editForm.style.display = 'block';
            toggleEditBtn.style.display = 'none';
        });

        cancelEditBtn?.addEventListener('click', () => {
            displayMode.style.display = 'block';
            editForm.style.display = 'none';
            toggleEditBtn.style.display = 'flex';
        });

        // Profile Update
        editForm?.addEventListener('submit', (e) => this.handleUpdateProfile(e));

        // Security Actions
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        const passwordModal = document.getElementById('passwordModal');
        const closePasswordModal = document.getElementById('closePasswordModal');
        const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
        const changePasswordForm = document.getElementById('changePasswordForm');

        changePasswordBtn?.addEventListener('click', () => passwordModal.style.display = 'flex');
        closePasswordModal?.addEventListener('click', () => passwordModal.style.display = 'none');
        cancelPasswordBtn?.addEventListener('click', () => passwordModal.style.display = 'none');
        changePasswordForm?.addEventListener('submit', (e) => this.handleChangePassword(e));

        const deleteAvatarBtn = document.getElementById('deleteAvatarBtn');
        deleteAvatarBtn?.addEventListener('click', () => this.handleDeleteAvatar());
    }

    resizeImage(file, maxSize = 800) {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = (e) => {
                img.onload = () => {
                    let { width, height } = img;
                    if (width <= maxSize && height <= maxSize) {
                        resolve(file);
                        return;
                    }
                    if (width > height) {
                        height = (height / width) * maxSize;
                        width = maxSize;
                    } else {
                        width = (width / height) * maxSize;
                        height = maxSize;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        } else {
                            resolve(file);
                        }
                    }, 'image/jpeg', 0.85);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const resizedFile = await this.resizeImage(file, 800);
            const result = await this.profileService.uploadAvatar(resizedFile);
            this.user = result;
            const token = this.auth.getToken();
            this.auth.login(token, result);

            // UI yangilash
            const avatarImg = document.getElementById('avatarImg');
            if (avatarImg) {
                avatarImg.src = this.auth.getAvatarUrl(result);
            }

            this.showNotification('Avatar muvaffaqiyatli yuklandi', 'success');
            
            // Re-render the whole content to show the delete button if not present
            this.renderContent();
        } catch (error) {
            console.error('Avatar yuklashda xatolik:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async handleUpdateProfile(event) {
        event.preventDefault();
        const saveBtn = document.getElementById('saveProfileBtn');
        const originalBtnHTML = saveBtn.innerHTML;

        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';

            const formData = new FormData(event.target);
            const data = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone')
            };

            const result = await this.profileService.updateProfile(data);
            this.user = result;
            const token = this.auth.getToken();
            this.auth.login(token, result);

            // Header ismini yangilash
            const headerName = document.getElementById('profileHeaderName');
            if (headerName) headerName.textContent = result.fullName;

            this.showNotification('Profil muvaffaqiyatli yangilandi', 'success');
        } catch (error) {
            console.error('Profilni yangilashda xatolik:', error);
            this.showNotification(error.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHTML;
        }
    }

    async handleDeleteAvatar() {
        if (!confirm('Avatarni o\'chirishni xohlaysizmi?')) return;

        try {
            await this.profileService.deleteAvatar();
            const result = await this.profileService.getProfile();
            this.user = result;
            const token = this.auth.getToken();
            this.auth.login(token, result);

            this.showNotification('Avatar muvaffaqiyatli o\'chirildi', 'success');
            this.renderContent();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleChangePassword(event) {
        event.preventDefault();
        const saveBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnHTML = saveBtn.innerHTML;

        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';

            const formData = new FormData(event.target);
            const data = {
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword')
            };

            await this.profileService.changePassword(data);
            document.getElementById('passwordModal').style.display = 'none';
            event.target.reset();
            this.showNotification('Parol muvaffaqiyatli o\'zgartirildi', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHTML;
        }
    }

    showNotification(message, type) {
        const notification = document.getElementById('profileNotification');
        if (!notification) return;

        notification.className = `notification notification-${type} show`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    destroy() { }
}
