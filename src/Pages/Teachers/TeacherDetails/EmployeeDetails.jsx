import React, { useEffect, useState } from 'react';
import { Briefcase, ChevronLeft, ChevronUp, ChevronDown, CreditCard, Edit, Printer, User, Wallet } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTeacherById } from '../../../Constant/TeachersApi';

const statusLabel = (status) => (status === 'active' ? 'فعال' : 'غیر فعال');

const InfoField = ({ label, value, dir = 'rtl' }) => (
    <div className="space-y-1 print:break-inside-avoid">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-main)]/40 print:text-slate-500">{label}</p>
        <p className={`text-[15px] font-medium text-[var(--color-text-main)]/90 print:text-slate-900 ${dir === 'ltr' ? 'text-left font-sans' : 'text-right'}`} dir={dir}>
            {value || '---'}
        </p>
    </div>
);

const DetailSection = ({ id, title, icon, isOpen, onToggle, children }) => (
    <div className="mb-4 overflow-hidden border border-[var(--color-border)] rounded-[2rem] bg-[var(--color-surface)] shadow-lg transition-all duration-300">
        <button onClick={() => onToggle(id)} className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-[var(--color-bg)]/5 transition-colors">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isOpen ? 'bg-[var(--color-primary)] text-[var(--color-text-main)]' : 'bg-[var(--color-bg)]/5 text-[var(--color-primary)]'}`}>
                    {React.createElement(icon, { size: 24 })}
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-main)]">{title}</h3>
            </div>
            {isOpen ? <ChevronUp /> : <ChevronDown />}
        </button>
        <div className={isOpen ? 'block' : 'hidden'}>
            <div className="p-6 md:p-8 pt-0 border-t border-[var(--color-border)]/5 bg-black/10">
                {children}
            </div>
        </div>
    </div>
);

export const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [openSection, setOpenSection] = useState('personal');
    const [teacher, setTeacher] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadTeacher = async () => {
            try {
                const result = await getTeacherById(id);
                setTeacher(result);
            } catch (loadError) {
                setError(loadError.message || 'استاد کی تفصیل لوڈ نہیں ہو سکی۔');
            }
        };

        loadTeacher();
    }, [id]);

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    if (error) {
        return <div className="p-6 text-red-400 font-bold">{error}</div>;
    }

    if (!teacher) {
        return <div className="p-6 text-[var(--color-text-muted)] font-bold">استاد کی تفصیل لوڈ ہو رہی ہے...</div>;
    }

    return (
        <div>
            {showPrintPreview && (
                <div className="flex flex-row justify-between" dir="rtl">
                    <button onClick={() => setShowPrintPreview(!showPrintPreview)} className="flex items-center text-[12px] gap-2 bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all">
                        واپس جائیں <ChevronLeft size={22} />
                    </button>
                    <p className="print:hidden">پرنٹ کے لیے کنٹرول اور پی دبائیں</p>
                </div>
            )}

            {!showPrintPreview && (
                <div className="min-h-screen space-y-6 pb-10 bg-[var(--color-bg)]" dir="rtl">
                    <div className="bg-[var(--color-surface)] rounded-[2.5rem] p-8 mt-5 md:mt-0 lg:mt-0 shadow-xl border border-[var(--color-border)]/5 flex flex-col lg:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[#008a63] flex items-center justify-center text-3xl font-black text-white shadow-xl">
                            {teacher.fullName?.charAt(0)}
                        </div>
                        <div className="text-center md:text-right space-y-2 flex-1">
                            <h1 className="text-3xl font-black text-[var(--color-text-main)]">{teacher.fullName}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                                <span className={`text-[10px] font-bold px-4 py-1.5 rounded-full border ${teacher.status === 'active' ? 'bg-emerald-500/10 text-[var(--color-primary)] border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                    {statusLabel(teacher.status)}
                                </span>
                                <span className="bg-emerald-500/10 text-[var(--color-primary)] text-[10px] font-bold px-4 py-1.5 rounded-full border border-emerald-500/20">
                                    نمبر: {teacher.id}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => navigate(`/HRManagement?teacherId=${teacher.id}`)} className="flex items-center text-[10px] md:text-[12px] lg:text-[14px] gap-2 bg-[var(--color-primary)] text-[var(--color-text-main)] px-8 py-3 rounded-2xl font-bold">
                                تبدیل کریں <Edit size={20} />
                            </button>
                            <button onClick={() => setShowPrintPreview(!showPrintPreview)} className="flex items-center text-[10px] gap-2 bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold">
                                پرنٹ <Printer size={20} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <DetailSection id="personal" title="ذاتی معلومات" icon={User} isOpen={openSection === 'personal'} onToggle={toggleSection}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <InfoField label="استاد کا نام" value={teacher.fullName} />
                                <InfoField label="موبائل نمبر" value={teacher.phone} dir="ltr" />
                                <InfoField label="ای میل" value={teacher.email} dir="ltr" />
                                <InfoField label="شناختی کارڈ نمبر" value={teacher.cnic} dir="ltr" />
                                <div className="md:col-span-3">
                                    <InfoField label="مستقل پتہ" value={teacher.address} />
                                </div>
                            </div>
                        </DetailSection>

                        <DetailSection id="job" title="تقرری تفصیلات" icon={Briefcase} isOpen={openSection === 'job'} onToggle={toggleSection}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <InfoField label="عملہ کی قسم" value={teacher.staffType === 'staff' ? 'دیگر عملہ' : 'استاد'} />
                                <InfoField label="مضمون" value={teacher.subject} />
                                <InfoField label="تعلیمی قابلیت" value={teacher.qualification} />
                                <InfoField label="تعلیمی ادارہ" value={teacher.educationInstitute} />
                                <InfoField label="تعلیمی سال" value={teacher.educationYear} />
                                <InfoField label="تخصص / مہارت" value={teacher.specialization} />
                                <InfoField label="عہدہ" value={teacher.jobTitle} />
                                <InfoField label="شعبہ" value={teacher.department} />
                                <InfoField label="ملازمت کی نوعیت" value={teacher.employmentType} />
                                <InfoField label="تاریخ تقرری" value={teacher.appointmentDate} />
                                <InfoField label="تاریخ شمولیت" value={teacher.joiningDate} />
                                <InfoField label="حالت" value={statusLabel(teacher.status)} />
                                <div className="md:col-span-3">
                                    <InfoField label="سابقہ تجربہ" value={teacher.experienceSummary} />
                                </div>
                            </div>
                        </DetailSection>

                        <DetailSection id="salary" title="تنخواہ / اکاؤنٹ" icon={Wallet} isOpen={openSection === 'salary'} onToggle={toggleSection}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <InfoField label="بنیادی تنخواہ" value={`روپے ${teacher.basicSalary}`} dir="rtl" />
                                <InfoField label="بینک کا نام" value={teacher.bankName} />
                                <InfoField label="اکاؤنٹ ٹائٹل" value={teacher.accountTitle} />
                                <InfoField label="اکاؤنٹ نمبر" value={teacher.accountNumber} dir="ltr" />
                                <InfoField label="IBAN" value={teacher.iban} dir="ltr" />
                            </div>
                        </DetailSection>

                        <DetailSection id="record" title="ریکارڈ" icon={CreditCard} isOpen={openSection === 'record'} onToggle={toggleSection}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InfoField label="درج کرنے کی تاریخ" value={teacher.createdAt ? new Date(teacher.createdAt).toLocaleString('ur-PK') : '---'} />
                                <InfoField label="آخری تبدیلی" value={teacher.updatedAt ? new Date(teacher.updatedAt).toLocaleString('ur-PK') : '---'} />
                                <div className="md:col-span-2">
                                    <InfoField label="نوٹس" value={teacher.notes} />
                                </div>
                            </div>
                        </DetailSection>
                    </div>
                </div>
            )}
        </div>
    );
};
