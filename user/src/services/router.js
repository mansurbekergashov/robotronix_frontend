export class Router {
    constructor() {
        this.routes = {};
        this.currentPage = null;
    }

    init() {
        // Register routes with dynamic import functions
        this.register('dashboard', () => import('../pages/Dashboard.js'));
        this.register('news', () => import('../pages/News.js'));
        this.register('courses', () => import('../pages/Courses.js'));
        this.register('my-courses', () => import('../pages/MyCourses.js'));
        this.register('my-certificates', () => import('../pages/MyCertificates.js'));
        this.register('products', () => import('../pages/Products.js'));
        this.register('cart', () => import('../pages/Cart.js'));
        this.register('orders', () => import('../pages/Orders.js'));
        this.register('profile', () => import('../pages/Profile.js'));
        this.register('contact', () => import('../pages/Contact.js'));
        this.register('chat', () => import(`../pages/Chat.js?v=${Date.now()}`));
        this.register('guide', () => import('../pages/Guide.js'));
        this.register('help', () => import('../pages/Help.js'));

        // Listen to hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1) || 'dashboard';
            this.navigate(hash);
        });
    }

    register(path, importFn) {
        this.routes[path] = importFn;
    }

    async navigate(path) {
        const importFn = this.routes[path];
        if (!importFn) {
            console.error(`Route not found: ${path}`);
            return;
        }

        try {
            // Show loading state if needed
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                // Subtle loading indicator
                mainContent.style.opacity = '0.5';
            }

            // Dynamically load the module
            const module = await importFn();
            const PageClass = module.default;

            if (this.currentPage && this.currentPage.destroy) {
                this.currentPage.destroy();
            }

            this.currentPage = new PageClass();
            await this.currentPage.render();

            if (mainContent) {
                mainContent.style.opacity = '1';
            }

            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.page === path) {
                    item.classList.add('active');
                }
            });
        } catch (error) {
            console.error('Error loading page:', error);
            console.error('Error stack:', error.stack);

            // Show error message to user
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div style="padding: 40px; text-align: center;">
                        <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #ef5350; margin-bottom: 20px;"></i>
                        <h2>Sahifa yuklanmadi</h2>
                        <p style="color: #666; margin: 20px 0;">${error.message}</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; background: #0066ff; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Qayta yuklash
                        </button>
                    </div>
                `;
            }
        }
    }
}
