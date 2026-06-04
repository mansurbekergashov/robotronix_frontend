import api from '../services/api.js';
import toast from '../services/toast.js';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 900000; // 15 daqiqa

export default class EnrollmentModal {
    constructor(options = {}) {
        this.course    = options.course;
        this.onSuccess = options.onSuccess || (() => {});
        this.onClose   = options.onClose   || (() => {});
        this._pollTimer   = null;
        this._pollTimeout = null;
        this._modal = null;
    }

    render() {
        const isFree = !this.course?.price || this.course.price === 0;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'enrollmentModal';

        const paymentBlock = isFree ? `
            <div class="checkout-summary" style="margin-top:20px; background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.25); border-radius:10px; padding:14px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.6rem">🎓</span>
                    <div>
                        <div style="font-weight:600; color:#10b981">Bepul kurs</div>
                        <div style="font-size:13px; color:#6ee7b7">
                            Bu kurs to'lovsiz taqdim etiladi
                        </div>
                    </div>
                </div>
            </div>
        ` : `
            <div class="checkout-summary" style="margin-top:20px; background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.25); border-radius:10px; padding:14px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.6rem">💳</span>
                    <div>
                        <div style="font-weight:600; color:#10b981">Payme orqali to'lov</div>
                        <div style="font-size:13px; color:#6ee7b7">
                            Yozilgandan so'ng Payme to'lov sahifasi avtomatik ochiladi
                        </div>
                    </div>
                </div>
            </div>
        `;

        const submitLabel = isFree
            ? `<i class="fas fa-user-plus"></i> Kursga bepul yozilish`
            : `<i class="fas fa-credit-card"></i> Kursga yozilish va Payme orqali to'lash`;

        modal.innerHTML = `
            <div class="modal-content checkout-modal-content detail-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-graduation-cap"></i> Kursga yozilish</h2>
                    <button class="close-btn" id="closeEnrollment">&times;</button>
                </div>
                <div class="modal-body" id="enrollmentBody">
                    <form class="checkout-form" id="enrollmentForm">

                        <div class="checkout-summary">
                            <div class="detail-section-title" style="margin-top:0">
                                <i class="fas fa-book"></i> Kurs ma'lumotlari
                            </div>
                            <div class="payment-card-line">
                                <strong>${this.course?.title || 'Kurs'}</strong>
                            </div>
                            <div class="payment-card-line" style="font-size:18px; color:${isFree ? '#10b981' : '#33cccc'}; font-weight:600; margin-top:6px;">
                                ${isFree ? 'Bepul' : `${(this.course?.price || 0).toLocaleString()} so'm`}
                            </div>
                        </div>

                        ${paymentBlock}

                        <div class="detail-control" style="margin-top:20px">
                            <div class="detail-actions">
                                <button type="submit" class="btn-confirm-delivery" id="submitEnrollBtn">
                                    ${submitLabel}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this._modal = modal;
        this._setupEventListeners(modal);
    }

    _setupEventListeners(modal) {
        modal.querySelector('#closeEnrollment').onclick = () => this.close();
        modal.onclick = (e) => { if (e.target === modal) this.close(); };

        const isFree = !this.course?.price || this.course.price === 0;

        modal.querySelector('#enrollmentForm').onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = modal.querySelector('#submitEnrollBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yozilmoqda...';

            try {
                const payload = isFree ? { paymentMethod: 'FREE' } : { paymentMethod: 'PAYME' };
                const response = await api.post(`/courses/${this.course.id}/enroll`, payload);
                const { id: enrollId, paymentUrl } = response;

                if (isFree || !paymentUrl) {
                    this._showSuccess();
                    setTimeout(() => { this.close(); this.onSuccess(); }, 2000);
                } else {
                    window.open(paymentUrl, '_blank');
                    this._showWaitingState(paymentUrl);
                    this._startPolling(enrollId);
                }
            } catch (error) {
                console.error('Enrollment error:', error);
                toast.error('Ariza yuborishda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
                submitBtn.disabled = false;
                const label = isFree
                    ? '<i class="fas fa-user-plus"></i> Kursga bepul yozilish'
                    : '<i class="fas fa-credit-card"></i> Kursga yozilish va Payme orqali to\'lash';
                submitBtn.innerHTML = label;
            }
        };
    }

    _showWaitingState(paymentUrl) {
        const body = this._modal.querySelector('#enrollmentBody');
        body.innerHTML = `
            <div style="text-align:center; padding:40px 20px">
                <div style="font-size:3rem; margin-bottom:16px">💳</div>
                <h3 style="color:white; margin-bottom:12px">Payme to'lov oynasi ochildi</h3>
                <p style="color:#8b92a7; margin-bottom:8px">
                    Yangi tabda Payme sahifasini ko'ring va to'lovni amalga oshiring.
                </p>
                <p style="color:#8b92a7; margin-bottom:24px">
                    To'lov tasdiqlangandan so'ng bu sahifa avtomatik yangilanadi...
                </p>
                <div style="width:36px;height:36px;border:4px solid #2d3748;border-top-color:#33cccc;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 24px;"></div>
                <button id="reopenPaymeEnroll" style="background:#33cccc;color:#0f172a;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;">
                    <i class="fas fa-external-link-alt"></i> Payme sahifasini qayta ochish
                </button>
            </div>
        `;
        body.querySelector('#reopenPaymeEnroll').onclick = () => window.open(paymentUrl, '_blank');
    }

    _startPolling(enrollId) {
        this._stopPolling();
        this._pollTimer = setInterval(async () => {
            try {
                const enrollments = await api.get('/courses/my-enrollments');
                const enr = (enrollments || []).find(e => e.id === enrollId);
                if (enr?.paymentConfirmed) {
                    this._stopPolling();
                    this._showSuccess();
                    setTimeout(() => { this.close(); this.onSuccess(); }, 2500);
                }
            } catch (_) {}
        }, POLL_INTERVAL_MS);

        this._pollTimeout = setTimeout(() => {
            this._stopPolling();
            this._showTimeout();
        }, POLL_TIMEOUT_MS);
    }

    _stopPolling() {
        if (this._pollTimer)   { clearInterval(this._pollTimer);  this._pollTimer = null; }
        if (this._pollTimeout) { clearTimeout(this._pollTimeout); this._pollTimeout = null; }
    }

    _showSuccess() {
        const body = this._modal?.querySelector('#enrollmentBody');
        if (!body) return;
        body.innerHTML = `
            <div style="text-align:center; padding:40px 20px">
                <div style="font-size:4rem; color:#10b981; margin-bottom:20px">✅</div>
                <h2 style="color:white; margin-bottom:12px">Kursga muvaffaqiyatli yozildingiz!</h2>
                <p style="color:#8b92a7">Tez orada operatorlarimiz siz bilan bog'lanadi.</p>
            </div>
        `;
    }

    _showTimeout() {
        const body = this._modal?.querySelector('#enrollmentBody');
        if (!body) return;
        body.innerHTML = `
            <div style="text-align:center; padding:40px 20px">
                <div style="font-size:3rem; margin-bottom:16px">⏰</div>
                <h3 style="color:white; margin-bottom:12px">To'lov vaqti tugadi</h3>
                <p style="color:#8b92a7; margin-bottom:24px">
                    15 daqiqa ichida to'lov tasdiqlanmadi. Qaytadan urinib ko'ring.
                </p>
                <button id="closeEnrollTimeout" style="background:#33cccc;color:#0f172a;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-weight:600">
                    Yopish
                </button>
            </div>
        `;
        body.querySelector('#closeEnrollTimeout').onclick = () => this.close();
    }

    close() {
        this._stopPolling();
        const modal = document.getElementById('enrollmentModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => { modal.remove(); this.onClose(); }, 300);
        }
    }
}
