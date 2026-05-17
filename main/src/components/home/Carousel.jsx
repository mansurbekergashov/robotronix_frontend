import { useEffect, useRef, useState } from "react";
import "../../styles/carousel.css";

const AVATAR_COLORS = [
  "linear-gradient(135deg, #214291, #1565c0)",
  "linear-gradient(135deg, #1565c0, #0d47a1)",
  "linear-gradient(135deg, #ff6b35, #e64a19)",
  "linear-gradient(135deg, #214291, #3557cc)",
  "linear-gradient(135deg, #0d47a1, #214291)",
  "linear-gradient(135deg, #ff6b35, #ff8c42)",
];

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

export default function Carousel() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const startInterval = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % members.length);
    }, 3000);
  };

  useEffect(() => {
    if (members.length < 2) return;
    startInterval();
    return () => clearInterval(intervalRef.current);
  }, [members]);

  const goTo = (index) => {
    setCurrent(index);
    startInterval();
  };

  const prevSlide = () => goTo((current - 1 + members.length) % members.length);
  const nextSlide = () => goTo((current + 1) % members.length);

  const getCardClass = (index) => {
    const total = members.length;
    if (index === current) return "team-card active";
    if (index === (current - 1 + total) % total) return "team-card left";
    if (index === (current + 1) % total) return "team-card right";
    if (index === (current - 2 + total) % total) return "team-card far-left";
    if (index === (current + 2) % total) return "team-card far-right";
    return "team-card hidden";
  };

  if (loading) {
    return (
      <section className="team-section">
        <div className="team-section__header">
          <span className="team-section__label">Jamoamiz</span>
          <h2 className="team-section__title">Bizning Mutaxassislar</h2>
        </div>
        <div className="team-skeleton-row">
          {[1, 2, 3].map((i) => <div key={i} className="team-skeleton-card" />)}
        </div>
      </section>
    );
  }

  if (members.length === 0) return null;

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
        {members.length > 1 && (
          <button className="team-nav left" onClick={prevSlide} aria-label="Oldingi">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <div className="team-track">
          {members.map((member, index) => (
            <div
              className={getCardClass(index)}
              key={member.id}
              onClick={() => index !== current && goTo(index)}
            >
              <div className="team-card__photo">
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} />
                ) : (
                  <div
                    className="team-card__avatar"
                    style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                  >
                    <span>{getInitials(member.name)}</span>
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

        {members.length > 1 && (
          <button className="team-nav right" onClick={nextSlide} aria-label="Keyingi">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {members.length > 1 && (
        <div className="team-dots">
          {members.map((_, index) => (
            <button
              key={index}
              className={`team-dot${index === current ? " active" : ""}`}
              onClick={() => goTo(index)}
              aria-label={`${index + 1}-hodim`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
