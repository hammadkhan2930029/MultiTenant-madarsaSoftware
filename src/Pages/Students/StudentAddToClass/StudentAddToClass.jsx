import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, PlusCircle, Search, Trash2, UserPlus } from 'lucide-react';
import { SelectField, InputField } from '../../../Components/HR/FormElements';
import { getBranches, getClasses, getSections, getSessions } from '../../../Constant/AcademicSetupApi';
import { assignStudentClass, getStudents } from '../../../Constant/StudentsApi';

export const StudentAddToClass = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [filters, setFilters] = useState({ sessionId: '', branchId: '', classId: '', sectionId: '' });
    const [studentsData, setStudentsData] = useState([]);
    const [assignedList, setAssignedList] = useState([]);
    const [branches, setBranches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);

        const loadData = async () => {
            try {
                const [studentsResult, branchesResult, classesResult, sectionsResult, sessionsResult] = await Promise.all([
                    getStudents('page=1&limit=100'),
                    getBranches('page=1&limit=100'),
                    getClasses('page=1&limit=100'),
                    getSections('page=1&limit=100'),
                    getSessions('page=1&limit=100'),
                ]);

                setStudentsData(studentsResult.items || []);
                setBranches(branchesResult.items || []);
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
                            className: assignment.class?.name || '---',
                            section: assignment.section?.name || '---',
                        })),
                );

                setAssignedList(mappedAssignments);
            } catch (loadError) {
                setError(loadError.message || 'Assignment data load nahi ho saki.');
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

    const branchOptions = branches.filter((item) => item.status === 'active');
    const classOptions = classes.filter((item) => item.status === 'active' && String(item.branchId) === String(filters.branchId));
    const sectionOptions = sections.filter((item) => item.status === 'active' && String(item.classId) === String(filters.classId));
    const sessionOptions = sessions.filter((item) => item.status === 'active');

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setSearchTerm('');
        setError('');
        setSuccess('');
    };

    const handleAddToList = async () => {
        if (!selectedStudent || !filters.sessionId || !filters.branchId || !filters.classId || !filters.sectionId) {
            setError('براہ کرم طالب علم اور تمام فیلڈز منتخب کریں۔');
            return;
        }

        try {
            await assignStudentClass(selectedStudent.id, {
                branchId: Number(filters.branchId),
                classId: Number(filters.classId),
                sectionId: Number(filters.sectionId),
                sessionId: Number(filters.sessionId),
            });

            const branch = branches.find((item) => String(item.id) === String(filters.branchId));
            const academicClass = classes.find((item) => String(item.id) === String(filters.classId));
            const section = sections.find((item) => String(item.id) === String(filters.sectionId));
            const session = sessions.find((item) => String(item.id) === String(filters.sessionId));

            const newData = {
                id: Date.now(),
                studentId: selectedStudent.id,
                name: selectedStudent.fullName,
                rollNo: selectedStudent.admissionNumber,
                session: session?.name || '---',
                className: academicClass?.name || '---',
                section: section?.name || '---',
                branch: branch?.name || '---',
            };

            setAssignedList((current) => [newData, ...current.filter((item) => item.studentId !== selectedStudent.id)]);
            setSelectedStudent(null);
            setFilters({ sessionId: '', branchId: '', classId: '', sectionId: '' });
            setSuccess('طالب علم کو کامیابی سے کلاس میں شامل کر دیا گیا ہے۔');
            setError('');
        } catch (assignError) {
            setError(assignError.message || 'Class assign nahi ho saki.');
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-[var(--color-bg)] min-h-screen font-urdu text-right" dir="rtl">
            <div className="bg-[var(--color-surface)] p-6 rounded-[2rem] border border-[var(--color-border)] shadow-sm">
                <h2 className="text-3xl font-black text-[var(--color-text)]">کلاس میں طالب علم کا اندراج</h2>
                <p className="text-xs text-[var(--color-text-muted)] font-bold mt-7">طالب علم کو تلاش کریں اور سیشن/کلاس الاٹ کریں</p>
            </div>

            {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">{success}</div> : null}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4 bg-[var(--color-surface)] p-5 rounded-[2rem] border border-[var(--color-border)] h-fit">
                    <h3 className="text-sm font-black text-[var(--color-primary)] mb-4 flex items-center gap-2">
                        <Search size={18} /> مرحلہ 1: طالب علم تلاش کریں
                    </h3>

                    <div className="relative">
                        <InputField
                            placeholder="نام یا رجسٹریشن نمبر لکھیں..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <div className="absolute top-full right-0 left-0 bg-white border border-[var(--color-border)] rounded-2xl mt-2 shadow-xl z-50 overflow-hidden">
                                {filteredSearchStudents.length ? (
                                    filteredSearchStudents.map((student) => (
                                        <div
                                            key={student.id}
                                            onClick={() => handleSelectStudent(student)}
                                            className="p-3 hover:bg-[var(--color-primary)]/10 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                        >
                                            <p className="font-black text-sm text-[var(--color-text)]">{student.fullName}</p>
                                            <p className="text-[10px] text-[var(--color-text-muted)]">{student.admissionNumber} - {student.fatherName}</p>
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
                        <UserPlus size={18} /> مرحلہ 2: سیشن اور کلاس منتخب کریں
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <SelectField label="سیشن" options={['سیشن منتخب کریں', ...sessionOptions.map((item) => item.name)]} value={sessions.find((item) => String(item.id) === String(filters.sessionId))?.name || 'سیشن منتخب کریں'} onChange={(e) => {
                            const session = sessionOptions.find((item) => item.name === e.target.value);
                            setFilters((current) => ({ ...current, sessionId: session?.id || '' }));
                        }} />
                        <SelectField label="برانچ" options={['برانچ منتخب کریں', ...branchOptions.map((item) => item.name)]} value={branches.find((item) => String(item.id) === String(filters.branchId))?.name || 'برانچ منتخب کریں'} onChange={(e) => {
                            const branch = branchOptions.find((item) => item.name === e.target.value);
                            setFilters({ sessionId: filters.sessionId, branchId: branch?.id || '', classId: '', sectionId: '' });
                        }} />
                        <SelectField label="کلاس" options={['کلاس منتخب کریں', ...classOptions.map((item) => item.name)]} value={classes.find((item) => String(item.id) === String(filters.classId))?.name || 'کلاس منتخب کریں'} onChange={(e) => {
                            const academicClass = classOptions.find((item) => item.name === e.target.value);
                            setFilters((current) => ({ ...current, classId: academicClass?.id || '', sectionId: '' }));
                        }} />
                        <SelectField label="سیکشن" options={['سیکشن منتخب کریں', ...sectionOptions.map((item) => item.name)]} value={sections.find((item) => String(item.id) === String(filters.sectionId))?.name || 'سیکشن منتخب کریں'} onChange={(e) => {
                            const section = sectionOptions.find((item) => item.name === e.target.value);
                            setFilters((current) => ({ ...current, sectionId: section?.id || '' }));
                        }} />
                    </div>

                    <button
                        onClick={handleAddToList}
                        className="w-full h-[55px] bg-[var(--color-primary)] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/20 active:scale-95"
                    >
                        <PlusCircle size={20} /> کلاس میں شامل کریں
                    </button>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[var(--color-border)] bg-[var(--color-input)]/30">
                    <h3 className="text-sm font-black text-[var(--color-text)]">حالیہ داخلے</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-[var(--color-input)]/50">
                            <tr>
                                <th className="p-4 text-[10px] font-black text-[var(--color-text-muted)]">نام طالب علم</th>
                                <th className="p-4 text-[10px] font-black text-[var(--color-text-muted)]">سیشن</th>
                                <th className="p-4 text-[10px] font-black text-[var(--color-text-muted)] text-center">کلاس</th>
                                <th className="p-4 text-[10px] font-black text-[var(--color-text-muted)] text-center">سیکشن</th>
                                <th className="p-4 text-[10px] font-black text-[var(--color-text-muted)] text-center">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {assignedList.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-black text-sm">{item.name}</div>
                                        <div className="text-[9px] text-[var(--color-text-muted)]">{item.rollNo}</div>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-slate-600">{item.session}</td>
                                    <td className="p-4 text-xs font-black text-center"><span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full">{item.className}</span></td>
                                    <td className="p-4 text-xs font-black text-center">{item.section}</td>
                                    <td className="p-4 text-center">
                                        <button className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
