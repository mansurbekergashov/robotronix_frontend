// Guide Page
export default class Guide {
    constructor() {
        this.container = document.getElementById('main-content');
    }

    async render() {
        this.container.innerHTML = `
            <div class="page-header">
                <div class="header-content">
                    <div>
                        <h1><i class="fas fa-book-open"></i> Yo'riqnoma</h1>
                        <p>Saytdan qanday to'g'ri foydalanish bo'yicha qo'llanma</p>
                    </div>
                </div>
            </div>

            <div class="guide-container">
                <div class="guide-grid">
                    
                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-home"></i></div>
                        <div class="guide-content">
                            <h3>Dashboard (Bosh sahifa)</h3>
                            <p>Bu yerda siz o'zingizning umumiy statistikangizni (faol kurslar, buyurtmalar, savatdagi mahsulotlar) va so'nggi ma'lumotlarni qisqacha ko'rishingiz mumkin.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-newspaper"></i></div>
                        <div class="guide-content">
                            <h3>Yangiliklar va E'lonlar</h3>
                            <p>Admin tomonidan joylashtirilgan so'nggi yangiliklar va muhim e'lonlarni shu bo'limda ko'rishingiz mumkin. Yangiliklar va e'lonlar alohida tab orqali filtrlanadi. Muhim xabarlar pin qilingan holda yuqorida ko'rinadi. Har bir yangilikni bosib to'liq matnini o'qishingiz mumkin.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-book"></i></div>
                        <div class="guide-content">
                            <h3>Kurslar</h3>
                            <p>Barcha mavjud o'quv kurslari ro'yxati. Bu yerdan siz o'zingizga yoqqan kursni tanlab, "Yozilish" tugmasi orqali arizangizni yuborishingiz mumkin.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-graduation-cap"></i></div>
                        <div class="guide-content">
                            <h3>Kurslarim</h3>
                            <p>Siz yozilgan va admin tomonidan tasdiqlangan kurslar. Bu yerda siz kurs statusini (tasdiqlangan, o'qishda, tugallangan) kuzatib borishingiz mumkin.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-certificate"></i></div>
                        <div class="guide-content">
                            <h3>Sertifikatlarim</h3>
                            <p>Admin tomonidan kurs yakunlangandan so'ng berilgan sertifikatlar shu yerda ko'rinadi. Sertifikatni ko'rish (preview) va yuklab olish imkoniyati mavjud.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-store"></i></div>
                        <div class="guide-content">
                            <h3>Do'kon</h3>
                            <p>Turli xil robototexnika moslamalari va ehtiyot qismlari. Ular bilan tanishib, keraklilarini "Savatga qo'shish" tugmasi orqali savatingizga yig'ishingiz mumkin.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-shopping-cart"></i></div>
                        <div class="guide-content">
                            <h3>Savat</h3>
                            <p>Tanlangan mahsulotlar saqlanadigan joy. Bu yerda miqdorni o'zgartirishingiz va yetkazib berish ma'lumotlarini kiritib, buyurtmani rasmiylashtirishingiz mumkin.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-shopping-bag"></i></div>
                        <div class="guide-content">
                            <h3>Buyurtmalarim</h3>
                            <p>Siz xarid qilgan mahsulotlar tarixi. Har bir buyurtmaning joriy holatini (tayyorlanmoqda, yo'lda, yetkazildi) va to'lov summasini bilib olish imkoniyatiga egasiz.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-comments"></i></div>
                        <div class="guide-content">
                            <h3>Chat</h3>
                            <p>Administratorlar bilan to'g'ridan-to'g'ri bog'lanish uchun xabar almashish tizimi. Savollaringiz yoki takliflaringiz bo'lsa, shu yerdan yozishingiz mumkin.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-book-open"></i></div>
                        <div class="guide-content">
                            <h3>Yo'riqnoma</h3>
                            <p>Platformadagi barcha bo'limlar va ularning vazifalari haqida qisqacha tushuntirish. Noma'lum joy bo'lsa, avvalo shu bo'limni ko'rib chiqing.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-headset"></i></div>
                        <div class="guide-content">
                            <h3>Yordam</h3>
                            <p>Texnik muammo, savol yoki taklif bo'lsa, administrator yoki dasturchi bilan tezkor bog'lanish havolalari shu bo'limda joylashgan.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-user"></i></div>
                        <div class="guide-content">
                            <h3>Profil</h3>
                            <p>Shaxsiy ma'lumotlaringizni (ism-sharif, telefon raqam, manzil) ko'rish va tahrirlash tizimi. Parolingizni ham shu yerdan yangilashingiz mumkin.</p>
                        </div>
                    </div>

                    <div class="guide-card">
                        <div class="guide-icon"><i class="fas fa-sign-out-alt"></i></div>
                        <div class="guide-content">
                            <h3>Chiqish / Saytga qaytish</h3>
                            <p>Paneldan chiqish yoki umumiy saytga qaytish uchun pastdagi tugmalardan foydalaning. Xavfsizlik uchun ishni tugatgach chiqishni tavsiya qilamiz.</p>
                        </div>
                    </div>

                </div>
            </div>
            
            <style>
                .guide-container {
                    padding: 20px 0;
                }
                .guide-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 24px;
                }
                .guide-card {
                    background: var(--card-bg);
                    border: 1px solid transparent;
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    gap: 20px;
                    transition: all 0.3s ease;
                    box-shadow: var(--shadow-md);
                }
                .guide-card:hover {
                    transform: translateY(-5px);
                    border: 1px solid transparent;

                }
                .guide-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(0, 204, 255, 0.1) 100%);
                    color: #00ccff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    flex-shrink: 0;
                }
                .guide-content h3 {
                    margin: 0 0 8px 0;
                    color: var(--text-primary);
                    font-size: 1.1rem;
                }
                .guide-content p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
            </style>
        `;
    }

    destroy() {
        // Cleanup if needed
    }
}

