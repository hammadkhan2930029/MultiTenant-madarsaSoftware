import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HandHeart, Home, Menu, UserPlus, X } from 'lucide-react';
import Container from './Container';
import { navigation } from '../data/siteData';
import logo from '../../assets/logo.jpg';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  return (
    <header className="fw-navbar" dir="rtl">
      <Container className="fw-nav-inner">
        <Link to="/" className="fw-brand" aria-label="جامعہ دارالعلوم ہوم">
          <img src={logo} alt="جامعہ دارالعلوم کا لوگو" />
          <span><strong>جامعہ دارالعلوم</strong><small>تعلیم، تربیت، تحقیق و نشر</small></span>
        </Link>
        <nav className="fw-desktop-nav" aria-label="مرکزی نیویگیشن">
          {navigation.map((item, index) => (
            <NavLink className={({ isActive }) => isActive ? 'active' : ''} to={item.href} end={item.href === '/'} key={item.id}>
              {index === 0 && <Home />}{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="fw-nav-actions">
          <a className="fw-btn fw-btn-gold" href="/#sponsor"><HandHeart /> تعاون / عطیہ کیجیے</a>
          <Link className="fw-btn fw-btn-green" to="/admission"><UserPlus /> داخلہ حاصل کریں</Link>
        </div>
        <button className="fw-menu-button" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'مینو بند کریں' : 'مینو کھولیں'}>
          {open ? <X /> : <Menu />}
        </button>
      </Container>
      {open && (
        <div id="mobile-menu" className="fw-mobile-menu">
          <Container>
            {navigation.map((item) => <NavLink className={({ isActive }) => isActive ? 'active' : ''} to={item.href} end={item.href === '/'} key={item.id} onClick={() => setOpen(false)}>{item.label}</NavLink>)}
            <div><Link className="fw-btn fw-btn-green" to="/admission" onClick={() => setOpen(false)}>داخلہ حاصل کریں</Link><a className="fw-btn fw-btn-gold" href="/#sponsor">عطیہ کیجیے</a></div>
          </Container>
        </div>
      )}
    </header>
  );
};

export default Navbar;
