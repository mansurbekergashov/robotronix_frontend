import api from '../services/api.js';
import toast from '../services/toast.js';

const esc = s => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 900000; // 15 daqiqa

export default class CheckoutModal {
    constructor(options = {}) {
        this.onSuccess = options.onSuccess || (() => {});
        this.onClose   = options.onClose   || (() => {});
        this.items     = options.items     || [];
        this.isCartCheckout = options.isCartCheckout || false;

        this.selectedJurisdiction = null; // { id, name }
        this._postalIndex = '';
        this._jurResults = [];
        this._jurTimer = null;
        this.phone = localStorage.getItem('userPhone') || '';
        this._pollTimer = null;
        this._pollTimeout = null;
        this._modal = null;
        this._submitting = false;
        // Default: yetkazib berish
        this._deliveryType = 'DELIVERY';
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

                        <!-- YETKAZISH TURI TANLASH -->
                        <div class="delivery-type-selector" id="deliveryTypeSelector">
                            <button type="button" class="delivery-type-btn active" id="btnDelivery" data-type="DELIVERY">
                                <span class="delivery-type-icon">🚚</span>
                                <span class="delivery-type-label">Yetkazib berish</span>
                                <span class="delivery-type-desc">Manzilga yetkazamiz</span>
                            </button>
                            <button type="button" class="delivery-type-btn" id="btnSelfPickup" data-type="SELF_PICKUP">
                                <span class="delivery-type-icon">🏪</span>
                                <span class="delivery-type-label">O'zim olib ketaman</span>
                                <span class="delivery-type-desc">Ofisdan o'zim olaman</span>
                            </button>
                        </div>

                        <div class="detail-grid">
                            <!-- Manzil qidiruv — faqat DELIVERY da ko'rinadi -->
                            <div class="detail-item full-width delivery-only-field" id="jurFieldWrapper" style="position:relative">
                                <label><i class="fas fa-map-marker-alt"></i> Shahar / Tuman (UzPost)</label>
                                <input type="text" id="jurSearchInput" class="form-input"
                                       placeholder="Tuman yoki shahar nomini kiriting..."
                                       autocomplete="off">
                                <div id="jurDropdown" style="
                                    display:none; position:absolute; top:100%; left:0; right:0;
                                    background: var(--card-bg); border:1px solid var(--border-color); border-radius:8px;
                                    max-height:180px; overflow-y:auto; z-index:9999; margin-top:2px;
                                "></div>
                                <div id="jurSelected" style="display:none; font-size:12px; color:#10b981; margin-top:4px;">
                                    <i class="fas fa-check-circle"></i> <span id="jurSelectedName"></span>
                                </div>
                            </div>

                            <!-- Self-pickup info banner — faqat SELF_PICKUP da ko'rinadi -->
                            <div class="detail-item full-width self-pickup-only-field" id="selfPickupBanner"
                                 style="display:none; background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.3);
                                        border-radius:10px; padding:14px; margin-bottom:4px;">
                                <div style="display:flex; align-items:flex-start; gap:12px;">
                                    <span style="font-size:2rem; line-height:1;">🏪</span>
                                    <div>
                                        <div style="font-weight:700; color:#10b981; margin-bottom:4px;">
                                            O'zim olib ketaman tanlandi
                                        </div>
                                        <div style="font-size:13px; color:#6ee7b7; line-height:1.5;">
                                            Buyurtmangiz tasdiqlanganidan so'ng siz bilan bog'lanamiz.<br>
                                            Mahsulotni ofisimizdan olib ketishingiz mumkin.
                                        </div>
                                        <div style="font-size:12px; color:#34d399; margin-top:8px;">
                                            <i class="fas fa-map-marker-alt"></i>
                                            <strong>Manzil:</strong> Toshkent sh., Robotronix Markazi
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Telefon — har doim ko'rinadi -->
                            <div class="detail-item full-width">
                                <label><i class="fas fa-phone"></i> Aloqa telefoni</label>
                                <input type="tel" id="phoneInput" class="form-input"
                                       value="${this.phone}" placeholder="+998 90 123 45 67" required>
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
                                            <span class="checkout-item-name">${esc(item.title)}</span>
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
        this._injectStyles();
        this._setupEventListeners(modal);
    }

    _injectStyles() {
        if (document.getElementById('checkout-delivery-styles')) return;
        const style = document.createElement('style');
        style.id = 'checkout-delivery-styles';
        style.textContent = `
            .delivery-type-selector {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 20px;
            }
            .delivery-type-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 14px 10px;
                background: rgba(255,255,255,0.04);
                border: 2px solid var(--border-color, #2d3748);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.25s ease;
                font-family: inherit;
                text-align: center;
            }
            .delivery-type-btn:hover {
                border-color: rgba(16,185,129,0.5);
                background: rgba(16,185,129,0.06);
            }
            .delivery-type-btn.active {
                border-color: #10b981;
                background: rgba(16,185,129,0.12);
                box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
            }
            .delivery-type-icon {
                font-size: 1.8rem;
                line-height: 1;
                margin-bottom: 2px;
            }
            .delivery-type-label {
                font-size: 14px;
                font-weight: 700;
                color: #e2e8f0;
            }
            .delivery-type-desc {
                font-size: 11px;
                color: #8b92a7;
            }
            .delivery-type-btn.active .delivery-type-label {
                color: #10b981;
            }
            .delivery-only-field,
            .self-pickup-only-field {
                transition: opacity 0.25s ease, max-height 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    _switchDeliveryType(type) {
        this._deliveryType = type;
        const modal = this._modal;

        const btnDelivery   = modal.querySelector('#btnDelivery');
        const btnSelfPickup = modal.querySelector('#btnSelfPickup');
        const jurWrapper    = modal.querySelector('#jurFieldWrapper');
        const selfBanner    = modal.querySelector('#selfPickupBanner');
        const submitBtn     = modal.querySelector('#submitOrderBtn');

        if (type === 'SELF_PICKUP') {
            btnDelivery.classList.remove('active');
            btnSelfPickup.classList.add('active');
            jurWrapper.style.display = 'none';
            selfBanner.style.display = 'block';
            submitBtn.innerHTML = '<i class="fas fa-store"></i> O\'zim olib ketaman — Buyurtma berish';
            // Jurisdiktsiya tanlovini tozalash
            this.selectedJurisdiction = null;
            this._postalIndex = '';
        } else {
            btnSelfPickup.classList.remove('active');
            btnDelivery.classList.add('active');
            jurWrapper.style.display = '';
            selfBanner.style.display = 'none';
            submitBtn.innerHTML = '<i class="fas fa-credit-card"></i> Buyurtma berish va Payme orqali to\'lash';
        }
    }

    async _searchJurisdictions(query) {
        if (!query || query.length < 2) {
            this._hideDropdown();
            return;
        }
        try {
            const res = await api.get(`/geography/jurisdictions?levelId=3&search=${encodeURIComponent(query)}&size=20`);
            this._jurResults = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
        } catch {
            this._jurResults = [];
        }
        this._renderDropdown();
    }

    _renderDropdown() {
        const modal = this._modal;
        if (!modal) return;
        const dropdown = modal.querySelector('#jurDropdown');
        if (!this._jurResults.length) { dropdown.style.display = 'none'; return; }

        dropdown.innerHTML = this._jurResults.map(j => {
            const path = Array.isArray(j.hierarchy) && j.hierarchy.length
                ? j.hierarchy.map(h => h.name).join(' > ')
                : '';
            return `
            <div class="district-option" data-id="${j.id}" data-name="${j.name}" data-path="${path}" style="
                padding:10px 14px; cursor:pointer; border-bottom:1px solid #2d3748;
            " onmouseover="this.style.background='#2d3748'" onmouseout="this.style.background=''">
                <div style="color:#e2e8f0; font-size:14px;">${esc(j.name)}</div>
                ${path ? `<div style="color:#8b92a7; font-size:12px; margin-top:2px;">${esc(path)}</div>` : ''}
            </div>`;
        }).join('');

        dropdown.querySelectorAll('.district-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const id   = parseInt(opt.dataset.id);
                const name = opt.dataset.name;
                const path = opt.dataset.path || '';
                this._selectJurisdiction(id, name, path);
            });
        });

        dropdown.style.display = 'block';
    }

    async _selectJurisdiction(id, name, hierarchyPath = '') {
        this.selectedJurisdiction = { id, name };
        const modal = this._modal;
        modal.querySelector('#jurSearchInput').value = name;
        modal.querySelector('#jurDropdown').style.display = 'none';
        modal.querySelector('#jurSelected').style.display = 'block';
        modal.querySelector('#jurSelectedName').textContent = name;

        // Auto-detect postal index
        try {
            const res = await api.get(
                `/geography/postal-index?jurisdictionName=${encodeURIComponent(name)}&hierarchyPath=${encodeURIComponent(hierarchyPath)}`
            );
            const data = res && res.data ? res.data : res;
            if (data?.found && data.postalIndex) {
                this._postalIndex = data.postalIndex;
                const el = modal.querySelector('#jurSelectedName');
                if (el) el.textContent = `${name} (indeks: ${data.postalIndex})`;
            } else {
                this._postalIndex = '';
            }
        } catch { this._postalIndex = ''; }
    }

    _hideDropdown() {
        if (this._modal) this._modal.querySelector('#jurDropdown').style.display = 'none';
    }

    _setupEventListeners(modal) {
        modal.querySelector('#closeCheckout').onclick = () => this.close();
        modal.onclick = (e) => { if (e.target === modal) this.close(); };

        // Delivery type tugmalari
        modal.querySelector('#btnDelivery').addEventListener('click', () => this._switchDeliveryType('DELIVERY'));
        modal.querySelector('#btnSelfPickup').addEventListener('click', () => this._switchDeliveryType('SELF_PICKUP'));

        // Jurisdiction search input
        const jurInput = modal.querySelector('#jurSearchInput');
        jurInput.addEventListener('input', (e) => {
            const q = e.target.value.trim();
            this.selectedJurisdiction = null;
            this._postalIndex = '';
            modal.querySelector('#jurSelected').style.display = 'none';
            if (this._jurTimer) clearTimeout(this._jurTimer);
            this._jurTimer = setTimeout(() => this._searchJurisdictions(q), 350);
        });

        this._jurClickOutside = (e) => {
            const dropdown = modal.querySelector('#jurDropdown');
            if (dropdown && !dropdown.contains(e.target) && e.target !== jurInput) {
                dropdown.style.display = 'none';
            }
        };
        document.addEventListener('click', this._jurClickOutside);

        // Quantity controls
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
            if (this._submitting) return;

            const submitBtn = modal.querySelector('#submitOrderBtn');
            const phone  = modal.querySelector('#phoneInput').value.trim();
            const isSelfPickup = this._deliveryType === 'SELF_PICKUP';

            const reset = (msg) => {
                toast.warning(msg);
                this._submitting = false;
                submitBtn.disabled = false;
                if (isSelfPickup) {
                    submitBtn.innerHTML = '<i class="fas fa-store"></i> O\'zim olib ketaman — Buyurtma berish';
                } else {
                    submitBtn.innerHTML = '<i class="fas fa-credit-card"></i> Buyurtma berish va Payme orqali to\'lash';
                }
            };

            // Validatsiya
            if (!isSelfPickup && !this.selectedJurisdiction) return reset('Shahar yoki tumaningizni tanlang');
            if (!phone) return reset('Telefon raqamini kiriting');

            this._submitting = true;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buyurtma yaratilmoqda...';

            localStorage.setItem('userPhone', phone);

            try {
                const orderData = {
                    items: this.items.map(item => ({ productId: item.id, quantity: item.quantity })),
                    deliveryType: this._deliveryType,
                    contactPhone: phone,
                };

                // Faqat DELIVERY uchun manzil qo'shamiz
                if (!isSelfPickup) {
                    orderData.shippingAddress = this.selectedJurisdiction.name;
                    orderData.receiverJurisdictionId = this.selectedJurisdiction.id;
                    if (this._postalIndex) orderData.postalIndex = this._postalIndex;
                }

                const response = await api.post('/orders', orderData);
                const { id: orderId, paymentUrl } = response;

                if (!paymentUrl) throw new Error("To'lov URL olinmadi");

                window.open(paymentUrl, '_blank');
                this._showWaitingState(orderId, paymentUrl);
                this._startPolling(orderId);

                if (this.isCartCheckout) localStorage.removeItem('userCart');
            } catch (error) {
                console.error('Order error:', error);
                reset('Buyurtma berishda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
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
                <p style="color:#8b92a7">Buyurtmangiz tasdiqlandi. Tez orada siz bilan bog'lanamiz.</p>
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
        if (this._jurClickOutside) {
            document.removeEventListener('click', this._jurClickOutside);
            this._jurClickOutside = null;
        }
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => { modal.remove(); this.onClose(); }, 300);
        }
    }
}
