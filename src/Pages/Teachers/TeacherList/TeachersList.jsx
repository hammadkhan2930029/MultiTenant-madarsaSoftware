import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Eye, Search, UserPlus } from 'lucide-react';
import { InputField } from '../../../Components/HR/FormElements';
import { useNavigate } from 'react-router-dom';
import { getTeachers, updateTeacherStatus } from '../../../Constant/TeachersApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

export const TeachersList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [error, setError] = useState('');
    useNotificationBridge({ error });

    const loadTeachers = async () => {
        try {
            const result = await getTeachers('page=1&limit=100');
            setTeachers(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'Teachers load nahi ho sake.');
        }
    };

    useEffect(() => {
        loadTeachers();
    }, []);

    const filteredTeachers = useMemo(
        () =>
            teachers.filter((teacher) =>
                [teacher.fullName, teacher.subject, teacher.phone]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase())),
            ),
        [teachers, searchTerm],
    );

    const handleToggleStatus = async (teacher) => {
        try {
            await updateTeacherStatus(teacher.id, teacher.status === 'active' ? 'inactive' : 'active');
            await loadTeachers();
        } catch (statusError) {
            setError(statusError.message || 'Teacher status update nahi hua.');
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="bg-[var(--color-surface)] rounded-[2.5rem] mt-6 md:mt-0 lg:mt-0 p-6 md:p-8 shadow-xl border border-white/5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black text-[var(--text-color)]">اساتذہ کی فہرست</h2>
                        <div className="flex items-center gap-3 mt-5">
                            <span className="bg-[var(--color-bg)]/20 text-[var(--color-primary)] text-[10px] font-bold px-3 py-1 rounded-full border border-[#00d094]/30 uppercase tracking-wider">
                                کل تعداد: {filteredTeachers.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-64 group">
                            <InputField
                                type="text"
                                placeholder="نام یا مضمون تلاش کریں..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => navigate('/HRManagement')}
                            className="flex items-center justify-center gap-2 bg-[#00d094] text-[#002a33] px-6 py-3 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
                        >
                            <UserPlus size={18} />
                            <span>نیا اندراج</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:hidden">
                {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher) => (
                        <div key={teacher.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-[2rem] shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d094] to-[#008a63] flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        {teacher.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-black text-[var(--color-text-main)]">{teacher.fullName}</h3>
                                        <span className="text-[11px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-md">
                                            ID: {teacher.id}
                                        </span>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${teacher.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                    {teacher.status === 'active' ? 'فعال' : 'غیر فعال'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[13px] border-t border-[var(--color-border)] pt-4">
                                <div>
                                    <p className="text-[var(--color-text-muted)] text-[11px] mb-1">مضمون</p>
                                    <p className="font-medium">{teacher.subject}</p>
                                </div>
                                <div>
                                    <p className="text-[var(--color-text-muted)] text-[11px] mb-1">رابطہ</p>
                                    <p className="font-medium" dir="ltr">{teacher.phone || '---'}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => navigate(`/teachers/details/${teacher.id}`)} className="flex-1 flex justify-center items-center py-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all">
                                    <Eye size={16} className="ml-2" /> دیکھئے
                                </button>
                                <button onClick={() => handleToggleStatus(teacher)} className="flex-1 flex justify-center items-center py-2.5 rounded-xl bg-[#00d094]/10 text-[#00d094] hover:bg-[#00d094] hover:text-white transition-all">
                                    <Edit2 size={16} className="ml-2" /> {teacher.status === 'active' ? 'بند' : 'فعال'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-[var(--color-surface)] p-10 rounded-[2rem] text-center text-[var(--color-text-muted)] col-span-full">
                        کوئی ڈیٹا نہیں ملا...
                    </div>
                )}
            </div>

            <div className="hidden lg:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto vip-scrollbar">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--color-border)] bg-[var(--color-input)]/50">
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)]">آئی ڈی</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)]">استاد کا نام</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)]">مضمون</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)]">رابطہ</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)] text-center">سٹیٹس</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)] text-center">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredTeachers.map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-[var(--color-bg)]/50 transition-colors group">
                                    <td className="p-5"><span className="text-[12px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-lg">{teacher.id}</span></td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d094] to-[#008a63] flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                {teacher.fullName.charAt(0)}
                                            </div>
                                            <span className="text-[14px] font-black text-[var(--color-text-main)]">{teacher.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-[13px] font-medium text-[var(--color-text-main)]">{teacher.subject}</td>
                                    <td className="p-5 text-[13px] font-medium text-[var(--color-text-main)]" dir="ltr">{teacher.phone || '---'}</td>
                                    <td className="p-5 text-center">
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${teacher.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                            {teacher.status === 'active' ? 'فعال' : 'غیر فعال'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => navigate(`/teachers/details/${teacher.id}`)} className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"><Eye size={16} /></button>
                                            <button onClick={() => handleToggleStatus(teacher)} className="p-2.5 rounded-xl bg-[#00d094]/10 text-[#00d094] hover:bg-[#00d094] hover:text-white transition-all shadow-sm"><Edit2 size={16} /></button>
                                        </div>
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
