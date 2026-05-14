const About = () => {
    const achievements = [
        "Farg'ona va Namangan viloyatlarida 10 dan ortiq hamkor maktablar",
        "Xalqaro tanlovlarda sovrinli o'rinlar (WRO, Technovation, FGC)",
        "Respublika Ta'lim Markazi bilan hamkorlik"
    ]

    const stats = [
        { number: '500+', label: "Tayyorlangan o'qituvchi" },
        { number: '2000+', label: "Muvaffaqiyatli o'quvchi" },
        { number: '15+', label: 'Xalqaro yutuq' }
    ]

    return (
        <section id="about" className="about">
            <div className="container">
                <div className="about-content">
                    <div className="about-text" data-aos="fade-right">
                        <h2 className="section-title">Robotronix haqida</h2>
                        <p className="about-description">
                            "Robotronix" — O'zbekistonda robototexnika ta'limini
                            yangi bosqichga olib chiqishni maqsad qilgan
                            innovatsion markazdir. Biz nafaqat bolalarga, balki
                            maktab o'qituvchilariga ham zamonaviy
                            texnologiyalarni o'rgatamiz.
                        </p>

                        <div className="achievements">
                            <div className="achievement-item">
                                <h4>Bizning yutuqlarimiz:</h4>
                                <ul>
                                    {achievements.map((achievement, index) => (
                                        <li key={index}>{achievement}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mission">
                            <h4>Missiyamiz:</h4>
                            <p>
                                Yoshlarni texnologiya iste'molchisidan
                                texnologiya ixtirochisiga aylantirish.
                            </p>
                        </div>

                        <button className="btn-primary">Biz bilan tanishing</button>
                    </div>

                    <div className="about-visual" data-aos="fade-left">
                        <div className="about-image">
                            <img
                                src="/assets/images/placeholder.svg"
                                alt="Robotronix jamoasi"
                            />
                            <div className="play-button">
                                <i className="fas fa-play"></i>
                            </div>
                        </div>

                        <div className="floating-stats">
                            {stats.map((stat, index) => (
                                <div key={index} className="stat-card">
                                    <span className="stat-number">{stat.number}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default About
