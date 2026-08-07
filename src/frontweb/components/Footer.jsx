import { Camera, Mail, MapPin, Phone, Share2, Video } from 'lucide-react';
import Container from './Container';
import logo from '../../assets/logo.jpg';

const Footer = () => (
  <footer id="contact" className="fw-footer" dir="rtl"><Container className="fw-footer-grid">
    <div className="fw-footer-about"><div className="fw-footer-brand"><img src={logo} alt="جامعہ دارالعلوم لوگو" /><span><strong>جامعہ دارالعلوم</strong><small>تعلیم، تربیت، تحقیق و نشر</small></span></div><p>قرآن و سنت کی خدمت اور علوم کی اشاعت کے لیے کوشاں، جہاں طلبہ کی بہترین تعلیم و تربیت ہمارا مقصد ہے۔</p></div>
    <div><h3>اہم لنکس</h3><a href="/">ہوم</a><a href="/about">تعارف</a><a href="/faculty">اساتذہ کرام</a><a href="/news">تقویم اوقات</a></div>
    <div><h3>مفید لنکس</h3><a href="/admission">داخلہ</a><a href="/programs">شعبہ جات</a><a href="/dar-ul-ifta">دارالافتاء</a><a href="/gallery">گیلری</a></div>
    <div><h3>ہم سے رابطہ کریں</h3><p><MapPin />جامعہ دارالعلوم، اسلام آباد، پاکستان</p><a dir="ltr" href="tel:+923001234567"><Phone />+92 300 1234567</a><a dir="ltr" href="mailto:info@madarsa.edu.pk"><Mail />info@madarsa.edu.pk</a><div className="fw-footer-social"><a aria-label="Facebook" href="#facebook"><Share2 /></a><a aria-label="Youtube" href="#youtube"><Video /></a><a aria-label="Instagram" href="#instagram"><Camera /></a></div></div>
  </Container><div className="fw-copyright"><Container><span>© 2026 جامعہ دارالعلوم۔ جملہ حقوق محفوظ ہیں۔</span><span dir="ltr">Developed by Your Company</span></Container></div></footer>
);
export default Footer;
