import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit2, PlusCircle, Search, Trash2, UserPlus } from 'lucide-react';
import { SelectField, InputField } from '../../../Components/HR/FormElements';
import { getClasses, getSections, getSessions } from '../../../Constant/AcademicSetupApi';
import { assignStudentClass, getStudents, removeStudentClassAssignment } from '../../../Constant/StudentsApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { ExportExcelButton } from '../../../Components/Export/ExportExcelButton';
import { DeleteConfirmationModal } from '../../../Components/Common/DeleteConfirmationModal';

export const StudentAddToClass = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [filters, setFilters] = useState({ sessionId: '', classId: '', sectionId: '' });
    const [tableFilters, setTableFilters] = useState({ sessionId: '', classId: '', sectionId: '' });
    const [studentsData, setStudentsData] = useState([]);
    const [assignedList, setAssignedList] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [editingAssignmentId, setEditingAssignmentId] = useState(null);
    const [removingAssignmentId, setRemovingAssignmentId] = useState(null);
    const [assignmentToRemove, setAssignmentToRemove] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    useEffect(() => {
        window.scrollTo(0, 0);

        const loadData = async () => {
            try {
                const [studentsResult, classesResult, sectionsResult, sessionsResult] = await Promise.all([
                    getStudents('page=1&limit=100&status=active'),
                    getClasses('page=1&limit=100&status=active'),
                    getSections('page=1&limit=100&status=active'),
                    getSessions('page=1&limit=100&status=active'),
                ]);

                setStudentsData(studentsResult.items || []);
                setClasses(classesResult.items || []);
                setSections(sectionsResult.items || []);
                setSessions(sessionsResult.items || []);

                const mappedAssignments = (studentsResult.items || []).flatMap((student) =>
                    (student.assignments || [])
                        .filter((assignment) => assignment.status === 'active')
                        .map((assignment) => ({
                            id: assignment.id,
                            studentId: student.id,
                            name: student.fullName,
                            rollNo: student.admissionNumber,
                            session: assignment.session?.name || '---',
                            sessionId: assignment.session?.id || assignment.sessionId || '',
                            className: assignment.class?.name || '---',
                            classId: assignment.class?.id || assignment.classId || '',
                            section: assignment.section?.name || '---',
                            sectionId: assignment.section?.id || assignment.sectionId || '',
                        })),
                );

                setAssignedList(mappedAssignments);
            } catch (loadError) {
                setError(loadError.message || 'جماعت اسائنمنٹ کا ڈیٹا لوڈ نہیں ہو سکا۔');
            }
        };

        loadData();
    }, []);

    const filteredSearchStudents = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return [];

        return studentsData
            .filter((student) =>
                [student.fullName, student.fatherName, student.admissionNumber]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(query)),
            )
            .slice(0, 8);
    }, [searchTerm, studentsData]);

    const classOptions = classes.filter((item) => item.status === 'active');
    const sectionOptions = sections.filter((item) => item.status === 'active' && String(item.classId) === String(filters.classId));
    const sessionOptions = sessions.filter((item) => item.status === 'active');
    const selectedClass = classes.find((item) => String(item.id) === String(filters.classId));
    const tableSectionOptions = sections.filter((item) =>
        item.status === 'active' && (!tableFilters.classId || String(item.classId) === String(tableFilters.classId)),
    );

    const filteredAssignedList = useMemo(
        () =>
            assignedList.filter((assignment) =>
                (!tableFilters.sessionId || String(assignment.sessionId) === String(tableFilters.sessionId)) &&
                (!tableFilters.classId || String(assignment.classId) === String(tableFilters.classId)) &&
                (!tableFilters.sectionId || String(assignment.sectionId) === String(tableFilters.sectionId)),
            ),
        [assignedList, tableFilters],
    );

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setEditingAssignmentId(null);
        setSearchTerm('');
        setError('');
        setSuccess('');
    };

    const handleAddToList = async () => {
        if (!selectedStudent || !filters.sessionId || !filters.classId || !filters.sectionId || !selectedClass?.branchId) {
            setError('براہ کرم طالب علم اور تمام فیلڈز منتخب کریں۔');
            return;
        }

        try {
            const assignment = await assignStudentClass(selectedStudent.id, {
                branchId: Number(selectedClass.branchId),
                classId: Number(filters.classId),
                sectionId: Number(filters.sectionId),
                sessionId: Number(filters.sessionId),
            });

            const academicClass = classes.find((item) => String(item.id) === String(filters.classId));
            const section = sections.find((item) => String(item.id) === String(filters.sectionId));
            const session = sessions.find((item) => String(item.id) === String(filters.sessionId));

            const newData = {
                id: assignment?.id || Date.now(),
                studentId: selectedStudent.id,
                name: selectedStudent.fullName,
                rollNo: selectedStudent.admissionNumber,
                session: assignment?.session?.name || session?.name || '---',
                sessionId: assignment?.session?.id || Number(filters.sessionId),
                className: assignment?.class?.name || academicClass?.name || '---',
                classId: assignment?.class?.id || Number(filters.classId),
                section: assignment?.section?.name || section?.name || '---',
                sectionId: assignment?.section?.id || Number(filters.sectionId),
            };

            setAssignedList((current) => [newData, ...current.filter((item) => item.studentId !== selectedStudent.id)]);
            setSelectedStudent(null);
            setEditingAssignmentId(null);
            setFilters({ sessionId: '', classId: '', sectionId: '' });
            setSuccess(editingAssignmentId ? 'طالب علم کی جماعت اسائنمنٹ کامیابی سے اپڈیٹ ہو گئی ہے۔' : 'طالب علم کو کامیابی سے جماعت میں شامل کر دیا گیا ہے۔');
            setError('');
        } catch (assignError) {
            setError(assignError.message || (editingAssignmentId ? 'طالب علم کی جماعت اسائنمنٹ اپڈیٹ نہیں ہو سکی۔' : 'طالب علم کو جماعت میں شامل نہیں کیا جا سکا۔'));
        }
    };

    const handleEditAssignment = (assignment) => {
        const student = studentsData.find((item) => item.id === assignment.studentId);

        setSelectedStudent(student || {
            id: assignment.studentId,
            fullName: assignment.name,
            admissionNumber: assignment.rollNo,
        });
        setFilters({
            sessionId: assignment.sessionId ? String(assignment.sessionId) : '',
            classId: assignment.classId ? String(assignment.classId) : '',
            sectionId: assignment.sectionId ? String(assignment.sectionId) : '',
        });
        setEditingAssignmentId(assignment.id);
        setSearchTerm('');
        setError('');
        setSuccess('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRemoveAssignment = async () => {
        if (!assignmentToRemove) return;

        setRemovingAssignmentId(assignmentToRemove.id);
        setError('');
        setSuccess('');

        try {
            await removeStudentClassAssignment(assignmentToRemove.id);
            setAssignedList((current) => current.filter((assignment) => assignment.id !== assignmentToRemove.id));
            setStudentsData((current) =>
                current.map((student) =>
                    student.id === assignmentToRemove.studentId
                        ? {
                            ...student,
                            assignments: (student.assignments || []).map((assignment) =>
                                assignment.id === assignmentToRemove.id ? { ...assignment, status: 'inactive' } : assignment,
                            ),
                        }
                        : student,
                ),
            );
            setSuccess('طالب علم کی جماعت اسائنمنٹ ختم کر دی گئی ہے۔');
            setAssignmentToRemove(null);
        } catch (removeError) {
            setError(removeError.message || 'جماعت اسائنمنٹ ختم نہیں ہو سکی۔');
        } finally {
            setRemovingAssignmentId(null);
        }
    };

    const exportColumns = useMemo(() => [
        { header: 'Student Name', accessor: 'name' },
        { header: 'Session', accessor: 'session' },
        { header: 'Class', accessor: 'className' },
        { header: 'Section', accessor: 'section' },
    ], []);

    return (
        <div className="p-4 md:p-6 space-y-6 bg-[var(--color-bg)] min-h-screen font-urdu text-right" dir="rtl">
            <div className="bg-[var(--color-surface)] p-6 rounded-[2rem] border border-[var(--color-border)] shadow-sm">
                <h2 className="text-3xl font-black text-[var(--color-text)]">جماعت میں طالب علم کا اندراج</h2>
                <p className="text-sm text-[var(--color-text-muted)] font-bold mt-7">طالب علم کو تلاش کریں اور سیشن/جماعت/جماعت سیکشن مختص کریں</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4 bg-[var(--color-surface)] p-5 rounded-[2rem] border border-[var(--color-border)] h-fit">
                    <h3 className="text-sm font-black text-[var(--color-primary)] mb-4 flex items-center gap-2">
                        <Search size={18} /> مرحلہ 1: طالب علم تلاش کریں<span className="text-red-500"> *</span>
                    </h3>

                    <div className="relative">
                        <InputField
                            placeholder="نام یا رجسٹریشن نمبر لکھیں..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <div className="absolute top-full right-0 left-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl mt-2 shadow-xl z-50 overflow-hidden">
                                {filteredSearchStudents.length ? (
                                    filteredSearchStudents.map((student) => (
                                        <div
                                            key={student.id}
                                            onClick={() => handleSelectStudent(student)}
                                            className="p-3 hover:bg-[var(--color-primary)]/10 cursor-pointer border-b border-[var(--color-border)] last:border-0 transition-colors"
                                        >
                                            <p className="font-black text-sm text-[var(--color-text-main)]">{student.fullName}</p>
                                            <p className="text-[10px] font-bold text-[var(--color-text-muted)]">{student.admissionNumber} - {student.fatherName}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-xs font-bold text-[var(--color-text-muted)]">کوئی طالب علم نہیں ملا</div>
                                )}
                            </div>
                        )}
                    </div>

                    {selectedStudent && (
                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between animate-in zoom-in-95">
                            <div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">منتخب شدہ:</p>
                                <p className="font-black text-sm text-emerald-900">{selectedStudent.fullName}</p>
                            </div>
                            <CheckCircle2 className="text-emerald-500" size={20} />
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-6 bg-[var(--color-surface)] p-5 rounded-[2rem] border border-[var(--color-border)]">
                    <h3 className="text-sm font-black text-[var(--color-primary)] mb-4 flex items-center gap-2">
                        <UserPlus size={18} /> مرحلہ 2: سیشن اور جماعت منتخب کریں
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SelectField required label="سیشن" options={['سیشن منتخب کریں', ...sessionOptions.map((item) => item.name)]} value={sessions.find((item) => String(item.id) === String(filters.sessionId))?.name || 'سیشن منتخب کریں'} onChange={(e) => {
                            const session = sessionOptions.find((item) => item.name === e.target.value);
                            setFilters((current) => ({ ...current, sessionId: session?.id || '' }));
                        }} />
                        <SelectField required label="جماعت" options={['جماعت منتخب کریں', ...classOptions.map((item) => item.name)]} value={classes.find((item) => String(item.id) === String(filters.classId))?.name || 'جماعت منتخب کریں'} onChange={(e) => {
                            const academicClass = classOptions.find((item) => item.name === e.target.value);
                            setFilters((current) => ({ ...current, classId: academicClass?.id || '', sectionId: '' }));
                        }} />
                        <SelectField required label="سیکشن" options={['سیکشن منتخب کریں', ...sectionOptions.map((item) => item.name)]} value={sections.find((item) => String(item.id) === String(filters.sectionId))?.name || 'سیکشن منتخب کریں'} onChange={(e) => {
                            const section = sectionOptions.find((item) => item.name === e.target.value);
                            setFilters((current) => ({ ...current, sectionId: section?.id || '' }));
                        }} />
                    </div>

                    <button
                        onClick={handleAddToList}
                        className="w-full h-[55px] bg-[var(--color-primary)] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/20 active:scale-95"
                    >
                        <PlusCircle size={20} /> {editingAssignmentId ? 'اپڈیٹ کریں' : 'محفوظ کریں'}
                    </button>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] overflow-hidden shadow-sm">
                <div className="flex flex-col gap-3 p-5 border-b border-[var(--color-border)] bg-[var(--color-input)]/30 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-sm font-black text-[var(--color-text)]">حالیہ داخلے</h3>
                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 md:max-w-3xl">
                        <select
                            value={tableFilters.sessionId}
                            onChange={(event) => setTableFilters((current) => ({ ...current, sessionId: event.target.value }))}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-bold text-[var(--color-text)] outline-none transition-all focus:border-[var(--color-primary)]/50"
                        >
                            <option value="">تمام سیشن</option>
                            {sessionOptions.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        <select
                            value={tableFilters.classId}
                            onChange={(event) => setTableFilters((current) => ({ ...current, classId: event.target.value, sectionId: '' }))}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-bold text-[var(--color-text)] outline-none transition-all focus:border-[var(--color-primary)]/50"
                        >
                            <option value="">تمام جماعتیں</option>
                            {classOptions.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        <select
                            value={tableFilters.sectionId}
                            onChange={(event) => setTableFilters((current) => ({ ...current, sectionId: event.target.value }))}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-bold text-[var(--color-text)] outline-none transition-all focus:border-[var(--color-primary)]/50"
                        >
                            <option value="">تمام جماعت سیکشن</option>
                            {tableSectionOptions.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                    <ExportExcelButton rows={filteredAssignedList} columns={exportColumns} fileName="student-class-assignments" className="w-full md:w-auto" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-[var(--color-input)]/50">
                            <tr>
                                <th className="p-4 text-[10px] font-black text-[var(--color-text-muted)]"> طالب علم</th>
                                <th className="p-4 text-[10px] font-black text-[var(--color-text-muted)]">سیشن</th>
                                <th className="p-4 text-[10px] font-black text-[var(--color-text-muted)] text-center">جماعت</th>
                                <th className="p-4 text-[10px] font-black text-[var(--color-text-muted)] text-center">سیکشن</th>
                                <th className="p-4 text-[10px] font-black text-[var(--color-text-muted)] text-center">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredAssignedList.map((item) => (
                                <tr key={item.id} className="hover:bg-[var(--color-primary)]/10 transition-colors">
                                    <td className="p-4">
                                        <div className="font-black text-sm text-[var(--color-text-main)]">{item.name}</div>
                                        <div className="text-[9px] text-[var(--color-text-muted)]">{item.rollNo}</div>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-[var(--color-text-muted)]">{item.session}</td>
                                    <td className="p-4 text-xs font-black text-center"><span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full">{item.className}</span></td>
                                    <td className="p-4 text-xs font-black text-center">{item.section}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                title="تبدیل کریں"
                                                aria-label="تبدیل کریں"
                                                onClick={() => handleEditAssignment(item)}
                                                disabled={removingAssignmentId === item.id}
                                                className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                title="حذف کریں"
                                                aria-label="حذف کریں"
                                                onClick={() => setAssignmentToRemove(item)}
                                                disabled={removingAssignmentId === item.id}
                                                className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!filteredAssignedList.length ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        کوئی طالب علم نہیں ملا
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            {assignmentToRemove ? (
                <DeleteConfirmationModal
                    title="جماعت اسائنمنٹ ختم کریں؟"
                    message={`کیا آپ واقعی ${assignmentToRemove.name} کو ${assignmentToRemove.className} / ${assignmentToRemove.section} سے ہٹانا چاہتے ہیں؟`}
                    isDeleting={removingAssignmentId === assignmentToRemove.id}
                    onClose={() => setAssignmentToRemove(null)}
                    onConfirm={handleRemoveAssignment}
                />
            ) : null}
        </div>
    );
};
