import { API_BASE_URL, getFileUrl } from '../config.js';
import EnrollmentModal from '../components/EnrollmentModal.js';

export default class Courses {
    constructor() {
        this.container = document.getElementById('main-content');
        this.courses = [];
        this.userEnrollments = [];
        this.loading = true;
        this.onUpdate = (event) => {
            const update = event.detail;
            if (update && (update.entityType === 'COURSE' || update.entityType === 'ENROLLMENT')) {
                this.loadData();
            }
        };
    }

    async render() {
        this.container.innerHTML = `
            <div class="page-header">
                <h1>Kurslar</h1>
                <p>Barcha mavjud kurslar</p>
            </div>

            <div class="courses-grid" id="coursesGrid">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Kurslar yuklanmoqda...</p>
                </div>
            </div>
        `;

        await this.loadData();

        // Listen for real-time updates
        window.addEventListener('robotronix-update', this.onUpdate);
    }

    async loadData() {
        try {
            const { default: api } = await import('../services/api.js');

            // Parallel ravishda kurslarni va foydalanuvchi arizalarini yuklash
            const [courses, enrollments] = await Promise.all([
                api.get('/courses'),
                api.get('/courses/my-enrollments')
            ]);

            this.courses = courses;
            this.userEnrollments = enrollments;
            this.loading = false;

            this.renderCourses();
        } catch (error) {
            console.error('Kurslarni yuklashda xatolik:', error);
            document.getElementById('coursesGrid').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Ma'lumotlarni yuklashda xatolik yuz berdi</p>
                    <button class="btn-primary" onclick="location.reload()">Qayta urinish</button>
                </div>
            `;
        }
    }

    renderCourses() {
        const grid = document.getElementById('coursesGrid');

        if (this.courses.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <p>Hozircha kurslar mavjud emas</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.courses.map(course => {
            const enrollment = this.userEnrollments.find(e => e.course && e.course.id === course.id);
            const isEnrolled = !!enrollment;
            const status = enrollment?.status;

            let buttonHTML = '';
            if (!isEnrolled) {
                buttonHTML = `
                    <button class="btn-primary btn-full enroll-btn" data-id="${course.id}">
                        <i class="fas fa-user-plus"></i> Kursga yozilish
                    </button>
                `;
            } else {
                const statusMap = {
                    'PENDING': { text: 'Ariza kutilmoqda', class: 'status-pending', icon: 'clock' },
                    'CONFIRMED': { text: 'O\'qishda', class: 'status-active', icon: 'check-double' },
                    'REJECTED': { text: 'Rad etilgan', class: 'status-rejected', icon: 'times-circle' },
                    'COMPLETED': { text: 'Tugallangan', class: 'status-completed', icon: 'certificate' }
                };
                const s = statusMap[status] || { text: 'Yozilgan', class: 'status-info', icon: 'info-circle' };
                buttonHTML = `
                    <button class="btn-status btn-full ${s.class}" disabled>
                        <i class="fas fa-${s.icon}"></i> ${s.text}
                    </button>
                `;
            }

            const imageUrl = getFileUrl(course.imageUrl);

            return `
                <div class="course-card" data-id="${course.id}">
                    <div class="course-image">
                        <img src="${imageUrl}" alt="${course.title}">
                        <div style="position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem; z-index: 2;">
                            <div class="course-category-badge" style="position: static;">${course.category || 'Robototexnika'}</div>
                            <div class="course-category-badge" style="position: static; background: ${course.isOnline ? 'var(--success, #22c55e)' : 'var(--warning, #f59e0b)'} !important; border-color: ${course.isOnline ? 'var(--success, #22c55e)' : 'var(--warning, #f59e0b)'} !important; color: white;">
                                <i class="fas ${course.isOnline ? 'fa-globe' : 'fa-building'}"></i> ${course.isOnline ? 'Online' : 'Oflayn'}
                            </div>
                        </div>
                    </div>
                    <div class="course-body">
                        <div class="course-age">${course.ageGroup || 'Barcha yoshlar'}</div>
                        <h3>${course.title}</h3>
                    <p class="course-desc">${course.description}</p>

                    <div class="course-features">
                        <div class="feature-item">
                            <i class="fas fa-clock"></i>
                            <span>${course.duration}</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-wallet"></i>
                            <span class="course-price">${(course.price || 0).toLocaleString()} so'm</span>
                        </div>
                    </div>

                    <div class="course-actions">
                        ${buttonHTML}
                    </div>
                </div>
                </div >
                `;
        }).join('');

        this.attachEvents();
    }

    attachEvents() {
        document.querySelectorAll('.enroll-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEnroll(e));
        });
    }

    async handleEnroll(event) {
        const btn = event.target;
        const courseId = btn.dataset.id;
        const course = this.courses.find(c => String(c.id) === String(courseId));
        if (!course) return;

        const modal = new EnrollmentModal({
            course,
            onSuccess: async () => {
                this.showNotification('Arizangiz muvaffaqiyatli qabul qilindi!', 'success');
                await this.loadData();
            }
        });
        modal.render();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    destroy() {
        window.removeEventListener('robotronix-update', this.onUpdate);
    }
}

