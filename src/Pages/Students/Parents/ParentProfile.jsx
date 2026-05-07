import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Eye, GraduationCap, MapPin, Phone, Search, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getParentById } from '../../../Constant/StudentsApi';

export const ParentProfile = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [parent, setParent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);

        const loadParent = async () => {
            try {
                const result = await getParentById(id);
                setParent(result);
            } catch (loadError) {
                setError(loadError.message || 'Parent profile load nahi ho saka.');
            }
        };

        loadParent();
    }, [id]);

    const filteredChildren = useMemo(() => {
        const children = parent?.students || [];
        return children.filter((item) =>
            [item.student?.fullName, item.student?.admissionNumber]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(searchTerm.toLowerCase())),
        );
    }, [parent, searchTerm]);

    if (error) {
        return <div className="max-w-5xl mx-auto p-6 text-red-400 font-bold">{error}</div>;
    }

    if (!parent) {
        return <div className="max-w-5xl mx-auto p-6 font-bold text-[var(--color-text-muted)]">Profile load ho raha hai...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6 bg-[var(--color-bg)] min-h-screen" dir="rtl">
            <div className="bg-[var(--color-surface)] rounded-[2rem] md:rounded-[2.8rem] border border-[var(--color-border)] p-5 sm:p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-center md:items-start">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[1.8rem] md:rounded-[2rem] bg-[var(--color-primary)]/10 border-4 border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] shrink-0">
                        <Users size={36} className="sm:w-[42px] sm:h-[42px]" />
                    </div>

                    <div className="flex-1 w-full min-w-0 text-center md:text-right space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.25em]">Parent Profile</p>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--color-text-main)] mt-2 break-words">{parent.fullName}</h1>
                            </div>

                            <button onClick={() => navigate(-1)} className="w-full md:w-auto self-stretch md:self-start flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-main)] font-bold transition-colors hover:bg-[var(--color-input)]">
                                <ArrowRight size={18} /> واپس
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                            <InfoCard label="فون نمبر" value={parent.phone || '---'} icon={<Phone size={14} className="text-[var(--color-primary)]" />} />
                            <InfoCard label="ای میل" value={parent.email || '---'} />
                            <InfoCard label="پیشہ" value={parent.occupation || '---'} />
                            <InfoCard label="کل بچے" value={String(parent.students?.length || 0)} icon={<Users size={14} className="text-[var(--color-primary)]" />} />
                            <InfoCard label="CNIC" value={parent.cnic || '---'} />
                            <InfoCard label="پتہ" value={parent.address || 'پتہ درج نہیں ہے'} icon={<MapPin size={14} className="text-[var(--color-primary)]" />} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg md:text-xl font-black text-[var(--color-text-main)] flex items-center gap-3">
                    <GraduationCap className="text-[var(--color-primary)]" />
                    منسلک طلباء
                </h3>
                <div className="relative group hidden sm:block">
                    <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)]" />
                    <input
                        type="text"
                        placeholder="طالب علم تلاش کریں..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-2 pr-10 pl-4 text-xs font-bold outline-none focus:border-[var(--color-primary)]/50"
                    />
                </div>
            </div>

            <div className="hidden md:block bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border)] shadow-sm overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-[var(--color-input)]/50 border-b border-white/5">
                        <tr>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest">آئی ڈی</th>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest">طالب علم</th>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest">رشتہ</th>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest text-center">ایکشن</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredChildren.map((item) => (
                            <tr key={item.student.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                <td className="p-6"><span className="bg-[var(--color-input)] text-[var(--color-text)]/70 px-4 py-2 rounded-2xl font-black text-[12px] border border-[var(--color-border)]">{item.student.admissionNumber}</span></td>
                                <td className="p-6">
                                    <div className="font-black text-[var(--color-text)] text-base">{item.student.fullName}</div>
                                    <div className="text-[11px] text-[var(--color-text-muted)] font-bold mt-1">{item.isPrimary ? 'Primary Parent' : 'Linked Parent'}</div>
                                </td>
                                <td className="p-6 text-sm font-bold text-[var(--color-text-muted)]">{item.relationship}</td>
                                <td className="p-6 text-center">
                                    <button onClick={() => navigate(`/students/profile/${item.student.id}`)} className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5">
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const InfoCard = ({ label, value, icon = null }) => (
    <div className="bg-[var(--color-bg)] rounded-[1.6rem] md:rounded-[1.8rem] p-4 border border-[var(--color-border)]">
        <div className="flex items-center gap-2 mb-2">
            {icon}
            <p className="text-[10px] text-[var(--color-text-muted)] font-black uppercase">{label}</p>
        </div>
        <p className="text-base md:text-lg font-black text-[var(--color-text-main)] break-words">{value}</p>
    </div>
);
