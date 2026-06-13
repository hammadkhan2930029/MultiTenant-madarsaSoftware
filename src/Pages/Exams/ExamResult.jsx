import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Award, BookOpen, Calculator, Plus, Save, Search, Trash2, UserRound } from 'lucide-react';
import { getSubjects } from '../../Constant/AcademicSetupApi';
import { getStudents } from '../../Constant/StudentsApi';
import { getStudentExamResult, saveExamResult, updateExamResult } from '../../Constant/ExamResultsApi';
import { defaultResultGrades, getResultGradeLabel } from '../../Constant/ResultGrades';
import { getResultGrades } from '../../Constant/ResultGradesApi';
import { useNotifier } from '../../Components/Notifications/useNotifier';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';

const emptySubjectRow = () => ({
    id: crypto.randomUUID(),
    subjectId: '',
    subjectName: '',
    totalMarks: '100',
    obtainedMarks: '',
});

const activeOnly = (items) => (items || []).filter((item) => !item.status || item.status === 'active');
const toNumber = (value) => Number(value || 0);
const getActiveAssignment = (student) => student?.assignments?.find((assignment) => assignment.status === 'active') || student?.assignments?.[0] || null;
const getPercentage = (obtained, total) => (total > 0 ? (obtained / total) * 100 : 0);
const getResultErrorMessage = (message, fallback) => {
    const text = String(message || '').toLowerCase();
    if (text.includes('duplicate subjects')) return 'ایک ہی مضمون دوبارہ شامل نہیں کیا جا سکتا۔';
    if (text.includes('student is not assigned')) return 'طالب علم اس کلاس/سیشن میں شامل نہیں ہے۔';
    if (text.includes('active student')) return 'فعال طالب علم نہیں ملا۔';
    if (text.includes('active session')) return 'فعال سیشن نہیں ملا۔';
    if (text.includes('active class')) return 'فعال کلاس نہیں ملی۔';
    if (text.includes('active section')) return 'فعال سیکشن نہیں ملا۔';
    if (text.includes('active subjects')) return 'منتخب کردہ مضمون فعال نہیں ملا۔';
    if (text.includes('validation')) return 'درج کردہ معلومات درست نہیں ہیں۔';
    return message || fallback;
};

const buildResultQuery = (assignment) => {
    const params = new URLSearchParams();
    if (assignment?.session?.id) params.set('sessionId', assignment.session.id);
    if (assignment?.class?.id) params.set('classId', assignment.class.id);
    if (assignment?.section?.id) params.set('sectionId', assignment.section.id);
    return params.toString();
};

const rowsFromResult = (result) => (result?.subjects || []).map((subjectRow) => ({
    id: `saved-${subjectRow.id}`,
    subjectId: String(subjectRow.subjectId),
    subjectName: subjectRow.subjectName || '',
    totalMarks: String(subjectRow.totalMarks ?? '100'),
    obtainedMarks: String(subjectRow.obtainedMarks ?? ''),
}));

export const ExamResult = () => {
    const notify = useNotifier();
    const location = useLocation();
    const editResult = location.state?.editResult || null;
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [savedResultId, setSavedResultId] = useState(null);
    const [rows, setRows] = useState([emptySubjectRow()]);
    const [gradeScale, setGradeScale] = useState(defaultResultGrades);
    const [isLoading, setIsLoading] = useState(true);
    const [isResultLoading, setIsResultLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError('');
            try {
                const [studentsResult, subjectsResult] = await Promise.all([
                    getStudents('page=1&limit=100'),
                    getSubjects('page=1&limit=100'),
                ]);
                setStudents(studentsResult.items || []);
                setSubjects(activeOnly(subjectsResult.items));
                try {
                    const gradesResult = await getResultGrades('page=1&limit=100&status=active');
                    setGradeScale((gradesResult.items || []).length ? gradesResult.items : defaultResultGrades);
                } catch {
                    setGradeScale(defaultResultGrades);
                }
            } catch (loadError) {
                setError(getResultErrorMessage(loadError.message, 'رزلٹ کا بنیادی ڈیٹا لوڈ نہیں ہو سکا۔'));
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (!editResult) return;

        setSelectedStudent({
            ...(editResult.student || {}),
            assignments: [{
                id: `result-${editResult.id}`,
                status: 'active',
                class: editResult.class,
                section: editResult.section,
                session: editResult.session,
            }],
        });
        setSearch(`${editResult.student?.fullName || ''} ${editResult.student?.admissionNumber ? `(${editResult.student.admissionNumber})` : ''}`.trim());
        setSavedResultId(editResult.id);
        setRows(rowsFromResult(editResult).length ? rowsFromResult(editResult) : [emptySubjectRow()]);
        setSuccess('رزلٹ ترمیم کے لیے لوڈ ہو گیا۔');
    }, [editResult]);

    const filteredStudents = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return students.slice(0, 8);

        return students.filter((student) =>
            [student.fullName, student.fatherName, student.admissionNumber, student.phone]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query)),
        ).slice(0, 10);
    }, [search, students]);

    const assignment = getActiveAssignment(selectedStudent);
    const totals = useMemo(() => {
        const totalMarks = rows.reduce((sum, row) => sum + toNumber(row.totalMarks), 0);
        const obtainedMarks = rows.reduce((sum, row) => sum + toNumber(row.obtainedMarks), 0);
        const percentage = getPercentage(obtainedMarks, totalMarks);
        return {
            totalMarks,
            obtainedMarks,
            percentage,
            grade: getResultGradeLabel(percentage, gradeScale),
        };
    }, [gradeScale, rows]);

    const selectStudent = async (student) => {
        setSelectedStudent(student);
        setSearch(`${student.fullName || ''} ${student.admissionNumber ? `(${student.admissionNumber})` : ''}`.trim());
        setSavedResultId(null);
        setRows([emptySubjectRow()]);
        setError('');
        setSuccess('');

        const studentAssignment = getActiveAssignment(student);
        if (!studentAssignment?.session?.id || !studentAssignment?.class?.id) {
            setError('اس طالب علم کی فعال کلاس/سیشن تفویض موجود نہیں۔');
            return;
        }

        setIsResultLoading(true);
        try {
            const result = await getStudentExamResult(student.id, buildResultQuery(studentAssignment));
            if (result) {
                setSavedResultId(result.id);
                setRows(rowsFromResult(result).length ? rowsFromResult(result) : [emptySubjectRow()]);
                setSuccess('محفوظ شدہ رزلٹ لوڈ ہو گیا۔');
            }
        } catch (loadError) {
            setError(getResultErrorMessage(loadError.message, 'محفوظ شدہ رزلٹ لوڈ نہیں ہو سکا۔'));
        } finally {
            setIsResultLoading(false);
        }
    };

    const updateRow = (rowId, field, value) => {
        setRows((current) => current.map((row) => {
            if (row.id !== rowId) return row;

            if (field === 'subjectId') {
                const subject = subjects.find((item) => String(item.id) === String(value));
                return { ...row, subjectId: value, subjectName: subject?.name || '' };
            }

            return { ...row, [field]: value };
        }));
    };

    const addRow = () => setRows((current) => [...current, emptySubjectRow()]);
    const deleteRow = (rowId) => setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== rowId) : current));

    const handleSave = async () => {
        setError('');
        setSuccess('');

        if (!selectedStudent) {
            setError('براہ کرم پہلے طالب علم منتخب کریں۔');
            return;
        }

        if (!assignment?.session?.id || !assignment?.class?.id) {
            setError('اس طالب علم کی کلاس/سیشن تفویض مکمل نہیں۔');
            return;
        }

        const validRows = rows.map((row) => ({
            subjectId: Number(row.subjectId),
            totalMarks: Number(row.totalMarks),
            obtainedMarks: Number(row.obtainedMarks),
        }));

        if (rows.some((row) => !row.subjectId || !row.totalMarks || row.obtainedMarks === '')) {
            setError('ہر قطار میں مضمون، کل نمبر اور حاصل کردہ نمبر درج کریں۔');
            return;
        }

        if (new Set(validRows.map((row) => row.subjectId)).size !== validRows.length) {
            setError('ایک ہی مضمون دوبارہ شامل نہیں کیا جا سکتا۔');
            return;
        }

        if (validRows.some((row) => row.obtainedMarks < 0 || row.obtainedMarks > row.totalMarks)) {
            setError('حاصل کردہ نمبر کل نمبروں سے زیادہ نہیں ہو سکتے۔');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                studentId: selectedStudent.id,
                sessionId: assignment.session.id,
                classId: assignment.class.id,
                sectionId: assignment.section?.id || null,
                subjects: validRows,
            };
            await (savedResultId
                ? updateExamResult(savedResultId, payload)
                : saveExamResult(payload));
            const successMessage = savedResultId ? 'رزلٹ اپڈیٹ ہو گیا۔' : 'رزلٹ محفوظ ہو گیا۔';
            setSelectedStudent(null);
            setSearch('');
            setSavedResultId(null);
            setRows([emptySubjectRow()]);
            setSuccess(successMessage);
            notify.success(successMessage, savedResultId ? 'رزلٹ اپڈیٹ' : 'رزلٹ محفوظ');
        } catch (saveError) {
            setError(getResultErrorMessage(saveError.message, 'رزلٹ محفوظ نہیں ہو سکا۔'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-3 text-[var(--color-text-main)] font-urdu md:p-6" dir="rtl">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-500/10 p-3 text-[var(--color-primary)]">
                            <Award size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[var(--color-primary)] md:text-3xl">امتحانی رزلٹ</h1>
                            <p className="mt-5 text-sm font-bold text-[var(--color-text-muted)]">طالب علم منتخب کریں، مضامین اور نمبر درج کریں، فیصد اور گریڈ خود حساب ہو جائیں گے۔</p>
                        </div>
                    </div>
                </div>

                {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-bold text-rose-400">{error}</div> : null}
                {success ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-400">{success}</div> : null}

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl xl:col-span-4">
                        <div className="mb-4 flex items-center gap-2 text-lg font-black">
                            <Search size={20} className="text-[var(--color-primary)]" />
                            طالب علم تلاش کریں <span className="text-red-500">*</span>
                        </div>
                        <div className="relative">
                            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={isLoading ? 'طلبہ لوڈ ہو رہے ہیں...' : 'نام، والد کا نام یا داخلہ نمبر'}
                                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] pr-11 pl-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>

                        <div className="mt-4 max-h-[470px] space-y-2 overflow-auto">
                            {filteredStudents.map((student) => {
                                const studentAssignment = getActiveAssignment(student);
                                const isSelected = selectedStudent?.id === student.id;
                                return (
                                    <button
                                        key={student.id}
                                        type="button"
                                        onClick={() => selectStudent(student)}
                                        className={`w-full rounded-2xl border p-3 text-right transition-all ${isSelected ? 'border-[var(--color-primary)] bg-emerald-500/10' : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary)]'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-primary)]">
                                                <UserRound size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-black">{student.fullName}</div>
                                                <div className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">
                                                    {student.admissionNumber || '---'} / {studentAssignment?.class?.name || 'کلاس نہیں'}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6 xl:col-span-8">
                        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
                            <div className="mb-4 flex items-center gap-2 text-lg font-black">
                                <UserRound size={20} className="text-[var(--color-primary)]" />
                                طالب علم کی تفصیل
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                <InfoBox label="نام" value={selectedStudent?.fullName || '---'} />
                                <InfoBox label="والد کا نام" value={selectedStudent?.fatherName || '---'} />
                                <InfoBox label="کلاس" value={assignment?.class?.name || '---'} />
                                <InfoBox label="سیکشن" value={assignment?.section?.name || '---'} />
                                <InfoBox label="سیشن" value={assignment?.session?.name || '---'} />
                                <InfoBox label="داخلہ نمبر" value={selectedStudent?.admissionNumber || '---'} />
                                <InfoBox label="کل نمبر" value={totals.totalMarks || '---'} />
                                <InfoBox label="حاصل کردہ نمبر" value={totals.obtainedMarks || '---'} />
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
                            <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-5 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-2 text-lg font-black">
                                    <BookOpen size={20} className="text-[var(--color-primary)]" />
                                    مضامین اور نمبر
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={addRow} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-bg)] px-4 text-xs font-black text-[var(--color-text-main)]">
                                        <Plus size={16} /> مضمون شامل کریں
                                    </button>
                                    <button type="button" onClick={handleSave} disabled={isSaving || isResultLoading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-xs font-black text-[#0b1120] disabled:cursor-not-allowed disabled:opacity-70">
                                        <Save size={16} /> {isSaving ? 'محفوظ ہو رہا ہے...' : savedResultId ? 'رزلٹ اپڈیٹ کریں' : 'رزلٹ محفوظ کریں'}
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[680px] text-right text-sm">
                                    <thead className="bg-[var(--color-bg)] text-xs font-black text-[var(--color-text-muted)]">
                                        <tr>
                                            <th className="p-4">مضمون <span className="text-red-500">*</span></th>
                                            <th className="p-4">کل نمبر <span className="text-red-500">*</span></th>
                                            <th className="p-4">حاصل کردہ نمبر <span className="text-red-500">*</span></th>
                                            <th className="p-4">فیصد</th>
                                            <th className="p-4 text-center">ایکشن</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {isResultLoading ? (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center font-black text-[var(--color-text-muted)]">محفوظ شدہ رزلٹ لوڈ ہو رہا ہے...</td>
                                            </tr>
                                        ) : rows.map((row) => {
                                            const rowTotal = toNumber(row.totalMarks);
                                            const rowObtained = toNumber(row.obtainedMarks);
                                            const rowPercentage = getPercentage(rowObtained, rowTotal);
                                            return (
                                                <tr key={row.id}>
                                                    <td className="p-3">
                                                        <select value={row.subjectId} onChange={(event) => updateRow(row.id, 'subjectId', event.target.value)} required className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 font-bold outline-none focus:border-[var(--color-primary)]">
                                                            <option value="">مضمون منتخب کریں</option>
                                                            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-3">
                                                        <input type="number" min="1" value={row.totalMarks} onChange={(event) => updateRow(row.id, 'totalMarks', event.target.value)} required className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-center font-bold outline-none focus:border-[var(--color-primary)]" />
                                                    </td>
                                                    <td className="p-3">
                                                        <input type="number" min="0" max={row.totalMarks || undefined} value={row.obtainedMarks} onChange={(event) => updateRow(row.id, 'obtainedMarks', event.target.value)} required className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-center font-bold outline-none focus:border-[var(--color-primary)]" />
                                                    </td>
                                                    <td className="p-3 font-sans font-black">{rowPercentage ? `${rowPercentage.toFixed(2)}%` : '---'}</td>
                                                    <td className="p-3 text-center">
                                                        <button type="button" onClick={() => deleteRow(row.id)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400 transition-all hover:bg-rose-500 hover:text-white" aria-label="حذف کریں">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <SummaryCard icon={<Calculator size={22} />} label="مجموعی فیصد" value={totals.percentage ? `${totals.percentage.toFixed(2)}%` : '---'} />
                            <SummaryCard icon={<Award size={22} />} label="گریڈ" value={totals.grade} />
                            <SummaryCard icon={<BookOpen size={22} />} label="مضامین" value={rows.filter((row) => row.subjectId).length} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoBox = ({ label, value }) => (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <div className="text-[11px] font-black text-[var(--color-text-muted)]">{label}</div>
        <div className="mt-2 min-h-7 text-sm font-black text-[var(--color-text-main)]">{value}</div>
    </div>
);

const SummaryCard = ({ icon, label, value }) => (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-xs font-black text-[var(--color-text-muted)]">{label}</p>
                <p className="mt-2 font-sans text-2xl font-black text-[var(--color-text-main)]">{value}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-[var(--color-primary)]">{icon}</div>
        </div>
    </div>
);
