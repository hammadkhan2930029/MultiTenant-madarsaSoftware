import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import Container from './Container';
import { events, news, sponsorshipPlans } from '../data/siteData';

const ContentGrid = () => (
  <section id="news" className="fw-section fw-content-section" dir="rtl">
    <Container className="fw-content-grid">
      <article id="sponsor" className="fw-content-card fw-sponsor">
        <h2>طالب علم کی کفالت کریں</h2><p>ایک طالب علم کی تعلیمی کفالت کر کے اجرِ عظیم میں حصہ بنیں۔</p>
        <div className="fw-plan-list">{sponsorshipPlans.map((plan) => <div key={plan.id}><strong>{plan.title}</strong><span dir="ltr">{plan.price}</span></div>)}</div>
        <a className="fw-btn fw-btn-gold" href="#contact">کفالت کے لیے آگے بڑھیں</a>
      </article>
      <article className="fw-content-card">
        <header><h2>آئندہ تقریبات</h2><a href="#events">مزید دیکھیں</a></header>
        <div className="fw-event-list">{events.map((event) => (
          <div className="fw-event" key={event.id}><time><strong>{event.day}</strong><span>{event.month}</span></time><div><h3>{event.title}</h3><p><Clock3 />{event.time}<MapPin />{event.place}</p></div></div>
        ))}</div><div className="fw-dots"><b /><span /><span /></div>
      </article>
      <article className="fw-content-card">
        <header><h2>تازہ ترین خبریں</h2><a href="#all-news">مزید دیکھیں</a></header>
        <div className="fw-news-list">{news.map((item) => (
          <div className="fw-news" key={item.id}><img src={item.image} alt={item.title} /><div><h3>{item.title}</h3><p><CalendarDays />{item.date}</p></div></div>
        ))}</div><a className="fw-outline-button" href="#all-news">تمام خبریں دیکھیں</a>
      </article>
    </Container>
  </section>
);
export default ContentGrid;
