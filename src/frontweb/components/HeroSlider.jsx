import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, UserPlus } from 'lucide-react';
import Container from './Container';
import { heroSlides } from '../data/siteData';

const HeroSlider = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % heroSlides.length), 7000);
    return () => window.clearInterval(timer);
  }, []);
  const slide = heroSlides[active];
  const move = (direction) => setActive((active + direction + heroSlides.length) % heroSlides.length);

  return (
    <section id="home" className="fw-hero" style={{ '--hero-image': `url(${slide.image})` }} dir="rtl">
      <div className="fw-hero-overlay" />
      <Container className="fw-hero-content">
        <div className="fw-hero-copy">
          <span className="fw-eyebrow">{slide.eyebrow}</span>
          <h1>{slide.title}</h1>
          <h2>{slide.subtitle}</h2>
          <p>{slide.description}</p>
          <div className="fw-hero-buttons">
            <a className="fw-btn fw-btn-green" href="#admission"><UserPlus /> داخلہ حاصل کریں</a>
            <a className="fw-btn fw-btn-gold" href="#sponsor"><Heart /> تعاون / عطیہ کریں</a>
          </div>
        </div>
      </Container>
      <button className="fw-slider-arrow fw-arrow-left" onClick={() => move(-1)} aria-label="پچھلی سلائیڈ"><ChevronLeft /></button>
      <button className="fw-slider-arrow fw-arrow-right" onClick={() => move(1)} aria-label="اگلی سلائیڈ"><ChevronRight /></button>
    </section>
  );
};

export default HeroSlider;
