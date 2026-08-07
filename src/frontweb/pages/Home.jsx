import { useEffect } from 'react';
import '../frontweb.css';
import TopBar from '../components/TopBar';
import Navbar from '../components/Navbar';
import HeroSlider from '../components/HeroSlider';
import Statistics from '../components/Statistics';
import DepartmentsSection from '../components/DepartmentsSection';
import ContentGrid from '../components/ContentGrid';
import GallerySection from '../components/GallerySection';
import Footer from '../components/Footer';

const FrontHome = () => {
  useEffect(() => {
    const elements = document.querySelectorAll('.frontweb .fw-reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="frontweb">
      <TopBar /><Navbar /><main><HeroSlider /><div className="fw-reveal"><Statistics /></div><div className="fw-reveal"><DepartmentsSection /></div><div className="fw-reveal"><ContentGrid /></div><div className="fw-reveal"><GallerySection /></div></main><div className="fw-reveal"><Footer /></div>
    </div>
  );
};
export default FrontHome;
