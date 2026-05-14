const Partners = () => {
    const partners = [
        { name: 'IT Park', image: '/assets/images/placeholder.svg' },
        { name: 'Cyberpark', image: '/assets/images/placeholder.svg' },
        { name: "Ta'lim vazirligi", image: '/assets/images/placeholder.svg' },
        { name: 'RTM', image: '/assets/images/placeholder.svg' }
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

                <div className="partners-grid">
                    {partners.map((partner, index) => (
                        <div key={index} className="partner-logo">
                            <img src={partner.image} alt={partner.name} />
                        </div>
                    ))}
                </div>
            
            
            </div>
        </section>
    )
}


export default Partners

