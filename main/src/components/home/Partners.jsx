const Partners = () => {
    const partners = [
        // { name: 'IT Park', image: '/assets/images/placeholder.svg' },
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

