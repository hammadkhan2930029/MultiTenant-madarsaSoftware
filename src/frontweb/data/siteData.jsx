import {
  BookOpen, BookMarked, Building2, GraduationCap, Laptop, MonitorPlay,
  School, Users, UserRoundCheck,
} from 'lucide-react';

export const navigation = [
  { id: 'home', label: 'الرئيسیہ', href: '/' },
  { id: 'about', label: 'تعارف', href: '/about' },
  { id: 'departments', label: 'شعبہ جات', href: '/programs' },
  { id: 'admission', label: 'داخلہ', href: '/admission' },
  { id: 'teachers', label: 'اساتذہ', href: '/faculty' },
  { id: 'darulifta', label: 'دارالافتاء', href: '/dar-ul-ifta' },
  { id: 'news', label: 'خبریں', href: '/news' },
  { id: 'gallery', label: 'گیلری', href: '/gallery' },
  { id: 'contact', label: 'رابطہ', href: '/contact' },
];

export const heroSlides = [
  {
    id: 1,
    eyebrow: 'جامعہ دارالعلوم میں خوش آمدید',
    title: 'علم، دین کی اشاعت',
    subtitle: 'اور سنہری مستقبل کی ضمانت',
    description: 'جامعہ دارالعلوم میں دینی و عصری تعلیم کے ساتھ طلبہ کی اخلاقی اور ذہنی تربیت کا بہترین ماحول فراہم کیا جاتا ہے۔',
    image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=2000&q=88',
  },
  {
    id: 2,
    eyebrow: 'جدید اور معیاری نظامِ تعلیم',
    title: 'قرآن و سنت کی روشنی',
    subtitle: 'میں کردار سازی کا سفر',
    description: 'قابل اساتذہ کی نگرانی میں حفظ، ناظرہ، درسِ نظامی اور عصری علوم کی جامع تعلیم۔',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=88',
  },
];

export const statistics = [
  { id: 1, label: 'طلبہ', value: '2500+', icon: Users },
  { id: 2, label: 'اساتذہ', value: '120+', icon: UserRoundCheck },
  { id: 3, label: 'شعبہ جات', value: '12+', icon: BookOpen },
  { id: 4, label: 'فارغ التحصیل طلبہ', value: '5000+', icon: GraduationCap },
  { id: 5, label: 'حفاظِ قرآن', value: '300+', icon: BookMarked },
];

export const departments = [
  { id: 1, title: 'عصری تعلیم', description: 'دینی تعلیم کے ساتھ معیاری عصری تعلیم', icon: Laptop, dark: true },
  { id: 2, title: 'دارالافتاء', description: 'شرعی مسائل کے حل کے لیے دارالافتاء', icon: Building2, dark: false },
  { id: 3, title: 'درسِ نظامی', description: 'عالمی معیار کے مطابق دینی نصاب کورس', icon: School, dark: true },
  { id: 4, title: 'ناظرہ قرآن', description: 'ناظرہ قرآن کی معیاری تعلیم', icon: BookOpen, dark: false },
  { id: 5, title: 'حفظ القرآن', description: 'کامل حفظِ قرآن کا بہترین انتظام', icon: BookMarked, dark: true },
];

export const news = [
  { id: 1, title: 'داخلہ برائے سال 2026-27 کا آغاز', date: '15 جولائی، 2026', image: 'https://images.unsplash.com/photo-1590076215667-875d0f43d549?auto=format&fit=crop&w=400&q=80' },
  { id: 2, title: 'سالانہ دستار بندی کی تقریب', date: '10 جولائی، 2026', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=400&q=80' },
  { id: 3, title: 'طلبہ کے لیے نئی لائبریری کا افتتاح', date: '5 جولائی، 2026', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=400&q=80' },
];

export const events = [
  { id: 1, day: '25', month: 'جولائی', title: 'سالانہ دستار بندی', time: '09:00 صبح', place: 'جامعہ ہال' },
  { id: 2, day: '10', month: 'اگست', title: 'علمی سیمینار', time: '10:00 صبح', place: 'جامعہ کانفرنس ہال' },
  { id: 3, day: '20', month: 'اگست', title: 'تقسیمِ اسناد', time: '09:00 صبح', place: 'جامعہ ہال' },
];

export const sponsorshipPlans = [
  { id: 1, title: '1 ماہ کی کفالت', price: '3,000 روپے' },
  { id: 2, title: '3 ماہ کی کفالت', price: '8,500 روپے' },
  { id: 3, title: '6 ماہ کی کفالت', price: '16,000 روپے' },
  { id: 4, title: '1 سال کی کفالت', price: '30,000 روپے' },
];

export const gallery = [
  { id: 1, alt: 'جامعہ کی مرکزی عمارت', image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=700&q=82' },
  { id: 2, alt: 'جامعہ کی لائبریری', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=700&q=82' },
  { id: 3, alt: 'طلبہ درس میں مصروف', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=700&q=82' },
  { id: 4, alt: 'جامعہ کا اجتماع', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=82' },
  { id: 5, alt: 'جامعہ کا خوبصورت بیرونی منظر', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=700&q=82' },
];

export const departmentFeatureIcon = MonitorPlay;
