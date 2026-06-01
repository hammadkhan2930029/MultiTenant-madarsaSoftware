import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Camera, ChevronLeft, ChevronRight, GraduationCap, Save, User, UserPlus, Wallet } from 'lucide-react';
import { InputField, SelectField } from '../../Components/HR/FormElements';
import { createTeacher, getTeacherById, updateTeacher } from '../../Constant/TeachersApi';
import { getQualifications } from '../../Constant/QualificationApi';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { useNavigate, useSearchParams } from 'react-router-dom';

const INITIAL_VALUES = {
  staffType: 'teacher',
  fullName: '',
  email: '',
  phone: '',
  cnic: '',
  subject: '',
  qualification: '',
  address: '',
  basicSalary: '',
  educationInstitute: '',
  educationYear: '',
  specialization: '',
  bankName: '',
  accountTitle: '',
  accountNumber: '',
  iban: '',
  jobTitle: '',
  department: '',
  employmentType: 'مستقل',
  appointmentDate: '',
  joiningDate: '',
  experienceSummary: '',
  notes: '',
};

const tabs = [
  { id: 'personal', label: 'ذاتی معلومات', icon: User },
  { id: 'education', label: 'تعلیمی معلومات', icon: GraduationCap },
  { id: 'account', label: 'تنخواہ / اکاؤنٹ', icon: Wallet },
  { id: 'service', label: 'تقرر / تجربہ', icon: Briefcase },
];

export const HRManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teacherId = searchParams.get('teacherId');
  const requestedStaffType = searchParams.get('staffType');
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState(INITIAL_VALUES);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [qualificationOptions, setQualificationOptions] = useState([]);
  const [isLoadingQualifications, setIsLoadingQualifications] = useState(true);
  useNotificationBridge({ error, success });

  const activeTabIndex = useMemo(() => tabs.findIndex((tab) => tab.id === activeTab), [activeTab]);

  useEffect(() => {
    if (teacherId) return;
    if (!['teacher', 'staff'].includes(requestedStaffType)) return;
    setFormData((current) => ({ ...current, staffType: requestedStaffType }));
  }, [requestedStaffType, teacherId]);

  useEffect(() => {
    const loadQualifications = async () => {
      setIsLoadingQualifications(true);

      try {
        const result = await getQualifications('page=1&limit=100');
        setQualificationOptions((result.items || []).filter((qualification) => qualification.status === 'active'));
      } catch (loadError) {
        setError(loadError.message || 'تعلیمی اسناد لوڈ نہیں ہو سکیں۔');
      } finally {
        setIsLoadingQualifications(false);
      }
    };

    loadQualifications();
  }, []);

  useEffect(() => {
    if (!teacherId) return;

    const loadTeacher = async () => {
      setError('');

      try {
        const teacher = await getTeacherById(teacherId);
        setFormData((current) => ({
          ...current,
          fullName: teacher?.fullName || '',
          email: teacher?.email || '',
          phone: teacher?.phone || '',
          cnic: teacher?.cnic || '',
          subject: teacher?.subject || '',
          qualification: teacher?.qualification || '',
          address: teacher?.address || '',
          basicSalary: teacher?.basicSalary ? String(teacher.basicSalary) : '',
          staffType: teacher?.staffType || 'teacher',
          educationInstitute: teacher?.educationInstitute || '',
          educationYear: teacher?.educationYear || '',
          specialization: teacher?.specialization || '',
          bankName: teacher?.bankName || '',
          accountTitle: teacher?.accountTitle || '',
          accountNumber: teacher?.accountNumber || '',
          iban: teacher?.iban || '',
          jobTitle: teacher?.jobTitle || '',
          department: teacher?.department || '',
          employmentType: teacher?.employmentType || 'مستقل',
          appointmentDate: teacher?.appointmentDate || '',
          joiningDate: teacher?.joiningDate || '',
          experienceSummary: teacher?.experienceSummary || '',
          notes: teacher?.notes || '',
        }));
        setImagePreview(teacher?.imageUrl || null);
      } catch (loadError) {
        setError(loadError.message || 'استاد کی تفصیل لوڈ نہیں ہو سکی۔');
      }
    };

    loadTeacher();
  }, [teacherId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const goToTab = (direction) => {
    const nextIndex = Math.min(Math.max(activeTabIndex + direction, 0), tabs.length - 1);
    setActiveTab(tabs[nextIndex].id);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!formData.fullName.trim()) {
      setActiveTab('personal');
      setError('براہ کرم نام لازمی درج کریں۔');
      return;
    }

    if (!Number(formData.basicSalary)) {
      setActiveTab('account');
      setError('براہ کرم بنیادی تنخواہ لازمی درج کریں۔');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        staffType: formData.staffType,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        cnic: formData.cnic,
        subject: formData.subject,
        qualification: formData.qualification,
        educationInstitute: formData.educationInstitute,
        educationYear: formData.educationYear,
        specialization: formData.specialization,
        address: formData.address,
        basicSalary: Number(formData.basicSalary || 0),
        bankName: formData.bankName,
        accountTitle: formData.accountTitle,
        accountNumber: formData.accountNumber,
        iban: formData.iban,
        jobTitle: formData.jobTitle,
        department: formData.department,
        employmentType: formData.employmentType,
        appointmentDate: formData.appointmentDate,
        joiningDate: formData.joiningDate,
        experienceSummary: formData.experienceSummary,
        notes: formData.notes,
        image: imageFile,
      };

      if (teacherId) {
        await updateTeacher(teacherId, payload);
      } else {
        await createTeacher(payload);
      }

      setSuccess(teacherId ? 'استاد کی معلومات کامیابی سے تبدیل ہو گئیں۔' : 'استاد کامیابی سے شامل ہو گیا۔');
      setFormData(INITIAL_VALUES);
      setActiveTab('personal');
      setImagePreview(null);
      setImageFile(null);
      navigate('/teachers/list');
    } catch (saveError) {
      setError(saveError.message || 'استاد محفوظ نہیں ہو سکا۔');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-3 text-[var(--color-text-main)] transition-colors duration-300 md:p-5" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black md:text-3xl">{teacherId ? 'عملہ کی معلومات تبدیل کریں' : 'نیا عملہ / استاد شامل کریں'}</h1>
              <p className="mt-3 text-sm font-bold text-[var(--color-text-muted)]">
                ایک ہی صفحہ پر معلومات درج کریں، صرف ٹیب تبدیل ہوں گے اور آخر میں ریکارڈ محفوظ ہو گا۔
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-7 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save size={18} /> {isSaving ? 'محفوظ ہو رہا ہے...' : teacherId ? 'ریکارڈ اپڈیٹ کریں' : 'ریکارڈ محفوظ کریں'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-input)] p-2">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex min-w-44 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-emerald-900/10'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-main)]'
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${isActive ? 'bg-white/15' : 'bg-[var(--color-surface)]'}`}>
                    <Icon size={16} />
                  </span>
                  <span>{index + 1}. {tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm md:p-7">
            {activeTab === 'personal' ? (
              <PersonalStep formData={formData} imagePreview={imagePreview} imageFile={imageFile} onChange={handleChange} onImageChange={(file, preview) => {
                setImageFile(file);
                setImagePreview(preview);
              }} />
            ) : null}

            {activeTab === 'education' ? (
              <EducationStep
                formData={formData}
                qualificationOptions={qualificationOptions}
                isLoadingQualifications={isLoadingQualifications}
                onChange={handleChange}
              />
            ) : null}

            {activeTab === 'account' ? (
              <AccountStep formData={formData} onChange={handleChange} />
            ) : null}

            {activeTab === 'service' ? (
              <ServiceStep formData={formData} onChange={handleChange} />
            ) : null}

            <div className="mt-8 flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => goToTab(-1)}
                disabled={activeTabIndex === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={16} /> پچھلا ٹیب
              </button>
              <div className="text-center text-xs font-black text-[var(--color-text-muted)]">
                {activeTabIndex + 1} / {tabs.length}
              </div>
              {activeTabIndex === tabs.length - 1 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Save size={16} /> {isSaving ? 'محفوظ ہو رہا ہے...' : 'ریکارڈ محفوظ کریں'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goToTab(1)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-5 text-xs font-black"
                >
                  اگلا ٹیب <ChevronLeft size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="h-fit rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)]">
                {imagePreview ? (
                  <img src={imagePreview} alt="استاد" className="h-full w-full object-cover" />
                ) : (
                  <UserPlus size={52} className="text-[var(--color-text-muted)]" />
                )}
              </div>
              <h2 className="text-xl font-black">{formData.fullName || 'نیا ریکارڈ'}</h2>
              <p className="text-xs font-bold text-[var(--color-text-muted)]">{formData.staffType === 'teacher' ? 'استاد' : 'دیگر عملہ'} / {formData.subject || 'ذمہ داری درج نہیں'}</p>
              <div className="grid w-full grid-cols-2 gap-2 text-xs font-black">
                <SummaryBox label="تعلیم" value={formData.qualification || '---'} />
                <SummaryBox label="تنخواہ" value={formData.basicSalary || '---'} />
                <SummaryBox label="فون" value={formData.phone || '---'} />
                <SummaryBox label="اکاؤنٹ" value={formData.accountNumber || '---'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PersonalStep = ({ formData, imagePreview, imageFile, onChange, onImageChange }) => (
  <div className="space-y-6">
    <StepHeading title="ذاتی معلومات" description="نام، رابطہ، شناخت اور تصویر درج کریں۔" />
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <SelectField
        label="عملہ کی قسم"
        value={formData.staffType}
        onChange={(event) => onChange('staffType', event.target.value)}
        options={[
          { value: 'teacher', label: 'استاد' },
          { value: 'staff', label: 'دیگر عملہ' },
        ]}
      />
      <InputField label="نام" value={formData.fullName} onChange={(event) => onChange('fullName', event.target.value)} />
      <InputField label="فون نمبر" value={formData.phone} onChange={(event) => onChange('phone', event.target.value)} />
      <InputField label="ای میل" type="email" value={formData.email} onChange={(event) => onChange('email', event.target.value)} />
      <InputField label="شناختی کارڈ نمبر" value={formData.cnic} onChange={(event) => onChange('cnic', event.target.value)} />
      <InputField label="پتہ" value={formData.address} onChange={(event) => onChange('address', event.target.value)} />
    </div>
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[var(--color-primary)]/10 px-6 py-3 text-sm font-black text-[var(--color-primary)]">
      <Camera size={18} /> {imageFile || imagePreview ? 'تصویر تبدیل کریں' : 'تصویر اپ لوڈ کریں'}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          onImageChange(file, URL.createObjectURL(file));
        }}
      />
    </label>
  </div>
);

const EducationStep = ({ formData, qualificationOptions, isLoadingQualifications, onChange }) => (
  <div className="space-y-6">
    <StepHeading title="تعلیمی معلومات" description="تعلیمی قابلیت، مضمون یا ذمہ داری اور تخصص درج کریں۔" />
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <InputField
        label="مضمون / ذمہ داری"
        value={formData.subject}
        onChange={(event) => onChange('subject', event.target.value)}
        placeholder="مثلاً: حفظ استاد، اکاؤنٹنٹ، باورچی، چوکیدار"
      />
      <SelectField
        label="تعلیمی قابلیت"
        value={formData.qualification}
        onChange={(event) => onChange('qualification', event.target.value)}
        disabled={isLoadingQualifications}
        options={[
          { value: '', label: isLoadingQualifications ? 'تعلیمی اسناد لوڈ ہو رہی ہیں...' : 'تعلیمی قابلیت منتخب کریں' },
          ...(!qualificationOptions.some((qualification) => qualification.title === formData.qualification) && formData.qualification
            ? [{ value: formData.qualification, label: formData.qualification }]
            : []),
          ...qualificationOptions.map((qualification) => ({ value: qualification.title, label: qualification.title })),
        ]}
      />
      <InputField label="ادارہ / جامعہ" value={formData.educationInstitute} onChange={(event) => onChange('educationInstitute', event.target.value)} />
      <InputField label="سال" value={formData.educationYear} onChange={(event) => onChange('educationYear', event.target.value)} />
      <InputField label="تخصص / مہارت" value={formData.specialization} onChange={(event) => onChange('specialization', event.target.value)} className="md:col-span-2" />
    </div>
  </div>
);

const AccountStep = ({ formData, onChange }) => (
  <div className="space-y-6">
    <StepHeading title="تنخواہ اور اکاؤنٹ" description="بنیادی تنخواہ اور بینک اکاؤنٹ کی معلومات درج کریں۔" />
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <InputField label="بنیادی تنخواہ" type="number" value={formData.basicSalary} onChange={(event) => onChange('basicSalary', event.target.value)} />
      <InputField label="بینک کا نام" value={formData.bankName} onChange={(event) => onChange('bankName', event.target.value)} />
      <InputField label="اکاؤنٹ ٹائٹل" value={formData.accountTitle} onChange={(event) => onChange('accountTitle', event.target.value)} />
      <InputField label="اکاؤنٹ نمبر" value={formData.accountNumber} onChange={(event) => onChange('accountNumber', event.target.value)} />
      <InputField label="IBAN" value={formData.iban} onChange={(event) => onChange('iban', event.target.value)} className="md:col-span-2" dir="ltr" />
    </div>
  </div>
);

const ServiceStep = ({ formData, onChange }) => (
  <div className="space-y-6">
    <StepHeading title="تقرر، تجربہ اور اضافی معلومات" description="ملازمت کی نوعیت، تاریخیں، تجربہ اور نوٹس درج کریں۔" />
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <InputField label="عہدہ" value={formData.jobTitle} onChange={(event) => onChange('jobTitle', event.target.value)} />
      <InputField label="شعبہ" value={formData.department} onChange={(event) => onChange('department', event.target.value)} />
      <SelectField
        label="ملازمت کی نوعیت"
        value={formData.employmentType}
        onChange={(event) => onChange('employmentType', event.target.value)}
        options={['مستقل', 'عارضی', 'کنٹریکٹ', 'پارٹ ٹائم']}
      />
      <InputField label="تاریخ تقرری" type="date" value={formData.appointmentDate} onChange={(event) => onChange('appointmentDate', event.target.value)} />
      <InputField label="تاریخ شمولیت" type="date" value={formData.joiningDate} onChange={(event) => onChange('joiningDate', event.target.value)} />
      <TextAreaField label="سابقہ تجربہ" value={formData.experienceSummary} onChange={(event) => onChange('experienceSummary', event.target.value)} />
      <TextAreaField label="نوٹس" value={formData.notes} onChange={(event) => onChange('notes', event.target.value)} className="md:col-span-2" />
    </div>
  </div>
);

const StepHeading = ({ title, description }) => (
  <div>
    <h2 className="text-xl font-black text-[var(--color-text-main)]">{title}</h2>
    <p className="mt-2 text-xs font-bold text-[var(--color-text-muted)]">{description}</p>
  </div>
);

const TextAreaField = ({ label, className = '', ...props }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</label>
    <textarea
      {...props}
      rows={4}
      className="w-full resize-none rounded-2xl border border-transparent bg-[var(--color-input)] p-4 font-bold outline-none transition-all focus:border-[var(--color-primary)] focus:ring-4 focus:ring-emerald-500/10"
    />
  </div>
);

const SummaryBox = ({ label, value }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
    <p className="text-[10px] font-black text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-1 truncate text-sm font-black text-[var(--color-text-main)]">{value}</p>
  </div>
);
