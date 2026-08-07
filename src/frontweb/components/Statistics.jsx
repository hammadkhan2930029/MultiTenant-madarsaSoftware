import { Megaphone } from 'lucide-react';
import { createElement } from 'react';
import Container from './Container';
import { statistics } from '../data/siteData';

const Statistics = () => (
  <div className="fw-overlap" dir="rtl">
    <Container>
      <div className="fw-announcement"><Megaphone /><strong>اہم اعلان:</strong><span>2026-27 کے داخلے جاری ہیں، مزید معلومات کے لیے داخلہ سیکشن دیکھیں۔</span></div>
      <div className="fw-stats-card">
        {statistics.map(({ id, icon: Icon, value, label }) => (
          <div className="fw-stat" key={id}><span className="fw-stat-icon">{createElement(Icon)}</span><span><strong dir="ltr">{value}</strong><small>{label}</small></span></div>
        ))}
      </div>
    </Container>
  </div>
);

export default Statistics;
