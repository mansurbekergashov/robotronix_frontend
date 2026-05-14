const InspiringMoments = () => {
    const galleryItems = [
        { id: 1, image: '/assets/images/gallery/gallery_1.png', size: 'large' },
        { id: 2, image: '/assets/images/gallery/gallery_2.png', size: 'medium' },
        { id: 3, image: '/assets/images/gallery/gallery_1.png', size: 'medium' },
        { id: 4, image: '/assets/images/gallery/gallery_2.png', size: 'large' },
    ];

    return (
        <section id="gallery" className="gallery-section">
            <div className="container" data-aos="fade-up">
                <div className="gallery-header">
                    <div className="gallery-title-wrapper">
                        <h2 className="section-title">Lahzalar, <br/><span className="highlight">ilhom beruvchi</span> lahzalar</h2>
                        <p className="gallery-description">
                            Yorqin g'oyalar, tabassumlar va ilk muhandislik kashfiyotlarining suratlari.
                        </p>
                    </div>
                    <button className="btn-outline">Barchasini ko'rish</button>
                </div>

                <div className="gallery-masonry">
                    {galleryItems.map((item) => (
                        <div key={item.id} className={`gallery-item ${item.size}`} data-aos="zoom-in">
                            <img src={item.image} alt={`Ilhom beruvchi lahza ${item.id}`} />
                            <div className="gallery-item-overlay">
                                <span className="view-icon"><i className="fas fa-search-plus"></i></span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default InspiringMoments;
