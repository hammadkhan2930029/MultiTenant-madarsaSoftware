import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CalendarRange, GraduationCap, Phone, ShieldCheck, User, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentById } from '../../../Constant/StudentsApi';
import { getApiAssetUrl } from '../../../Constant/AdminAuth';
import { AppImages } from '../../../Constant/AppImages';

const GENDER_LABELS = {
    male: 'مرد',
    female: 'خاتون',
    other: 'دیگر',
};

const formatDate = (value) => {
    if (!value) return '---';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
};

const formatAdmissionFee = (value) => {
    if (value === 0 || value === '0') return '-';
    return value;
};

const getProfileClassName = (student, assignment) => assignment?.class?.name || student?.requiredClass || '---';
const getProfileSectionName = (student, assignment) => assignment?.section?.name || student?.requiredJamaat || '---';

const InfoGrid = ({ items }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
            <div key={item.label} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[1.5rem] p-4">
                <p className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest">{item.label}</p>
                <p className="text-base font-bold text-[var(--color-text-main)] mt-2 leading-8">{item.value || '---'}</p>
            </div>
        ))}
    </div>
);

const SectionCard = ({ title, icon, children }) => (
    <section className="bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] shadow-sm p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-3 text-[var(--color-primary)]">
            <div className="p-3 rounded-2xl bg-[var(--color-primary)]/10">
                {React.createElement(icon, { size: 22 })}
            </div>
            <h2 className="text-xl font-black text-[var(--color-text-main)] flex-1">{title}</h2>
        </div>
        {children}
    </section>
);

export const StudentProfile = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);

        const loadStudent = async () => {
            try {
                const result = await getStudentById(id);
                setStudent(result);
            } catch (loadError) {
                setError(loadError.message || 'طالب علم کی پروفائل لوڈ نہیں ہو سکی۔');
            }
        };

        loadStudent();
    }, [id]);

    const activeAssignment = useMemo(
        () => student?.assignments?.find((assignment) => assignment.status === 'active') || null,
        [student],
    );
    const studentImageUrl = student?.imageUrl ? getApiAssetUrl(student.imageUrl) : AppImages.profile;

    if (error) {
        return <div className="max-w-5xl mx-auto p-6 text-red-400 font-bold">{error}</div>;
    }

    if (!student) {
        return <div className="max-w-5xl mx-auto p-6 font-bold text-[var(--color-text-muted)]">پروفائل لوڈ ہو رہی ہے...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 bg-[var(--color-bg)] min-h-screen" dir="rtl">
            <div className="bg-[var(--color-surface)] rounded-[2.8rem] border border-[var(--color-border)] p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <img
                        src={studentImageUrl}
                        alt={student.fullName}
                        onError={(event) => {
                            event.currentTarget.src = AppImages.profile;
                        }}
                        className="w-32 h-32 rounded-[2rem] object-cover border-4 border-[var(--color-primary)]/20"
                    />

                    <div className="flex-1 text-center md:text-right space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.25em]">طالب علم کی پروفائل</p>
                                <h1 className="mt-2 py-2 text-3xl font-black leading-[1.8] text-[var(--color-text-main)]">
                                    {student.fullName}
                                </h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-4">سرپرست: {student.fatherName}</p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
                                <button onClick={() => navigate(`/students/attendance-history/${student.id}`)} className="flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 font-bold text-white">
                                    <CalendarRange size={18} /> حاضری ریکارڈ
                                </button>
                                <button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 font-bold text-[var(--color-text-main)]">
                                    <ArrowRight size={18} /> واپس
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            <InfoCard label="داخلہ نمبر" value={student.admissionNumber} />
                            <InfoCard label="تاریخ داخلہ" value={formatDate(student.admissionDate)} />
                            <InfoCard label="داخلہ فیس" value={formatAdmissionFee(student.admissionFee)} />
                            <InfoCard label="جماعت" value={getProfileClassName(student, activeAssignment)} />
                            <InfoCard label="جماعت سیکشن" value={getProfileSectionName(student, activeAssignment)} />
                        </div>
                    </div>
                </div>
            </div>

            <SectionCard title="بنیادی معلومات" icon={User}>
                <InfoGrid
                    items={[
                        { label: 'نام طالب علم', value: student.fullName },
                        { label: 'سرپرست کا نام', value: student.fatherName },
                        { label: 'جنس', value: GENDER_LABELS[student.gender] || student.gender },
                        { label: 'قومیت/ذات', value: student.caste },
                        { label: 'تاریخ پیدائش', value: formatDate(student.dob) },
                        { label: 'آئی ڈی نمبر', value: student.cnic },
                        { label: 'طالب علم فون نمبر', value: student.phone },
                        { label: 'طالب علم واٹس ایپ', value: student.whatsapp },
                        { label: 'ای میل', value: student.email },
                        { label: 'حالیہ پتہ', value: student.currentAddress || student.address },
                        { label: 'مستقل پتہ', value: student.permanentAddress },
                        { label: 'رہائشی (ہاں/نہیں)', value: student.reside },
                        { label: 'اسٹیٹس', value: student.status },
                    ]}
                />
            </SectionCard>

            <SectionCard title="جماعت اور داخلہ" icon={GraduationCap}>
                <InfoGrid
                    items={[
                        { label: 'جماعت', value: getProfileClassName(student, activeAssignment) },
                        { label: 'جماعت سیکشن', value: getProfileSectionName(student, activeAssignment) },
                        { label: 'سیشن', value: activeAssignment?.session?.name || '---' },
                        { label: 'تاریخ داخلہ', value: formatDate(student.admissionDate) },
                        { label: 'داخلہ فیس', value: formatAdmissionFee(student.admissionFee) },
                        { label: 'دینی تعلیم', value: student.religiousEdu },
                        { label: 'عصری تعلیم', value: student.secularEdu },
                        { label: 'سابقہ مدرسہ', value: student.prevMadrassa },
                        { label: 'سابقہ اسکول', value: student.prevSchool },
                        { label: 'بیماری (اگر ہے)', value: student.medicalCondition },
                        { label: 'تفویض کی تاریخ', value: formatDate(activeAssignment?.assignedAt) },
                    ]}
                />
            </SectionCard>

            <SectionCard title="سرپرست" icon={Users}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(student.parents || []).map((parentItem) => (
                        <div key={parentItem.id} className="bg-[var(--color-bg)] rounded-[1.8rem] border border-[var(--color-border)] p-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-[var(--color-text-main)]">{parentItem.parent?.fullName}</h3>
                                <span className="text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full text-xs font-bold">
                                    {parentItem.relationship}
                                </span>
                            </div>
                            <p className="mt-4 text-sm font-bold text-[var(--color-text-main)] flex items-center gap-2">
                                <Phone size={14} className="text-[var(--color-primary)]" /> سرپرست فون نمبر: {parentItem.parent?.phone || '---'}
                            </p>
                            <p className="mt-2 text-sm font-bold text-[var(--color-text-main)] flex items-center gap-2">
                                <Phone size={14} className="text-[var(--color-primary)]" /> سرپرست واٹس ایپ: {parentItem.parent?.whatsapp || '---'}
                            </p>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="ریکارڈ" icon={ShieldCheck}>
                <InfoGrid
                    items={[
                        { label: 'بننے کی تاریخ', value: student.createdAt ? new Date(student.createdAt).toLocaleString() : '---' },
                        { label: 'تبدیلی کی تاریخ', value: student.updatedAt ? new Date(student.updatedAt).toLocaleString() : '---' },
                    ]}
                />
            </SectionCard>
        </div>
    );
};

const InfoCard = ({ label, value }) => (
    <div className="bg-[var(--color-bg)] rounded-[1.8rem] p-4 border border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)] font-black uppercase">{label}</p>
        <p className="text-xl font-black text-[var(--color-text-main)] mt-2 leading-9">{value || '---'}</p>
    </div>
);
