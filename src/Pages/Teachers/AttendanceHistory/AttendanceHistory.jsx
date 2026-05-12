import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Save, ChevronRight, Edit2, ChevronDown } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getTeacherAttendance, saveTeacherAttendance } from '../../../Constant/AttendanceApi';
import { getTeacherById } from '../../../Constant/TeachersApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

const monthsUrdu = [
    'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
    'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر',
];

const years = [2024, 2025, 2026, 2027];

const buildAttendanceHistory = (year, month, existingEntries) => {
    const data = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const entryMap = new Map(existingEntries.map((entry) => [entry.date.slice(0, 10), entry]));

    for (let day = daysInMonth; day >= 1; day -= 1) {
        const currentDate = new Date(year, month, day);
        const date = currentDate.toISOString().slice(0, 10);
        const entry = entryMap.get(date);

        data.push({
            date,
            dayName: currentDate.toLocaleDateString('ur-PK', { weekday: 'long' }),
            dayNum: day,
            status: entry?.status || 'Not Marked',
            note: entry?.remarks || '',
            branchId: entry?.branchId || null,
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
    const [attendanceEntries, setAttendanceEntries] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    useNotificationBridge({ error, success: successMessage });

    useEffect(() => {
        const loadTeacherAndAttendance = async () => {
            try {
                const [teacherResult, attendanceResult] = await Promise.all([
                    getTeacherById(teacherId),
                    getTeacherAttendance(`page=1&limit=366&teacherId=${teacherId}`),
                ]);

                const items = attendanceResult.items || [];
                setTeacher(teacherResult);
                setAttendanceEntries(items);
            } catch (loadError) {
                setError(loadError.message || 'Attendance history load nahi ho saki.');
            }
        };

        loadTeacherAndAttendance();
    }, [teacherId]);

    useEffect(() => {
        const monthEntries = attendanceEntries.filter((entry) => {
            const currentDate = new Date(entry.date);
            return currentDate.getFullYear() === selectedYear && currentDate.getMonth() === selectedMonth;
        });

        setAttendanceHistory(buildAttendanceHistory(selectedYear, selectedMonth, monthEntries));
    }, [attendanceEntries, selectedMonth, selectedYear]);

    const stats = useMemo(
        () => ({
            present: attendanceHistory.filter((item) => item.status === 'Present').length,
            absent: attendanceHistory.filter((item) => item.status === 'Absent').length,
            leave: attendanceHistory.filter((item) => item.status === 'Leave').length,
        }),
        [attendanceHistory],
    );

    const updateCalendar = (year, month) => {
        setSelectedYear(year);
        setSelectedMonth(month);
        setSuccessMessage('');
        setError('');
    };

    const scrollToDate = (dayNum) => {
        const element = document.getElementById(`date-${dayNum}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-[#00d094]');
            setTimeout(() => element.classList.remove('ring-4', 'ring-[#00d094]'), 1500);
        }
    };

    const handleSave = async () => {
        const rowsToSave = attendanceHistory.filter((item) => item.status !== 'Not Marked');

        if (!rowsToSave.length) {
            setError('Save karne ke liye koi marked attendance maujood nahi.');
            return;
        }

        const missingBranchRow = rowsToSave.find((item) => !item.branchId && !branchIdFromQuery);

        if (missingBranchRow) {
            setError('Branch context missing hai. History me save ke liye branch ke saath open karein.');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            await Promise.all(
                rowsToSave.map((item) =>
                    saveTeacherAttendance({
                        teacherId: Number(teacherId),
                        branchId: Number(item.branchId || branchIdFromQuery),
                        date: item.date,
                        status: item.status,
                        remarks: item.note || '',
                    }),
                ),
            );

            const refreshed = await getTeacherAttendance(`page=1&limit=366&teacherId=${teacherId}`);
            setAttendanceEntries(refreshed.items || []);
            setIsEditMode(false);
            setSuccessMessage('Teacher attendance history update ho gayi.');
        } catch (saveError) {
            setError(saveError.message || 'History save nahi ho saki.');
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-[var(--color-surface)] p-6 rounded-[2.5rem] border border-[var(--color-border)]/10 shadow-xl flex flex-col items-center text-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#00d094] to-[#008a63] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-[#00d094]/20 mb-4">
                        {teacher?.fullName?.charAt(0) || 'T'}
                    </div>
                    <h1 className="text-2xl font-black text-[var(--color-text)]">{teacher?.fullName || 'Teacher'}</h1>
                    <span className="bg-[#00d094]/10 text-[#00d094] text-xs px-3 py-1 rounded-full font-bold mt-2 border border-[#00d094]/20">{teacherId}</span>
                    <p className="text-sm opacity-60 mt-4 font-medium text-[var(--color-text)]">{teacher?.subject || '---'}</p>

                    <div className="flex gap-3 w-full mt-6 border-t border-[var(--color-border)]/10 pt-6">
                        <StatBox label="حاضر" value={String(stats.present).padStart(2, '0')} color="text-emerald-500" bg="bg-emerald-500/10" />
                        <StatBox label="غائب" value={String(stats.absent).padStart(2, '0')} color="text-red-500" bg="bg-red-500/10" />
                        <StatBox label="چھٹی" value={String(stats.leave).padStart(2, '0')} color="text-amber-500" bg="bg-amber-500/10" />
                    </div>
                </div>

                <div className="xl:col-span-2 bg-[var(--color-surface)] p-6 rounded-[2.5rem] border border-[var(--color-border)]/10 shadow-xl">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                            <Calendar size={18} className="text-[var(--color-primary)]" />
                            {monthsUrdu[selectedMonth]} {selectedYear} - حاضری کا پیٹرن
                        </h3>
                        <span className="text-xs opacity-50 text-[var(--color-text)]">(کسی تاریخ پر کلک کریں)</span>
                    </div>

                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 font-mono" dir="ltr">
                        {[...attendanceHistory].reverse().map((item) => (
                            <button
                                key={`map-${item.dayNum}`}
                                onClick={() => scrollToDate(item.dayNum)}
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
                                <span className="text-[7px] uppercase opacity-70">
                                    {item.status === 'Present' ? 'Pre' : item.status === 'Absent' ? 'Abs' : item.status === 'Leave' ? 'Lea' : item.status === 'Late' ? 'Lat' : 'Mis'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <h2 className="text-xl font-black text-[var(--color-text)] mb-6 flex items-center gap-3">
                    <AlertCircle className="text-amber-400" />
                    تفصیلی روزنامچہ
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {attendanceHistory.map((item) => (
                        <div
                            key={item.dayNum}
                            id={`date-${item.dayNum}`}
                            className={`relative group p-5 rounded-[2rem] border-2 transition-all duration-300 bg-[var(--color-surface)] ${item.status === 'Not Marked' ? 'border-dashed border-amber-500/40 bg-amber-500/5' : 'border-[var(--color-border)]/10 shadow-md hover:border-[var(--color-primary)]/30'}`}
                        >
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--color-border)]/5">
                                <div>
                                    <span className="text-xs font-black text-[var(--color-text)] opacity-40 block" dir="ltr">{item.date}</span>
                                    <span className="text-sm font-bold text-[var(--color-primary)]">{item.dayName}</span>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>

                            {isEditMode ? (
                                <div className="space-y-3">
                                    <select
                                        className="w-full bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]/10 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 ring-[#00d094]"
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
                                        className="w-full bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]/10 rounded-xl p-3 text-xs font-bold outline-none"
                                    />
                                </div>
                            ) : (
                                <p className="text-[11px] text-[var(--color-text)] opacity-60 italic leading-relaxed">
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
