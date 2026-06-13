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
                setError(loadError.message || 'والدین کی پروفائل لوڈ نہیں ہو سکی۔');
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
        return <div className="max-w-5xl mx-auto p-6 font-bold text-red-400">{error}</div>;
    }

    if (!parent) {
        return <div className="max-w-5xl mx-auto p-6 font-bold text-[var(--color-text-muted)]">Profile load ho raha hai...</div>;
    }

    return (
        <div className="min-h-screen max-w-7xl mx-auto space-y-5 bg-[var(--color-bg)] p-3 sm:p-4 md:space-y-6 md:p-6" dir="rtl">
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm md:rounded-[2.8rem] md:p-8">
                <div className="flex flex-col items-center gap-5 md:flex-row md:items-start md:gap-6">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.8rem] border-4 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)] sm:h-28 sm:w-28 md:rounded-[2rem]">
                        <Users size={36} className="sm:h-[42px] sm:w-[42px]" />
                    </div>

                    <div className="w-full min-w-0 flex-1 space-y-4 text-center md:text-right">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Parent Profile</p>
                                <h1 className="mt-2 break-words py-2 text-2xl font-black leading-[1.8] text-[var(--color-text-main)] sm:text-3xl md:text-4xl">
                                    {parent.fullName}
                                </h1>
                            </div>

                            <button onClick={() => navigate(-1)} className="flex w-full items-center justify-center gap-2 self-stretch rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 font-bold text-[var(--color-text-main)] transition-colors hover:bg-[var(--color-input)] md:w-auto md:self-start">
                                <ArrowRight size={18} /> واپس
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-4">
                            <InfoCard label="فون نمبر" value={parent.phone || '---'} icon={<Phone size={14} className="text-[var(--color-primary)]" />} />
                            <InfoCard label="فیملی نمبر" value={parent.familyNumber || '---'} />
                            <InfoCard label="ای میل" value={parent.email || '---'} />
                            <InfoCard label="پیشہ" value={parent.occupation || '---'} />
                            <InfoCard label="کل بچے" value={String(parent.students?.length || 0)} icon={<Users size={14} className="text-[var(--color-primary)]" />} />
                            <InfoCard label="ID" value={parent.cnic || '---'} />
                            <InfoCard label="پتہ" value={parent.address || 'پتہ درج نہیں ہے'} icon={<MapPin size={14} className="text-[var(--color-primary)]" />} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-2">
                <h3 className="flex items-center gap-3 text-lg font-black text-[var(--color-text-main)] md:text-xl">
                    <GraduationCap className="text-[var(--color-primary)]" />
                    منسلک طلباء
                </h3>
                <div className="group relative hidden sm:block">
                    <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)]" />
                    <input
                        type="text"
                        placeholder="طالب علم تلاش کریں..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-10 pl-4 text-xs font-bold outline-none focus:border-[var(--color-primary)]/50"
                    />
                </div>
            </div>

            <div className="hidden overflow-hidden rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm md:block">
                <table className="w-full text-right">
                    <thead className="border-b border-white/5 bg-[var(--color-input)]/50">
                        <tr>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">آئی ڈی</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">طالب علم</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">رشتہ</th>
                            <th className="p-6 text-center text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">ایکشن</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredChildren.map((item) => (
                            <tr key={item.student.id} className="group cursor-pointer transition-colors hover:bg-white/[0.02]">
                                <td className="p-6">
                                    <span className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 py-2 text-[12px] font-black text-[var(--color-text)]/70">
                                        {item.student.admissionNumber}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="text-base font-black text-[var(--color-text)]">{item.student.fullName}</div>
                                    <div className="mt-1 text-[11px] font-bold text-[var(--color-text-muted)]">{item.isPrimary ? 'Primary Parent' : 'Linked Parent'}</div>
                                </td>
                                <td className="p-6 text-sm font-bold text-[var(--color-text-muted)]">{item.relationship}</td>
                                <td className="p-6 text-center">
                                    <button onClick={() => navigate(`/students/profile/${item.student.id}`)} className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 shadow-lg shadow-emerald-500/5 transition-all hover:bg-emerald-500 hover:text-white">
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
    <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 md:rounded-[1.8rem]">
        <div className="mb-2 flex items-center gap-2">
            {icon}
            <p className="text-[10px] font-black uppercase text-[var(--color-text-muted)]">{label}</p>
        </div>
        <p className="break-words text-base font-black text-[var(--color-text-main)] md:text-lg">{value}</p>
    </div>
);
