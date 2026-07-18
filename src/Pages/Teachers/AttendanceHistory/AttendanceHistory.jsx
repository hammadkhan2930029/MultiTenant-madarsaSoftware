import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Save, ChevronRight, Edit2, ChevronDown } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { deleteTeacherAttendance, getTeacherAttendance, saveTeacherAttendance } from '../../../Constant/AttendanceApi';
import { getTeacherById } from '../../../Constant/TeachersApi';
import { getTeacherAssignments } from '../../../Constant/TeacherAssignmentApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { getDefaultBranch } from '../../../Constant/AcademicSetupApi';

const monthsUrdu = [
    'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
    'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر',
];

const years = [2024, 2025, 2026, 2027];

const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDateKey = (value) => String(value || '').slice(0, 10);
const getPresetRange = (preset) => {
    const today = new Date();

    if (preset === 'last-month') {
        return {
            startDate: formatDateKey(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
            endDate: formatDateKey(new Date(today.getFullYear(), today.getMonth(), 0)),
        };
    }

    if (preset === 'three-months') {
        return {
            startDate: formatDateKey(new Date(today.getFullYear(), today.getMonth() - 2, 1)),
            endDate: formatDateKey(today),
        };
    }

    if (preset === 'six-months') {
        return {
            startDate: formatDateKey(new Date(today.getFullYear(), today.getMonth() - 5, 1)),
            endDate: formatDateKey(today),
        };
    }

    if (preset === 'one-year') {
        return {
            startDate: formatDateKey(new Date(today.getFullYear(), today.getMonth() - 11, 1)),
            endDate: formatDateKey(today),
        };
    }

    return {
        startDate: formatDateKey(new Date(today.getFullYear(), today.getMonth(), 1)),
        endDate: formatDateKey(today),
    };
};

const joinLabels = (values) => {
    const labels = [...new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean))];
    return labels.length ? labels.join('، ') : '---';
};

const formatShiftTime = (shift) => {
    if (!shift) return '---';
    const time = [shift.startTime, shift.endTime].filter(Boolean).join(' - ');
    return [shift.name, time].filter(Boolean).join(' | ') || '---';
};

const buildAttendanceHistory = (range, existingEntries) => {
    const data = [];
    const startDate = new Date(range.startDate);
    const endDate = new Date(range.endDate);
    const entryMap = new Map(existingEntries.map((entry) => [getDateKey(entry.date), entry]));

    for (let currentDate = startDate; currentDate <= endDate; currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)) {
        const date = formatDateKey(currentDate);
        const entry = entryMap.get(date);

        data.push({
            id: entry?.id || null,
            date,
            dayName: currentDate.toLocaleDateString('ur-PK', { weekday: 'long' }),
            dayNum: currentDate.getDate(),
            status: entry?.status || 'Not Marked',
            note: entry?.remarks || '',
            branchId: entry?.branchId || entry?.branch?.id || null,
        });
    }

    return data;
};

export const TeacherAttendanceHistory = () => {
    const { id: teacherId } = useParams();
    const [searchParams] = useSearchParams();
    const branchIdFromQuery = searchParams.get('branchId') || '';
    const today = new Date();
    const [teacher, setTeacher] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [range, setRange] = useState(() => getPresetRange('current-month'));
    const [activePreset, setActivePreset] = useState('current-month');
    const [attendanceEntries, setAttendanceEntries] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [teacherAssignments, setTeacherAssignments] = useState([]);
    const [defaultBranchId, setDefaultBranchId] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    useNotificationBridge({ error, success: successMessage });

    useEffect(() => {
        const loadTeacherAndAttendance = async () => {
            try {
                const [teacherResult, attendanceResult, defaultBranch, assignmentsResult] = await Promise.all([
                    getTeacherById(teacherId),
                    getTeacherAttendance(`page=1&limit=366&teacherId=${teacherId}`),
                    getDefaultBranch().catch(() => null),
                    getTeacherAssignments(`page=1&limit=100&status=active&teacherId=${teacherId}`).catch(() => ({ items: [] })),
                ]);

                const items = attendanceResult.items || [];
                setTeacher(teacherResult);
                setAttendanceEntries(items);
                setTeacherAssignments(assignmentsResult.items || []);
                setDefaultBranchId(defaultBranch?.id ? String(defaultBranch.id) : '');
            } catch (loadError) {
                setError(loadError.message || 'اساتذہ کی حاضری کی تفصیل لوڈ نہیں ہو سکی۔');
            }
        };

        loadTeacherAndAttendance();
    }, [teacherId]);

    useEffect(() => {
        const rangeEntries = attendanceEntries.filter((entry) => {
            const entryDate = getDateKey(entry.date);
            return entryDate >= range.startDate && entryDate <= range.endDate;
        });

        setAttendanceHistory(buildAttendanceHistory(range, rangeEntries));
    }, [attendanceEntries, range]);

    const stats = useMemo(
        () => ({
            present: attendanceHistory.filter((item) => item.status === 'Present').length,
            absent: attendanceHistory.filter((item) => item.status === 'Absent').length,
            leave: attendanceHistory.filter((item) => item.status === 'Leave').length,
            late: attendanceHistory.filter((item) => item.status === 'Late').length,
        }),
        [attendanceHistory],
    );

    const teacherInfo = useMemo(() => ({
        subjects: joinLabels([teacher?.subject, ...teacherAssignments.map((assignment) => assignment.subject?.name)]),
        classes: joinLabels(teacherAssignments.map((assignment) => assignment.class?.name)),
        sections: joinLabels(teacherAssignments.map((assignment) => assignment.section?.name)),
        phone: teacher?.phone || '---',
        shift: formatShiftTime(teacher?.shift),
    }), [teacher, teacherAssignments]);

    const updateCalendar = (year, month) => {
        setSelectedYear(year);
        setSelectedMonth(month);
        setRange({
            startDate: formatDateKey(new Date(year, month, 1)),
            endDate: formatDateKey(new Date(year, month + 1, 0)),
        });
        setActivePreset('custom');
        setSuccessMessage('');
        setError('');
    };

    const applyPreset = (preset) => {
        const nextRange = getPresetRange(preset);
        const [year, month] = nextRange.startDate.split('-').map(Number);
        setActivePreset(preset);
        setSelectedYear(year);
        setSelectedMonth(month - 1);
        setRange(nextRange);
        setSuccessMessage('');
        setError('');
    };

    const scrollToDate = (dateKey) => {
        const element = document.getElementById(`date-${dateKey}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-[#00d094]');
            setTimeout(() => element.classList.remove('ring-4', 'ring-[#00d094]'), 1500);
        }
    };

    const handleSave = async () => {
        const rowsToSave = attendanceHistory.filter((item) => item.status !== 'Not Marked');
        const rowsToClear = attendanceHistory.filter((item) => item.status === 'Not Marked' && item.id);

        if (!rowsToSave.length && !rowsToClear.length) {
            setError('محفوظ کرنے کے لیے کوئی حاضری منتخب نہیں ہے۔');
            return;
        }

        const fallbackBranchId = branchIdFromQuery || defaultBranchId;
        const missingBranchRow = rowsToSave.find((item) => !item.branchId && !fallbackBranchId);

        if (missingBranchRow) {
            setError('بنیادی سیٹ اپ دستیاب نہیں، حاضری محفوظ نہیں ہو سکتی۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            await Promise.all(
                [
                    ...rowsToSave.map((item) => saveTeacherAttendance({
                        teacherId: Number(teacherId),
                        branchId: Number(item.branchId || fallbackBranchId),
                        date: item.date,
                        status: item.status,
                        remarks: item.note || '',
                    })),
                    ...rowsToClear.map((item) => deleteTeacherAttendance(`teacherId=${teacherId}&date=${item.date}`)),
                ],
            );

            const refreshed = await getTeacherAttendance(`page=1&limit=366&teacherId=${teacherId}`);
            setAttendanceEntries(refreshed.items || []);
            setIsEditMode(false);
            setSuccessMessage('استاد کی حاضری کی تفصیل کامیابی سے اپڈیٹ ہو گئی۔');
        } catch (saveError) {
            setError(saveError.message || 'حاضری کی تفصیل محفوظ نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-[var(--color-bg)] min-h-screen pb-24" dir="rtl">
            <div className="sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)]/5 no-print">
                <div className="flex justify-between items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-[var(--color-text)] opacity-70 hover:opacity-100 font-bold transition-all"
                    >
                        <div className="bg-[var(--color-surface)] p-2 rounded-xl shadow-md border border-[var(--color-border)]/10">
                            <ChevronRight size={20} className="text-[var(--color-primary)]" />
                        </div>
                    </button>

                    <div className="flex gap-2 items-center bg-[var(--color-surface)] p-1 rounded-2xl border border-[var(--color-border)]/10">
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => updateCalendar(selectedYear, Number(e.target.value))}
                                className="appearance-none bg-transparent pr-8 pl-4 py-2 text-[14px] font-bold text-[var(--color-text)] outline-none cursor-pointer"
                            >
                                {monthsUrdu.map((month, index) => (
                                    <option key={month} value={index} className="bg-[var(--color-surface)]">
                                        {month}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                        </div>

                        <div className="w-[1px] h-4 bg-[var(--color-border)]/20" />

                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => updateCalendar(Number(e.target.value), selectedMonth)}
                                className="appearance-none bg-transparent pr-8 pl-4 py-2 text-[12px] font-bold text-[var(--color-text)] outline-none cursor-pointer"
                            >
                                {years.map((year) => (
                                    <option key={year} value={year} className="bg-[var(--color-surface)] text-[12px]">
                                        {year}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                        </div>
                    </div>

                    <button
                        onClick={() => (isEditMode ? handleSave() : setIsEditMode(true))}
                        disabled={isSaving}
                        className={`flex items-center justify-center gap-2 px-3 md:px-6 lg:px-6 py-3 text-[10px] md:text-[12px] lg:text-[14px] rounded-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-60 ${isEditMode ? 'bg-emerald-600 text-white' : 'bg-[#00d094] text-[#002a33]'}`}
                    >
                        {isEditMode ? <Save size={18} /> : <Edit2 size={18} />}
                        {isSaving ? 'محفوظ...' : isEditMode ? 'محفوظ کریں' : 'درستگی کریں'}
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
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-[var(--color-surface)] p-6 rounded-[2.5rem] border border-[var(--color-border)]/10 shadow-xl flex flex-col items-center text-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#00d094] to-[#008a63] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-[#00d094]/20 mb-4">
                        {teacher?.fullName?.charAt(0) || 'T'}
                    </div>
                    <h1 className="text-2xl font-black text-[var(--color-text)]">{teacher?.fullName || 'استاد'}</h1>
                    <span className="bg-[#00d094]/10 text-[#00d094] text-xs px-3 py-1 rounded-full font-bold mt-2 border border-[#00d094]/20">{teacherId}</span>
                    <div className="mt-5 grid w-full grid-cols-1 gap-3 text-right sm:grid-cols-2">
                        <ProfileInfo label="مضمون" value={teacherInfo.subjects} />
                        <ProfileInfo label="جماعت" value={teacherInfo.classes} />
                        <ProfileInfo label="جماعت سیکشن" value={teacherInfo.sections} />
                        <ProfileInfo label="فون نمبر" value={teacherInfo.phone} dir="ltr" />
                        <ProfileInfo label="شفٹ کا وقت" value={teacherInfo.shift} className="sm:col-span-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-6 border-t border-[var(--color-border)]/10 pt-6">
                        <StatBox label="حاضری" value={String(stats.present).padStart(2, '0')} color="text-emerald-500" bg="bg-emerald-500/10" />
                        <StatBox label="غیر حاضری" value={String(stats.absent).padStart(2, '0')} color="text-red-500" bg="bg-red-500/10" />
                        <StatBox label="رخصت" value={String(stats.leave).padStart(2, '0')} color="text-amber-500" bg="bg-amber-500/10" />
                        <StatBox label="تاخیر" value={String(stats.late).padStart(2, '0')} color="text-sky-500" bg="bg-sky-500/10" />
                    </div>
                </div>

                <div className="xl:col-span-2 bg-[var(--color-surface)] p-6 rounded-[2.5rem] border border-[var(--color-border)]/10 shadow-xl">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                            <Calendar size={18} className="text-[var(--color-primary)]" />
                            {monthsUrdu[selectedMonth]} {selectedYear} - حاضری کا نقشہ
                        </h3>
                        <span className="text-xs opacity-50 text-[var(--color-text)]">(کسی تاریخ پر کلک کریں)</span>
                    </div>

                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 font-mono" dir="ltr">
                        {attendanceHistory.map((item) => (
                            <button
                                key={`map-${item.date}`}
                                onClick={() => scrollToDate(item.date)}
                                title={`${item.date} (${item.status})`}
                                className={`h-12 rounded-xl border-2 flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95
                                    ${item.status === 'Present' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : ''}
                                    ${item.status === 'Absent' ? 'bg-red-500/10 border-red-500/20 text-red-400' : ''}
                                    ${item.status === 'Leave' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : ''}
                                    ${item.status === 'Late' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : ''}
                                    ${item.status === 'Not Marked' ? 'bg-slate-500/10 border-slate-500/20 text-slate-400 border-dashed' : ''}
                                `}
                            >
                                <span className="text-lg font-black">{item.dayNum}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <h2 className="text-xl font-black text-[var(--color-text)] mb-6 flex items-center gap-3">
                    <AlertCircle className="text-amber-400" />
                    تفصیلی حاضری
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {attendanceHistory.map((item) => (
                        <div
                            key={item.date}
                            id={`date-${item.date}`}
                            className={`relative group p-5 rounded-[2rem] border-2 transition-all duration-300 bg-[var(--color-surface)] ${item.status === 'Not Marked' ? 'border-dashed border-amber-500/40 bg-amber-500/5' : 'border-[var(--color-border)]/10 shadow-md hover:border-[var(--color-primary)]/30'}`}
                        >
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--color-border)]/5">
                                <div>
                                    <span className="text-sm font-black text-[var(--color-text)] opacity-50 block" dir="ltr">{item.date}</span>
                                    <span className="text-base font-bold text-[var(--color-primary)]">{item.dayName}</span>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>

                            {isEditMode ? (
                                <div className="space-y-3">
                                    <select
                                        className="w-full bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]/10 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 ring-[#00d094]"
                                        value={item.status}
                                        onChange={(e) => {
                                            setAttendanceHistory((prev) =>
                                                prev.map((historyItem) =>
                                                    historyItem.dayNum === item.dayNum ? { ...historyItem, status: e.target.value } : historyItem,
                                                ),
                                            );
                                        }}
                                    >
                                        <option value="Present">حاضر</option>
                                        <option value="Absent">غیر حاضر</option>
                                        <option value="Leave">رخصت</option>
                                        <option value="Late">تاخیر</option>
                                        <option value="Not Marked">خالی</option>
                                    </select>
                                    <input
                                        value={item.note}
                                        onChange={(e) => {
                                            setAttendanceHistory((prev) =>
                                                prev.map((historyItem) =>
                                                    historyItem.dayNum === item.dayNum ? { ...historyItem, note: e.target.value } : historyItem,
                                                ),
                                            );
                                        }}
                                        placeholder="نوٹ"
                                        className="w-full bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]/10 rounded-xl p-3 text-sm font-bold outline-none"
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--color-text)] opacity-70 italic leading-7">
                                    {item.note || (item.status === 'Not Marked' ? 'اس دن کی حاضری درج نہیں کی گئی۔' : 'کوئی اضافی تفصیل موجود نہیں ہے۔')}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatBox = ({ label, value, color, bg }) => (
    <div className={`text-center flex-1 ${bg} p-4 rounded-2xl border border-[var(--color-border)]/5`}>
        <p className="text-[10px] font-bold opacity-60 uppercase text-[var(--color-text)]">{label}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
);

const ProfileInfo = ({ label, value, className = '', dir = 'rtl' }) => (
    <div className={`rounded-2xl border border-[var(--color-border)]/10 bg-[var(--color-bg)]/50 p-3 ${className}`}>
        <p className="text-[10px] font-black text-[var(--color-text)] opacity-50">{label}</p>
        <p className="mt-1 text-sm font-black text-[var(--color-text)]" dir={dir}>{value || '---'}</p>
    </div>
);

const StatusBadge = ({ status }) => {
    const config = {
        Present: { text: 'حاضر', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        Absent: { text: 'غیر حاضر', style: 'bg-red-500/10 text-red-400 border-red-500/20' },
        Leave: { text: 'رخصت', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
        Late: { text: 'تاخیر', style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
        'Not Marked': { text: 'رہ گئی', style: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    };

    const current = config[status] || config['Not Marked'];

    return <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${current.style}`}>{current.text}</span>;
};
