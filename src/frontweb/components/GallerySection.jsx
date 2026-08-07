import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Container from './Container';
import SectionHeading from './SectionHeading';
import { gallery } from '../data/siteData';

const GallerySection = () => {
  const trackRef = useRef(null);

  const moveSlider = (direction = 1) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector('.fw-gallery-slide');
    if (!slide) return;
    const gap = Number.parseFloat(window.getComputedStyle(track).gap) || 0;
    const step = slide.getBoundingClientRect().width + gap;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - step / 2;
    const atStart = track.scrollLeft <= step / 2;

    if (direction > 0 && atEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
    else if (direction < 0 && atStart) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
    else track.scrollBy({ left: step * direction, behavior: 'smooth' });
  };

  useEffect(() => {
    const timer = window.setInterval(() => moveSlider(1), 3200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section id="gallery" className="fw-gallery fw-section" dir="rtl"><Container><SectionHeading>گیلری</SectionHeading>
      <div className="fw-gallery-slider">
        <button className="fw-gallery-arrow fw-gallery-prev" type="button" onClick={() => moveSlider(-1)} aria-label="پچھلی تصاویر"><ChevronLeft /></button>
        <div className="fw-gallery-track" ref={trackRef} dir="ltr">
          {gallery.map((item) => <div className="fw-gallery-slide" key={item.id}><img src={item.image} alt={item.alt} loading="lazy" /></div>)}
        </div>
        <button className="fw-gallery-arrow fw-gallery-next" type="button" onClick={() => moveSlider(1)} aria-label="اگلی تصاویر"><ChevronRight /></button>
      </div>
      <a className="fw-gallery-more" href="#gallery-more">مزید تصاویر دیکھیں</a>
    </Container></section>
  );
};
export default GallerySection;
