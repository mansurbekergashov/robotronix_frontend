import { Link } from 'react-router-dom'

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">
                            <img
                                src="/robologo.png"
                                alt="Robotronix"
                            />
                            <span className="logo-text">Robotronix</span>
                        </Link>
                        <p className="footer-description">
                            Robotronix – O'zbekistonda robototexnika ta'limini
                            yangi bosqichga olib chiquvchi innovatsion markaz.
                            Yoshlarni texnologiya iste'molchisidan ixtirochisiga
                            aylantiramiz.
                        </p>
                        <div className="footer-social">
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
                                href="https://youtube.com/robotronixuz"
                                className="social-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-youtube"></i>
                            </a>
                        </div>
                    </div>

                    <div className="footer-section">
                        <h4>Kurslar</h4>
                        <ul className="footer-links">
                            <li><a href="/#courses">Mitti Muhandis</a></li>
                            <li><a href="/#courses">Kichik Muhandis</a></li>
                            <li><a href="/#courses">Yosh Muhandis</a></li>
                            <li><a href="/#courses">Dasturlash va AI</a></li>
                            <li><a href="/#courses">O'qituvchilar kursi</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Mahsulotlar</h4>
                        <ul className="footer-links">
                            <li><a href="/#products">Arduino To'plamlari</a></li>
                            <li><a href="/#products">LEGO WeDo 2.0</a></li>
                            <li><a href="/#products">3D Modellar</a></li>
                            <li><a href="/#products">Elektronika Qismlari</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Kompaniya</h4>
                        <ul className="footer-links">
                            <li><a href="/#about">Biz haqimizda</a></li>
                            <li><a href="/#contact">Aloqa</a></li>
                            <li><a href="#">Hamkorlik</a></li>
                            <li><a href="#">Yangiliklar</a></li>
                            <li><a href="#">Vakansiyalar</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div>
                        <p>
                            &copy; {new Date().getFullYear()} Robotronix. Barcha huquqlar
                            himoyalangan.
                        </p>
                    </div>
                    <div>
                        <a href="#">Maxfiylik siyosati</a>
                        <span style={{ margin: '0 10px' }}>•</span>
                        <a href="#">Foydalanish shartlari</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
