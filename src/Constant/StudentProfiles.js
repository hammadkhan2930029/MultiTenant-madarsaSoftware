import { AppImages } from './AppImages';

const STORAGE_KEY = 'madarsa_student_profiles';
const STORE_EVENT = 'madarsa-students-updated';

const defaultStudentProfiles = [
  {
    id: 'STU-001',
    image: AppImages.profile,
    admission: {
      idNo: 'STU-001',
      admissionDate: '2026-04-15',
      admissionFee: '5000',
      monthlyFee: '2500',
      reside: 'نہیں',
    },
    personal: {
      fullName: 'محمد احمد',
      fatherName: 'عبدالرحمن',
      caste: 'شیخ',
      cnic: '42101-1234567-1',
      dob: '2013-08-12',
      bForm: '42101-9876543-1',
      medicalCondition: 'کوئی خاص مسئلہ نہیں',
    },
    contact: {
      currentAddress: 'گلی نمبر 4، بلاک 12، گلشن اقبال، کراچی',
      permanentAddress: 'ضلع حافظ آباد، پنجاب',
      district: 'کراچی',
      mobile: '0300-1234567',
      whatsapp: '0300-1234567',
      fatherOccupation: 'تاجر',
    },
    guardian: {
      guardianName: 'عائشہ عبدالرحمن',
      relation: 'والدہ',
      guardianMobile: '0333-5552244',
      guardianEmail: 'family.stu001@example.com',
      guardianCnic: '42101-7654321-9',
    },
    education: {
      religiousEdu: 'ناظرہ مکمل',
      secularEdu: 'کلاس پنجم',
      prevMadrassa: 'جامعہ فاروقیہ',
      prevSchool: 'سٹی ماڈل اسکول',
      requiredClass: 'ہشتم',
      requiredJamaat: 'نورانیہ',
      teacherName: 'قاری اسماعیل',
    },
    classInfo: {
      campus: 'مین کیمپس',
      className: 'ہشتم',
      section: 'A',
      familyNo: 'F-501',
      rollNo: '101',
    },
    parents: [
      { role: 'والد', name: 'عبدالرحمن', phone: '0300-1234567', occupation: 'تاجر' },
      { role: 'والدہ', name: 'عائشہ عبدالرحمن', phone: '0333-5552244', occupation: 'گھریلو خاتون' },
    ],
    attendance: {
      totalDays: 30,
      present: 27,
      absent: 2,
      leave: 1,
      percentage: 90,
      records: [
        { date: '2026-05-01', status: 'Hazir', note: 'وقت پر حاضر' },
        { date: '2026-04-30', status: 'Hazir', note: 'سبق مکمل' },
        { date: '2026-04-29', status: 'Ghair Hazir', note: 'بغیر اطلاع غیر حاضر' },
        { date: '2026-04-28', status: 'Leave', note: 'گھر میں بیماری' },
        { date: '2026-04-27', status: 'Hazir', note: 'کلاس میں شریک' },
      ],
    },
  },
  {
    id: 'STU-002',
    image: AppImages.profile,
    admission: {
      idNo: 'STU-002',
      admissionDate: '2026-03-02',
      admissionFee: '4500',
      monthlyFee: '2200',
      reside: 'نہیں',
    },
    personal: {
      fullName: 'علی خان',
      fatherName: 'عمران خان',
      caste: 'خان',
      cnic: '42101-3334567-1',
      dob: '2012-02-04',
      bForm: '42101-1112233-4',
      medicalCondition: 'دمہ کی ہلکی شکایت',
    },
    contact: {
      currentAddress: 'گلشن کیمپس روڈ، کراچی',
      permanentAddress: 'مردان، خیبر پختونخوا',
      district: 'کراچی',
      mobile: '0311-7654321',
      whatsapp: '0311-7654321',
      fatherOccupation: 'استاد',
    },
    guardian: {
      guardianName: 'سلمیٰ عمران',
      relation: 'والدہ',
      guardianMobile: '0344-2233001',
      guardianEmail: 'family.stu002@example.com',
      guardianCnic: '42101-1122334-8',
    },
    education: {
      religiousEdu: 'ابتدائی قاعدہ',
      secularEdu: 'کلاس ششم',
      prevMadrassa: 'جامعہ رحمانیہ',
      prevSchool: 'اقبال پبلک اسکول',
      requiredClass: 'ہفتم',
      requiredJamaat: 'ابتدائی',
      teacherName: 'مولانا زبیر',
    },
    classInfo: {
      campus: 'مین کیمپس',
      className: 'ہفتم',
      section: 'B',
      familyNo: 'F-702',
      rollNo: '102',
    },
    parents: [
      { role: 'والد', name: 'عمران خان', phone: '0311-7654321', occupation: 'استاد' },
      { role: 'والدہ', name: 'سلمیٰ عمران', phone: '0344-2233001', occupation: 'گھریلو خاتون' },
    ],
    attendance: {
      totalDays: 30,
      present: 24,
      absent: 4,
      leave: 2,
      percentage: 80,
      records: [
        { date: '2026-05-01', status: 'Hazir', note: 'کلاس ورک مکمل' },
        { date: '2026-04-30', status: 'Hazir', note: 'حفظ کی دہرائی' },
        { date: '2026-04-29', status: 'Leave', note: 'ڈاکٹر وزٹ' },
        { date: '2026-04-28', status: 'Ghair Hazir', note: 'بغیر اطلاع' },
        { date: '2026-04-27', status: 'Hazir', note: 'امتحان میں شریک' },
      ],
    },
  },
  {
    id: 'STU-003',
    image: AppImages.profile,
    admission: {
      idNo: 'STU-003',
      admissionDate: '2026-01-18',
      admissionFee: '5500',
      monthlyFee: '2800',
      reside: 'ہاں',
    },
    personal: {
      fullName: 'حمزہ یوسف',
      fatherName: 'یوسف علی',
      caste: 'قریشی',
      cnic: '42101-9994567-2',
      dob: '2011-11-19',
      bForm: '42101-4442211-5',
      medicalCondition: 'نظر کمزور',
    },
    contact: {
      currentAddress: 'مین کیمپس ہاسٹل، کراچی',
      permanentAddress: 'حیدرآباد، سندھ',
      district: 'کراچی',
      mobile: '0322-9876543',
      whatsapp: '0322-9876543',
      fatherOccupation: 'زمیندار',
    },
    guardian: {
      guardianName: 'فاطمہ یوسف',
      relation: 'والدہ',
      guardianMobile: '0301-8899001',
      guardianEmail: 'family.stu003@example.com',
      guardianCnic: '42101-9988776-4',
    },
    education: {
      religiousEdu: 'حفظ جاری',
      secularEdu: 'کلاس ہفتم',
      prevMadrassa: 'جامعہ اشرفیہ',
      prevSchool: 'گرین لینڈ اسکول',
      requiredClass: 'دہم',
      requiredJamaat: 'حفظ',
      teacherName: 'قاری بلال',
    },
    classInfo: {
      campus: 'مین کیمپس',
      className: 'دہم',
      section: 'C',
      familyNo: 'F-305',
      rollNo: '103',
    },
    parents: [
      { role: 'والد', name: 'یوسف علی', phone: '0322-9876543', occupation: 'زمیندار' },
      { role: 'والدہ', name: 'فاطمہ یوسف', phone: '0301-8899001', occupation: 'گھریلو خاتون' },
    ],
    attendance: {
      totalDays: 30,
      present: 21,
      absent: 6,
      leave: 3,
      percentage: 70,
      records: [
        { date: '2026-05-01', status: 'Ghair Hazir', note: 'گاؤں گیا ہوا تھا' },
        { date: '2026-04-30', status: 'Hazir', note: 'سبق سنایا' },
        { date: '2026-04-29', status: 'Hazir', note: 'ہاسٹل سے وقت پر آیا' },
        { date: '2026-04-28', status: 'Leave', note: 'طبی آرام' },
        { date: '2026-04-27', status: 'Ghair Hazir', note: 'رابطہ نہیں ہو سکا' },
      ],
    },
  },
];

const canUseStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readProfiles = () => {
  if (!canUseStorage) return defaultStudentProfiles;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultStudentProfiles;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultStudentProfiles;
  } catch {
    return defaultStudentProfiles;
  }
};

const writeProfiles = (profiles) => {
  if (!canUseStorage) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
};

export const getStudentProfiles = () => readProfiles();

export const initializeStudentProfiles = () => {
  if (!canUseStorage) return;
  if (!window.localStorage.getItem(STORAGE_KEY)) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStudentProfiles));
  }
};

export const subscribeToStudentProfiles = (callback) => {
  if (!canUseStorage) return () => {};
  const handler = () => callback(readProfiles());
  window.addEventListener(STORE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(STORE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const getStudentProfileById = (id) =>
  readProfiles().find((student) => student.id === id || student.admission.idNo === id);

const createAttendanceFromAdmissionDate = (admissionDate) => {
  const baseDate = admissionDate || new Date().toISOString().split('T')[0];
  return {
    totalDays: 1,
    present: 1,
    absent: 0,
    leave: 0,
    percentage: 100,
    records: [
      {
        date: baseDate,
        status: 'Hazir',
        note: 'نیا داخلہ رجسٹر ہوا',
      },
    ],
  };
};

export const createStudentProfileFromAdmission = (values) => {
  const generatedId = values.idNo?.trim() || `STU-${String(Date.now()).slice(-5)}`;

  return {
    id: generatedId,
    image: values.studentImage || AppImages.profile,
    admission: {
      idNo: generatedId,
      admissionDate: values.admissionDate || '',
      admissionFee: values.admissionFee || '',
      monthlyFee: values.monthlyFee || '',
      reside: values.reside || 'نہیں',
    },
    personal: {
      fullName: values.fullName || '',
      fatherName: values.fatherName || '',
      caste: values.caste || '',
      cnic: values.cnic || '',
      dob: values.dob || '',
      bForm: values.bForm || '',
      medicalCondition: values.medicalCondition || '',
    },
    contact: {
      currentAddress: values.currentAddress || '',
      permanentAddress: values.permanentAddress || '',
      district: values.district || '',
      mobile: values.mobile || '',
      whatsapp: values.whatsapp || '',
      fatherOccupation: values.fatherOccupation || '',
    },
    guardian: {
      guardianName: values.guardianName || '',
      relation: values.relation || '',
      guardianMobile: values.guardianMobile || '',
      guardianEmail: values.guardianEmail || '',
      guardianCnic: values.guardianCnic || '',
    },
    education: {
      religiousEdu: values.religiousEdu || '',
      secularEdu: values.secularEdu || '',
      prevMadrassa: values.prevMadrassa || '',
      prevSchool: values.prevSchool || '',
      requiredClass: values.requiredClass || '',
      requiredJamaat: values.requiredJamaat || '',
      teacherName: values.teacherName || '',
    },
    classInfo: {
      campus: 'مین کیمپس',
      className: values.requiredClass || 'غیر متعین',
      section: values.section || 'A',
      familyNo: values.familyNo || `F-${String(Date.now()).slice(-3)}`,
      rollNo: values.rollNo || String(Math.floor(100 + Math.random() * 900)),
    },
    parents: [
      {
        role: 'والد',
        name: values.fatherName || '',
        phone: values.mobile || '',
        occupation: values.fatherOccupation || '',
      },
      {
        role: 'سرپرست',
        name: values.guardianName || values.fatherName || '',
        phone: values.guardianMobile || values.mobile || '',
        occupation: values.relation || 'سرپرست',
      },
    ],
    attendance: createAttendanceFromAdmissionDate(values.admissionDate),
  };
};

export const saveStudentProfile = (profile) => {
  const profiles = readProfiles();
  const index = profiles.findIndex((student) => student.id === profile.id || student.admission.idNo === profile.admission.idNo);

  if (index >= 0) {
    const nextProfiles = [...profiles];
    nextProfiles[index] = profile;
    writeProfiles(nextProfiles);
    return profile;
  }

  writeProfiles([profile, ...profiles]);
  return profile;
};
