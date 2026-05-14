import { useEffect, useState } from "react";
import "../../styles/carousel.css";

const cards = [
  { id: 1, title: "Card 1" },
  { id: 2, title: "Card 2" },
  { id: 3, title: "Card 3" },
  { id: 4, title: "Card 4" },
  { id: 5, title: "Card 5" },
  { id: 6, title: "Card 6" },
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 2000);

    return () => clearInterval(interval);
  }, [current]);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % cards.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const getClassName = (index) => {
    if (index === current) return "card active";
    if (
      index === (current - 1 + cards.length) % cards.length ||
      index === (current + 1) % cards.length
    ) {
      return "card side";
    }
    return "card hidden";
  };

  return (
    <div className="carousel-container">
      <button className="nav-btn left" onClick={prevSlide}>
        ❮
      </button>

      <div className="carousel">
        {cards.map((card, index) => (
          <div className={getClassName(index)} key={card.id}>
            <h2>{card.title}</h2>
          </div>
        ))}
      </div>

      <button className="nav-btn right" onClick={nextSlide}>
        ❯
      </button>
    </div>
  );
}