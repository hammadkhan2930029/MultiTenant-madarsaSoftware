import { createElement, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, CalendarDays, Clock3, Mail, MapPin, Phone, Send, ShieldCheck, UserRound } from 'lucide-react';
import '../frontweb.css';
import TopBar from '../components/TopBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';
import { departments, gallery, news } from '../data/siteData';

const pageContent = {
  '/about': { title: 'جامعہ کا تعارف', subtitle: 'علم، تربیت اور کردار سازی کا روشن سفر', image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1800&q=85' },
  '/programs': { title: 'شعبہ جات', subtitle: 'دینی و عصری علوم کے جامع تعلیمی شعبے', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1800&q=85' },
  '/admission': { title: 'داخلہ', subtitle: 'علم و عمل کے سفر کا آج ہی آغاز کریں', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=85' },
  '/faculty': { title: 'اساتذہ کرام', subtitle: 'علم، تجربہ اور اخلاص سے مزین اساتذہ', image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1800&q=85' },
  '/dar-ul-ifta': { title: 'دارالافتاء', subtitle: 'قرآن و سنت کی روشنی میں شرعی رہنمائی', image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1800&q=85' },
  '/news': { title: 'خبریں و اعلانات', subtitle: 'جامعہ کی تازہ سرگرمیوں سے باخبر رہیے', image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1800&q=85' },
  '/gallery': { title: 'تصویری گیلری', subtitle: 'جامعہ کی علمی، تربیتی اور سماجی سرگرمیاں', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=85' },
  '/contact': { title: 'رابطہ کریں', subtitle: 'آپ کے سوالات اور آراء ہمارے لیے اہم ہیں', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1800&q=85' },
};

const Reveal = ({ children, className = '' }) => <div className={`fw-reveal ${className}`}>{children}</div>;

const InnerHero = ({ page }) => <section className="fw-inner-hero" style={{ '--inner-image': `url(${page.image})` }} dir="rtl"><Container><div><span>الرئيسیہ / {page.title}</span><h1>{page.title}</h1><p>{page.subtitle}</p></div></Container></section>;

const AboutPage = () => <>
  <Reveal><section className="fw-inner-section"><Container className="fw-about-grid"><div><SectionHeading>ہمارا تعارف</SectionHeading><p>جامعہ دارالعلوم ایک ممتاز دینی و عصری تعلیمی ادارہ ہے جہاں قرآن و سنت کی روشنی میں طلبہ کی علمی، اخلاقی اور عملی تربیت کی جاتی ہے۔ ہمارا مقصد ایسی باکردار نسل تیار کرنا ہے جو علم، خدمت اور دیانت کے ذریعے معاشرے کی رہنمائی کرے۔</p><p>تجربہ کار اساتذہ، جدید تدریسی وسائل، وسیع لائبریری اور محفوظ رہائشی ماحول طلبہ کو بہترین علمی سفر فراہم کرتے ہیں۔</p></div><img src="https://images.unsplash.com/photo-1590076215667-875d0f43d549?auto=format&fit=crop&w=1000&q=85" alt="جامعہ کی عمارت" /></Container></section></Reveal>
  <Reveal><section className="fw-inner-section fw-tinted"><Container className="fw-value-grid">{[['ہمارا مقصد','دینی بصیرت اور جدید مہارت رکھنے والی نسل کی تیاری'],['ہمارا وژن','علم و اخلاق میں ممتاز عالمی معیار کا ادارہ'],['ہماری اقدار','اخلاص، دیانت، احترام، تحقیق اور خدمتِ خلق']].map(([title,text])=><article key={title}><ShieldCheck/><h3>{title}</h3><p>{text}</p></article>)}</Container></section></Reveal>
</>;

const ProgramsPage = () => <Reveal><section className="fw-inner-section"><Container><SectionHeading>تعلیمی شعبہ جات</SectionHeading><div className="fw-program-grid">{departments.map(({id,title,description,icon})=><article key={id}>{createElement(icon)}<div><h3>{title}</h3><p>{description}، تجربہ کار اساتذہ اور منظم نصاب کے ساتھ۔</p><ul><li>مستند اور مرحلہ وار نصاب</li><li>ماہانہ تعلیمی جائزہ</li><li>طلبہ کی انفرادی رہنمائی</li></ul></div></article>)}</div></Container></section></Reveal>;

const AdmissionPage = () => <Reveal><section className="fw-inner-section"><Container className="fw-form-layout"><div><SectionHeading>آن لائن درخواست</SectionHeading><form className="fw-public-form" onSubmit={(e)=>e.preventDefault()}><label>طالب علم کا نام<input required placeholder="مکمل نام" /></label><label>والد / سرپرست کا نام<input required placeholder="سرپرست کا نام" /></label><div><label>موبائل نمبر<input dir="ltr" required placeholder="03XX XXXXXXX" /></label><label>مطلوبہ شعبہ<select defaultValue=""><option value="" disabled>شعبہ منتخب کریں</option>{departments.map(item=><option key={item.id}>{item.title}</option>)}</select></label></div><label>پتہ<textarea rows="3" placeholder="مکمل رہائشی پتہ" /></label><button className="fw-submit" type="submit"><Send/> درخواست جمع کریں</button></form></div><aside className="fw-info-panel"><h2>داخلہ کا طریقۂ کار</h2>{['آن لائن درخواست مکمل کریں','ضروری دستاویزات جمع کروائیں','داخلہ ٹیسٹ اور انٹرویو','کامیابی پر فیس جمع کروائیں'].map((x,i)=><p key={x}><b>{i+1}</b>{x}</p>)}<h3>ضروری دستاویزات</h3><ul><li>ب فارم یا شناختی کارڈ کی نقل</li><li>دو حالیہ تصاویر</li><li>سابقہ تعلیمی اسناد</li></ul></aside></Container></section></Reveal>;

const faculty = ['مفتی عبدالرحمن صاحب','مولانا محمد عثمان صاحب','قاری احمد سعید صاحب','مولانا زبیر حسن صاحب','مفتی حارث محمود صاحب','قاری عبداللہ صاحب'];
const FacultyPage = () => <Reveal><section className="fw-inner-section"><Container><SectionHeading>معزز اساتذہ کرام</SectionHeading><div className="fw-faculty-grid">{faculty.map((name,index)=><article key={name}><div><UserRound/></div><h3>{name}</h3><p>{index%2?'استادِ حدیث و فقہ':'استادِ قرآن و تجوید'}</p><span>تدریسی تجربہ: {8+index*2} سال</span></article>)}</div></Container></section></Reveal>;

const IftaPage = () => <Reveal><section className="fw-inner-section"><Container className="fw-form-layout"><div><SectionHeading>شرعی سوال ارسال کریں</SectionHeading><p className="fw-lead">دارالافتاء میں مستند مفتیانِ کرام قرآن و سنت اور فقہی اصولوں کی روشنی میں آپ کے سوالات کا جواب دیتے ہیں۔</p><form className="fw-public-form" onSubmit={(e)=>e.preventDefault()}><div><label>نام<input required /></label><label>ای میل<input dir="ltr" type="email" /></label></div><label>سوال کا عنوان<input required /></label><label>اپنا سوال تفصیل سے لکھیے<textarea rows="7" required /></label><button className="fw-submit" type="submit"><Send/> سوال ارسال کریں</button></form></div><aside className="fw-info-panel"><BookOpen/><h2>اہم ہدایات</h2><ul><li>سوال واضح اور مکمل تحریر کریں۔</li><li>ذاتی معلومات راز میں رکھی جائیں گی۔</li><li>جواب کے لیے 3 سے 7 ایام درکار ہو سکتے ہیں۔</li><li>پیچیدہ معاملات میں بالمشافہ ملاقات کریں۔</li></ul><p><Clock3/> اوقات: صبح 9 تا شام 4 بجے</p></aside></Container></section></Reveal>;

const NewsPage = () => <Reveal><section className="fw-inner-section"><Container><SectionHeading>تازہ ترین خبریں</SectionHeading><div className="fw-news-page-grid">{[...news,...news].map((item,index)=><article key={`${item.id}-${index}`}><img src={item.image} alt={item.title}/><div><span><CalendarDays/>{item.date}</span><h3>{item.title}</h3><p>جامعہ دارالعلوم کی علمی و تربیتی سرگرمی سے متعلق مکمل تفصیلات اور اہم معلومات پڑھیے۔</p><a href="#read">مزید پڑھیں</a></div></article>)}</div></Container></section></Reveal>;

const GalleryPage = () => <Reveal><section className="fw-inner-section"><Container><SectionHeading>جامعہ کی تصاویر</SectionHeading><div className="fw-gallery-page-grid">{[...gallery,...gallery].map((item,index)=><figure key={`${item.id}-${index}`}><img src={item.image} alt={item.alt}/><figcaption>{item.alt}</figcaption></figure>)}</div></Container></section></Reveal>;

const ContactPage = () => <Reveal><section className="fw-inner-section"><Container className="fw-form-layout"><div><SectionHeading>پیغام بھیجیں</SectionHeading><form className="fw-public-form" onSubmit={(e)=>e.preventDefault()}><div><label>آپ کا نام<input required /></label><label>ای میل<input dir="ltr" type="email" required /></label></div><label>موضوع<input required /></label><label>پیغام<textarea rows="6" required /></label><button className="fw-submit" type="submit"><Send/> پیغام ارسال کریں</button></form></div><aside className="fw-info-panel"><h2>رابطے کی معلومات</h2><p><MapPin/>جامعہ دارالعلوم، اسلام آباد، پاکستان</p><p dir="ltr"><Phone/>+92 300 1234567</p><p dir="ltr"><Mail/>info@madarsa.edu.pk</p><h3>دفتری اوقات</h3><p><Clock3/>پیر تا ہفتہ: صبح 8 تا شام 5 بجے</p></aside></Container></section></Reveal>;

const pageComponents = {'/about':AboutPage,'/programs':ProgramsPage,'/admission':AdmissionPage,'/faculty':FacultyPage,'/dar-ul-ifta':IftaPage,'/news':NewsPage,'/gallery':GalleryPage,'/contact':ContactPage};

const PublicPage = () => {
  const { pathname } = useLocation();
  const page = pageContent[pathname] || pageContent['/about'];
  const PageBody = pageComponents[pathname] || AboutPage;
  useEffect(() => { window.scrollTo(0,0); const elements=document.querySelectorAll('.frontweb .fw-reveal'); const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08}); elements.forEach(el=>observer.observe(el)); return()=>observer.disconnect(); },[pathname]);
  return <div className="frontweb"><TopBar/><Navbar/><main><InnerHero page={page}/><PageBody/></main><Footer/></div>;
};
export default PublicPage;
