import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarRange, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DateField } from '../../../Components/HR/FormElements';
import { getStudentAttendance } from '../../../Constant/AttendanceApi';
import { getStudentById } from '../../../Constant/StudentsApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

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

export const StudentAttendanceHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [entries, setEntries] = useState([]);
    const [range, setRange] = useState(() => getPresetRange('current-month'));
    const [activePreset, setActivePreset] = useState('current-month');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    useNotificationBridge({ error });

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

    const applyPreset = (preset) => {
        const nextRange = getPresetRange(preset);
        setActivePreset(preset);
        setRange(nextRange);
        loadHistory(nextRange);
    };

    return (
        <div className="min-h-screen space-y-6 bg-[var(--color-bg)] p-4 text-[var(--color-text-main)] md:p-6" dir="rtl">
            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-bold text-[var(--color-primary)]">طالب علم کی حاضری</p>
                        <h1 className="mt-2 text-3xl font-black">{student?.fullName || 'طالب علم'}</h1>
                        <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">
                            داخلہ نمبر: {student?.admissionNumber || '---'}
                        </p>
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

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="حاضر" value={stats.present} color="text-emerald-500" />
                <StatCard label="غیر حاضر" value={stats.absent} color="text-rose-500" />
                <StatCard label="رخصت" value={stats.leave} color="text-amber-500" />
                <StatCard label="تاخیر" value={stats.late} color="text-sky-500" />
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="flex items-center gap-3 border-b border-[var(--color-border)] p-5">
                    <CalendarRange className="text-[var(--color-primary)]" />
                    <h2 className="text-xl font-black">حاضری کی تفصیل</h2>
                    <span className="mr-auto text-sm font-bold text-[var(--color-text-muted)]">{entries.length} ریکارڈ</span>
                </div>
                <div className="divide-y divide-[var(--color-border)]">
                    {entries.map((entry) => (
                        <div key={entry.id} className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[180px_180px_1fr] md:items-center">
                            <div className="font-sans font-black">{String(entry.date).slice(0, 10)}</div>
                            <span className={`w-fit rounded-full border px-4 py-2 text-xs font-black ${statusStyle[entry.status] || ''}`}>
                                {STATUS_LABELS[entry.status] || entry.status}
                            </span>
                            <p className="font-bold text-[var(--color-text-muted)]">{entry.remarks || 'کوئی نوٹ موجود نہیں۔'}</p>
                        </div>
                    ))}
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
