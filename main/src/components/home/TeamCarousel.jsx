import { useState } from 'react';

const teamMembers = [
    {
        id: 1,
        name: 'Svetlana',
        role: 'Arduino ustozi',
        image: '/assets/images/team/team_1.png'
    },
    {
        id: 2,
        name: 'Boburbek',
        role: 'Robototexnika ustozi',
        image: '/assets/images/team/team_2.png'
    },
    {
        id: 3,
        name: 'Humoyun Mirzo',
        role: 'Robototexnika ustozi',
        image: '/assets/images/team/team_2.png'
    },
    {
        id: 4,
        name: 'Fotima',
        role: 'Robototexnika ustozi',
        image: '/assets/images/team/team_1.png'
    }
];

const TeamCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev >= teamMembers.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev <= 0 ? teamMembers.length - 1 : prev - 1));
    };

    const getTransformValue = () => {
        let itemsToShow = 3;
        if (typeof window !== 'undefined') {
            if (window.innerWidth <= 768) itemsToShow = 1;
            else if (window.innerWidth <= 992) itemsToShow = 2;
        }
        
        // Ensure we don't scroll past the end
        const maxIndex = teamMembers.length - itemsToShow;
        const actualIndex = Math.min(currentIndex, Math.max(0, maxIndex));
        
        return `translateX(-${actualIndex * (100 / itemsToShow)}%)`;
    };

    return (
        <section id="team" className="team-section">
            <div className="container" data-aos="fade-up">
                <div className="team-header text-center">
                    <h2 className="section-title">LOYIHANI AMALGA OSHIRAYOTGAN <span className="highlight">JAMOA</span></h2>
                    <p className="team-description">
                        Muhandislar, o'qituvchilar, marketologlar va dizaynerlar birgalikda ishlaydi,
                        texnologik ta'limni hayotiy va zamonaviy qilish uchun.
                    </p>
                </div>
                
                <div className="carousel-container">
                    <button className="carousel-btn prev-btn" onClick={prevSlide}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    
                    <div className="carousel-track-wrapper">
                        <div 
                            className="carousel-track" 
                            style={{ transform: getTransformValue() }}
                        >
                            {teamMembers.map((member) => (
                                <div key={member.id} className="carousel-slide">
                                    <div className="team-card">
                                        <div className="team-img-wrapper">
                                            <img src={member.image} alt={member.name} />
                                            <div className="team-overlay"></div>
                                        </div>
                                        <div className="team-info">
                                            <h3>{member.name}</h3>
                                            <p>{member.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="carousel-btn next-btn" onClick={nextSlide}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default TeamCarousel;
