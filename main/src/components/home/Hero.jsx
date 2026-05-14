import { Link } from 'react-router-dom'

const Hero = () => {
    return (
        <section id="home" className="hero">
            <div className="hero-background">
            </div>

            <div className="container">
                <div className="hero-content">
                    <div className="hero-text" data-aos="fade-up">
                        <h1 className="hero-title">
                            <span className="gradient-text">Robotlar sizni emas,</span>
                            <br />
                            <span className="highlight">siz robotlarni boshqaring!</span>
                        </h1>
                        <p className="hero-description">
                            Robotronix - Farg'ona va Namangan viloyatlaridagi
                            yetakchi robototexnika markazi. Biz bolalar va
                            o'qituvchilarni kelajak texnologiyalari bilan
                            tanishtiramiz.
                        </p>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-number">500+</span>
                                <span className="stat-label">O'qituvchi</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">2000+</span>
                                <span className="stat-label">O'quvchi</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">10+</span>
                                <span className="stat-label">Filial</span>
                            </div>
                        </div>
                        <div className="hero-buttons">
                            <Link to="/courses" className="btn-primary btn-large">
                                <i className="fas fa-robot"></i>
                                Kursni boshlash
                            </Link>
                            <a href="#about" className="btn-outline btn-large">
                                <i className="fas fa-play"></i>
                                Batafsil
                            </a>
                        </div>
                    </div>

                    <div className="hero-visual" data-aos="fade-left">
                        <div className="robot-showcase">
                            <div className="main-robot">
                                <div className="robot-body">
                                    <div className="robot-head-main">
                                        <div className="robot-eye-main left-eye"></div>
                                        <div className="robot-eye-main right-eye"></div>
                                        <div className="robot-antenna"></div>
                                    </div>
                                    <div className="robot-torso">
                                        <div className="led-indicator"></div>
                                        <div className="led-indicator"></div>
                                        <div className="led-indicator"></div>
                                    </div>
                                    <div className="robot-arms">
                                        <div className="arm left-arm"></div>
                                        <div className="arm right-arm"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="code-lines">
                                <div className="code-line">void setup() {'{'}</div>
                                <div className="code-line">Serial.begin(9600);</div>
                                <div className="code-line">pinMode(LED, OUTPUT);</div>
                                <div className="code-line">{'}'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero

