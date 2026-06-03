const Features = () => {
    const features = [
        {
            icon: 'fas fa-chalkboard-teacher',
            title: 'Tajribali ustozlar',
            description: "900 dan ortiq texnologiya fani o'qituvchilarini malakasini oshirgan professional jamoa"
        },
        {
            icon: 'fas fa-tools',
            title: 'Amaliy yondashuv',
            description: "Quruq nazariya emas, har bir darsda real qurilmalar yasash va ishga tushirish"
        },
        {
            icon: 'fas fa-certificate',
            title: 'Rasmiy maqom',
            description: "IT Park rezidenti, litsenziyalangan sertifikat beruvchi"
        },
        {
            icon: 'fas fa-microchip',
            title: 'Sifatli jihozlar',
            description: "Darslar uchun maxsus tayyorlangan Arduino va LEGO to'plamlari"
        }
    ]

    return (
        <section className="features" data-aos="fade-up">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Afzalliklarimiz</h2>
                    <p className="section-subtitle">Nima uchun aynan Robotronix?</p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="feature-card"
                            data-aos="fade-up"
                            data-aos-delay={(index + 1) * 100}
                        >
                            <div className="feature-icon">
                                <i className={feature.icon}></i>
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}

export default Features

