import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, CheckCircle, XCircle, Clock, Phone, BookOpen, Save, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemedDatePicker } from '../../../Components/DatePicker/ThemedDatePicker';
import { getDefaultBranch } from '../../../Constant/AcademicSetupApi';
import { getTeachers } from '../../../Constant/TeachersApi';
import { getTeacherAttendance, saveTeacherAttendance } from '../../../Constant/AttendanceApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { ExportExcelButton } from '../../../Components/Export/ExportExcelButton';

const STATUS_OPTIONS = [
    { value: 'Present', label: 'حاضر' },
    { value: 'Absent', label: 'غیر حاضر' },
    { value: 'Leave', label: 'رخصت' },
    { value: 'Late', label: 'تاخیر' },
];

const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const TeacherAttendance = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    useNotificationBridge({ error, success: successMessage });

    const loadAttendance = useCallback(async () => {
        setError('');
        setSuccessMessage('');

        if (!selectedBranchId) {
            setError('حاضری کے لیے بنیادی سیٹ اپ دستیاب نہیں۔');
            return;
        }

        setIsLoading(true);

        try {
            const [teacherResult, attendanceResult] = await Promise.all([
                getTeachers('page=1&limit=100&staffType=teacher'),
                getTeacherAttendance(`page=1&limit=100&branchId=${selectedBranchId}&date=${selectedDate}`),
            ]);

            const attendanceMap = new Map(
                (attendanceResult.items || []).map((entry) => [String(entry.teacherId || entry.teacher?.id), entry]),
            );

            setTeachers(
                (teacherResult.items || []).map((teacher) => {
                    const existingAttendance = attendanceMap.get(String(teacher.id));

                    return {
                        ...teacher,
                        status: existingAttendance?.status || 'Present',
                        remarks: existingAttendance?.remarks || '',
                    };
                }),
            );
        } catch (loadError) {
            setError(loadError.message || 'اساتذہ کی حاضری لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    }, [selectedBranchId, selectedDate]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [defaultBranch, teacherResult] = await Promise.all([
                    getDefaultBranch(),
                    getTeachers('page=1&limit=100&staffType=teacher'),
                ]);

                setSelectedBranchId(defaultBranch?.id ? String(defaultBranch.id) : '');
                setTeachers(
                    (teacherResult.items || []).map((teacher) => ({
                        ...teacher,
                        status: 'Present',
                        remarks: '',
                    })),
                );
            } catch (loadError) {
                setError(loadError.message || 'اساتذہ کی حاضری کا ڈیٹا لوڈ نہیں ہو سکا۔');
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        if (!selectedBranchId) return;
        loadAttendance();
    }, [loadAttendance, selectedBranchId]);

    const handleStatusChange = (id, newStatus) => {
        setTeachers((prev) => prev.map((teacher) => (teacher.id === id ? { ...teacher, status: newStatus } : teacher)));
    };

    const handleSave = async () => {
        if (!selectedBranchId) {
            setError('محفوظ کرنے سے پہلے بنیادی سیٹ اپ دستیاب ہونا چاہیے۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            await Promise.all(
                teachers.map((teacher) =>
                    saveTeacherAttendance({
                        teacherId: Number(teacher.id),
                        branchId: Number(selectedBranchId),
                        date: selectedDate,
                        status: teacher.status,
                        remarks: teacher.remarks || '',
                    }),
                ),
            );

            setSuccessMessage('اساتذہ کی حاضری کامیابی سے محفوظ ہو گئی۔');
        } catch (saveError) {
            setError(saveError.message || 'اساتذہ کی حاضری محفوظ نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredTeachers = useMemo(
        () =>
            teachers.filter((teacher) =>
                [teacher.fullName, teacher.phone, teacher.subject]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase())),
            ),
        [searchTerm, teachers],
    );

    const stats = useMemo(
        () => ({
            total: filteredTeachers.length,
            hazir: filteredTeachers.filter((teacher) => teacher.status === 'Present').length,
            ghairHazir: filteredTeachers.filter((teacher) => teacher.status === 'Absent').length,
            leave: filteredTeachers.filter((teacher) => teacher.status === 'Leave').length,
        }),
        [filteredTeachers],
    );

    const exportColumns = useMemo(() => [
        { header: 'ID', accessor: 'id' },
        { header: 'Name', accessor: 'fullName' },
        { header: 'Subject', accessor: 'subject' },
        { header: 'Phone', accessor: 'phone' },
        { header: 'Date', accessor: () => selectedDate },
        { header: 'Status', accessor: (teacher) => STATUS_OPTIONS.find((status) => status.value === teacher.status)?.label || teacher.status },
    ], [selectedDate]);

    return (
        <div className="p-6 space-y-6 bg-[var(--color-bg)] min-h-screen" dir="rtl">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard title="کل اساتذہ" count={stats.total} icon={Users} color="border-blue-500" textColor="text-blue-500" />
                <SummaryCard title="حاضر" count={stats.hazir} icon={CheckCircle} color="border-emerald-500" textColor="text-emerald-500" />
                <SummaryCard title="غیر حاضر" count={stats.ghairHazir} icon={XCircle} color="border-red-500" textColor="text-red-500" />
                <SummaryCard title="رخصت" count={stats.leave} icon={Clock} color="border-amber-500" textColor="text-amber-500" />
            </div>

            <div className="bg-[var(--color-surface)] rounded-[2rem] shadow-xl border border-[var(--color-border)]/5 overflow-visible">
                <div className="relative z-[90] p-6 border-b border-[var(--color-border)]/10 flex flex-col gap-4">
                    <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
                        <div className="flex flex-col lg:flex-row items-center gap-4 w-full xl:w-auto">
                            <h2 className="text-xl font-bold text-[var(--text-color)]">روزانہ حاضری شیٹ</h2>
                            <div className="w-full lg:w-[240px]">
                                <ThemedDatePicker
                                    value={selectedDate}
                                    onChange={(nextValue) => setSelectedDate(nextValue)}
                                    placeholder="تاریخ منتخب کریں"
                                />
                            </div>
                        </div>

                        <div className="bg-[var(--color-bg)] flex flex-row justify-center items-center rounded-xl w-full xl:w-[35%] overflow-hidden border border-[var(--color-border)]/10">
                            <button onClick={loadAttendance} className="bg-[var(--color-primary)] text-white p-3">
                                <Search size={20} />
                            </button>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="تلاش کریں (نام یا فون)..."
                                className="bg-transparent outline-none p-2 w-full text-sm"
                            />
                        </div>

                        <div className="flex w-full flex-col gap-2 xl:w-[22%]">
                            <ExportExcelButton rows={filteredTeachers} columns={exportColumns} fileName={`teacher-attendance-${selectedDate}`} className="w-full" />
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !selectedBranchId}
                                className="w-full flex justify-center items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60"
                            >
                                <Save size={18} /> {isSaving ? 'محفوظ...' : 'محفوظ کریں'}
                            </button>
                        </div>
                    </div>

                    {isLoading ? <div className="text-sm font-bold text-[var(--color-text-muted)]">حاضری لوڈ ہو رہی ہے...</div> : null}
                </div>

                <div className="overflow-x-auto hidden lg:block">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-black/5 text-[var(--text-color)] opacity-70 uppercase text-xs font-bold">
                                <th className="p-4">نمبر</th>
                                <th className="p-4">نام</th>
                                <th className="p-4">مضمون</th>
                                <th className="p-4">موبائل نمبر</th>
                                <th className="p-4 text-center">حاضری</th>
                                <th className="p-4 text-center">کارروائی</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]/5">
                            {filteredTeachers.map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-black/5 transition-colors">
                                    <td className="p-4 font-mono text-sm">{teacher.id}</td>
                                    <td className="p-4 font-bold text-[var(--text-color)]">{teacher.fullName}</td>
                                    <td className="p-4 text-sm text-[var(--text-color)] opacity-80">{teacher.subject || '---'}</td>
                                    <td className="p-4 text-sm font-sans text-[var(--text-color)] opacity-80" dir="ltr">{teacher.phone || '---'}</td>
                                    <td className="p-4">
                                        <div className="flex justify-center">
                                            <StatusDropdown status={teacher.status} onChange={(value) => handleStatusChange(teacher.id, value)} />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => navigate(`/teachers/attendance-history/${teacher.id}?branchId=${selectedBranchId}`)}
                                                className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="lg:hidden p-4 space-y-4">
                    {filteredTeachers.map((teacher) => (
                        <div
                            onClick={() => navigate(`/teachers/attendance-history/${teacher.id}?branchId=${selectedBranchId}`)}
                            key={teacher.id}
                            className="bg-[var(--color-bg)] p-5 rounded-3xl border border-[var(--color-border)]/10 shadow-sm space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{teacher.id}</span>
                                    <h3 className="text-lg font-black text-[var(--text-color)]">{teacher.fullName}</h3>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${teacher.status === 'Present' ? 'bg-emerald-500' : teacher.status === 'Leave' ? 'bg-amber-500' : teacher.status === 'Late' ? 'bg-sky-500' : 'bg-red-500'}`}></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-[var(--text-color)] opacity-70">
                                    <BookOpen size={16} className="text-[var(--color-primary)]" />
                                    <span>{teacher.subject || '---'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[var(--text-color)] opacity-70" dir="ltr">
                                    <Phone size={16} className="text-[var(--color-primary)]" />
                                    <span>{teacher.phone || '---'}</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="text-[10px] font-bold opacity-40 block mb-2 mr-1 uppercase">حاضری منتخب کریں:</label>
                                <StatusDropdown status={teacher.status} onChange={(value) => handleStatusChange(teacher.id, value)} isFullWidth />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, count, icon, color, textColor }) => (
    <div className={`bg-[var(--color-surface)] p-6 rounded-3xl border-r-5 ${color} shadow-lg flex items-center justify-between`}>
        <div>
            <p className="text-sm font-bold opacity-60">{title}</p>
            <h3 className={`text-3xl font-black ${textColor}`}>{count}</h3>
        </div>
        <div className={`p-4 rounded-2xl bg-slate-100 ${textColor}`}>
            {React.createElement(icon, { size: 28 })}
        </div>
    </div>
);

const StatusDropdown = ({ status, onChange, isFullWidth }) => (
    <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className={`px-4 py-2.5 rounded-2xl text-sm font-bold border-2 outline-none transition-all
            ${isFullWidth ? 'w-full' : 'w-48'}
            ${status === 'Present' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600' : ''}
            ${status === 'Absent' ? 'border-red-500/20 bg-red-500/5 text-red-600' : ''}
            ${status === 'Leave' ? 'border-amber-500/20 bg-amber-500/5 text-amber-600' : ''}
            ${status === 'Late' ? 'border-sky-500/20 bg-sky-500/5 text-sky-600' : ''}
        `}
    >
        {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
        ))}
    </select>
);
