import { Link } from 'react-router-dom'

const Hero = () => {
    return (
        <section id="home" className="hero">
            <div className="hero-bg-glow"></div>

            <div className="container">
                <div className="hero-content">

                    {/* ── LEFT ── */}
                    <div className="hero-text">
                        <div className="hero-badge">
                            <span>⭐</span> Hamma yosh uchun
                        </div>

                        <h1 className="hero-title">
                            Robotlar sizni emas,<br />
                            <span className="hero-title__blue">siz robotlarni boshqaring!</span>
                        </h1>

                        <p className="hero-description">
                            Robotronix — Farg'ona va Namangan viloyatlaridagi yetakchi
                            robototexnika markazi...
                        </p>

                        <div className="hero-features">
                            <div className="hero-feature-item">
                                <div className="hero-feature-icon hero-feature-icon--blue">
                                    <i className="fas fa-robot"></i>
                                </div>
                                <span>Robototexnika</span>
                            </div>
                            <div className="hero-feature-item">
                                <div className="hero-feature-icon hero-feature-icon--orange">
                                    <span className="hero-feature-code">&lt;/&gt;</span>
                                </div>
                                <span>Dasturlash</span>
                            </div>
                            <div className="hero-feature-item">
                                <div className="hero-feature-icon hero-feature-icon--green">
                                    <i className="fas fa-brain"></i>
                                </div>
                                <span>Sun'iy intellekt</span>
                            </div>
                        </div>

                        <div className="hero-buttons">
                            <Link to="/courses" className="btn-hero-start">
                                <i className="fas fa-th"></i>
                                Kursni boshlash
                                <span className="btn-hero-arrow">→</span>
                            </Link>
                            <a href="#about" className="btn-hero-more">Batafsil</a>
                        </div>
                    </div>

                    {/* ── RIGHT ── */}
                    <div className="hero-visual">
                        <div className="hero-scene hero-scene--clean">
                            {/* Floating tech badges */}
                            <div className="hero-float-badge hero-float-badge--chip">
                                <i className="fas fa-microchip"></i>
                            </div>
                            <div className="hero-float-badge hero-float-badge--code">
                                <span>&lt;/&gt;</span>
                            </div>
                            <div className="hero-float-badge hero-float-badge--cpu">
                                <i className="fas fa-memory"></i>
                            </div>

                            {/* Decorative gems */}
                            <div className="hero-gem hero-gem--1"></div>
                            <div className="hero-gem hero-gem--2"></div>

                            {/* Main robot image */}
                            <div className="hero-image-wrapper">
                                <img
                                    src="/assets/images/robot-3d.png"
                                    alt="Robotronix 3D Robot"
                                    className="hero-main-3d-img"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

export default Hero
