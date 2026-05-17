import { useEffect, useRef, useState } from "react";
import "../../styles/carousel.css";

const teamMembers = [
  {
    id: 1,
    name: "Ism Familiya",
    position: "CEO & Asoschisi",
    image: null,
    initials: "IF",
    avatarBg: "linear-gradient(135deg, #214291, #1565c0)",
  },
  {
    id: 2,
    name: "Ism Familiya",
    position: "Bosh Muhandis",
    image: null,
    initials: "IF",
    avatarBg: "linear-gradient(135deg, #1565c0, #0d47a1)",
  },
  {
    id: 3,
    name: "Ism Familiya",
    position: "Robotika O'qituvchisi",
    image: null,
    initials: "IF",
    avatarBg: "linear-gradient(135deg, #ff6b35, #e64a19)",
  },
  {
    id: 4,
    name: "Ism Familiya",
    position: "Frontend Dasturchi",
    image: null,
    initials: "IF",
    avatarBg: "linear-gradient(135deg, #214291, #3557cc)",
  },
  {
    id: 5,
    name: "Ism Familiya",
    position: "Backend Dasturchi",
    image: null,
    initials: "IF",
    avatarBg: "linear-gradient(135deg, #0d47a1, #214291)",
  },
  {
    id: 6,
    name: "Ism Familiya",
    position: "Dizayner",
    image: null,
    initials: "IF",
    avatarBg: "linear-gradient(135deg, #ff6b35, #ff8c42)",
  },
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  const startInterval = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % teamMembers.length);
    }, 3000);
  };

  useEffect(() => {
    startInterval();
    return () => clearInterval(intervalRef.current);
  }, []);

  const goTo = (index) => {
    setCurrent(index);
    startInterval();
  };

  const prevSlide = () => {
    goTo((current - 1 + teamMembers.length) % teamMembers.length);
  };

  const nextSlide = () => {
    goTo((current + 1) % teamMembers.length);
  };

  const getCardClass = (index) => {
    const total = teamMembers.length;
    if (index === current) return "team-card active";
    if (index === (current - 1 + total) % total) return "team-card left";
    if (index === (current + 1) % total) return "team-card right";
    if (index === (current - 2 + total) % total) return "team-card far-left";
    if (index === (current + 2) % total) return "team-card far-right";
    return "team-card hidden";
  };

  return (
    <section className="team-section">
      <div className="team-section__header">
        <span className="team-section__label">Jamoamiz</span>
        <h2 className="team-section__title">Bizning Mutaxassislar</h2>
        <p className="team-section__desc">
          Robotronix jamoasi — ta'lim va texnologiyaga ishtiyoqli mutaxassislar
        </p>
      </div>

      <div className="team-carousel">
        <button className="team-nav left" onClick={prevSlide} aria-label="Oldingi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="team-track">
          {teamMembers.map((member, index) => (
            <div className={getCardClass(index)} key={member.id} onClick={() => goTo(index)}>
              <div className="team-card__photo">
                {member.image ? (
                  <img src={member.image} alt={member.name} />
                ) : (
                  <div className="team-card__avatar" style={{ background: member.avatarBg }}>
                    <span>{member.initials}</span>
                  </div>
                )}
                <div className="team-card__overlay" />
              </div>
              <div className="team-card__info">
                <h3 className="team-card__name">{member.name}</h3>
                <p className="team-card__position">{member.position}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="team-nav right" onClick={nextSlide} aria-label="Keyingi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="team-dots">
        {teamMembers.map((_, index) => (
          <button
            key={index}
            className={`team-dot${index === current ? " active" : ""}`}
            onClick={() => goTo(index)}
            aria-label={`${index + 1}-hodim`}
          />
        ))}
      </div>
    </section>
  );
}
