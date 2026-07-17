import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, CheckCircle, XCircle, Clock, Layers, BookOpen, Save, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemedDatePicker } from '../../../Components/DatePicker/ThemedDatePicker';
import { getDefaultBranch } from '../../../Constant/AcademicSetupApi';
import { getTeachers } from '../../../Constant/TeachersApi';
import { getTeacherAssignments } from '../../../Constant/TeacherAssignmentApi';
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

const getTeacherShiftLabel = (teacher) =>
    teacher?.shift?.name || teacher?.shiftName || teacher?.shiftTitle || (teacher?.shiftId ? `شفٹ #${teacher.shiftId}` : '---');

const uniqueByKey = (items, keyGetter) => {
    const map = new Map();
    (items || []).forEach((item) => {
        const key = keyGetter(item);
        if (key && !map.has(String(key))) map.set(String(key), item);
    });
    return [...map.values()];
};

const joinLabels = (values) => {
    const labels = [...new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean))];
    return labels.length ? labels.join('، ') : '---';
};

export const TeacherAttendance = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [teacherAssignments, setTeacherAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    useNotificationBridge({ error, success: successMessage });

    const loadAttendance = useCallback(async () => {
        setError('');
        setSuccessMessage('');

        if (!selectedBranchId || !selectedDate) {
            setError('حاضری کے لیے بنیادی سیٹ اپ دستیاب نہیں۔');
            return;
        }

        setIsLoading(true);

        try {
            const [teacherResult, attendanceResult] = await Promise.all([
                getTeachers('page=1&limit=100&status=active&staffType=teacher'),
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
                const [defaultBranch, teacherResult, assignmentsResult] = await Promise.all([
                    getDefaultBranch(),
                    getTeachers('page=1&limit=100&status=active&staffType=teacher'),
                    getTeacherAssignments('page=1&limit=500&status=active').catch(() => ({ items: [] })),
                ]);

                setSelectedBranchId(defaultBranch?.id ? String(defaultBranch.id) : '');
                setTeachers(
                    (teacherResult.items || []).map((teacher) => ({
                        ...teacher,
                        status: 'Present',
                        remarks: '',
                    })),
                );
                setTeacherAssignments(assignmentsResult.items || []);
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

    const assignmentsByTeacher = useMemo(() => {
        const map = new Map();
        teacherAssignments.forEach((assignment) => {
            const teacherId = String(assignment.teacherId || assignment.teacher?.id || '');
            if (!teacherId) return;
            if (!map.has(teacherId)) map.set(teacherId, []);
            map.get(teacherId).push(assignment);
        });
        return map;
    }, [teacherAssignments]);

    const getTeacherAssignmentsList = (teacher) => assignmentsByTeacher.get(String(teacher.id)) || [];
    const getTeacherSubjectLabels = (teacher) => joinLabels([
        teacher.subject,
        ...getTeacherAssignmentsList(teacher).map((assignment) => assignment.subject?.name),
    ]);
    const getTeacherClassLabels = (teacher) => joinLabels(getTeacherAssignmentsList(teacher).map((assignment) => assignment.class?.name));
    const getTeacherSectionLabels = (teacher) => joinLabels(getTeacherAssignmentsList(teacher).map((assignment) => assignment.section?.name));

    const subjectOptions = useMemo(() => {
        const assignmentSubjects = teacherAssignments.map((assignment) => assignment.subject?.name).filter(Boolean);
        const directSubjects = teachers.map((teacher) => teacher.subject).filter(Boolean);
        return [...new Set([...assignmentSubjects, ...directSubjects])];
    }, [teacherAssignments, teachers]);

    const classOptions = useMemo(
        () => uniqueByKey(teacherAssignments.map((assignment) => assignment.class).filter(Boolean), (item) => item.id),
        [teacherAssignments],
    );

    const sectionOptions = useMemo(
        () => uniqueByKey(
            teacherAssignments
                .filter((assignment) => !selectedClassId || String(assignment.classId || assignment.class?.id) === String(selectedClassId))
                .map((assignment) => assignment.section)
                .filter(Boolean),
            (item) => item.id,
        ),
        [teacherAssignments, selectedClassId],
    );

    const filteredTeachers = useMemo(
        () =>
            teachers.filter((teacher) => {
                const assignments = getTeacherAssignmentsList(teacher);
                const subjectLabels = [teacher.subject, ...assignments.map((assignment) => assignment.subject?.name)].filter(Boolean);
                const searchOk = [
                    teacher.fullName,
                    teacher.subject,
                    getTeacherShiftLabel(teacher),
                    ...assignments.map((assignment) => assignment.class?.name),
                    ...assignments.map((assignment) => assignment.section?.name),
                ]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()));
                const subjectOk = !selectedSubject || subjectLabels.includes(selectedSubject);
                const classOk = !selectedClassId || assignments.some((assignment) => String(assignment.classId || assignment.class?.id) === String(selectedClassId));
                const sectionOk = !selectedSectionId || assignments.some((assignment) => String(assignment.sectionId || assignment.section?.id) === String(selectedSectionId));
                return searchOk && subjectOk && classOk && sectionOk;
            }),
        [assignmentsByTeacher, searchTerm, selectedClassId, selectedSectionId, selectedSubject, teachers],
    );

    const stats = useMemo(
        () => ({
            total: filteredTeachers.length,
            hazir: filteredTeachers.filter((teacher) => teacher.status === 'Present').length,
            ghairHazir: filteredTeachers.filter((teacher) => teacher.status === 'Absent').length,
            leave: filteredTeachers.filter((teacher) => teacher.status === 'Leave').length,
            late: filteredTeachers.filter((teacher) => teacher.status === 'Late').length,
        }),
        [filteredTeachers],
    );

    const exportColumns = useMemo(() => [
        { header: 'ID', accessor: 'id' },
        { header: 'Name', accessor: 'fullName' },
        { header: 'Subject', accessor: getTeacherSubjectLabels },
        { header: 'Class', accessor: getTeacherClassLabels },
        { header: 'Section', accessor: getTeacherSectionLabels },
        { header: 'Shift', accessor: getTeacherShiftLabel },
        { header: 'Date', accessor: () => selectedDate },
        { header: 'Status', accessor: (teacher) => STATUS_OPTIONS.find((status) => status.value === teacher.status)?.label || teacher.status },
    ], [assignmentsByTeacher, selectedDate]);

    return (
        <div className="p-6 space-y-6 bg-[var(--color-bg)] min-h-screen" dir="rtl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <SummaryCard title="کل اساتذہ" count={stats.total} icon={Users} color="border-blue-500" textColor="text-blue-500" />
                <SummaryCard title="حاضر" count={stats.hazir} icon={CheckCircle} color="border-emerald-500" textColor="text-emerald-500" />
                <SummaryCard title="غیر حاضر" count={stats.ghairHazir} icon={XCircle} color="border-red-500" textColor="text-red-500" />
                <SummaryCard title="رخصت" count={stats.leave} icon={Clock} color="border-amber-500" textColor="text-amber-500" />
                <SummaryCard title="تاخیر" count={stats.late} icon={Clock} color="border-sky-500" textColor="text-sky-500" />
            </div>

            <div className="bg-[var(--color-surface)] rounded-[2rem] shadow-xl border border-[var(--color-border)]/5 overflow-visible">
                <div className="relative z-[90] p-6 border-b border-[var(--color-border)]/10 flex flex-col gap-4">
                    <div className="flex flex-col gap-5">
                        <div className="flex w-full flex-col gap-3">
                            <h2 className="text-xl font-bold text-[var(--text-color)]">حاضری شیٹ</h2>
                            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[var(--text-color)]">تاریخ</label>
                                    <ThemedDatePicker
                                        value={selectedDate}
                                        onChange={(nextValue) => setSelectedDate(nextValue)}
                                        placeholder="تاریخ منتخب کریں"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[var(--text-color)]">مضمون</label>
                                    <select
                                        value={selectedSubject}
                                        onChange={(event) => setSelectedSubject(event.target.value)}
                                        className="h-12 w-full rounded-xl border border-[var(--color-border)]/10 bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--text-color)] outline-none"
                                    >
                                        <option value="">تمام مضامین</option>
                                        {subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[var(--text-color)]">جماعت</label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(event) => {
                                            setSelectedClassId(event.target.value);
                                            setSelectedSectionId('');
                                        }}
                                        className="h-12 w-full rounded-xl border border-[var(--color-border)]/10 bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--text-color)] outline-none"
                                    >
                                        <option value="">تمام جماعتیں</option>
                                        {classOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[var(--text-color)]">جماعت سیکشن</label>
                                    <select
                                        value={selectedSectionId}
                                        onChange={(event) => setSelectedSectionId(event.target.value)}
                                        className="h-12 w-full rounded-xl border border-[var(--color-border)]/10 bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--text-color)] outline-none"
                                    >
                                        <option value="">تمام سیکشن</option>
                                        {sectionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px] lg:items-center">
                            <div className="bg-[var(--color-bg)] flex h-12 flex-row justify-center items-center rounded-xl w-full overflow-hidden border border-[var(--color-border)]/10">
                                <button onClick={loadAttendance} className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--color-primary)] text-white">
                                    <Search size={20} />
                                </button>
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="تلاش کریں (نام، مضمون، جماعت)..."
                                    className="bg-transparent outline-none px-3 w-full text-sm"
                                />
                            </div>
                            <ExportExcelButton rows={filteredTeachers} columns={exportColumns} fileName={`teacher-attendance-${selectedDate}`} className="w-full h-12" />
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !selectedBranchId}
                                className="w-full h-12 flex justify-center items-center gap-2 bg-[var(--color-primary)] text-white px-6 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60"
                            >
                                <Save size={18} /> {isSaving ? 'محفوظ...' : 'محفوظ کریں'}
                            </button>
                        </div>
                    </div>

                    {isLoading ? <div className="text-sm font-bold text-[var(--color-text-muted)]">حاضری لوڈ ہو رہی ہے...</div> : null}
                </div>

                <div className="overflow-x-auto hidden lg:block">
                    <table className="w-full min-w-[980px] text-right border-collapse">
                        <thead>
                            <tr className="bg-black/5 text-[var(--text-color)] opacity-70 uppercase text-xs font-bold">
                                <th className="p-4">نمبر</th>
                                <th className="p-4">نام</th>
                                <th className="p-4">مضمون</th>
                                <th className="p-4">جماعت</th>
                                <th className="p-4">جماعت سیکشن</th>
                                <th className="p-4">شفٹ</th>
                                <th className="p-4 text-center">حاضری</th>
                                <th className="p-4 text-center">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]/5">
                            {filteredTeachers.map((teacher, index) => (
                                <tr key={teacher.id} className="hover:bg-black/5 transition-colors">
                                    <td className="p-4 font-mono text-sm">{index + 1}</td>
                                    <td className="p-4 font-bold text-[var(--text-color)]">{teacher.fullName}</td>
                                    <td className="p-4 text-sm text-[var(--text-color)] opacity-80">{getTeacherSubjectLabels(teacher)}</td>
                                    <td className="p-4 text-sm text-[var(--text-color)] opacity-80">{getTeacherClassLabels(teacher)}</td>
                                    <td className="p-4 text-sm text-[var(--text-color)] opacity-80">{getTeacherSectionLabels(teacher)}</td>
                                    <td className="p-4 text-sm text-[var(--text-color)] opacity-80">{getTeacherShiftLabel(teacher)}</td>
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
                    {filteredTeachers.map((teacher, index) => (
                        <div
                            onClick={() => navigate(`/teachers/attendance-history/${teacher.id}?branchId=${selectedBranchId}`)}
                            key={teacher.id}
                            className="bg-[var(--color-bg)] p-5 rounded-3xl border border-[var(--color-border)]/10 shadow-sm space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{index + 1}</span>
                                    <h3 className="text-lg font-black text-[var(--text-color)]">{teacher.fullName}</h3>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${teacher.status === 'Present' ? 'bg-emerald-500' : teacher.status === 'Leave' ? 'bg-amber-500' : teacher.status === 'Late' ? 'bg-sky-500' : 'bg-red-500'}`}></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-[var(--text-color)] opacity-70">
                                    <BookOpen size={16} className="text-[var(--color-primary)]" />
                                    <span>{getTeacherSubjectLabels(teacher)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[var(--text-color)] opacity-70">
                                    <Layers size={16} className="text-[var(--color-primary)]" />
                                    <span>{getTeacherClassLabels(teacher)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[var(--text-color)] opacity-70">
                                    <Layers size={16} className="text-[var(--color-primary)]" />
                                    <span>{getTeacherSectionLabels(teacher)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[var(--text-color)] opacity-70">
                                    <Clock size={16} className="text-[var(--color-primary)]" />
                                    <span>{getTeacherShiftLabel(teacher)}</span>
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
