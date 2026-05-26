import { useState } from 'react'
import Map from './Map'

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        course: '',
        message: '',
        agreement: false
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            alert('Xabar muvaffaqiyatli yuborildi!')
            setFormData({
                name: '',
                phone: '',
                course: '',
                message: '',
                agreement: false
            })
        } catch (error) {
            console.error('Contact form error:', error)
            alert('Xatolik yuz berdi. Qaytadan urinib ko\'ring.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section id="contact" className="contact">
            <div className="container">
                <div className="section-header" data-aos="fade-up">
                    <h2 className="section-title">Bog'lanish</h2>
                    <p className="section-subtitle">
                        Savollaringiz bormi? Biz bilan bog'laning!
                    </p>
                </div>

                <div className="contact-content">
                    <div className="contact-info" data-aos="fade-right">
                        <div className="contact-item">
                            <div className="contact-icon">
                                <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <div className="contact-details">
                                <h4>Manzil</h4>
                                <p>
                                    Farg'ona, Ma'rifat ko'chasi, 21B
                                </p>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-icon">
                                <i className="fas fa-phone"></i>
                            </div>
                            <div className="contact-details">
                                <h4>Telefon</h4>
                                <p>+998 33 803 33 53</p>
                            </div>
                        </div>

                        <div className="contact-item">
                            <div className="contact-icon">
                                <i className="fas fa-envelope"></i>
                            </div>
                            <div className="contact-details">
                                <h4>Email</h4>
                                <p>info@robotronix.uz</p>
                            </div>
                        </div>

                        <div className="social-links">
                            <a
                                href="https://t.me/Robotronix_LLC"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-telegram"></i>
                            </a>
                            <a
                                href="https://instagram.com/robotronixuz"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a
                                href="https://www.youtube.com/@robotronixuz"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-youtube"></i>
                            </a>
                        </div>
                        <Map/>
                    </div>

                    <div className="contact-form" data-aos="fade-left">
                        <form id="contactForm" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name" className="form-label">
                                    Ism va familiya *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone" className="form-label">
                                    Telefon raqam *
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="course" className="form-label">
                                    Qiziqtiruvchi kurs
                                </label>
                                <select
                                    id="course"
                                    name="course"
                                    className="form-select"
                                    value={formData.course}
                                    onChange={handleChange}
                                >
                                    <option value="">Kursni tanlang</option>
                                    <option value="mitti-muhandis">Mitti Muhandis (4-6 yosh)</option>
                                    <option value="kichik-muhandis">Kichik Muhandis (7-9 yosh)</option>
                                    <option value="yosh-muhandis">Yosh Muhandis (10-14 yosh)</option>
                                    <option value="dasturlash-ai">Dasturlash va AI (14+ yosh)</option>
                                    <option value="oquvchilar-kursi">O'qituvchilar kursi</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="message" className="form-label">
                                    Xabar
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    className="form-textarea"
                                    placeholder="Qo'shimcha savollaringiz..."
                                    value={formData.message}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <div className="form-checkbox">
                                <input
                                    type="checkbox"
                                    id="agreement"
                                    name="agreement"
                                    checked={formData.agreement}
                                    onChange={handleChange}
                                    required
                                />
                                <label htmlFor="agreement">
                                    Shaxsiy ma'lumotlarni qayta ishlashga roziman
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary btn-full"
                                disabled={isSubmitting}
                            >
                                <i className="fas fa-paper-plane"></i>
                                {isSubmitting ? 'Yuborilmoqda...' : 'Xabar yuborish'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Contact
