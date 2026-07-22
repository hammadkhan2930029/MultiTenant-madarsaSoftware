import React, { useEffect, useMemo, useState } from 'react';
import { User, Calendar, Plus, Save, Search, Wallet, FileText, RefreshCw, Edit2, Trash2, X, Eye } from 'lucide-react';
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
    paymentMethod: 'Cash',
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
const paymentMethods = ['Cash', 'Online', 'Cheque', 'Bank Transfer'];

const parseDateOnly = (value) => {
    if (!value) return null;
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
    const date = year && month && day ? new Date(year, month - 1, day) : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
};

const getTeacherStartDate = (teacher) => parseDateOnly(teacher?.joiningDate || teacher?.appointmentDate || teacher?.createdAt);

const getMonthStartDate = (value) => {
    const [year, month] = String(value || '').split('-').map(Number);
    if (!year || !month) return null;
    return new Date(year, month - 1, 1);
};

const canTeacherReceiveSalary = (teacher, salaryMonth, paymentDate) => {
    const startDate = getTeacherStartDate(teacher);
    const monthDate = getMonthStartDate(salaryMonth);
    const paidDate = parseDateOnly(paymentDate);
    if (!startDate || !monthDate || !paidDate) return true;

    const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    return monthDate >= startMonth && paidDate >= startDate;
};

const toUrduSalaryError = (message, fallback) => {
    if (!message) return fallback;
    if (/already exists|duplicate|another salary/i.test(message)) {
        return 'اس عملہ / استاد کی اس مہینے کی تنخواہ پہلے سے محفوظ ہے۔';
    }
    if (/teacher not found/i.test(message)) return 'منتخب استاد نہیں ملا۔';
    if (/finance head not found/i.test(message)) return 'تنخواہ محفوظ کرنے کے لیے پہلے مالیات میں تنخواہ یا خرچ کی مد شامل کریں۔';
    if (/expense head/i.test(message)) return 'منتخب مد خرچ کی مد ہونی چاہیے۔';
    if (/payment date/i.test(message)) return 'ادائیگی کی تاریخ ضروری ہے۔';
    if (/amount/i.test(message)) return 'رقم درست درج کریں۔';
    if (/not joined|not available|ابھی شامل/i.test(message)) return 'اس تاریخ یا مہینے میں منتخب استاد/عملہ ابھی شامل نہیں ہوا تھا۔';
    return message;
};

export const SalaryEntry = ({ staffType = '' }) => {
    const [teachers, setTeachers] = useState([]);
    const [entries, setEntries] = useState([]);
    const [formData, setFormData] = useState(createEmptyForm());
    const [editingEntry, setEditingEntry] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);
    const [filterMonth, setFilterMonth] = useState('');
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

    const filteredEntries = useMemo(
        () => entries.filter((entry) => !filterMonth || toMonthInputValue(entry.salaryMonth, entry.salaryYear) === filterMonth),
        [entries, filterMonth]
    );

    const totalPaid = useMemo(
        () => filteredEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        [filteredEntries]
    );

    const filteredTeachers = useMemo(
        () => teachers.filter((teacher) =>
            canTeacherReceiveSalary(teacher, formData.salaryMonth, formData.paymentDate) &&
            [teacher.fullName, teacher.subject, teacher.phone]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
        [teachers, searchQuery, formData.salaryMonth, formData.paymentDate]
    );

    const refreshEntries = async () => {
        const params = new URLSearchParams({ page: '1', limit: '100', status: 'active' });
        if (staffType) params.set('staffType', staffType);
        const salaryResult = await getSalaryEntries(params.toString());
        setEntries(salaryResult.items || []);
    };

    const loadData = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [teacherResult, salaryResult] = await Promise.all([
                getTeachers(`page=1&limit=100&status=active${staffType ? `&staffType=${staffType}` : ''}`),
                getSalaryEntries(`page=1&limit=100&status=active${staffType ? `&staffType=${staffType}` : ''}`),
            ]);
            const headsResult = await getFinanceHeads('page=1&limit=100&type=expense&status=active').catch(() => ({ items: [] }));

            const heads = headsResult.items || [];
            const salaryHead = heads.find((head) => /salary|تنخواہ|payroll/i.test(head.name || '')) || heads[0];

            setTeachers(teacherResult.items || []);
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
    }, [staffType]);

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
        const payload = {
            teacherId: Number(formData.teacherId),
            amount: Number(formData.amount),
            salaryMonth: monthParts.salaryMonth,
            salaryYear: monthParts.salaryYear,
            paymentDate: formData.paymentDate,
            paymentMethod: formData.paymentMethod,
            remarks: formData.remarks,
            status: 'active',
        };
        if (formData.financeHeadId) {
            payload.financeHeadId = Number(formData.financeHeadId);
        }
        return payload;
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.teacherId || !formData.amount || !formData.salaryMonth || !formData.paymentDate || !formData.paymentMethod) {
            setError('براہ کرم استاد، طریقہ ادائیگی، رقم، مہینہ اور ادائیگی کی تاریخ مکمل کریں۔');
            return;
        }

        if (selectedTeacher && !canTeacherReceiveSalary(selectedTeacher, formData.salaryMonth, formData.paymentDate)) {
            setError('اس تاریخ یا مہینے میں منتخب استاد/عملہ ابھی شامل نہیں ہوا تھا۔');
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
            paymentMethod: entry.paymentMethod || 'Cash',
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
        <div className="min-h-screen p-3 md:p-5 font-urdu bg-[var(--color-bg)] text-[var(--color-text-main)]" dir="rtl">
            <div className="max-w-6xl mx-auto space-y-5">
                <div>
                    <div className="p-4 md:p-5 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--color-primary)] rounded-lg text-[#0b1120]">
                                    {editingEntry ? <Edit2 size={20} /> : <Plus size={20} />}
                                </div>
                                <h2 className="text-2xl font-bold text-[var(--color-primary)]">
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

                        <div className="mb-4 relative">
                            <label className="block text-base font-bold text-[var(--color-text-muted)] mb-2 mr-2">عملہ / استاد تلاش کریں<span className="text-red-500"> *</span></label>
                            <div className="relative">
                                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-[var(--color-primary)] bg-[var(--color-input)] text-base focus:outline-none"
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
                                            <span className="font-bold text-base">{teacher.fullName}</span>
                                            <span className="text-sm opacity-70 px-2 py-0.5 rounded-md border border-current">{teacher.subject || '---'}</span>
                                        </button>
                                    )) : (
                                        <div className="p-3 text-sm text-center text-[var(--color-text-muted)]">کوئی عملہ / استاد نہیں ملا</div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <form onSubmit={handleSave} noValidate className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="p-3 rounded-xl bg-[var(--color-bg)] border border-dashed border-[var(--color-border)]">
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mb-1">منتخب عملہ / استاد:</p>
                                <p className="text-lg font-bold text-[var(--color-primary)]">{selectedTeacher?.fullName || searchQuery || '---'}</p>
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">{selectedTeacher?.subject || '---'}</p>
                            </div>

                            <div>
                                <label className="block text-base font-bold text-[var(--color-text-muted)] mb-2 mr-2">طریقہ ادائیگی<span className="text-red-500"> *</span></label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] text-base focus:outline-none"
                                    value={formData.paymentMethod}
                                    onChange={(event) => setFormData({ ...formData, paymentMethod: event.target.value })}
                                >
                                    {paymentMethods.map((method) => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-base font-bold text-[var(--color-text-muted)] mb-2 mr-2">رقم<span className="text-red-500"> *</span></label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] text-base focus:outline-none"
                                        value={formData.amount}
                                        onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-[var(--color-text-muted)] mb-2 mr-2">مہینہ<span className="text-red-500"> *</span></label>
                                    <input
                                        required
                                        type="month"
                                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] text-base focus:outline-none [color-scheme:dark]"
                                        value={formData.salaryMonth}
                                        onChange={(event) => setFormData({ ...formData, salaryMonth: event.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="[&_button]:!py-2.5 [&_input]:!py-2.5">
                                <label className="block text-base font-bold text-[var(--color-text-muted)] mb-2 mr-2">ادائیگی کی تاریخ<span className="text-red-500"> *</span></label>
                                <DateField
                                    className="space-y-0"
                                    required
                                    value={formData.paymentDate}
                                    onChange={(nextValue) => setFormData({ ...formData, paymentDate: nextValue })}
                                />
                            </div>

                            <textarea
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] text-base focus:outline-none resize-none"
                                placeholder="تفصیل / نوٹ"
                                value={formData.remarks}
                                onChange={(event) => setFormData({ ...formData, remarks: event.target.value })}
                            />

                            <button disabled={isSaving || isLoading} className="w-full py-3 rounded-xl text-base font-bold bg-[var(--color-primary)] text-[#0b1120] hover:bg-[var(--color-primary-hover)] shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed md:self-end">
                                <Save size={18} />
                                {isSaving ? 'محفوظ ہو رہی ہے...' : editingEntry ? 'تبدیلی محفوظ کریں' : 'تنخواہ جاری کریں'}
                            </button>
                        </form>
                    </div>
                </div>

                <div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 bg-[var(--color-surface)] p-4 rounded-[1.2rem] border border-[var(--color-border)]">
                        <div>
                            <h2 className="text-2xl font-bold">حالیہ تنخواہ ریکارڈز</h2>
                            <p className="text-base text-[var(--color-text-muted)] mt-1">کل رقم: {formatAmount(totalPaid)}</p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div>
                                <label className="mb-2 mr-2 block text-base font-bold text-[var(--color-text-muted)]">مہینہ فلٹر</label>
                                <input
                                    type="month"
                                    value={filterMonth}
                                    onChange={(event) => setFilterMonth(event.target.value)}
                                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 py-2.5 text-base font-bold [color-scheme:dark] focus:outline-none sm:w-48"
                                />
                            </div>
                            {filterMonth ? (
                                <button
                                    type="button"
                                    onClick={() => setFilterMonth('')}
                                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-base font-bold text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                                >
                                    فلٹر صاف کریں
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={loadData}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-base disabled:opacity-60"
                            >
                                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                                {filteredEntries.length} انٹریز
                            </button>
                        </div>
                    </div>

                    <div className="mb-2 hidden grid-cols-[1.3fr_0.75fr_1fr_0.85fr_0.7fr_120px] gap-3 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4 text-base font-black text-[var(--color-text-muted)] sm:grid">
                        <span className="text-center">نام</span>
                        <span className="text-center">مہینہ</span>
                        <span className="text-center">ادائیگی کی تاریخ</span>
                        <span className="text-center">تنخواہ</span>
                        <span className="text-center">اسٹیٹس</span>
                        <span className="text-center">ایکشن</span>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="p-8 text-center rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                                تنخواہ ریکارڈز لوڈ ہو رہے ہیں...
                            </div>
                        ) : filteredEntries.length ? filteredEntries.map((entry) => (
                            <div key={entry.id} className="grid grid-cols-1 gap-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-primary)]/50 sm:grid-cols-[1.3fr_0.75fr_1fr_0.85fr_0.7fr_120px] sm:items-center sm:gap-3">
                                <div className="flex min-w-0 items-center gap-4 sm:justify-center">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 text-[var(--color-primary)]">
                                        <User size={20} />
                                    </div>
                                    <div className="min-w-0 text-right">
                                        <p className="mb-1 text-[10px] font-black text-[var(--color-text-muted)] sm:hidden">نام</p>
                                        <h3 className="truncate text-xl font-bold">{entry.teacher?.fullName || '---'}</h3>
                                        <p className="truncate text-base text-[var(--color-text-muted)]">{entry.teacher?.subject || entry.financeHead?.name || '---'}</p>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-[var(--color-bg)]/60 p-3 text-right sm:bg-transparent sm:p-0 sm:text-center">
                                    <p className="mb-1 text-[10px] font-black text-[var(--color-text-muted)] sm:hidden">مہینہ</p>
                                    <div className="flex items-center gap-2 text-lg text-[var(--color-text-muted)] sm:justify-center">
                                        <Calendar size={14} className="shrink-0" />
                                        <span className="whitespace-nowrap">{formatMonth(entry.salaryMonth, entry.salaryYear)}</span>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-[var(--color-bg)]/60 p-3 text-right sm:bg-transparent sm:p-0 sm:text-center">
                                    <p className="mb-1 text-[10px] font-black text-[var(--color-text-muted)] sm:hidden">ادائیگی کی تاریخ</p>
                                    <div className="flex items-center gap-2 text-lg text-[var(--color-text-muted)] sm:justify-center">
                                        <FileText size={14} className="shrink-0" />
                                        <span className="whitespace-nowrap">{formatDate(entry.paymentDate)}</span>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-[var(--color-bg)]/60 p-3 text-right sm:bg-transparent sm:p-0 sm:text-center">
                                    <p className="mb-1 text-[10px] font-black text-[var(--color-text-muted)] sm:hidden">تنخواہ</p>
                                    <div className="whitespace-nowrap text-[var(--color-primary)] font-extrabold text-xl">{formatAmount(entry.amount)}</div>
                                </div>
                                <div className="rounded-xl bg-[var(--color-bg)]/60 p-3 text-right sm:bg-transparent sm:p-0 sm:text-center">
                                    <p className="mb-1 text-[10px] font-black text-[var(--color-text-muted)] sm:hidden">اسٹیٹس</p>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-4 py-1 text-sm font-bold text-[#0b1120]">
                                        <Wallet size={12} />
                                        جاری
                                    </span>
                                </div>
                                <div className="flex items-center justify-end gap-2 sm:justify-center">
                                    <p className="ml-auto text-[10px] font-black text-[var(--color-text-muted)] sm:hidden">ایکشن</p>
                                    <button
                                        type="button"
                                        onClick={() => setViewTarget(entry)}
                                        className="p-2 rounded-xl bg-emerald-500/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[#0b1120] transition-all"
                                        aria-label="دیکھیں"
                                    >
                                        <Eye size={16} />
                                    </button>
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

            {viewTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl" dir="rtl">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--color-text-main)]">تنخواہ کی تفصیل</h3>
                                <p className="mt-1 text-base font-bold text-[var(--color-text-muted)]">{viewTarget.teacher?.fullName || '---'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewTarget(null)}
                                className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                                aria-label="بند کریں"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                                <p className="text-sm font-black text-[var(--color-text-muted)]">نام</p>
                                <p className="mt-1 text-lg font-bold">{viewTarget.teacher?.fullName || '---'}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                                <p className="text-sm font-black text-[var(--color-text-muted)]">مضمون / مد</p>
                                <p className="mt-1 text-lg font-bold">{viewTarget.teacher?.subject || viewTarget.financeHead?.name || '---'}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                                <p className="text-sm font-black text-[var(--color-text-muted)]">مہینہ</p>
                                <p className="mt-1 text-lg font-bold">{formatMonth(viewTarget.salaryMonth, viewTarget.salaryYear)}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                                <p className="text-sm font-black text-[var(--color-text-muted)]">ادائیگی کی تاریخ</p>
                                <p className="mt-1 text-lg font-bold">{formatDate(viewTarget.paymentDate)}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                                <p className="text-sm font-black text-[var(--color-text-muted)]">طریقہ ادائیگی</p>
                                <p className="mt-1 text-lg font-bold">{viewTarget.paymentMethod || 'Cash'}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                                <p className="text-sm font-black text-[var(--color-text-muted)]">رقم</p>
                                <p className="mt-1 text-lg font-black text-[var(--color-primary)]">{formatAmount(viewTarget.amount)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

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
