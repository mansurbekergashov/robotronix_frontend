import api from '../services/api.js';

export default class EnrollmentModal {
    constructor(options = {}) {
        this.course = options.course;
        this.onSuccess = options.onSuccess || (() => { });
        this.onClose = options.onClose || (() => { });
        this.paymentCardId = this.course?.paymentCardId || null;
        this.paymentCardIssue = this.paymentCardId ? null : "Ushbu kurs uchun to'lov kartasi tanlanmagan.";
    }

    render() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'enrollmentModal';

        modal.innerHTML = `
            <div class="modal-content checkout-modal-content detail-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-graduation-cap"></i> Kursga yozilish</h2>
                    <button class="close-btn" id="closeEnrollment">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="checkout-form" id="enrollmentForm">
                        <div class="checkout-summary">
                            <div class="detail-section-title" style="margin-top: 0;">
                                <i class="fas fa-book"></i> Kurs ma'lumotlari
                            </div>
                            <div class="payment-card-info">
                                <div class="payment-card-line"><strong>${this.course?.title || 'Kurs'}</strong></div>
                                <div class="payment-card-line">Narxi: ${(this.course?.price || 0).toLocaleString()} so'm</div>
                            </div>
                        </div>

                        <div class="checkout-summary" style="margin-top: 20px;">
                            <div class="detail-section-title" style="margin-top: 0;">
                                <i class="fas fa-credit-card"></i> To'lov ma'lumotlari
                            </div>
                            <div id="coursePaymentCardInfo" class="payment-card-info">
                                ${this.paymentCardIssue ? `<div class="warning-text">${this.paymentCardIssue}</div>` : '<div class="loading-note">Yuklanmoqda...</div>'}
                            </div>
                            <div class="detail-item full-width" style="margin-top: 12px;">
                                <label><i class="fas fa-file-upload"></i> To'lov cheki (majburiy)</label>
                                <input type="file" id="courseReceiptFile" class="form-input" accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf" ${this.paymentCardIssue ? 'disabled' : ''} required>
                            </div>
                        </div>

                        <div class="detail-control">
                            <h3><i class="fas fa-tasks"></i> Arizani yuborish</h3>
                            <div class="detail-actions">
                                <button type="submit" class="btn-confirm-delivery" id="submitEnrollBtn" ${this.paymentCardIssue ? 'disabled' : ''}>
                                    <i class="fas fa-check-circle"></i> Yuborish
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupEventListeners(modal);
        this.loadPaymentCardInfo(modal);
    }

    setupEventListeners(modal) {
        const closeBtn = modal.querySelector('#closeEnrollment');
        const form = modal.querySelector('#enrollmentForm');

        closeBtn.onclick = () => this.close();
        modal.onclick = (e) => {
            if (e.target === modal) this.close();
        };

        form.onsubmit = async (e) => {
            e.preventDefault();
            if (this.paymentCardIssue) {
                alert(this.paymentCardIssue);
                return;
            }

            const submitBtn = modal.querySelector('#submitEnrollBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...';

            try {
                const receiptInput = modal.querySelector('#courseReceiptFile');
                const receiptFile = receiptInput?.files?.[0];
                if (!receiptFile) {
                    alert('Iltimos, to\'lov chekini yuklang');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Yuborish';
                    return;
                }

                const payload = new FormData();
                payload.append('receipt', receiptFile);

                const response = await api.post(`/courses/${this.course.id}/enroll`, payload, true);
                if (response) {
                    this.showSuccess();
                    setTimeout(() => {
                        this.close();
                        this.onSuccess();
                    }, 1500);
                }
            } catch (error) {
                console.error('Enrollment error:', error);
                alert('Ariza yuborishda xatolik yuz berdi');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Yuborish';
            }
        };
    }

    async loadPaymentCardInfo(modal) {
        const container = modal.querySelector('#coursePaymentCardInfo');
        if (!container) return;

        if (this.paymentCardIssue) {
            container.innerHTML = `<div class="warning-text">${this.paymentCardIssue}</div>`;
            return;
        }

        try {
            const cards = await api.get('/payment-cards');
            const card = (cards || []).find(c => String(c.id) === String(this.paymentCardId));
            if (!card) {
                container.innerHTML = `<div class="warning-text">To'lov kartasi topilmadi</div>`;
                return;
            }
            const hasLinks = card.paymeUrl || card.clickUrl;

            container.innerHTML = `
                <div class="payment-card-line"><strong>${card.label}</strong></div>
                ${!hasLinks ? `
                    <div class="payment-card-line">Karta raqami: ${card.cardNumber}</div>
                    <div class="payment-card-line">Ega: ${card.cardHolder}</div>
                ` : ''}
                ${card.bankName ? `<div class="payment-card-line">Bank: ${card.bankName}</div>` : ''}
                ${card.phone ? `<div class="payment-card-line">Telefon: ${card.phone}</div>` : ''}
                ${hasLinks ? `
                <div class="payment-links-container" style="margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${card.paymeUrl ? `<button type="button" class="btn-pay-link btn-payme" data-url="${card.paymeUrl}" style="background:#33cccc; color:white; padding:8px 15px; border-radius:8px; border:none; cursor:pointer; font-weight:600; font-family:inherit; font-size:14px; display:flex; align-items:center; gap:8px;"><i class="fas fa-link"></i> Payme orqali to'lash</button>` : ''}
                    ${card.clickUrl ? `<button type="button" class="btn-pay-link btn-click" data-url="${card.clickUrl}" style="background:#00a1ff; color:white; padding:8px 15px; border-radius:8px; border:none; cursor:pointer; font-weight:600; font-family:inherit; font-size:14px; display:flex; align-items:center; gap:8px;"><i class="fas fa-link"></i> Click orqali to'lash</button>` : ''}
                </div>
                ` : ''}
            `;

            const buttons = container.querySelectorAll('.btn-pay-link');
            buttons.forEach(btn => {
                btn.onclick = (e) => {
                    const url = e.currentTarget.getAttribute('data-url');
                    console.log('Opening payment URL:', url);
                    this.showPaymentWarning(url);
                };
            });
        } catch (error) {
            console.error('Payment card load error:', error);
            container.innerHTML = `<div class="warning-text">To'lov kartasi yuklanmadi</div>`;
        }
    }

    showSuccess() {
        const modalBody = document.querySelector('#enrollmentModal .modal-body');
        if (!modalBody) return;
        modalBody.innerHTML = `
            <div class="order-success-state" style="text-align: center; padding: 40px 20px;">
                <div class="success-icon" style="font-size: 4rem; color: #10b981; margin-bottom: 20px;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 style="color: white; margin-bottom: 12px;">Arizangiz qabul qilindi!</h2>
                <p style="color: #8b92a7;">Adminlar arizangizni ko'rib chiqadi.</p>
            </div>
        `;
    }

    showPaymentWarning(url) {
        const warningModal = document.createElement('div');
        warningModal.className = 'modal-overlay active';
        warningModal.style.zIndex = '20000';
        warningModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center; padding: 25px; background: #1c2333; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="font-size: 3.5rem; color: #f59e0b; margin-bottom: 15px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="margin-bottom: 15px; color: white;">Diqqat!</h3>
                <p style="color: #8b92a7; margin-bottom: 25px; line-height: 1.6;">
                    To'lovni amalga oshirganingizdan so'ng, to'lov <strong>muvaffaqiyatli bo'lganligi haqidagi skrinshotni</strong> yoki <strong>cheki</strong>ni saqlab oling.
                    <br><br>
                    Adminlar sizning arizangizni aynan shu ma'lumotlar asosida tekshirishadi va shundan so'ng tasdiqlashadi. Uni joyidagi "To'lov cheki" joyiga yuklashni unutmang!
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button type="button" class="btn-primary" id="btnUnderstandWarning" style="flex: 1; padding: 10px;"><i class="fas fa-check"></i> Tushundim, to'lash</button>
                    <button type="button" class="btn-cancel" id="btnCancelWarning" style="flex: 1; padding: 10px; background: #334155; color: white; border: none; border-radius: 8px; cursor: pointer;">Bekor qilish</button>
                </div>
            </div>
        `;
        document.body.appendChild(warningModal);

        warningModal.querySelector('#btnUnderstandWarning').onclick = () => {
            window.open(url, '_blank');
            warningModal.remove();
        };

        warningModal.querySelector('#btnCancelWarning').onclick = () => {
            warningModal.remove();
        };

        warningModal.onclick = (e) => {
            if(e.target === warningModal) warningModal.remove();
        };
    }

    close() {
        const modal = document.getElementById('enrollmentModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                this.onClose();
            }, 300);
        }
    }
}
