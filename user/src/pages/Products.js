import { API_BASE_URL, getFileUrl } from '../config.js';
import CheckoutModal from '../components/CheckoutModal.js';

const esc = s => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };


export default class Products {
    constructor() {
        this.container = document.getElementById('main-content');
        this.products = [];
        this.onProductUpdate = (event) => {
            const update = event.detail;
            if (update && update.entityType === 'PRODUCT') {
                this.loadProducts();
            }
        };
    }

    async render() {
        this.container.innerHTML = `
            <div class="page-header">
                <h1>Do'kon</h1>
                <p>Mahsulotlar va to'plamlar</p>
            </div>

            <div class="products-grid" id="productsGrid">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Mahsulotlar yuklanmoqda...</p>
                </div>
            </div>
        `;

        await this.loadProducts();

        // Listen for real-time updates
        window.addEventListener('robotronix-update', this.onProductUpdate);
    }

    async loadProducts() {
        try {
            const { default: api } = await import('../services/api.js');
            this.products = await api.get('/products');
            this.renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            document.getElementById('productsGrid').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Mahsulotlarni yuklashda xatolik</p>
                </div>
            `;
        }
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!this.products || this.products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Mahsulotlar topilmadi</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${getFileUrl(product.imageUrl)}" alt="${esc(product.title)}">
                </div>
                <div class="product-content">
                    <h3>${esc(product.title)}</h3>
                    <p>${esc(product.description) || 'Arduino va elektronika sohasidagi eng sara to\'plam'}</p>
                    <div class="product-price">
                        <span class="price-main">${(product.price || 0).toLocaleString()} so'm</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-order-now buy-now"
                            data-id="${product.id}"
                            data-title="${esc(product.title)}"
                            data-price="${product.price}"
                            data-image="${esc(product.imageUrl || '')}">
                            <i class="fas fa-bolt"></i> Buyurtma berish
                        </button>
                        <button class="btn-add-cart-outline add-to-cart"
                            data-id="${product.id}"
                            data-title="${esc(product.title)}"
                            data-price="${product.price}"
                            data-image="${esc(product.imageUrl || '')}"
                            title="Savatga qo'shish">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        this.attachEvents();
    }

    attachEvents() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (this._gridClickHandler) {
            grid.removeEventListener('click', this._gridClickHandler);
        }

        this._gridClickHandler = (e) => {
            const addBtn = e.target.closest('.add-to-cart');
            if (addBtn) {
                const product = {
                    id: String(addBtn.dataset.id),
                    title: addBtn.dataset.title,
                    price: parseInt(addBtn.dataset.price),
                    image: addBtn.dataset.image,
                    quantity: 1
                };
                this.addToCart(product);
                return;
            }

            const buyBtn = e.target.closest('.buy-now');
            if (buyBtn) {
                const product = {
                    id: buyBtn.dataset.id,
                    title: buyBtn.dataset.title,
                    price: parseInt(buyBtn.dataset.price),
                    imageUrl: buyBtn.dataset.image,
                    quantity: 1
                };

                const modal = new CheckoutModal({
                    items: [product],
                    isCartCheckout: false,
                    onSuccess: () => {
                        this.showNotification('Buyurtmangiz muvaffaqiyatli yuborildi!');
                    }
                });
                modal.render();
            }
        };

        grid.addEventListener('click', this._gridClickHandler);
    }

    addToCart(product) {
        let cart = JSON.parse(localStorage.getItem('userCart') || '[]');
        const existing = cart.find(item => item.id === product.id);

        if (existing) {
            existing.quantity++;
        } else {
            cart.push(product);
        }

        localStorage.setItem('userCart', JSON.stringify(cart));
        this.showNotification('Mahsulot savatga qo\'shildi!');

        // Update cart badge
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const count = cart.reduce((total, item) => total + item.quantity, 0);
            badge.textContent = count;
            badge.style.display = 'inline-block';
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    destroy() {
        window.removeEventListener('robotronix-update', this.onProductUpdate);
        const grid = document.getElementById('productsGrid');
        if (grid && this._gridClickHandler) {
            grid.removeEventListener('click', this._gridClickHandler);
        }
    }
}
