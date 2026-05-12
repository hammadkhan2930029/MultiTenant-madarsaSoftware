import React, { useEffect, useMemo, useState } from 'react';
import { Search, Save } from 'lucide-react';
import { SelectField, DateField } from '../../../Components/HR/FormElements';
import { getBranches, getClasses, getSections, getSessions } from '../../../Constant/AcademicSetupApi';
import { getStudents } from '../../../Constant/StudentsApi';
import { getStudentAttendance, saveStudentAttendance } from '../../../Constant/AttendanceApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

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
    const today = new Date().toISOString().split('T')[0];
    const [searchFilters, setSearchFilters] = useState({
        branchId: '',
        sessionId: '',
        classId: '',
        sectionId: '',
        date: today,
    });
    const [branches, setBranches] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);
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
                const [branchResult, sessionResult] = await Promise.all([
                    getBranches('page=1&limit=100'),
                    getSessions('page=1&limit=100'),
                ]);

                setBranches(branchResult.items || []);
                setSessions(sessionResult.items || []);
            } catch (loadError) {
                setError(loadError.message || 'Attendance filters load nahi ho sake.');
            }
        };

        loadBaseData();
    }, []);

    useEffect(() => {
        const loadClasses = async () => {
            if (!searchFilters.branchId) {
                setClasses([]);
                return;
            }

            try {
                const result = await getClasses(`page=1&limit=100&branchId=${searchFilters.branchId}`);
                setClasses(result.items || []);
            } catch (loadError) {
                setError(loadError.message || 'Classes load nahi ho sakin.');
            }
        };

        loadClasses();
    }, [searchFilters.branchId]);

    useEffect(() => {
        const loadSections = async () => {
            if (!searchFilters.classId) {
                setSections([]);
                return;
            }

            try {
                const result = await getSections(`page=1&limit=100&classId=${searchFilters.classId}`);
                setSections(result.items || []);
            } catch (loadError) {
                setError(loadError.message || 'Sections load nahi ho sakin.');
            }
        };

        loadSections();
    }, [searchFilters.classId]);

    const handleFilterChange = (key, value) => {
        setError('');
        setSuccessMessage('');

        setSearchFilters((prev) => {
            const next = { ...prev, [key]: value };

            if (key === 'branchId') {
                next.classId = '';
                next.sectionId = '';
            }

            if (key === 'classId') {
                next.sectionId = '';
            }

            return next;
        });
    };

    const handleSearch = async () => {
        setError('');
        setSuccessMessage('');

        if (!searchFilters.branchId || !searchFilters.classId || !searchFilters.sectionId || !searchFilters.sessionId) {
            setError('Branch, session, class aur section select karna zaroori hai.');
            return;
        }

        setIsLoading(true);

        try {
            const studentQuery = new URLSearchParams({
                page: '1',
                limit: '200',
                branchId: searchFilters.branchId,
                classId: searchFilters.classId,
                sectionId: searchFilters.sectionId,
                sessionId: searchFilters.sessionId,
            }).toString();

            const attendanceQuery = new URLSearchParams({
                page: '1',
                limit: '200',
                branchId: searchFilters.branchId,
                classId: searchFilters.classId,
                sectionId: searchFilters.sectionId,
                date: searchFilters.date,
            }).toString();

            const [studentResult, attendanceResult] = await Promise.all([
                getStudents(studentQuery),
                getStudentAttendance(attendanceQuery),
            ]);

            const attendanceMap = new Map(
                (attendanceResult.items || []).map((entry) => [String(entry.studentId), entry]),
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
                        branchId: activeAssignment.branchId || Number(searchFilters.branchId),
                        classId: activeAssignment.classId || Number(searchFilters.classId),
                        sectionId: activeAssignment.sectionId || Number(searchFilters.sectionId),
                    };
                })
                .filter(Boolean);

            setStudents(rows);
            setIsSearched(true);

            if (!rows.length) {
                setError('Is filter ke liye koi student nahi mila.');
            }
        } catch (loadError) {
            setError(loadError.message || 'Attendance list load nahi ho saki.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!students.length) {
            setError('Save karne ke liye pehle attendance list load karein.');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            await Promise.all(
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

            setSuccessMessage('Student attendance backend me save ho gayi.');
        } catch (saveError) {
            setError(saveError.message || 'Attendance save nahi ho saki.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateStatus = (id, newStatus) => {
        setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, status: newStatus } : student)));
    };

    const counts = useMemo(
        () => ({
            present: students.filter((student) => student.status === 'Present').length,
            absent: students.filter((student) => student.status === 'Absent').length,
            leave: students.filter((student) => student.status === 'Leave').length,
            late: students.filter((student) => student.status === 'Late').length,
        }),
        [students],
    );

    return (
        <div className="p-4 md:p-6 space-y-6 bg-[var(--color-bg)] min-h-screen font-urdu text-right" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--color-surface)] p-6 rounded-[2rem] shadow-sm border border-[var(--color-border)]">
                <div>
                    <h2 className="text-4xl font-black text-[var(--color-text)]">روزانہ حاضری</h2>
                    <p className="text-xs text-[var(--color-text-muted)] font-bold mt-4">طلباء کی روزانہ حاضری backend ke saath</p>
                </div>

                <div className="w-full md:w-64 bg-[var(--color-input)] p-1 rounded-2xl border border-[var(--color-border)]">
                    <DateField
                        label="تاریخ"
                        value={searchFilters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 bg-[var(--color-surface)] p-5 rounded-[2rem] shadow-sm border border-[var(--color-border)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    <SelectField
                        label="برانچ"
                        value={searchFilters.branchId}
                        onChange={(e) => handleFilterChange('branchId', e.target.value)}
                        options={formatOptions(branches, 'برانچ منتخب کریں')}
                    />
                    <SelectField
                        label="سیشن"
                        value={searchFilters.sessionId}
                        onChange={(e) => handleFilterChange('sessionId', e.target.value)}
                        options={formatOptions(sessions, 'سیشن منتخب کریں')}
                    />
                    <SelectField
                        label="کلاس"
                        value={searchFilters.classId}
                        onChange={(e) => handleFilterChange('classId', e.target.value)}
                        options={formatOptions(classes, 'کلاس منتخب کریں')}
                    />
                    <SelectField
                        label="سیکشن"
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
                    <Search size={18} /> {isLoading ? 'لوڈ ہو رہا ہے...' : 'حاضری لسٹ دکھائیں'}
                </button>
            </div>

            {isSearched && (
                <div className="bg-[var(--color-surface)] rounded-[2.5rem] shadow-sm border border-[var(--color-border)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-input)]/50">
                        <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase text-center">کل طلباء: {students.length}</p>
                    </div>

                    <div className="divide-y divide-[var(--color-border)]">
                        {students.map((student) => (
                            <div key={student.id} className="p-4 flex items-center justify-between hover:bg-[var(--color-input)]/30 transition-colors gap-3">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-black text-xs border border-[var(--color-primary)]/20 shrink-0">
                                        {student.rollNo}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-black text-sm text-[var(--color-text)] truncate">{student.name}</h4>
                                        <p className="text-[9px] text-[var(--color-text-muted)] font-bold">Roll / Admission: {student.rollNo}</p>
                                    </div>
                                </div>

                                <div className="w-36 shrink-0">
                                    <select
                                        value={student.status}
                                        onChange={(e) => updateStatus(student.id, e.target.value)}
                                        className={`w-full p-2 rounded-xl border-2 text-[10px] font-black outline-none transition-all cursor-pointer ${getStatusColor(student.status)}`}
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-[var(--color-input)] border-t border-[var(--color-border)] space-y-4">
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
                            disabled={isSaving || !students.length}
                            className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-4 rounded-2xl font-black text-sm hover:opacity-95 shadow-xl shadow-[var(--color-primary)]/30 transition-all disabled:opacity-60"
                        >
                            <Save size={18} /> {isSaving ? 'محفوظ ہو رہا ہے...' : 'ڈیٹا محفوظ کریں'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
