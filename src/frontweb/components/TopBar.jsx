import { Camera, Mail, Phone, Share2, UserRound, Video } from 'lucide-react';
import Container from './Container';

const TopBar = () => (
  <div className="fw-topbar" dir="ltr">
    <Container className="fw-topbar-inner">
      <div className="fw-contact-mini">
        <a href="mailto:info@madarsa.edu.pk"><Mail /> info@madarsa.edu.pk</a>
        <a href="tel:+923001234567"><Phone /> +92 300 1234567</a>
      </div>
      <div className="fw-social-mini">
        <a href="/admin"><UserRound /> Staff Login</a>
        <a href="/login"><UserRound /> Student Login</a>
        <a aria-label="Facebook" href="#facebook"><Share2 /></a>
        <a aria-label="Youtube" href="#youtube"><Video /></a>
        <a aria-label="Instagram" href="#instagram"><Camera /></a>
      </div>
    </Container>
  </div>
);

export default TopBar;
