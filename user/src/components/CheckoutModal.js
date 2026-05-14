import { API_BASE_URL } from '../config.js';
import api from '../services/api.js';

export default class CheckoutModal {
    constructor(options = {}) {
        this.onSuccess = options.onSuccess || (() => { });
        this.onClose = options.onClose || (() => { });
        this.items = options.items || []; // [{id, title, price, quantity, imageUrl}]
        this.isCartCheckout = options.isCartCheckout || false;

        this.regions = [
            'Toshkent sh.', 'Toshkent vil.', 'Andijon', 'Buxoro', 'Farg\'ona',
            'Jizzax', 'Xorazm', 'Namangan', 'Navoiy', 'Qashqadaryo',
            'Samarqand', 'Sirdaryo', 'Surxondaryo', 'Qoraqalpog\'iston'
        ];

        this.selectedRegion = this.regions[0];
        this.city = '';
        this.district = '';
        this.phone = localStorage.getItem('userPhone') || '';

        const cardIds = [...new Set(this.items.map(item => item.paymentCardId).filter(Boolean))];
        this.paymentCardId = null;
        this.paymentCardIssue = null;
        if (cardIds.length === 0) {
            this.paymentCardIssue = "To'lov kartasi tanlanmagan. Iltimos, admin bilan bog'laning.";
        } else if (cardIds.length > 1) {
            this.paymentCardIssue = "Savatda bir nechta to'lov kartasi mavjud. Har bir kartaga alohida buyurtma bering.";
        } else {
            this.paymentCardId = cardIds[0];
        }
    }

    render() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'checkoutModal';

        const totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        modal.innerHTML = `
            <div class="modal-content checkout-modal-content detail-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-shipping-fast"></i> Buyurtma ma'lumotlari</h2>
                    <button class="close-btn" id="closeCheckout">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="checkout-form" id="checkoutForm">
                        <div class="detail-grid">
                            <div class="detail-item full-width">
                                <label><i class="fas fa-map-marker-alt"></i> Tanlangan viloyat</label>
                                <select id="regionSelect" class="form-input" required>
                                    ${this.regions.map(r => `<option value="${r}" ${r === this.selectedRegion ? 'selected' : ''}>${r}</option>`).join('')}
                                </select>
                            </div>
                            <div class="detail-item">
                                <label><i class="fas fa-city"></i> Shahar / Tuman</label>
                                <input type="text" id="cityInput" class="form-input" placeholder="Masalan: Chirchiq sh." required>
                            </div>
                            <div class="detail-item">
                                <label><i class="fas fa-phone"></i> Aloqa telefoni</label>
                                <input type="tel" id="phoneInput" class="form-input" value="${this.phone}" placeholder="+998 90 123 45 67" required>
                            </div>
                            <div class="detail-item full-width">
                                <label><i class="fas fa-road"></i> Yetkazib berish manzili</label>
                                <input type="text" id="districtInput" class="form-input" placeholder="Masalan: Navoiy mfy, 12-uy" required>
                            </div>
                        </div>
                        
                        <div class="checkout-summary">
                            <div class="detail-section-title" style="margin-top: 0;">
                                <i class="fas fa-shopping-cart"></i> Tanlangan mahsulotlar
                            </div>
                            <div class="checkout-items-list">
                                ${this.items.map((item, index) => `
                                    <div class="checkout-item-row">
                                        <div class="checkout-item-info">
                                            <span class="checkout-item-name">${item.title}</span>
                                            <span class="checkout-item-price">${item.price.toLocaleString()} so'm</span>
                                        </div>

                                        <div class="quantity-control" data-index="${index}">
                                            <button type="button" class="qty-btn minus" ${item.quantity <= 1 ? 'disabled' : ''}>
                                                <i class="fas fa-minus"></i>
                                            </button>
                                            <span class="qty-value">${item.quantity}</span>
                                            <button type="button" class="qty-btn plus">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="summary-row total">
                                <span class="label">Umumiy summa:</span>
                                <span class="value" id="totalAmountDisplay">${totalAmount.toLocaleString()} so'm</span>
                            </div>
                        </div>

                        <div class="checkout-summary" style="margin-top: 20px;">
                            <div class="detail-section-title" style="margin-top: 0;">
                                <i class="fas fa-credit-card"></i> To'lov ma'lumotlari
                            </div>
                            <div id="paymentCardInfo" class="payment-card-info">
                                ${this.paymentCardIssue ? `<div class="warning-text">${this.paymentCardIssue}</div>` : '<div class="loading-note">Yuklanmoqda...</div>'}
                            </div>
                            <div class="detail-item full-width" style="margin-top: 12px;">
                                <label><i class="fas fa-file-upload"></i> To'lov cheki (majburiy)</label>
                                <input type="file" id="receiptFile" class="form-input" accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf" ${this.paymentCardIssue ? 'disabled' : ''} required>
                            </div>
                        </div>
                        
                        <div class="detail-control">
                            <h3><i class="fas fa-tasks"></i> Buyurtmani tasdiqlash</h3>
                            <div class="detail-actions">
                                <button type="submit" class="btn-confirm-delivery" id="submitOrderBtn" ${this.paymentCardIssue ? 'disabled' : ''}>
                                    <i class="fas fa-check-circle"></i> Buyurtmani yuborish
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupEventListeners(modal);
    }

    setupEventListeners(modal) {
        const closeBtn = modal.querySelector('#closeCheckout');
        const form = modal.querySelector('#checkoutForm');

        closeBtn.onclick = () => this.close();

        modal.onclick = (e) => {
            if (e.target === modal) this.close();
        };

        // Sonini o'zgartirish
        modal.querySelectorAll('.qty-btn').forEach(btn => {
            btn.onclick = (e) => {
                const container = e.currentTarget.closest('.quantity-control');
                const index = parseInt(container.dataset.index);
                const isPlus = e.currentTarget.classList.contains('plus');

                if (isPlus) {
                    this.items[index].quantity++;
                } else if (this.items[index].quantity > 1) {
                    this.items[index].quantity--;
                }

                // UI yangilash
                container.querySelector('.qty-value').textContent = this.items[index].quantity;
                container.querySelector('.minus').disabled = this.items[index].quantity <= 1;
                this.updateSummary();
            };
        });

        form.onsubmit = async (e) => {
            e.preventDefault();
            if (this.paymentCardIssue) {
                alert(this.paymentCardIssue);
                return;
            }

            const submitBtn = modal.querySelector('#submitOrderBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...';

            try {
                const receiptInput = modal.querySelector('#receiptFile');
                const receiptFile = receiptInput?.files?.[0];
                if (!receiptFile) {
                    alert('Iltimos, to\'lov chekini yuklang');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Buyurtmani yuborish';
                    return;
                }

                const region = modal.querySelector('#regionSelect').value;
                const city = modal.querySelector('#cityInput').value;
                const district = modal.querySelector('#districtInput').value;
                const shippingAddress = `${region}, ${city}, ${district}`;

                const orderData = {
                    items: this.items.map(item => ({
                        productId: item.id,
                        quantity: item.quantity
                    })),
                    shippingAddress: shippingAddress,
                    contactPhone: modal.querySelector('#phoneInput').value
                };

                const payload = new FormData();
                payload.append('order', new Blob([JSON.stringify(orderData)], { type: 'application/json' }));
                payload.append('receipt', receiptFile);

                const response = await api.post('/orders', payload, true);

                if (response) {
                    this.showSuccess();
                    if (this.isCartCheckout) {
                        // Clear cart if needed
                        localStorage.removeItem('cart');
                    }
                    setTimeout(() => {
                        this.close();
                        this.onSuccess();
                    }, 2000);
                }
            } catch (error) {
                console.error('Order error:', error);
                alert('Buyurtma berishda xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Buyurtmani tasdiqlash';
            }
        };

        this.loadPaymentCardInfo(modal);
    }

    async loadPaymentCardInfo(modal) {
        const container = modal.querySelector('#paymentCardInfo');
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

            // Use direct assignment to children to ensure events are attached to the right elements
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

    updateSummary() {
        const totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalDisplay = document.getElementById('totalAmountDisplay');
        if (totalDisplay) {
            totalDisplay.textContent = `${totalAmount.toLocaleString()} so'm`;
        }
    }

    showSuccess() {
        const modalBody = document.querySelector('.checkout-modal-content .modal-body');
        modalBody.innerHTML = `
            <div class="order-success-state" style="text-align: center; padding: 40px 20px;">
                <div class="success-icon" style="font-size: 4rem; color: #10b981; margin-bottom: 20px;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 style="color: white; margin-bottom: 12px;">Buyurtmangiz qabul qilindi!</h2>
                <p style="color: #8b92a7;">Tez orada operatorimiz siz bilan bog'lanadi.</p>
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
                    Adminlar sizning arizangizni aynan shu ma'lumotlar asosida tekshirishadi va shundan so'ng tasdiqlashadi. Uyni joyidagi "To'lov cheki" joyiga yuklashni unutmang!
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
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                this.onClose();
            }, 300);
        }
    }
}
