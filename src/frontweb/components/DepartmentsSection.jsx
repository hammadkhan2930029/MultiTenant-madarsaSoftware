import Container from './Container';
import { createElement } from 'react';
import SectionHeading from './SectionHeading';
import { departments } from '../data/siteData';

const DepartmentsSection = () => (
  <section id="departments" className="fw-section fw-departments" dir="rtl">
    <Container>
      <SectionHeading>شعبہ جات</SectionHeading>
      <div className="fw-department-grid">
        {departments.map(({ id, icon: Icon, title, description, dark }) => (
          <article className={`fw-department-card ${dark ? 'is-dark' : ''}`} key={id}>
            <div className="fw-department-icon">{createElement(Icon)}</div><h3>{title}</h3><p>{description}</p><a href="#contact">مزید معلومات</a>
          </article>
        ))}
      </div>
    </Container>
  </section>
);
export default DepartmentsSection;
