// Contact Page
export default class Contact {
    constructor() {
        this.container = document.getElementById('main-content');
    }

    render() {
        this.container.innerHTML = `
            <div class="page-header">
                <h1>Aloqa</h1>
                <p>Biz bilan bog'laning</p>
            </div>

            <div class="contact-grid">
                <div class="contact-info">
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <div>
                            <h4>Telefon</h4>
                            <p>+998 33 803 33 53</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <div>
                            <h4>Email</h4>
                            <p>info@robotronix.uz</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <h4>Manzil</h4>
                            <p>Farg'ona, Murabbiylar ko'chasi</p>
                        </div>
                    </div>
                </div>

                <div class="contact-form-card">
                    <h3>Xabar Yuborish</h3>
                    <form class="contact-form" id="contactForm">
                        <input type="text" id="contactName" placeholder="Ismingiz" class="form-input" required>
                        <input type="tel" id="contactPhone" placeholder="Telefon raqamingiz" class="form-input" required>
                        <textarea id="contactMessage" placeholder="Xabar" class="form-textarea" rows="5" required></textarea>
                        <button type="submit" id="contactSubmitBtn" class="btn-primary btn-full">Yuborish</button>
                    </form>
                </div>
            </div>
        `;
        this.attachEvents();
    }

    attachEvents() {
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('contactSubmitBtn');
                
                try {
                    btn.disabled = true;
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...';

                    const { default: api } = await import('../services/api.js');
                    
                    const requestData = {
                        name: document.getElementById('contactName').value,
                        phone: document.getElementById('contactPhone').value,
                        course: 'Umumiy xabar',
                        message: document.getElementById('contactMessage').value
                    };

                    await api.post('/contact', requestData);
                    
                    form.reset();
                    alert('Xabaringiz muvaffaqiyatli yuborildi!');
                    
                } catch (error) {
                    console.error('Contact submit error:', error);
                    alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = 'Yuborish';
                }
            });
        }
    }

    destroy() {}
}
