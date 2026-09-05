import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarRange, Edit2, Save, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DateField } from '../../../Components/HR/FormElements';
import { getStudentAttendance, saveStudentAttendance } from '../../../Constant/AttendanceApi';
import { getStudentById } from '../../../Constant/StudentsApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { formatStudentRegistrationNumber } from '../../../Utils/studentRegistration';
import { getCurrentParent } from '../../../Utils/parentRelations';

const STATUS_LABELS = {
    Present: 'حاضر',
    Absent: 'غیر حاضر',
    Leave: 'رخصت',
    Late: 'تاخیر',
};

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getPresetRange = (preset) => {
    const today = new Date();

    if (preset === 'last-month') {
        return {
            startDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
            endDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 0)),
        };
    }

    if (preset === 'three-months') {
        return {
            startDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 2, 1)),
            endDate: formatDate(today),
        };
    }

    if (preset === 'six-months') {
        return {
            startDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 5, 1)),
            endDate: formatDate(today),
        };
    }

    if (preset === 'one-year') {
        return {
            startDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 11, 1)),
            endDate: formatDate(today),
        };
    }

    return {
        startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        endDate: formatDate(today),
    };
};

const statusStyle = {
    Present: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Absent: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    Leave: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Late: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
};

const getActiveAssignment = (student) =>
    student?.assignments?.find((assignment) => assignment.status === 'active') || student?.assignments?.[0] || null;

const getPrimaryParent = getCurrentParent;

export const StudentAttendanceHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [entries, setEntries] = useState([]);
    const [range, setRange] = useState(() => getPresetRange('current-month'));
    const [activePreset, setActivePreset] = useState('current-month');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    useNotificationBridge({ error, success: successMessage });

    const loadHistory = async (nextRange = range) => {
        if (!nextRange.startDate || !nextRange.endDate) {
            setError('شروع اور اختتامی تاریخ منتخب کریں۔');
            return;
        }

        if (nextRange.startDate > nextRange.endDate) {
            setError('اختتامی تاریخ شروع کی تاریخ سے پہلے نہیں ہو سکتی۔');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const query = new URLSearchParams({
                page: '1',
                limit: '400',
                studentId: String(id),
                startDate: nextRange.startDate,
                endDate: nextRange.endDate,
            });
            const result = await getStudentAttendance(query.toString());
            setEntries(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'طالب علم کی حاضری کا ریکارڈ لوڈ نہیں ہو سکا۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const initialRange = getPresetRange('current-month');

        const loadPage = async () => {
            try {
                const studentResult = await getStudentById(id);
                setStudent(studentResult);
            } catch (loadError) {
                setError(loadError.message || 'طالب علم کی معلومات لوڈ نہیں ہو سکیں۔');
            }
        };

        loadPage();
        loadHistory(initialRange);
        // Initial load only; filters are applied explicitly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const stats = useMemo(() => ({
        present: entries.filter((entry) => entry.status === 'Present').length,
        absent: entries.filter((entry) => entry.status === 'Absent').length,
        leave: entries.filter((entry) => entry.status === 'Leave').length,
        late: entries.filter((entry) => entry.status === 'Late').length,
    }), [entries]);

    const activeAssignment = useMemo(() => getActiveAssignment(student), [student]);
    const primaryParent = useMemo(() => getPrimaryParent(student), [student]);

    const applyPreset = (preset) => {
        const nextRange = getPresetRange(preset);
        setActivePreset(preset);
        setRange(nextRange);
        setIsEditMode(false);
        loadHistory(nextRange);
    };

    const scrollToDate = (date) => {
        const element = document.getElementById(`student-date-${date}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-[var(--color-primary)]');
            setTimeout(() => element.classList.remove('ring-4', 'ring-[var(--color-primary)]'), 1500);
        }
    };

    const handleSave = async () => {
        if (!entries.length) return;

        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            await Promise.all(entries.map((entry) => saveStudentAttendance({
                studentId: Number(id),
                branchId: Number(entry.branchId),
                classId: Number(entry.classId),
                sectionId: Number(entry.sectionId),
                date: String(entry.date).slice(0, 10),
                status: entry.status,
                remarks: entry.remarks || '',
            })));
            await loadHistory(range);
            setIsEditMode(false);
            setSuccessMessage('طالب علم کی حاضری کامیابی سے اپڈیٹ ہو گئی۔');
        } catch (saveError) {
            setError(saveError.message || 'طالب علم کی حاضری محفوظ نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen space-y-6 bg-[var(--color-bg)] p-4 text-[var(--color-text-main)] md:p-6" dir="rtl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
                    <StatCard label="حاضری" value={stats.present} color="text-emerald-500" />
                    <StatCard label="غیر حاضری" value={stats.absent} color="text-rose-500" />
                    <StatCard label="رخصت" value={stats.leave} color="text-amber-500" />
                    <StatCard label="تاخیر" value={stats.late} color="text-sky-500" />
                </div>
                <button
                    type="button"
                    onClick={() => (isEditMode ? handleSave() : setIsEditMode(true))}
                    disabled={isSaving || !entries.length}
                    className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-black shadow-lg transition-all disabled:opacity-60 ${isEditMode ? 'bg-emerald-600 text-white' : 'bg-[#00d094] text-[#002a33]'}`}
                >
                    {isEditMode ? <Save size={18} /> : <Edit2 size={18} />}
                    {isSaving ? 'محفوظ...' : isEditMode ? 'محفوظ کریں' : 'درستگی کریں'}
                </button>
            </div>

            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-[var(--color-primary)]">طالب علم کی حاضری</p>
                        <h1 className="mt-2 text-3xl font-black">{student?.fullName || 'طالب علم'}</h1>
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <StudentInfo label="داخلہ نمبر" value={formatStudentRegistrationNumber(student?.admissionNumber)} dir="ltr" />
                            <StudentInfo label="سیشن" value={activeAssignment?.session?.name} />
                            <StudentInfo label="جماعت" value={activeAssignment?.class?.name} />
                            <StudentInfo label="جماعت سیکشن" value={activeAssignment?.section?.name} />
                            <StudentInfo label="سرپرست کا نام" value={primaryParent?.fullName} />
                            <StudentInfo label="سرپرست فون نمبر" value={primaryParent?.phone} dir="ltr" />
                        </div>
                    </div>
                    <button type="button" onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 font-black">
                        <ArrowRight size={18} />
                        <span className="-translate-y-0.5 leading-none">واپس</span>
                    </button>
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {[
                        ['current-month', 'موجودہ مہینہ'],
                        ['last-month', 'پچھلا مہینہ'],
                        ['three-months', 'گزشتہ 3 ماہ'],
                        ['six-months', 'گزشتہ 6 ماہ'],
                        ['one-year', 'گزشتہ ایک سال'],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => applyPreset(value)}
                            className={`h-12 rounded-2xl border px-4 font-black transition-colors ${activePreset === value ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] bg-[var(--color-bg)]'}`}
                        >
                            <span className="inline-block -translate-y-0.5 leading-none">{label}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-5 grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_1fr_auto]">
                    <DateField label="شروع تاریخ" value={range.startDate} onChange={(value) => { setRange((current) => ({ ...current, startDate: value })); setActivePreset('custom'); }} />
                    <DateField label="اختتامی تاریخ" value={range.endDate} onChange={(value) => { setRange((current) => ({ ...current, endDate: value })); setActivePreset('custom'); }} />
                    <button type="button" onClick={() => loadHistory()} disabled={isLoading} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-8 font-black text-white disabled:opacity-60">
                        <Search size={18} />
                        <span className="-translate-y-0.5 leading-none">
                            {isLoading ? 'لوڈ ہو رہا ہے...' : 'ریکارڈ دکھائیں'}
                        </span>
                    </button>
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <CalendarRange className="text-[var(--color-primary)]" />
                    <h2 className="text-xl font-black">حاضری کا نقشہ</h2>
                    <span className="mr-auto text-xs font-bold text-[var(--color-text-muted)]">(کسی تاریخ پر کلک کریں)</span>
                </div>

                <div className="grid grid-cols-6 gap-2 font-mono sm:grid-cols-10" dir="ltr">
                    {entries.map((entry) => (
                        <button
                            key={`map-${entry.id}`}
                            type="button"
                            onClick={() => scrollToDate(String(entry.date).slice(0, 10))}
                            className={`flex h-12 flex-col items-center justify-center rounded-xl border-2 transition-all hover:scale-110 ${statusStyle[entry.status] || ''}`}
                        >
                            <span className="text-lg font-black">{Number(String(entry.date).slice(8, 10))}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4">
                <h2 className="mb-6 flex items-center gap-3 text-xl font-black">
                    <CalendarRange className="text-[var(--color-primary)]" />
                    تفصیلی حاضری
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {entries.map((entry) => {
                        const date = String(entry.date).slice(0, 10);
                        const dayName = new Date(`${date}T00:00:00`).toLocaleDateString('ur-PK', { weekday: 'long' });

                        return (
                            <div key={entry.id} id={`student-date-${date}`} className="rounded-[2rem] border-2 border-[var(--color-border)]/10 bg-[var(--color-surface)] p-5 shadow-md transition-all">
                                <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)]/5 pb-3">
                                    <div>
                                        <span className="block font-sans text-sm font-black opacity-50" dir="ltr">{date}</span>
                                        <span className="text-base font-bold text-[var(--color-primary)]">{dayName}</span>
                                    </div>
                                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusStyle[entry.status] || ''}`}>
                                        {STATUS_LABELS[entry.status] || entry.status}
                                    </span>
                                </div>

                                {isEditMode ? (
                                    <div className="space-y-3">
                                        <select
                                            value={entry.status}
                                            onChange={(event) => setEntries((current) => current.map((item) => item.id === entry.id ? { ...item, status: event.target.value } : item))}
                                            className="w-full rounded-xl border border-[var(--color-border)]/10 bg-[var(--color-bg)] p-3 text-sm font-bold outline-none"
                                        >
                                            <option value="Present">حاضر</option>
                                            <option value="Absent">غیر حاضر</option>
                                            <option value="Leave">رخصت</option>
                                            <option value="Late">تاخیر</option>
                                        </select>
                                        <input
                                            value={entry.remarks || ''}
                                            onChange={(event) => setEntries((current) => current.map((item) => item.id === entry.id ? { ...item, remarks: event.target.value } : item))}
                                            placeholder="نوٹ"
                                            className="w-full rounded-xl border border-[var(--color-border)]/10 bg-[var(--color-bg)] p-3 text-sm font-bold outline-none"
                                        />
                                    </div>
                                ) : (
                                    <p className="text-sm font-bold text-[var(--color-text-muted)]">{entry.remarks || 'کوئی نوٹ موجود نہیں۔'}</p>
                                )}
                            </div>
                        );
                    })}
                    {!entries.length && !isLoading ? (
                        <div className="p-10 text-center font-bold text-[var(--color-text-muted)]">
                            منتخب مدت میں حاضری کا کوئی ریکارڈ موجود نہیں۔
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, color }) => (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center shadow-sm">
        <p className="text-sm font-black text-[var(--color-text-muted)]">{label}</p>
        <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </div>
);

const StudentInfo = ({ label, value, dir = 'rtl' }) => (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-4 py-3">
        <p className="text-xs font-black text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-1 text-sm font-black text-[var(--color-text-main)]" dir={dir}>{value || '---'}</p>
    </div>
);
