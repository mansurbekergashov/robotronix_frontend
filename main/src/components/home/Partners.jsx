const Partners = () => {
    const partners = [
        { name: 'Ideal School', image: '/assets/images/partners/ideal-school.png' },
        { name: 'Edu Nova', image: '/assets/images/partners/edunova.png' },
        { name: 'Ideal Orzular', image: '/assets/images/partners/ideal-orzular.png' },
        { name: 'Ziyrak', image: '/assets/images/partners/ziyrak.png' },
        { name: 'Beruniy', image: '/assets/images/partners/beruniy.png' },
        { name: 'Al Kamal', image: '/assets/images/partners/al-kamal.png' },
    ]


    return (
        <section className="partners" data-aos="fade-up">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Hamkorlarimiz</h2>
                    <p className="section-subtitle">
                        Bizga ishonuvchi tashkilotlar
                    </p>
                </div>

                <div className="partners-marquee">
                    <div className="partners-track">
                        {[...partners, ...partners].map((partner, index) => (
                            <div key={index} className="partner-logo">
                                <img src={partner.image} alt={partner.name} loading="lazy" decoding="async" />
                                <span>{partner.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            
            
            </div>
        </section>
    )
}


export default Partners

