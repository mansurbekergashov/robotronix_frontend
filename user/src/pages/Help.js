// Help Page
export default class Help {
    constructor() {
        this.container = document.getElementById('main-content');
    }

    async render() {
        this.container.innerHTML = `
            <div class="page-header">
                <div class="header-content">
                    <div>
                        <h1><i class="fas fa-headset"></i> Yordam</h1>
                        <p>Texnik yordam va ma'muriyat bilan bog'lanish</p>
                    </div>
                </div>
            </div>

            <div class="help-container">
                <div class="help-grid">
                    
                    <div class="help-card admin-card">
                        <div class="help-card-header">
                            <div class="help-icon admin-icon">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <h2>Administrator</h2>
                        </div>
                        <div class="help-card-body">
                            <p class="help-desc">Platformadagi kurslar, buyurtmalar, arizalar va tashkiliy masalalar bo'yicha savollaringiz bo'lsa ma'muriyatga murojaat qiling.</p>
                            
                            <div class="contact-methods">
                                <a href="https://t.me/Robotronix_qabul" target="_blank" class="contact-btn btn-telegram">
                                    <i class="fab fa-telegram"></i>
                                    <span>@Robotronix_qabul</span>
                                </a>
                                
                                <a href="tel:+998338033353" class="contact-btn btn-phone">
                                    <i class="fas fa-phone-alt"></i>
                                    <span>+998 33 803 33 53</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div class="help-card dev-card">
                        <div class="help-card-header">
                            <div class="help-icon dev-icon">
                                <i class="fas fa-code"></i>
                            </div>
                            <h2>Dasturchi</h2>
                        </div>
                        <div class="help-card-body">
                            <p class="help-desc">Sayt ishlashida kuzatilgan texnik xatoliklar, xatolar yoki yangi imkoniyatlar qo'shish bo'yicha takliflar bo'lsa dasturchiga murojaat qiling.</p>
                            
                            <div class="contact-methods">
                                <a href="https://t.me/Just_Boqiyev" target="_blank" class="contact-btn btn-telegram">
                                    <i class="fab fa-telegram"></i>
                                    <span>@Just_Boqiyev</span>
                                </a>
                                
                                <a href="tel:+998938090312" class="contact-btn btn-phone">
                                    <i class="fas fa-phone-alt"></i>
                                    <span>+998 93 809 03 12</span>
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            
            <style>
                .help-container {
                    padding: 20px 0;
                }
                .help-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 30px;
                }
                .help-card {
                    background: var(--card-bg);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    box-shadow: var(--shadow-md);
                }
                .help-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
                }
                .admin-card {
                    border-top: 4px solid #00ccff;
                }
                .dev-card {
                    border-top: 4px solid #10b981;
                }
                .help-card-header {
                    padding: 30px 24px 20px;
                    text-align: center;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    background: rgba(255, 255, 255, 0.02);
                }
                .help-icon {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    margin: 0 auto 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    color: white;
                }
                .admin-icon {
                    background: linear-gradient(135deg, #0066ff 0%, #00ccff 100%);
                    box-shadow: 0 4px 15px rgba(0, 204, 255, 0.3);
                }
                .dev-icon {
                    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                }
                .help-card-header h2 {
                    margin: 0;
                    color: var(--text-primary);
                    font-size: 1.5rem;
                }
                .help-card-body {
                    padding: 30px 24px;
                }
                .help-desc {
                    color: var(--text-secondary);
                    text-align: center;
                    margin-bottom: 30px;
                    line-height: 1.6;
                    font-size: 0.95rem;
                }
                .contact-methods {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .contact-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 14px;
                    border-radius: 12px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }
                .btn-telegram {
                    background: rgba(36, 161, 222, 0.1);
                    color: #24A1DE;
                    border: 1px solid rgba(36, 161, 222, 0.2);
                }
                .btn-telegram:hover {
                    background: #24A1DE;
                    color: white;
                }
                .btn-phone {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
                .btn-phone:hover {
                    background: #10b981;
                    color: white;
                }
            </style>
        `;
    }

    destroy() {
        // Cleanup if needed
    }
}

