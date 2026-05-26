import React, { useEffect, useMemo, useState } from 'react';
import { User, Calendar, Plus, Save, Search, Wallet, FileText, RefreshCw, Edit2, Trash2, X } from 'lucide-react';
import { DateField } from '../../../../Components/HR/FormElements';
import { useNotificationBridge } from '../../../../Components/Notifications/useNotificationBridge';
import { getTeachers } from '../../../../Constant/TeachersApi';
import { getFinanceHeads } from '../../../../Constant/FinanceHeadsApi';
import { createSalaryEntry, deactivateSalaryEntry, getSalaryEntries, updateSalaryEntry } from '../../../../Constant/SalariesApi';

const today = () => new Date().toISOString().split('T')[0];
const currentMonth = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const createEmptyForm = (financeHeadId = '') => ({
    teacherId: '',
    financeHeadId,
    amount: '',
    salaryMonth: currentMonth(),
    paymentDate: today(),
    remarks: '',
});

const formatAmount = (value) => Number(value || 0).toLocaleString('en-US');
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('ur-PK') : '---');
const formatMonth = (month, year) => (month && year ? `${String(month).padStart(2, '0')}/${year}` : '---');
const toDateInputValue = (value) => (value ? new Date(value).toISOString().split('T')[0] : today());
const toMonthInputValue = (month, year) => (month && year ? `${year}-${String(month).padStart(2, '0')}` : currentMonth());
const readMonthParts = (value) => {
    const [year, month] = value.split('-').map(Number);
    return { salaryYear: year, salaryMonth: month };
};

const toUrduSalaryError = (message, fallback) => {
    if (!message) return fallback;
    if (/already exists|duplicate|another salary/i.test(message)) {
        return 'اس استاد کی اس مہینے کی تنخواہ پہلے سے محفوظ ہے۔';
    }
    if (/teacher not found/i.test(message)) return 'منتخب استاد نہیں ملا۔';
    if (/finance head not found/i.test(message)) return 'منتخب خرچ کی مد نہیں ملی۔';
    if (/expense head/i.test(message)) return 'منتخب مد خرچ کی مد ہونی چاہیے۔';
    if (/payment date/i.test(message)) return 'ادائیگی کی تاریخ ضروری ہے۔';
    if (/amount/i.test(message)) return 'رقم درست درج کریں۔';
    return message;
};

export const SalaryEntry = () => {
    const [teachers, setTeachers] = useState([]);
    const [expenseHeads, setExpenseHeads] = useState([]);
    const [entries, setEntries] = useState([]);
    const [formData, setFormData] = useState(createEmptyForm());
    const [editingEntry, setEditingEntry] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const selectedTeacher = useMemo(
        () => teachers.find((teacher) => String(teacher.id) === String(formData.teacherId)),
        [teachers, formData.teacherId]
    );

    const totalPaid = useMemo(
        () => entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        [entries]
    );

    const filteredTeachers = useMemo(
        () => teachers.filter((teacher) =>
            [teacher.fullName, teacher.subject, teacher.phone]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
        [teachers, searchQuery]
    );

    const refreshEntries = async () => {
        const salaryResult = await getSalaryEntries('page=1&limit=100&status=active');
        setEntries(salaryResult.items || []);
    };

    const loadData = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [teacherResult, headsResult, salaryResult] = await Promise.all([
                getTeachers('page=1&limit=100&status=active'),
                getFinanceHeads('page=1&limit=100&type=expense&status=active'),
                getSalaryEntries('page=1&limit=100&status=active'),
            ]);

            const heads = headsResult.items || [];
            const salaryHead = heads.find((head) => /salary|تنخواہ|payroll/i.test(head.name || '')) || heads[0];

            setTeachers(teacherResult.items || []);
            setExpenseHeads(heads);
            setEntries(salaryResult.items || []);
            setFormData((prev) => ({
                ...prev,
                financeHeadId: prev.financeHeadId || String(salaryHead?.id || ''),
            }));
        } catch (loadError) {
            setError(toUrduSalaryError(loadError.message, 'تنخواہ کا ڈیٹا لوڈ نہیں ہو سکا۔'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSelectTeacher = (teacher) => {
        setFormData((prev) => ({
            ...prev,
            teacherId: String(teacher.id),
            amount: teacher.basicSalary ? String(teacher.basicSalary) : prev.amount,
        }));
        setSearchQuery(teacher.fullName || '');
        setShowSuggestions(false);
    };

    const resetForm = () => {
        setFormData((prev) => createEmptyForm(prev.financeHeadId));
        setSearchQuery('');
        setEditingEntry(null);
    };

    const buildPayload = () => {
        const monthParts = readMonthParts(formData.salaryMonth);
        return {
            teacherId: Number(formData.teacherId),
            financeHeadId: Number(formData.financeHeadId),
            amount: Number(formData.amount),
            salaryMonth: monthParts.salaryMonth,
            salaryYear: monthParts.salaryYear,
            paymentDate: formData.paymentDate,
            remarks: formData.remarks,
            status: 'active',
        };
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.teacherId || !formData.financeHeadId || !formData.amount || !formData.salaryMonth || !formData.paymentDate) {
            setError('براہ کرم استاد، مد، رقم، مہینہ اور ادائیگی کی تاریخ مکمل کریں۔');
            return;
        }

        setIsSaving(true);
        try {
            if (editingEntry) {
                await updateSalaryEntry(editingEntry.id, buildPayload());
                setSuccess('تنخواہ کا ریکارڈ کامیابی سے تبدیل ہو گیا۔');
            } else {
                await createSalaryEntry(buildPayload());
                setSuccess('تنخواہ کامیابی سے محفوظ ہو گئی۔');
            }
            resetForm();
            await refreshEntries();
        } catch (saveError) {
            setError(toUrduSalaryError(saveError.message, editingEntry ? 'تنخواہ تبدیل نہیں ہو سکی۔' : 'تنخواہ محفوظ نہیں ہو سکی۔'));
        } finally {
            setIsSaving(false);
        }
    };

    const startEdit = (entry) => {
        setEditingEntry(entry);
        setError('');
        setSuccess('');
        setFormData({
            teacherId: String(entry.teacher?.id || ''),
            financeHeadId: String(entry.financeHead?.id || ''),
            amount: String(entry.amount || ''),
            salaryMonth: toMonthInputValue(entry.salaryMonth, entry.salaryYear),
            paymentDate: toDateInputValue(entry.paymentDate),
            remarks: entry.remarks || '',
        });
        setSearchQuery(entry.teacher?.fullName || '');
        setShowSuggestions(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        setError('');
        setSuccess('');

        try {
            await deactivateSalaryEntry(deleteTarget.id);
            setSuccess('تنخواہ کا ریکارڈ کامیابی سے حذف ہو گیا۔');
            setDeleteTarget(null);
            if (editingEntry?.id === deleteTarget.id) resetForm();
            await refreshEntries();
        } catch (deleteError) {
            setError(toUrduSalaryError(deleteError.message, 'تنخواہ کا ریکارڈ حذف نہیں ہو سکا۔'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen p-3 md:p-6 font-urdu bg-[var(--color-bg)] text-[var(--color-text-main)]" dir="rtl">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="sticky top-6 p-5 md:p-6 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--color-primary)] rounded-lg text-[#0b1120]">
                                    {editingEntry ? <Edit2 size={20} /> : <Plus size={20} />}
                                </div>
                                <h2 className="text-xl font-bold text-[var(--color-primary)]">
                                    {editingEntry ? 'تنخواہ تبدیل کریں' : 'تنخواہ کی انٹری'}
                                </h2>
                            </div>
                            {editingEntry ? (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="p-2 rounded-lg bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-rose-500"
                                    aria-label="ترمیم بند کریں"
                                >
                                    <X size={18} />
                                </button>
                            ) : null}
                        </div>

                        <div className="mb-6 relative">
                            <label className="block text-xs text-[var(--color-text-muted)] mb-2 mr-2">استاد تلاش کریں</label>
                            <div className="relative">
                                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-[var(--color-primary)] bg-[var(--color-input)] text-sm focus:outline-none"
                                    placeholder="نام، مضمون یا نمبر..."
                                    value={searchQuery}
                                    onChange={(event) => {
                                        setSearchQuery(event.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                />
                            </div>

                            {showSuggestions && searchQuery ? (
                                <div className="absolute z-20 w-full mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl max-h-48 overflow-y-auto">
                                    {filteredTeachers.length ? filteredTeachers.map((teacher) => (
                                        <button
                                            type="button"
                                            key={teacher.id}
                                            onClick={() => handleSelectTeacher(teacher)}
                                            className="w-full p-3 hover:bg-[var(--color-primary)] hover:text-[#0b1120] cursor-pointer flex justify-between items-center transition-colors border-b border-[var(--color-border)] last:border-0 text-right"
                                        >
                                            <span className="font-bold text-sm">{teacher.fullName}</span>
                                            <span className="text-[10px] opacity-70 px-2 py-0.5 rounded-md border border-current">{teacher.subject || '---'}</span>
                                        </button>
                                    )) : (
                                        <div className="p-3 text-xs text-center text-[var(--color-text-muted)]">کوئی استاد نہیں ملا</div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="p-3 rounded-xl bg-[var(--color-bg)] border border-dashed border-[var(--color-border)]">
                                <p className="text-[10px] text-[var(--color-text-muted)] mb-1">منتخب استاد:</p>
                                <p className="font-bold text-[var(--color-primary)]">{selectedTeacher?.fullName || searchQuery || '---'}</p>
                                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{selectedTeacher?.subject || '---'}</p>
                            </div>

                            <div>
                                <label className="block text-xs text-[var(--color-text-muted)] mb-2 mr-2">خرچ کی مد</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] text-sm focus:outline-none"
                                    value={formData.financeHeadId}
                                    onChange={(event) => setFormData({ ...formData, financeHeadId: event.target.value })}
                                >
                                    <option value="">مد منتخب کریں</option>
                                    {expenseHeads.map((head) => (
                                        <option key={head.id} value={head.id}>{head.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[var(--color-text-muted)] mb-2 mr-2">رقم</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] text-sm focus:outline-none"
                                        value={formData.amount}
                                        onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--color-text-muted)] mb-2 mr-2">مہینہ</label>
                                    <input
                                        type="month"
                                        className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] text-sm focus:outline-none [color-scheme:dark]"
                                        value={formData.salaryMonth}
                                        onChange={(event) => setFormData({ ...formData, salaryMonth: event.target.value })}
                                    />
                                </div>
                            </div>

                            <DateField
                                label="ادائیگی کی تاریخ"
                                value={formData.paymentDate}
                                onChange={(nextValue) => setFormData({ ...formData, paymentDate: nextValue })}
                            />

                            <textarea
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] text-sm focus:outline-none resize-none"
                                placeholder="تفصیل / نوٹ"
                                value={formData.remarks}
                                onChange={(event) => setFormData({ ...formData, remarks: event.target.value })}
                            />

                            <button disabled={isSaving || isLoading} className="w-full py-4 rounded-xl font-bold bg-[var(--color-primary)] text-[#0b1120] hover:bg-[var(--color-primary-hover)] shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                                <Save size={18} />
                                {isSaving ? 'محفوظ ہو رہی ہے...' : editingEntry ? 'تبدیلی محفوظ کریں' : 'تنخواہ جاری کریں'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                        <div>
                            <h2 className="text-xl font-bold">حالیہ تنخواہ ریکارڈز</h2>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">کل رقم: {formatAmount(totalPaid)}/-</p>
                        </div>
                        <button
                            type="button"
                            onClick={loadData}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 text-xs bg-[var(--color-surface)] px-4 py-2 rounded-full border border-[var(--color-border)] disabled:opacity-60"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                            {entries.length} انٹریز
                        </button>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="p-8 text-center rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                                تنخواہ ریکارڈز لوڈ ہو رہے ہیں...
                            </div>
                        ) : entries.length ? entries.map((entry) => (
                            <div key={entry.id} className="p-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-wrap md:flex-nowrap justify-between items-center gap-4 hover:border-[var(--color-primary)]/50 transition-all">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 text-[var(--color-primary)]">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{entry.teacher?.fullName || '---'}</h3>
                                        <p className="text-[10px] text-[var(--color-text-muted)]">{entry.teacher?.subject || entry.financeHead?.name || '---'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-1 justify-between md:justify-around items-center w-full md:w-auto px-4">
                                    <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm">
                                        <Calendar size={14} />
                                        <span>{formatMonth(entry.salaryMonth, entry.salaryYear)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm">
                                        <FileText size={14} />
                                        <span>{formatDate(entry.paymentDate)}</span>
                                    </div>
                                    <div className="text-[var(--color-primary)] font-extrabold text-lg">{formatAmount(entry.amount)}/-</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-4 py-1 rounded-full text-[10px] font-bold bg-[var(--color-primary)] text-[#0b1120] flex items-center gap-1">
                                        <Wallet size={12} />
                                        جاری
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => startEdit(entry)}
                                        className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                                        aria-label="تبدیل کریں"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(entry)}
                                        className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                                        aria-label="حذف کریں"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                                کوئی تنخواہ ریکارڈ نہیں ملا
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text-main)]">تنخواہ ریکارڈ حذف کریں؟</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                    کیا آپ واقعی <span className="text-rose-500">{deleteTarget.teacher?.fullName || 'یہ ریکارڈ'}</span> کی تنخواہ حذف کرنا چاہتے ہیں؟
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
                                {isDeleting ? 'حذف ہو رہی ہے...' : 'حذف کریں'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
