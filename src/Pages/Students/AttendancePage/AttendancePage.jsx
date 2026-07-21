import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, CheckCircle2, Edit2, Search, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SelectField, DateField } from '../../../Components/HR/FormElements';
import { getClasses, getSections, getSessions } from '../../../Constant/AcademicSetupApi';
import { getStudents } from '../../../Constant/StudentsApi';
import { getStudentAttendance, saveStudentAttendance } from '../../../Constant/AttendanceApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { ExportExcelButton } from '../../../Components/Export/ExportExcelButton';

const STATUS_OPTIONS = [
    { value: 'Present', label: 'حاضر' },
    { value: 'Absent', label: 'غیر حاضر' },
    { value: 'Leave', label: 'رخصت' },
    { value: 'Late', label: 'تاخیر' },
];

const formatOptions = (items, fallbackLabel) => [
    { value: '', label: fallbackLabel },
    ...(items || []).map((item) => ({ value: String(item.id), label: item.name })),
];

const getStatusColor = (status) => {
    switch (status) {
        case 'Present':
            return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        case 'Absent':
            return 'text-rose-600 bg-rose-50 border-rose-100';
        case 'Leave':
            return 'text-amber-600 bg-amber-50 border-amber-100';
        case 'Late':
            return 'text-sky-600 bg-sky-50 border-sky-100';
        default:
            return 'text-slate-600 bg-slate-50';
    }
};

export const AttendancePage = () => {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [searchFilters, setSearchFilters] = useState({
        sessionId: '',
        classId: '',
        sectionId: '',
        date: today,
    });
    const [sessions, setSessions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);
    const [savedStudents, setSavedStudents] = useState([]);
    const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSearched, setIsSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    useNotificationBridge({ error, success: successMessage });

    useEffect(() => {
        window.scrollTo(0, 0);

        const loadBaseData = async () => {
            try {
                const [sessionResult, classesResult] = await Promise.all([
                    getSessions('page=1&limit=100&status=active'),
                    getClasses('page=1&limit=100&status=active'),
                ]);

                setSessions(sessionResult.items || []);
                setClasses(classesResult.items || []);
            } catch (loadError) {
                setError(loadError.message || 'حاضری کے فلٹرز لوڈ نہیں ہو سکے۔');
            }
        };

        loadBaseData();
    }, []);

    useEffect(() => {
        const loadSections = async () => {
            if (!searchFilters.classId) {
                setSections([]);
                return;
            }

            try {
                const result = await getSections(`page=1&limit=100&status=active&classId=${searchFilters.classId}`);
                setSections(result.items || []);
            } catch (loadError) {
                setError(loadError.message || 'سیکشنز لوڈ نہیں ہو سکے۔');
            }
        };

        loadSections();
    }, [searchFilters.classId]);

    const handleFilterChange = (key, value) => {
        setError('');
        setSuccessMessage('');
        setStudents([]);
        setSavedStudents([]);
        setIsAttendanceSaved(false);
        setIsEditMode(false);
        setIsSearched(false);

        setSearchFilters((prev) => {
            const next = { ...prev, [key]: value };

            if (key === 'classId') {
                next.sectionId = '';
            }

            return next;
        });
    };

    const handleSearch = async () => {
        setError('');
        setSuccessMessage('');

        const selectedClass = classes.find((item) => String(item.id) === String(searchFilters.classId));

        if (!searchFilters.classId || !searchFilters.sectionId || !searchFilters.sessionId || !selectedClass?.branchId) {
            setError('براہ کرم سیشن، جماعت اور سیکشن منتخب کریں۔');
            return;
        }

        setIsLoading(true);

        try {
            const studentQuery = new URLSearchParams({
                page: '1',
                limit: '100',
                classId: searchFilters.classId,
                sectionId: searchFilters.sectionId,
                sessionId: searchFilters.sessionId,
            }).toString();

            const attendanceQuery = new URLSearchParams({
                page: '1',
                limit: '100',
                branchId: String(selectedClass.branchId),
                classId: searchFilters.classId,
                sectionId: searchFilters.sectionId,
                date: searchFilters.date,
            }).toString();

            const [studentResult, attendanceResult] = await Promise.all([
                getStudents(studentQuery),
                getStudentAttendance(attendanceQuery),
            ]);

            const attendanceMap = new Map(
                (attendanceResult.items || []).map((entry) => [
                    String(entry.studentId ?? entry.student?.id),
                    entry,
                ]),
            );

            const rows = (studentResult.items || [])
                .map((student) => {
                    const activeAssignment = student.assignments?.find((assignment) => assignment.status === 'active');

                    if (!activeAssignment) {
                        return null;
                    }

                    const existingAttendance = attendanceMap.get(String(student.id));

                    return {
                        id: student.id,
                        rollNo: student.admissionNumber,
                        name: student.fullName,
                        status: existingAttendance?.status || 'Present',
                        remarks: existingAttendance?.remarks || '',
                        branchId: activeAssignment.branchId || Number(selectedClass.branchId),
                        classId: activeAssignment.classId || Number(searchFilters.classId),
                        sectionId: activeAssignment.sectionId || Number(searchFilters.sectionId),
                        attendanceId: existingAttendance?.id || null,
                    };
                })
                .filter(Boolean);

            setStudents(rows);
            setSavedStudents(rows.map((student) => ({ ...student })));
            setIsAttendanceSaved(rows.length > 0 && rows.every((student) => Boolean(student.attendanceId)));
            setIsEditMode(false);
            setIsSearched(true);

            if (!rows.length) {
                setError('اس فلٹر کے لیے کوئی طالب علم نہیں ملا۔');
            }
        } catch (loadError) {
            setError(loadError.message || 'حاضری کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!students.length) {
            setError('محفوظ کرنے سے پہلے حاضری کی فہرست لوڈ کریں۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            const savedEntries = await Promise.all(
                students.map((student) =>
                    saveStudentAttendance({
                        studentId: Number(student.id),
                        branchId: Number(student.branchId),
                        classId: Number(student.classId),
                        sectionId: Number(student.sectionId),
                        date: searchFilters.date,
                        status: student.status,
                        remarks: student.remarks || '',
                    }),
                ),
            );

            const nextStudents = students.map((student, index) => ({
                ...student,
                attendanceId: savedEntries[index]?.id || student.attendanceId || null,
            }));
            setStudents(nextStudents);
            setSavedStudents(nextStudents.map((student) => ({ ...student })));
            setIsAttendanceSaved(true);
            setIsEditMode(false);
            setSuccessMessage('طلباء کی حاضری کامیابی سے محفوظ ہو گئی۔');
        } catch (saveError) {
            setError(saveError.message || 'حاضری محفوظ نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    const updateStatus = (id, newStatus) => {
        setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, status: newStatus } : student)));
    };

    const updateRemarks = (id, remarks) => {
        setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, remarks } : student)));
    };

    const markAllStudents = (status) => {
        setStudents((prev) => prev.map((student) => ({ ...student, status })));
    };

    const hasAttendanceChanges = useMemo(() => {
        if (students.length !== savedStudents.length) return true;

        return students.some((student, index) => (
            student.status !== savedStudents[index]?.status ||
            student.remarks !== savedStudents[index]?.remarks
        ));
    }, [savedStudents, students]);

    const canEditAttendance = !isAttendanceSaved || isEditMode;
    const canSaveAttendance = students.length > 0 && (
        !isAttendanceSaved || (isEditMode && hasAttendanceChanges)
    );

    const counts = useMemo(
        () => ({
            present: students.filter((student) => student.status === 'Present').length,
            absent: students.filter((student) => student.status === 'Absent').length,
            leave: students.filter((student) => student.status === 'Leave').length,
            late: students.filter((student) => student.status === 'Late').length,
        }),
        [students],
    );

    const exportColumns = useMemo(() => [
        { header: 'داخلہ نمبر', accessor: 'rollNo' },
        { header: 'Student Name', accessor: 'name' },
        { header: 'Date', accessor: () => searchFilters.date },
        { header: 'Status', accessor: (student) => STATUS_OPTIONS.find((status) => status.value === student.status)?.label || student.status },
        { header: 'نوٹ', accessor: 'remarks' },
    ], [searchFilters.date]);

    return (
        <div className="p-4 md:p-6 space-y-6 bg-[var(--color-bg)] min-h-screen font-urdu text-right" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--color-surface)] p-6 rounded-[2rem] shadow-sm border border-[var(--color-border)]">
                <div>
                    <h2 className="text-3xl font-black text-[var(--color-text)]">طلباء کی حاضری</h2>
                    <p className="text-sm text-[var(--color-text-muted)] font-bold mt-4">طلباء کی روزانہ حاضری کا اندراج کریں یا پرانی حاضری دیکھیں</p>
                    <p className="mt-2 text-sm font-bold text-[var(--color-primary)]">
                        پچھلی حاضری دیکھنے کے لیے تاریخ، سیشن، جماعت اور سیکشن منتخب کر کے حاضری کی فہرست دیکھیں۔
                    </p>
                </div>

                <div className="w-full md:w-64 bg-[var(--color-input)] p-1 rounded-2xl border border-[var(--color-border)]">
                    <DateField
                        label="تاریخ"
                        required
                        value={searchFilters.date}
                        onChange={(nextValue) => handleFilterChange('date', nextValue)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 bg-[var(--color-surface)] p-5 rounded-[2rem] shadow-sm border border-[var(--color-border)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    <SelectField
                        label="سیشن"
                        required
                        value={searchFilters.sessionId}
                        onChange={(e) => handleFilterChange('sessionId', e.target.value)}
                        options={formatOptions(sessions, 'سیشن منتخب کریں')}
                    />
                    <SelectField
                        label="جماعت"
                        required
                        value={searchFilters.classId}
                        onChange={(e) => handleFilterChange('classId', e.target.value)}
                        options={formatOptions(classes, 'جماعت منتخب کریں')}
                    />
                    <SelectField
                        label="سیکشن"
                        required
                        value={searchFilters.sectionId}
                        onChange={(e) => handleFilterChange('sectionId', e.target.value)}
                        options={formatOptions(sections, 'سیکشن منتخب کریں')}
                    />
                </div>

                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="w-full h-[55px] bg-[var(--color-primary)] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/20 active:scale-[0.98] disabled:opacity-60"
                >
                    <Search size={18} /> {isLoading ? 'فہرست لوڈ ہو رہی ہے...' : 'حاضری کی فہرست دیکھیں'}
                </button>
            </div>

            {isSearched && (
                <div className="bg-[var(--color-surface)] rounded-[2.5rem] shadow-sm border border-[var(--color-border)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-input)]/50">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-black text-[var(--color-text-muted)] uppercase">کل طلباء: {students.length}</p>
                                <p className="mt-1 text-sm font-bold text-[var(--color-text-main)]">
                                    تاریخ: <span className="font-sans mr-2">{searchFilters.date}</span>
                                </p>
                            </div>
                            {students.length ? (
                                <div className="grid grid-cols-2 gap-2 md:flex">
                                    <ExportExcelButton rows={students} columns={exportColumns} fileName={`student-attendance-${searchFilters.date}`} className="col-span-2 w-full md:w-auto" />
                                    {isAttendanceSaved && !isEditMode ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditMode(true)}
                                            className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-[10px] font-black text-blue-400 md:col-auto"
                                        >
                                            <Edit2 size={15} />
                                            درستگی کریں
                                        </button>
                                    ) : null}
                                    {STATUS_OPTIONS.map((status) => (
                                        <button
                                            key={status.value}
                                            type="button"
                                            onClick={() => markAllStudents(status.value)}
                                            disabled={!canEditAttendance}
                                            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[10px] font-black text-[var(--color-text-main)] transition-colors hover:bg-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            سب {status.label}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="divide-y divide-[var(--color-border)]">
                        {students.map((student) => (
                            <div key={student.id} className="p-4 grid grid-cols-1 gap-3 hover:bg-[var(--color-input)]/30 transition-colors lg:grid-cols-[1fr_160px_260px_auto] lg:items-center">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="min-w-0">
                                        <h4 className="font-black text-sm text-[var(--color-text)] truncate">{student.name}</h4>
                                        <p className="text-[10px] text-[var(--color-text-muted)] font-bold">
                                            <span>داخلہ نمبر: </span>
                                            <span dir="ltr" className="inline-block">{student.rollNo || '---'}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full lg:w-40">
                                    <select
                                        value={student.status}
                                        onChange={(e) => updateStatus(student.id, e.target.value)}
                                        disabled={!canEditAttendance}
                                        className={`w-full p-2 rounded-xl border-2 text-[10px] font-black outline-none transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${getStatusColor(student.status)}`}
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <input
                                    type="text"
                                    value={student.remarks}
                                    onChange={(event) => updateRemarks(student.id, event.target.value)}
                                    disabled={!canEditAttendance}
                                    placeholder="نوٹ"
                                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text-main)] outline-none transition-colors focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-70"
                                />

                                <button
                                    type="button"
                                    onClick={() => navigate(`/students/attendance-history/${student.id}`)}
                                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 text-xs font-black text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                                >
                                    <CalendarRange size={17} />
                                    حاضری ریکارڈ
                                </button>
                            </div>
                        ))}
                        {!students.length ? (
                            <div className="p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                حاضری کی فہرست خالی ہے۔ فلٹرز منتخب کر کے فہرست لوڈ کریں۔
                            </div>
                        ) : null}
                    </div>

                    <div className="p-6 bg-[var(--color-input)] border-t border-[var(--color-border)] space-y-4">
                        {isAttendanceSaved ? (
                            <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-500">
                                <CheckCircle2 size={18} />
                                اس تاریخ کی حاضری محفوظ ہے۔
                            </div>
                        ) : null}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center">
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mb-1">حاضر</p>
                                <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-sm font-black">{counts.present}</span>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mb-1">غیر حاضر</p>
                                <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-sm font-black">{counts.absent}</span>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mb-1">رخصت</p>
                                <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-sm font-black">{counts.leave}</span>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mb-1">تاخیر</p>
                                <span className="bg-sky-100 text-sky-600 px-3 py-1 rounded-full text-sm font-black">{counts.late}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving || !canSaveAttendance}
                            className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-4 rounded-2xl font-black text-sm hover:opacity-95 shadow-xl shadow-[var(--color-primary)]/30 transition-all disabled:opacity-60"
                        >
                            <Save size={18} />
                            {isSaving
                                ? 'محفوظ ہو رہا ہے...'
                                : isAttendanceSaved && !isEditMode
                                    ? 'حاضری محفوظ ہے'
                                    : isAttendanceSaved && !hasAttendanceChanges
                                        ? 'کوئی تبدیلی نہیں'
                                        : 'حاضری محفوظ کریں'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
