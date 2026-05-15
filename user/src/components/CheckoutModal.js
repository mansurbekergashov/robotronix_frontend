import api from '../services/api.js';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 900000; // 15 daqiqa

export default class CheckoutModal {
    constructor(options = {}) {
        this.onSuccess = options.onSuccess || (() => {});
        this.onClose   = options.onClose   || (() => {});
        this.items     = options.items     || [];
        this.isCartCheckout = options.isCartCheckout || false;

        this.regions = [
            "Toshkent sh.", "Toshkent vil.", "Andijon", "Buxoro", "Farg'ona",
            "Jizzax", "Xorazm", "Namangan", "Navoiy", "Qashqadaryo",
            "Samarqand", "Sirdaryo", "Surxondaryo", "Qoraqalpog'iston"
        ];

        this.selectedRegion = this.regions[0];
        this.phone = localStorage.getItem('userPhone') || '';
        this._pollTimer = null;
        this._pollTimeout = null;
    }

    render() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'checkoutModal';

        const totalAmount = this.items.reduce((s, i) => s + i.price * i.quantity, 0);

        modal.innerHTML = `
            <div class="modal-content checkout-modal-content detail-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-shopping-cart"></i> Buyurtma ma'lumotlari</h2>
                    <button class="close-btn" id="closeCheckout">&times;</button>
                </div>
                <div class="modal-body" id="checkoutBody">
                    <form class="checkout-form" id="checkoutForm">
                        <div class="detail-grid">
                            <div class="detail-item full-width">
                                <label><i class="fas fa-map-marker-alt"></i> Tanlangan viloyat</label>
                                <select id="regionSelect" class="form-input" required>
                                    ${this.regions.map(r =>
                                        `<option value="${r}" ${r === this.selectedRegion ? 'selected' : ''}>${r}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="detail-item">
                                <label><i class="fas fa-city"></i> Shahar / Tuman</label>
                                <input type="text" id="cityInput" class="form-input"
                                       placeholder="Masalan: Chirchiq sh." required>
                            </div>
                            <div class="detail-item">
                                <label><i class="fas fa-phone"></i> Aloqa telefoni</label>
                                <input type="tel" id="phoneInput" class="form-input"
                                       value="${this.phone}" placeholder="+998 90 123 45 67" required>
                            </div>
                            <div class="detail-item full-width">
                                <label><i class="fas fa-road"></i> Ko'cha / Uy raqami</label>
                                <input type="text" id="districtInput" class="form-input"
                                       placeholder="Masalan: Navoiy mfy, 12-uy" required>
                            </div>
                        </div>

                        <div class="checkout-summary">
                            <div class="detail-section-title" style="margin-top:0">
                                <i class="fas fa-shopping-cart"></i> Tanlangan mahsulotlar
                            </div>
                            <div class="checkout-items-list">
                                ${this.items.map((item, idx) => `
                                    <div class="checkout-item-row">
                                        <div class="checkout-item-info">
                                            <span class="checkout-item-name">${item.title}</span>
                                            <span class="checkout-item-price">${item.price.toLocaleString()} so'm</span>
                                        </div>
                                        <div class="quantity-control" data-index="${idx}">
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

                        <div class="checkout-summary" style="margin-top:20px; background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.25); border-radius:10px; padding:14px;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-size:1.6rem">💳</span>
                                <div>
                                    <div style="font-weight:600; color:#10b981">Payme orqali to'lov</div>
                                    <div style="font-size:13px; color:#6ee7b7">
                                        Buyurtma bergandan so'ng Payme to'lov sahifasi avtomatik ochiladi
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="detail-control">
                            <div class="detail-actions">
                                <button type="submit" class="btn-confirm-delivery" id="submitOrderBtn">
                                    <i class="fas fa-credit-card"></i> Buyurtma berish va Payme orqali to'lash
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
        modal.querySelector('#closeCheckout').onclick = () => this.close();
        modal.onclick = (e) => { if (e.target === modal) this.close(); };

        modal.querySelectorAll('.qty-btn').forEach(btn => {
            btn.onclick = (e) => {
                const container = e.currentTarget.closest('.quantity-control');
                const idx = parseInt(container.dataset.index);
                const isPlus = e.currentTarget.classList.contains('plus');
                if (isPlus) {
                    this.items[idx].quantity++;
                } else if (this.items[idx].quantity > 1) {
                    this.items[idx].quantity--;
                }
                container.querySelector('.qty-value').textContent = this.items[idx].quantity;
                container.querySelector('.minus').disabled = this.items[idx].quantity <= 1;
                this._updateSummary();
            };
        });

        modal.querySelector('#checkoutForm').onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = modal.querySelector('#submitOrderBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buyurtma yaratilmoqda...';

            try {
                const region   = modal.querySelector('#regionSelect').value;
                const city     = modal.querySelector('#cityInput').value.trim();
                const district = modal.querySelector('#districtInput').value.trim();
                const phone    = modal.querySelector('#phoneInput').value.trim();

                if (!city)     { alert("Shahar/tuman kiriting"); submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-credit-card"></i> Buyurtma berish va Payme orqali to\'lash'; return; }
                if (!district) { alert("Ko'cha/uy raqamini kiriting"); submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-credit-card"></i> Buyurtma berish va Payme orqali to\'lash'; return; }
                if (!phone)    { alert("Telefon raqamini kiriting"); submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-credit-card"></i> Buyurtma berish va Payme orqali to\'lash'; return; }

                localStorage.setItem('userPhone', phone);

                const orderData = {
                    items: this.items.map(item => ({ productId: item.id, quantity: item.quantity })),
                    shippingAddress: `${region}, ${city}, ${district}`,
                    contactPhone: phone
                };

                const response = await api.post('/orders', orderData);
                const { id: orderId, paymentUrl } = response;

                if (!paymentUrl) throw new Error("To'lov URL olinmadi");

                window.open(paymentUrl, '_blank');
                this._showWaitingState(orderId, paymentUrl);
                this._startPolling(orderId);

                if (this.isCartCheckout) {
                    localStorage.removeItem('userCart');
                }
            } catch (error) {
                console.error('Order error:', error);
                alert('Buyurtma berishda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-credit-card"></i> Buyurtma berish va Payme orqali to\'lash';
            }
        };
    }

    _showWaitingState(orderId, paymentUrl) {
        const body = this._modal.querySelector('#checkoutBody');
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
                <button id="reopenPayme" style="background:#33cccc;color:#0f172a;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;margin-right:10px;">
                    <i class="fas fa-external-link-alt"></i> Payme sahifasini qayta ochish
                </button>
            </div>
        `;
        body.querySelector('#reopenPayme').onclick = () => window.open(paymentUrl, '_blank');
    }

    _startPolling(orderId) {
        this._stopPolling();
        this._pollTimer = setInterval(async () => {
            try {
                const orders = await api.get('/orders/my');
                const order  = (orders || []).find(o => o.id === orderId);
                if (order?.paymentConfirmed) {
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
        if (this._pollTimer)   { clearInterval(this._pollTimer);   this._pollTimer = null; }
        if (this._pollTimeout) { clearTimeout(this._pollTimeout);  this._pollTimeout = null; }
    }

    _showSuccess() {
        const body = this._modal.querySelector('#checkoutBody');
        body.innerHTML = `
            <div style="text-align:center; padding:40px 20px">
                <div style="font-size:4rem; color:#10b981; margin-bottom:20px">✅</div>
                <h2 style="color:white; margin-bottom:12px">To'lov muvaffaqiyatli!</h2>
                <p style="color:#8b92a7">Buyurtmangiz tasdiqlandi. Tez orada yetkazib beriladi.</p>
            </div>
        `;
    }

    _showTimeout() {
        const body = this._modal.querySelector('#checkoutBody');
        if (!body) return;
        body.innerHTML = `
            <div style="text-align:center; padding:40px 20px">
                <div style="font-size:3rem; margin-bottom:16px">⏰</div>
                <h3 style="color:white; margin-bottom:12px">To'lov vaqti tugadi</h3>
                <p style="color:#8b92a7; margin-bottom:24px">
                    15 daqiqa ichida to'lov tasdiqlanmadi. Qaytadan buyurtma bering.
                </p>
                <button id="closeTimeout" style="background:#33cccc;color:#0f172a;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-weight:600">
                    Yopish
                </button>
            </div>
        `;
        body.querySelector('#closeTimeout').onclick = () => this.close();
    }

    _updateSummary() {
        const total = this.items.reduce((s, i) => s + i.price * i.quantity, 0);
        const el = document.getElementById('totalAmountDisplay');
        if (el) el.textContent = `${total.toLocaleString()} so'm`;
    }

    close() {
        this._stopPolling();
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => { modal.remove(); this.onClose(); }, 300);
        }
    }
}
