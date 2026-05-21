import React, { useEffect, useMemo, useState } from 'react';
import { Eye, GraduationCap, Phone, Search, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStudents } from '../../../Constant/StudentsApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

const mapStudentsForList = (items) =>
    items.map((student) => {
        const activeAssignment = student.assignments?.find((assignment) => assignment.status === 'active');
        return {
            id: student.id,
            idNo: student.admissionNumber,
            name: student.fullName,
            fatherName: student.fatherName,
            className: activeAssignment?.class?.name || '---',
            section: activeAssignment?.section?.name || '---',
            familyNo:
                student.parents?.find((parentItem) => parentItem.isPrimary)?.parent?.familyNumber ||
                student.parents?.find((parentItem) => parentItem.isPrimary)?.parent?.phone ||
                student.phone ||
                '---',
        };
    });

export const StudentList = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    useNotificationBridge({ error });

    useEffect(() => {
        window.scrollTo(0, 0);

        const loadStudents = async () => {
            setIsLoading(true);
            setError('');

            try {
                const result = await getStudents('page=1&limit=100');
                setStudents(mapStudentsForList(result.items || []));
            } catch (loadError) {
                setError(loadError.message || 'Students load nahi ho sake.');
            } finally {
                setIsLoading(false);
            }
        };

        loadStudents();
    }, []);

    const filteredStudents = useMemo(
        () =>
            students.filter((student) =>
                [student.name, student.idNo, student.familyNo]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase())),
            ),
        [searchTerm, students],
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-10" dir="rtl">
            <div className="flex flex-col gap-6 rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-10 shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)]">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-3xl font-black text-themeText flex items-center gap-3">
                            <div className="p-3 bg-[var(--color-primary)]/10 rounded-2xl text-[var(--color-primary)]">
                                <GraduationCap size={28} />
                            </div>
                            طلباء کی فہرست
                        </h2>
                        <p className="text-[var(--color-text-muted)] text-xs font-bold mt-2 mr-14">کل رجسٹرڈ طلباء: {filteredStudents.length}</p>
                    </div>
                    <button
                        onClick={() => navigate('/students/admission')}
                        className="bg-[var(--color-primary)] text-white p-4 rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--color-primary)]/20 group"
                    >
                        <UserPlus size={24} className="group-hover:rotate-12 transition-transform" />
                    </button>
                </div>

                <div className="relative group">
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="نام، آئی ڈی یا فون سے تلاش کریں..."
                        className="w-full pr-14 pl-6 py-4 bg-[var(--color-input)] border shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] border-[var(--color-border)] focus:border-[var(--color-primary)]/50 rounded-2xl outline-none font-bold text-sm transition-all text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredStudents.map((student) => (
                    <div
                        key={student.id}
                        onClick={() => navigate(`/students/profile/${student.id}`)}
                        className="bg-[var(--color-surface)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] space-y-5 cursor-pointer hover:border-[var(--color-primary)]/40 transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] font-black text-xs border border-[var(--color-primary)]/20">
                                    {student.idNo}
                                </div>
                                <div>
                                    <h4 className="font-black text-[var(--color-text)] text-lg">{student.name}</h4>
                                    <p className="text-[11px] text-[var(--color-text-muted)] font-bold mt-0.5">ولدیت: {student.fatherName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="py-4 border-y border-[var(--color-border)]">
                            <div className="flex items-center gap-2 justify-end">
                                <Users size={16} className="text-[var(--color-primary)]" />
                                <span className="text-[12px] font-bold text-[var(--color-text)]/80">{student.className} ({student.section})</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Phone size={15} className="text-[var(--color-text-muted)]" />
                                <span className="text-xs font-black text-[var(--color-text-muted)]">{student.familyNo}</span>
                            </div>
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    navigate(`/students/profile/${student.id}`);
                                }}
                                className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all"
                            >
                                <Eye size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="hidden md:block bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border)] shadow-2xl overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-[var(--color-input)]/50 border-b border-white/5">
                        <tr>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest">آئی ڈی</th>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest">طالب علم کی تفصیلات</th>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest">کلاس</th>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest text-center">ایکشن</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredStudents.map((student) => (
                            <tr
                                key={student.id}
                                onClick={() => navigate(`/students/profile/${student.id}`)}
                                className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                            >
                                <td className="p-6">
                                    <span className="bg-[var(--color-input)] text-[var(--color-text)]/70 px-4 py-2 rounded-2xl font-black text-[12px] border border-[var(--color-border)]">
                                        {student.idNo}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="font-black text-[var(--color-text)] text-base">{student.name}</div>
                                    <div className="text-[11px] text-[var(--color-text-muted)] font-bold mt-1">ولدیت: {student.fatherName} | فون: {student.familyNo}</div>
                                </td>
                                <td className="p-6">
                                    <span className="text-[var(--color-primary)] font-bold text-xs bg-[var(--color-primary)]/10 px-4 py-1.5 rounded-full border border-[var(--color-primary)]/20 inline-block">
                                        {student.className} ({student.section})
                                    </span>
                                </td>
                                <td className="p-6 text-center">
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            navigate(`/students/profile/${student.id}`);
                                        }}
                                        className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!isLoading && filteredStudents.length === 0 ? (
                <div className="p-24 text-center bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border)]">
                    <div className="w-24 h-24 bg-[var(--color-input)] rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-[var(--color-text-muted)] opacity-20">
                        <Search size={48} />
                    </div>
                    <h3 className="text-[var(--color-text)] text-xl font-black">کوئی طالب علم نہیں ملا</h3>
                    <p className="text-[var(--color-text-muted)] font-bold mt-2">براہ کرم تلاش کے الفاظ چیک کریں</p>
                </div>
            ) : null}
        </div>
    );
};
