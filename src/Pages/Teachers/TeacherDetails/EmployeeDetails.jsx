import React, { useEffect, useState } from 'react';
import { Briefcase, ChevronLeft, ChevronUp, ChevronDown, CreditCard, Edit, Plus, Printer, User, Wallet } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTeacherIncrement, getTeacherById, getTeacherIncrements } from '../../../Constant/TeachersApi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';

const statusLabel = (status) => (status === 'active' ? 'فعال' : 'غیر فعال');
const getTeacherShiftLabel = (teacher) =>
    teacher?.shift?.name || teacher?.shiftName || teacher?.shiftTitle || (teacher?.shiftId ? `شفٹ #${teacher.shiftId}` : '---');
const formatShiftClock = (time) => {
    const match = String(time || '').match(/^(\d{1,2}):(\d{2})/);
    if (!match) return time || '';

    const hour = Number(match[1]);
    const minute = match[2];
    const hour12 = hour % 12 || 12;
    const period = hour < 12 ? 'AM' : 'PM';

    return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
};

const formatShiftRange = (startTime, endTime) => {
    const range = `${formatShiftClock(startTime)} - ${formatShiftClock(endTime)}`;
    return `‎${range}‎`;
};

const getTeacherShiftTime = (teacher) => {
    const startTime = teacher?.shift?.startTime || teacher?.shiftStartTime;
    const endTime = teacher?.shift?.endTime || teacher?.shiftEndTime;
    return startTime && endTime ? formatShiftRange(startTime, endTime) : '---';
};

const formatCurrency = (value) => `روپے ${Number(value || 0).toLocaleString('en-PK')}`;
const todayInputValue = () => new Date().toISOString().slice(0, 10);

const InfoField = ({ label, value, dir = 'rtl' }) => (
    <div className="min-h-[96px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-4 shadow-sm transition-all hover:border-[var(--color-primary)]/40 print:break-inside-avoid print:border-slate-200 print:bg-white print:shadow-none">
        <p className="mb-3 inline-flex rounded-xl bg-[var(--color-surface)] px-3 py-1 text-[12px] font-black text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)] print:text-slate-500">
            {label}
        </p>
        <p className={`min-h-7 break-words text-[18px] font-black leading-8 text-[var(--color-text-main)] print:text-slate-900 ${dir === 'ltr' ? 'text-left font-sans' : 'text-right'}`} dir={dir}>
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
            <div className="p-5 md:p-7 border-t border-[var(--color-border)] bg-[var(--color-bg)]/25">
                {children}
            </div>
        </div>
    </div>
);

const MiniFact = ({ label, value }) => (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-4 py-3 text-right">
        <p className="text-[11px] font-black text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-1 truncate text-sm font-black text-[var(--color-text-main)]" title={String(value || '---')}>{value || '---'}</p>
    </div>
);

const LabeledValue = ({ label, value, highlight = false }) => (
    <span className={highlight ? 'text-[var(--color-primary)]' : ''}>
        <span className="mb-1 block text-[11px] font-black text-[var(--color-text-muted)] md:hidden">{label}</span>
        {value}
    </span>
);

export const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const notify = useNotifier();
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [openSection, setOpenSection] = useState('personal');
    const [teacher, setTeacher] = useState(null);
    const [increments, setIncrements] = useState([]);
    const [incrementForm, setIncrementForm] = useState({
        incrementAmount: '',
        effectiveDate: todayInputValue(),
        reason: '',
    });
    const [isSavingIncrement, setIsSavingIncrement] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadTeacher = async () => {
            try {
                const [result, incrementResult] = await Promise.all([
                    getTeacherById(id),
                    getTeacherIncrements(id),
                ]);
                setTeacher(result);
                setIncrements(incrementResult || []);
            } catch (loadError) {
                setError(loadError.message || 'استاد کی تفصیل لوڈ نہیں ہو سکی۔');
            }
        };

        loadTeacher();
    }, [id]);

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    const handleSaveIncrement = async (event) => {
        event.preventDefault();

        if (!Number(incrementForm.incrementAmount)) {
            notify.error('براہ کرم اضافہ رقم درج کریں۔', 'نامکمل معلومات');
            return;
        }

        setIsSavingIncrement(true);

        try {
            const result = await createTeacherIncrement(id, {
                incrementAmount: Number(incrementForm.incrementAmount),
                effectiveDate: incrementForm.effectiveDate,
                reason: incrementForm.reason,
            });

            if (result?.teacher) {
                setTeacher(result.teacher);
            } else {
                setTeacher(await getTeacherById(id));
            }

            setIncrements((prev) => [result?.increment, ...prev].filter(Boolean));
            setIncrementForm({ incrementAmount: '', effectiveDate: todayInputValue(), reason: '' });
            notify.success('تنخواہ کا انکریمنٹ محفوظ ہو گیا۔', 'انکریمنٹ محفوظ');
        } catch (saveError) {
            notify.error(saveError?.message || 'انکریمنٹ محفوظ نہیں ہو سکا۔', 'محفوظ کرنے میں مسئلہ');
        } finally {
            setIsSavingIncrement(false);
        }
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
                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <MiniFact label="قسم" value={teacher.staffType === 'staff' ? 'دیگر عملہ' : 'استاد'} />
                                <MiniFact label="شعبہ / عہدہ" value={teacher.department || teacher.jobTitle || '---'} />
                                <MiniFact label="موجودہ تنخواہ" value={formatCurrency(teacher.basicSalary)} />
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
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <InfoField label="عملہ کی قسم" value={teacher.staffType === 'staff' ? 'دیگر عملہ' : 'استاد'} />
                                <InfoField label="مضمون" value={teacher.subject} />
                                <InfoField label="تعلیمی قابلیت" value={teacher.qualification} />
                                <InfoField label="تعلیمی ادارہ" value={teacher.educationInstitute} />
                                <InfoField label="تعلیمی سال" value={teacher.educationYear} />
                                <InfoField label="تخصص / مہارت" value={teacher.specialization} />
                                <InfoField label="عہدہ" value={teacher.jobTitle} />
                                <InfoField label="شعبہ" value={teacher.department} />
                                <InfoField label="شفٹ" value={getTeacherShiftLabel(teacher)} />
                                <InfoField label="شفٹ اوقات" value={getTeacherShiftTime(teacher)} />
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
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <InfoField label="بنیادی تنخواہ" value={formatCurrency(teacher.basicSalary)} dir="rtl" />
                                <InfoField label="بینک کا نام" value={teacher.bankName} />
                                <InfoField label="اکاؤنٹ ٹائٹل" value={teacher.accountTitle} />
                                <InfoField label="اکاؤنٹ نمبر" value={teacher.accountNumber} dir="ltr" />
                                <InfoField label="IBAN" value={teacher.iban} dir="ltr" />
                            </div>

                            <div className="mt-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-5">
                                <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h4 className="text-2xl font-black text-[var(--color-text-main)]">تنخواہ انکریمنٹ</h4>
                                        <p className="mt-1 text-sm font-bold text-[var(--color-text-muted)]">
                                            نیا اضافہ محفوظ ہوتے ہی بنیادی تنخواہ اپڈیٹ ہو جائے گی۔
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-black text-[var(--color-primary)]">
                                        موجودہ تنخواہ: {formatCurrency(teacher.basicSalary)}
                                    </div>
                                </div>

                                <form onSubmit={handleSaveIncrement} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_2fr_auto]">
                                    <div className="space-y-2">
                                        <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">اضافہ رقم</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={incrementForm.incrementAmount}
                                            onChange={(event) => setIncrementForm((prev) => ({ ...prev, incrementAmount: event.target.value }))}
                                            placeholder="مثلاً 5000"
                                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">مؤثر تاریخ</label>
                                        <input
                                            type="date"
                                            value={incrementForm.effectiveDate}
                                            onChange={(event) => setIncrementForm((prev) => ({ ...prev, effectiveDate: event.target.value }))}
                                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">وجہ / نوٹ</label>
                                        <input
                                            value={incrementForm.reason}
                                            onChange={(event) => setIncrementForm((prev) => ({ ...prev, reason: event.target.value }))}
                                            placeholder="مثلاً سالانہ اضافہ"
                                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            type="submit"
                                            disabled={isSavingIncrement}
                                            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                                        >
                                            <Plus size={18} />
                                            {isSavingIncrement ? 'محفوظ...' : 'شامل کریں'}
                                        </button>
                                    </div>
                                </form>

                                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)]">
                                    <div className="hidden grid-cols-5 gap-3 bg-[var(--color-surface)] px-4 py-3 text-sm font-black text-[var(--color-text-muted)] md:grid">
                                        <span>تاریخ</span>
                                        <span>پرانی تنخواہ</span>
                                        <span>اضافہ</span>
                                        <span>نئی تنخواہ</span>
                                        <span>وجہ</span>
                                    </div>

                                    {increments.length ? (
                                        increments.map((increment) => (
                                            <div key={increment.id} className="grid grid-cols-1 gap-3 border-t border-[var(--color-border)] px-4 py-4 text-sm font-bold text-[var(--color-text-main)] md:grid-cols-5">
                                                <LabeledValue label="تاریخ" value={increment.effectiveDate || '---'} />
                                                <LabeledValue label="پرانی تنخواہ" value={formatCurrency(increment.previousSalary)} />
                                                <LabeledValue label="اضافہ" value={formatCurrency(increment.incrementAmount)} highlight />
                                                <LabeledValue label="نئی تنخواہ" value={formatCurrency(increment.newSalary)} />
                                                <LabeledValue label="وجہ" value={increment.reason || '---'} />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="border-t border-[var(--color-border)] px-4 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                            ابھی کوئی انکریمنٹ ریکارڈ موجود نہیں۔
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DetailSection>
                        <DetailSection id="record" title="ریکارڈ" icon={CreditCard} isOpen={openSection === 'record'} onToggle={toggleSection}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
