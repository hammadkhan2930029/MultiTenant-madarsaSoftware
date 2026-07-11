import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Plus, Search, TrendingUp, UserCheck, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createTeacherIncrement, getAllTeacherIncrements, getTeachers } from '../../../Constant/TeachersApi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';

const todayInputValue = () => new Date().toISOString().slice(0, 10);
const formatCurrency = (value) => `روپے ${Number(value || 0).toLocaleString('en-PK')}`;
const staffTypeLabel = (value) => (value === 'staff' ? 'دیگر عملہ' : 'استاد');

const initialForm = {
    teacherId: '',
    incrementAmount: '',
    effectiveDate: todayInputValue(),
    reason: '',
};

export const SalaryIncrements = () => {
    const navigate = useNavigate();
    const notify = useNotifier();
    const [teachers, setTeachers] = useState([]);
    const [increments, setIncrements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [staffType, setStaffType] = useState('');
    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page: '1', limit: '100' });
            if (staffType) params.set('staffType', staffType);
            if (searchTerm.trim()) params.set('search', searchTerm.trim());

            const [teacherResult, incrementResult] = await Promise.all([
                getTeachers('page=1&limit=100&status=active'),
                getAllTeacherIncrements(params.toString()),
            ]);

            setTeachers(teacherResult.items || []);
            setIncrements(incrementResult.items || []);
        } catch (error) {
            notify.error(error?.message || 'انکریمنٹ ریکارڈ لوڈ نہیں ہو سکے۔', 'لوڈنگ میں مسئلہ');
        } finally {
            setIsLoading(false);
        }
    }, [notify, searchTerm, staffType]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const selectedTeacher = useMemo(
        () => teachers.find((teacher) => String(teacher.id) === String(formData.teacherId)),
        [formData.teacherId, teachers],
    );

    const stats = useMemo(() => {
        const totalIncrement = increments.reduce((sum, item) => sum + Number(item.incrementAmount || 0), 0);
        const latest = increments[0];

        return {
            totalRecords: increments.length,
            totalIncrement,
            latestAmount: latest?.incrementAmount || 0,
        };
    }, [increments]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.teacherId || !Number(formData.incrementAmount) || !formData.effectiveDate) {
            notify.error('براہ کرم ملازم، اضافہ رقم اور مؤثر تاریخ درج کریں۔', 'نامکمل معلومات');
            return;
        }

        setIsSaving(true);
        try {
            await createTeacherIncrement(formData.teacherId, {
                incrementAmount: Number(formData.incrementAmount),
                effectiveDate: formData.effectiveDate,
                reason: formData.reason,
            });
            notify.success('تنخواہ انکریمنٹ محفوظ ہو گیا۔', 'انکریمنٹ محفوظ');
            setFormData(initialForm);
            await loadData();
        } catch (error) {
            notify.error(error?.message || 'انکریمنٹ محفوظ نہیں ہو سکا۔', 'محفوظ کرنے میں مسئلہ');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl md:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-black text-[var(--color-primary)]">
                            <TrendingUp size={18} />
                            تنخواہ انکریمنٹ
                        </div>
                        <h1 className="text-3xl font-black text-[var(--color-text-main)]">اساتذہ / عملہ انکریمنٹ</h1>
                        <p className="mt-3 text-base font-bold leading-8 text-[var(--color-text-muted)]">
                            تمام اساتذہ اور عملہ کی تنخواہ میں اضافہ یہاں سے درج اور ٹریک کریں۔
                        </p>
                    </div>
                    <div className="grid h-20 w-20 place-items-center rounded-[2rem] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        <Wallet size={34} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SummaryCard icon={UserCheck} label="کل ریکارڈز" value={stats.totalRecords} />
                <SummaryCard icon={TrendingUp} label="کل اضافہ" value={formatCurrency(stats.totalIncrement)} />
                <SummaryCard icon={Wallet} label="آخری اضافہ" value={formatCurrency(stats.latestAmount)} />
            </div>

            <form onSubmit={handleSubmit} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
                <div className="mb-5 flex items-center gap-2 text-[var(--color-primary)]">
                    <Plus size={20} />
                    <h2 className="text-2xl font-black">نیا انکریمنٹ شامل کریں</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr_1fr_2fr_auto]">
                    <Field label="استاد / عملہ">
                        <select
                            value={formData.teacherId}
                            onChange={(event) => setFormData((prev) => ({ ...prev, teacherId: event.target.value }))}
                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                        >
                            <option value="">منتخب کریں</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.fullName} - {staffTypeLabel(teacher.staffType)} - {formatCurrency(teacher.basicSalary)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="موجودہ تنخواہ">
                        <div className="flex h-14 items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-black text-[var(--color-primary)]">
                            {selectedTeacher ? formatCurrency(selectedTeacher.basicSalary) : '---'}
                        </div>
                    </Field>

                    <Field label="اضافہ رقم">
                        <input
                            type="number"
                            min="1"
                            value={formData.incrementAmount}
                            onChange={(event) => setFormData((prev) => ({ ...prev, incrementAmount: event.target.value }))}
                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                            placeholder="5000"
                        />
                    </Field>

                    <Field label="مؤثر تاریخ">
                        <input
                            type="date"
                            value={formData.effectiveDate}
                            onChange={(event) => setFormData((prev) => ({ ...prev, effectiveDate: event.target.value }))}
                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                        />
                    </Field>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-6 text-sm font-black text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus size={18} />
                            {isSaving ? 'محفوظ...' : 'شامل کریں'}
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <Field label="وجہ / نوٹ">
                        <input
                            value={formData.reason}
                            onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                            placeholder="مثلاً سالانہ اضافہ"
                        />
                    </Field>
                </div>
            </form>

            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm md:p-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
                    <div className="relative">
                        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="نام، شعبہ، عہدہ یا وجہ تلاش کریں"
                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 pl-12 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>
                    <select
                        value={staffType}
                        onChange={(event) => setStaffType(event.target.value)}
                        className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                    >
                        <option value="">تمام</option>
                        <option value="teacher">اساتذہ</option>
                        <option value="staff">دیگر عملہ</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="hidden grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_0.9fr_1.2fr_90px] gap-4 border-b border-[var(--color-border)] bg-[var(--color-input)]/40 px-5 py-4 text-sm font-black text-[var(--color-text-muted)] lg:grid">
                    <span>نام</span>
                    <span>قسم</span>
                    <span>تاریخ</span>
                    <span>پرانی تنخواہ</span>
                    <span>اضافہ</span>
                    <span>نئی تنخواہ</span>
                    <span>عمل</span>
                </div>

                {isLoading ? (
                    <div className="px-5 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">ریکارڈز لوڈ ہو رہے ہیں...</div>
                ) : increments.length ? (
                    increments.map((item) => (
                        <div key={item.id} className="grid grid-cols-1 gap-3 border-b border-[var(--color-border)] px-5 py-4 text-sm font-bold text-[var(--color-text-main)] last:border-b-0 lg:grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_0.9fr_1.2fr_90px] lg:items-center">
                            <div>
                                <p className="text-base font-black">{item.teacherName || '---'}</p>
                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.department || item.jobTitle || item.reason || '---'}</p>
                            </div>
                            <span>{staffTypeLabel(item.staffType)}</span>
                            <span>{item.effectiveDate || '---'}</span>
                            <span>{formatCurrency(item.previousSalary)}</span>
                            <span className="text-[var(--color-primary)]">{formatCurrency(item.incrementAmount)}</span>
                            <span>{formatCurrency(item.newSalary)}</span>
                            <button
                                type="button"
                                onClick={() => navigate(`/teachers/details/${item.teacherId}`)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-500/10 px-4 text-blue-500 transition-all hover:bg-blue-500 hover:text-white"
                            >
                                <Eye size={16} />
                                دیکھیں
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="px-5 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی انکریمنٹ ریکارڈ موجود نہیں۔</div>
                )}
            </div>
        </div>
    );
};

const SummaryCard = ({ icon, label, value }) => (
    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-bold text-[var(--color-text-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-black text-[var(--color-text-main)]">{value}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                {React.createElement(icon, { size: 22 })}
            </div>
        </div>
    </div>
);

const Field = ({ label, children }) => (
    <div className="space-y-2">
        <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{label}</label>
        {children}
    </div>
);
