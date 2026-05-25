import { getFileUrl } from '../config.js';
import CheckoutModal from '../components/CheckoutModal.js';

const esc = s => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };

export default class Cart {
    constructor() {
        this.container = document.getElementById('main-content');
        this.cart = JSON.parse(localStorage.getItem('userCart') || '[]');
    }

    render() {
        this.container.innerHTML = `
            <div class="page-header">
                <h1>Savat</h1>
                <p>Tanlangan mahsulotlar</p>
            </div>

            ${this.cart.length > 0 ? this.renderCart() : this.renderEmpty()}
        `;

        if (this.cart.length > 0) {
            this.attachEvents();
        }
    }

    renderCart() {
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return `
            <div class="cart-container">
                <div class="cart-items">
                    ${this.cart.map(item => this.renderCartItem(item)).join('')}
                </div>
                
                <div class="cart-summary">
                    <h3>Jami</h3>
                    <div class="summary-row">
                        <span>Mahsulotlar:</span>
                        <span>${(total || 0).toLocaleString()} so'm</span>
                    </div>
                    <div class="summary-row">
                        <span>Yetkazib berish:</span>
                        <span>Bepul</span>
                    </div>
                    <div class="summary-total">
                        <span>Jami:</span>
                        <span>${(total || 0).toLocaleString()} so'm</span>
                    </div>
                    <button class="btn-primary btn-full btn-large" id="checkoutBtn">Buyurtma berish</button>
                </div>
            </div>
        `;
    }

    renderCartItem(item) {
        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-img">
                    <img src="${getFileUrl(item.image)}" alt="${esc(item.title) || 'Mahsulot'}" onerror="this.onerror=null;this.src='/default-image.svg'">
                </div>
                <div class="item-info">
                    <h4>${esc(item.title) || 'Mahsulot'}</h4>
                    <p class="item-category">Mahsulot to'plami</p>
                    <div class="item-quick-actions">
                        <button class="btn-checkout-single" data-id="${item.id}">
                            <i class="fas fa-shopping-bag"></i> Faqat shuni olish
                        </button>
                    </div>
                </div>
                <div class="item-actions">
                    <div class="quantity-control">
                        <button class="qty-btn qty-minus" data-id="${item.id}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="qty-btn qty-plus" data-id="${item.id}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="item-price-info">
                        <span class="price-label">Narxi:</span>
                        <span class="price-value">${((item.price || 0) * item.quantity).toLocaleString()} so'm</span>
                    </div>
                    <button class="btn-remove" data-id="${item.id}" title="O'chirish">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderEmpty() {
        return `
            <div class="cart-empty-state">
                <div class="empty-icon-wrapper">
                    <i class="fas fa-shopping-basket"></i>
                    <div class="icon-pulse"></div>
                </div>
                <h2>Savatingiz hali bo'sh</h2>
                <p>Hozircha savatingizda hech narsa yo'q. Do'konimizdan o'zingizga yoqqan mahsulotlarni topishingiz mumkin.</p>
                <a href="#products" class="btn-primary btn-large">
                    <i class="fas fa-store"></i> Do'konga o'tish
                </a>
            </div>
        `;
    }

    attachEvents() {
        // Quantity buttons
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = String(e.currentTarget.dataset.id);
                this.updateQuantity(id, 1);
            });
        });

        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = String(e.currentTarget.dataset.id);
                this.updateQuantity(id, -1);
            });
        });

        // Remove buttons
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = String(e.currentTarget.dataset.id);
                this.removeItem(id);
            });
        });

        // Individual checkout buttons
        document.querySelectorAll('.btn-checkout-single').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = String(e.currentTarget.dataset.id);
                this.checkoutSingle(id);
            });
        });

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }
    }

    updateQuantity(id, change) {
        const item = this.cart.find(i => String(i.id) === String(id));
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeItem(id);
            } else {
                localStorage.setItem('userCart', JSON.stringify(this.cart));
                this.render();
            }
        }
    }

    removeItem(id) {
        this.cart = this.cart.filter(item => String(item.id) !== String(id));
        localStorage.setItem('userCart', JSON.stringify(this.cart));
        this.render();

        // Update badge
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const count = this.cart.reduce((total, item) => total + item.quantity, 0);
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    async checkoutSingle(id) {
        const item = this.cart.find(i => String(i.id) === String(id));
        if (!item) return;

        const modal = new CheckoutModal({
            items: [{
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.image,
            }],
            isCartCheckout: false,
            onSuccess: () => {
                this.removeItem(id);
            }
        });
        modal.render();
    }

    async checkout() {
        if (!this.cart || this.cart.length === 0) return;

        const modal = new CheckoutModal({
            items: this.cart.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.image,
            })),
            isCartCheckout: true,
            onSuccess: () => {
                this.cart = [];
                localStorage.setItem('userCart', JSON.stringify(this.cart));
                this.updateBadge();
                this.render();
            }
        });
        modal.render();
    }

    updateBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const count = this.cart.reduce((total, item) => total + item.quantity, 0);
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    destroy() { }
}
