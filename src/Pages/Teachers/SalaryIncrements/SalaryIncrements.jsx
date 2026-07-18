import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Eye, Plus, Search, Trash2, TrendingUp, UserCheck, Wallet, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createTeacherIncrement, deleteTeacherIncrement, getAllTeacherIncrements, getTeachers, updateTeacherIncrement } from '../../../Constant/TeachersApi';
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

export const SalaryIncrements = ({ staffType: fixedStaffType = '' }) => {
    const navigate = useNavigate();
    const notify = useNotifier();
    const [teachers, setTeachers] = useState([]);
    const [increments, setIncrements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [staffType, setStaffType] = useState('');
    const [formData, setFormData] = useState(initialForm);
    const [editingIncrement, setEditingIncrement] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const activeStaffType = fixedStaffType || staffType;
            const params = new URLSearchParams({ page: '1', limit: '100' });
            if (activeStaffType) params.set('staffType', activeStaffType);
            if (searchTerm.trim()) params.set('search', searchTerm.trim());
            const teacherParams = new URLSearchParams({ page: '1', limit: '100', status: 'active' });
            if (activeStaffType) teacherParams.set('staffType', activeStaffType);

            const [teacherResult, incrementResult] = await Promise.all([
                getTeachers(teacherParams.toString()),
                getAllTeacherIncrements(params.toString()),
            ]);

            setTeachers(teacherResult.items || []);
            setIncrements(incrementResult.items || []);
        } catch (error) {
            notify.error(error?.message || 'انکریمنٹ ریکارڈ لوڈ نہیں ہو سکے۔', 'لوڈنگ میں مسئلہ');
        } finally {
            setIsLoading(false);
        }
    }, [fixedStaffType, notify, searchTerm, staffType]);

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
            const payload = {
                incrementAmount: Number(formData.incrementAmount),
                effectiveDate: formData.effectiveDate,
                reason: formData.reason,
            };
            if (editingIncrement) {
                await updateTeacherIncrement(editingIncrement.id, payload);
            } else {
                await createTeacherIncrement(formData.teacherId, payload);
            }
            notify.success(editingIncrement ? 'تنخواہ انکریمنٹ تبدیل ہو گیا۔' : 'تنخواہ انکریمنٹ محفوظ ہو گیا۔', editingIncrement ? 'انکریمنٹ تبدیل' : 'انکریمنٹ محفوظ');
            setFormData(initialForm);
            setEditingIncrement(null);
            await loadData();
        } catch (error) {
            notify.error(error?.message || (editingIncrement ? 'انکریمنٹ تبدیل نہیں ہو سکا۔' : 'انکریمنٹ محفوظ نہیں ہو سکا۔'), 'محفوظ کرنے میں مسئلہ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditIncrement = (item) => {
        setEditingIncrement(item);
        setFormData({
            teacherId: String(item.teacherId || ''),
            incrementAmount: String(item.incrementAmount || ''),
            effectiveDate: item.effectiveDate || todayInputValue(),
            reason: item.reason || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingIncrement(null);
        setFormData(initialForm);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await deleteTeacherIncrement(deleteTarget.id);
            notify.success('تنخواہ انکریمنٹ حذف ہو گیا۔', 'انکریمنٹ حذف');
            setDeleteTarget(null);
            if (editingIncrement?.id === deleteTarget.id) cancelEdit();
            await loadData();
        } catch (error) {
            notify.error(error?.message || 'انکریمنٹ حذف نہیں ہو سکا۔', 'حذف کرنے میں مسئلہ');
        } finally {
            setIsDeleting(false);
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
                        <h1 className="text-3xl font-black text-[var(--color-text-main)]">{fixedStaffType === 'staff' ? 'عملہ انکریمنٹ' : fixedStaffType === 'teacher' ? 'اساتذہ انکریمنٹ' : 'اساتذہ / عملہ انکریمنٹ'}</h1>
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
                                    {teacher.fullName} - {staffTypeLabel(teacher.staffType)}
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
                            {isSaving ? 'محفوظ...' : editingIncrement ? 'تبدیل کریں' : 'شامل کریں'}
                        </button>
                    </div>
                </div>

                {editingIncrement ? (
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 text-sm font-black text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                        >
                            <X size={16} />
                            منسوخ کریں
                        </button>
                    </div>
                ) : null}

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
                    {fixedStaffType ? (
                        <div className="flex h-14 w-full items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)]">
                            {staffTypeLabel(fixedStaffType)}
                        </div>
                    ) : (
                        <select
                            value={staffType}
                            onChange={(event) => setStaffType(event.target.value)}
                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                        >
                            <option value="">تمام</option>
                            <option value="teacher">اساتذہ</option>
                            <option value="staff">دیگر عملہ</option>
                        </select>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="hidden grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_0.9fr_1.2fr_150px] gap-4 border-b border-[var(--color-border)] bg-[var(--color-input)]/40 px-5 py-4 text-sm font-black text-[var(--color-text-muted)] lg:grid">
                    <span>نام</span>
                    <span>قسم</span>
                    <span>تاریخ</span>
                    <span>پرانی تنخواہ</span>
                    <span>اضافہ</span>
                    <span>نئی تنخواہ</span>
                    <span>ایکشن</span>
                </div>

                {isLoading ? (
                    <div className="px-5 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">ریکارڈز لوڈ ہو رہے ہیں...</div>
                ) : increments.length ? (
                    increments.map((item) => (
                        <div key={item.id} className="grid grid-cols-1 gap-3 border-b border-[var(--color-border)] px-5 py-4 text-sm font-bold text-[var(--color-text-main)] last:border-b-0 lg:grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_0.9fr_1.2fr_150px] lg:items-center">
                            <div>
                                <p className="text-base font-black">{item.teacherName || '---'}</p>
                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.department || item.jobTitle || item.reason || '---'}</p>
                            </div>
                            <span>{staffTypeLabel(item.staffType)}</span>
                            <span>{item.effectiveDate || '---'}</span>
                            <span>{formatCurrency(item.previousSalary)}</span>
                            <span className="text-[var(--color-primary)]">{formatCurrency(item.incrementAmount)}</span>
                            <span>{formatCurrency(item.newSalary)}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/teachers/details/${item.teacherId}`)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-all hover:bg-blue-500 hover:text-white"
                                    title="دیکھیں"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleEditIncrement(item)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)] hover:text-white"
                                    title="تبدیل کریں"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(item)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                                    title="حذف کریں"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-5 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی انکریمنٹ ریکارڈ موجود نہیں۔</div>
                )}
            </div>

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text-main)]">انکریمنٹ حذف کریں؟</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                    کیا آپ واقعی <span className="text-rose-500">{deleteTarget.teacherName || 'یہ ریکارڈ'}</span> کا انکریمنٹ حذف کرنا چاہتے ہیں؟
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !isDeleting && setDeleteTarget(null)}
                                className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                                aria-label="بند کریں"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                منسوخ کریں
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isDeleting ? 'حذف ہو رہا ہے...' : 'حذف کریں'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
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
