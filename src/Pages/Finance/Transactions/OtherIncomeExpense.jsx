import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Receipt, Save, Search, Trash2, Wallet, X } from 'lucide-react';
import { DateField, InputField } from '../../../Components/HR/FormElements';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { getFinanceHeads } from '../../../Constant/FinanceHeadsApi';
import { createFinanceTransaction, deactivateFinanceTransaction, getFinanceTransactions, updateFinanceTransaction } from '../../../Constant/FinanceTransactionsApi';

const today = () => new Date().toISOString().split('T')[0];
const PAGE_SIZE = 10;
const formatAmount = (value) => Number(value || 0).toLocaleString('en-US');
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('ur-PK') : '---');
const toDateInputValue = (value) => (value ? new Date(value).toISOString().split('T')[0] : today());

const createForm = () => ({
    transactionDate: today(),
    type: 'income',
    financeHeadId: '',
    paymentMode: '',
    paymentStatus: '',
    amount: '',
    slipNo: '',
    details: '',
});

const toUrduError = (message, fallback) => {
    if (!message) return fallback;
    if (/head|مد/i.test(message)) return 'براہ کرم درست مالیاتی مد منتخب کریں۔';
    if (/amount|رقم/i.test(message)) return 'رقم درست درج کریں۔';
    if (/date|تاریخ/i.test(message)) return 'تاریخ منتخب کریں۔';
    return message;
};

const getFieldValue = (valueOrEvent) => valueOrEvent?.target?.value ?? valueOrEvent ?? '';

const buildTransactionQuery = ({ page, filters }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), status: 'active' });
    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (filters.type) params.set('type', filters.type);
    if (filters.financeHeadId) params.set('financeHeadId', filters.financeHeadId);
    if (filters.fromDate) params.set('fromDate', filters.fromDate);
    if (filters.toDate) params.set('toDate', filters.toDate);
    return params.toString();
};

export const OtherIncomeExpense = () => {
    const [formData, setFormData] = useState(createForm);
    const [incomeHeads, setIncomeHeads] = useState([]);
    const [expenseHeads, setExpenseHeads] = useState([]);
    const [entries, setEntries] = useState([]);
    const [meta, setMeta] = useState({ totalItems: 0, totalPages: 1, currentPage: 1, perPage: PAGE_SIZE });
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        financeHeadId: '',
        fromDate: '',
        toDate: '',
    });
    const [editingEntry, setEditingEntry] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const activeHeads = useMemo(
        () => (formData.type === 'income' ? incomeHeads : expenseHeads),
        [formData.type, incomeHeads, expenseHeads]
    );

    const allHeads = useMemo(() => [...incomeHeads, ...expenseHeads], [incomeHeads, expenseHeads]);

    const totals = useMemo(() => ({
        income: entries.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0),
        expense: entries.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0),
    }), [entries]);

    const loadEntries = async (nextPage = page, nextFilters = filters) => {
        const transactionsResult = await getFinanceTransactions(buildTransactionQuery({ page: nextPage, filters: nextFilters }));
        setEntries(transactionsResult.items || []);
        setMeta(transactionsResult.meta || { totalItems: 0, totalPages: 1, currentPage: nextPage, perPage: PAGE_SIZE });
        setPage(nextPage);
    };

    const loadData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [incomeResult, expenseResult, transactionsResult] = await Promise.all([
                getFinanceHeads('page=1&limit=100&type=income&status=active'),
                getFinanceHeads('page=1&limit=100&type=expense&status=active'),
                getFinanceTransactions(buildTransactionQuery({ page: 1, filters })),
            ]);

            const nextIncome = incomeResult.items || [];
            const nextExpense = expenseResult.items || [];
            setIncomeHeads(nextIncome);
            setExpenseHeads(nextExpense);
            setEntries(transactionsResult.items || []);
            setMeta(transactionsResult.meta || { totalItems: 0, totalPages: 1, currentPage: 1, perPage: PAGE_SIZE });
            setPage(1);
            setFormData((prev) => ({
                ...prev,
                financeHeadId: prev.financeHeadId || String((prev.type === 'income' ? nextIncome[0] : nextExpense[0])?.id || ''),
            }));
        } catch (loadError) {
            setError(toUrduError(loadError.message, 'آمدن و خرچ کا ڈیٹا لوڈ نہیں ہو سکا۔'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const selectedExists = activeHeads.some((head) => String(head.id) === String(formData.financeHeadId));
        if (!selectedExists) {
            setFormData((prev) => ({ ...prev, financeHeadId: String(activeHeads[0]?.id || '') }));
        }
    }, [activeHeads, formData.financeHeadId]);

    const handleTypeChange = (type) => {
        const nextHeads = type === 'income' ? incomeHeads : expenseHeads;
        setFormData((prev) => ({
            ...prev,
            type,
            financeHeadId: String(nextHeads[0]?.id || ''),
            paymentMode: type === 'income' ? prev.paymentMode : prev.paymentMode || 'نقد',
            paymentStatus: type === 'income' ? prev.paymentStatus : prev.paymentStatus || 'مکمل',
        }));
    };

    const handleFilterChange = (field, value) => {
        setFilters((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'type') next.financeHeadId = '';
            return next;
        });
    };

    const applyFilters = () => loadEntries(1, filters);

    const clearFilters = () => {
        const nextFilters = { search: '', type: '', financeHeadId: '', fromDate: '', toDate: '' };
        setFilters(nextFilters);
        loadEntries(1, nextFilters);
    };

    const resetForm = () => {
        setEditingEntry(null);
        setFormData((prev) => ({
            ...createForm(),
            type: prev.type,
            financeHeadId: prev.financeHeadId,
        }));
    };

    const startEdit = (entry) => {
        setEditingEntry(entry);
        setError('');
        setSuccess('');
        setFormData({
            transactionDate: toDateInputValue(entry.transactionDate),
            type: entry.type || 'income',
            financeHeadId: String(entry.financeHeadId || entry.financeHead?.id || ''),
            paymentMode: entry.paymentMode || '',
            paymentStatus: entry.paymentStatus || '',
            amount: String(entry.amount || ''),
            slipNo: entry.slipNo || '',
            details: entry.details || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.transactionDate || !formData.type || !formData.financeHeadId || !formData.amount) {
            setError('براہ کرم تاریخ، قسم، مد اور رقم مکمل کریں۔');
            return;
        }

        if (formData.type === 'expense' && (!formData.paymentMode || !formData.paymentStatus)) {
            setError('خرچ کے لیے ادائیگی کا طریقہ اور حالت منتخب کریں۔');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                transactionDate: formData.transactionDate,
                type: formData.type,
                financeHeadId: Number(formData.financeHeadId),
                amount: Number(formData.amount),
                paymentMode: formData.paymentMode,
                paymentStatus: formData.paymentStatus,
                slipNo: formData.slipNo.trim(),
                details: formData.details.trim(),
                status: 'active',
            };

            if (editingEntry) {
                await updateFinanceTransaction(editingEntry.id, payload);
                setSuccess('ریکارڈ کامیابی سے تبدیل ہو گیا۔');
            } else {
                await createFinanceTransaction(payload);
                setSuccess('ریکارڈ کامیابی سے محفوظ ہو گیا۔');
            }

            resetForm();
            await loadEntries(1, filters);
        } catch (saveError) {
            setError(toUrduError(saveError.message, editingEntry ? 'ریکارڈ تبدیل نہیں ہو سکا۔' : 'ریکارڈ محفوظ نہیں ہو سکا۔'));
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        setError('');
        setSuccess('');

        try {
            await deactivateFinanceTransaction(deleteTarget.id);
            setSuccess('ریکارڈ کامیابی سے حذف ہو گیا۔');
            if (editingEntry?.id === deleteTarget.id) resetForm();
            setDeleteTarget(null);
            const nextPage = entries.length === 1 && page > 1 ? page - 1 : page;
            await loadEntries(nextPage, filters);
        } catch (deleteError) {
            setError(toUrduError(deleteError.message, 'ریکارڈ حذف نہیں ہو سکا۔'));
        } finally {
            setIsDeleting(false);
        }
    };

    const canGoPrev = page > 1;
    const canGoNext = page < (meta.totalPages || 1);

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-3 md:p-6 text-[var(--color-text-main)] font-urdu" dir="rtl">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SummaryCard icon={<Wallet size={22} />} label="حالیہ آمدن" value={`${formatAmount(totals.income)}/-`} tone="income" />
                    <SummaryCard icon={<Receipt size={22} />} label="حالیہ خرچ" value={`${formatAmount(totals.expense)}/-`} tone="expense" />
                </div>

                <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6 shadow-2xl space-y-5">
                    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[var(--color-primary)] p-3 text-[#0b1120]">
                            {editingEntry ? <Edit2 size={20} /> : <Receipt size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-black text-[var(--color-primary)]">{editingEntry ? 'ریکارڈ تبدیل کریں' : 'دیگر آمدن و خرچ'}</h1>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">روزانہ آمدنی یا خرچ محفوظ کریں</p>
                        </div>
                        </div>
                        {editingEntry ? (
                            <button type="button" onClick={resetForm} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:text-rose-500 md:w-auto" aria-label="ترمیم بند کریں">
                                <X size={18} />
                                ترمیم بند کریں
                            </button>
                        ) : null}
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                            <DateField
                                label="تاریخ"
                                value={formData.transactionDate}
                                onChange={(nextValue) => setFormData({ ...formData, transactionDate: nextValue })}
                                className="[&_button]:h-[76px] [&_button]:rounded-2xl"
                            />

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">قسم</label>
                                <div className="grid h-[76px] grid-cols-2 gap-2 rounded-2xl bg-[var(--color-input)] p-1.5 border border-[var(--color-border)]">
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('income')}
                                        className={`rounded-xl py-3 text-sm font-black transition-all ${formData.type === 'income' ? 'bg-[var(--color-primary)] text-[#0b1120] shadow-lg' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'}`}
                                    >
                                        آمدن
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('expense')}
                                        className={`rounded-xl py-3 text-sm font-black transition-all ${formData.type === 'expense' ? 'bg-rose-500 text-white shadow-lg' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'}`}
                                    >
                                        خرچ
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">
                                    {formData.type === 'income' ? 'آمدن کی مد' : 'خرچ کی مد'}
                                </label>
                                <select
                                    value={formData.financeHeadId}
                                    onChange={(event) => setFormData({ ...formData, financeHeadId: event.target.value })}
                                    disabled={isLoading || activeHeads.length === 0}
                                    className="h-[76px] w-full p-4 rounded-2xl border outline-none font-bold bg-[var(--color-input)] border-transparent focus:border-[var(--color-primary)]"
                                >
                                    <option value="">
                                        {activeHeads.length ? `${formData.type === 'income' ? 'آمدن' : 'خرچ'} کی مد منتخب کریں` : `${formData.type === 'income' ? 'آمدن' : 'خرچ'} کی کوئی مد موجود نہیں`}
                                    </option>
                                    {activeHeads.map((head) => (
                                        <option key={head.id} value={head.id}>{head.name}</option>
                                    ))}
                                </select>
                            </div>

                            <InputField
                                label="رقم"
                                type="number"
                                value={formData.amount}
                                onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                                className="h-[76px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="space-y-2">
                            <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">
                                ادائیگی کا طریقہ {formData.type === 'income' ? '(اختیاری)' : ''}
                            </label>
                            <select
                                value={formData.paymentMode}
                                onChange={(event) => setFormData({ ...formData, paymentMode: event.target.value })}
                                className="h-[76px] w-full rounded-2xl border border-transparent bg-[var(--color-input)] p-4 font-bold outline-none focus:border-[var(--color-primary)]"
                            >
                                <option value="">منتخب کریں</option>
                                <option value="نقد">نقد</option>
                                <option value="آن لائن">آن لائن</option>
                                <option value="چیک">چیک</option>
                            </select>
                            </div>

                            <div className="space-y-2">
                            <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">
                                ادائیگی کی حالت {formData.type === 'income' ? '(اختیاری)' : ''}
                            </label>
                            <select
                                value={formData.paymentStatus}
                                onChange={(event) => setFormData({ ...formData, paymentStatus: event.target.value })}
                                className="h-[76px] w-full rounded-2xl border border-transparent bg-[var(--color-input)] p-4 font-bold outline-none focus:border-[var(--color-primary)]"
                            >
                                <option value="">منتخب کریں</option>
                                <option value="مکمل">مکمل</option>
                                <option value="جزوی">جزوی</option>
                            </select>
                            </div>

                            <InputField
                                label="سلپ نمبر (اختیاری)"
                                value={formData.slipNo}
                                onChange={(event) => setFormData({ ...formData, slipNo: event.target.value })}
                                className="h-[76px]"
                            />
                        </div>

                        <textarea
                            rows={3}
                            className="w-full resize-none rounded-2xl border border-transparent bg-[var(--color-input)] p-4 text-sm font-bold outline-none transition-all focus:border-[var(--color-primary)] min-h-[120px]"
                            placeholder="تفصیل"
                            value={formData.details}
                            onChange={(event) => setFormData({ ...formData, details: event.target.value })}
                        />
                    </div>

                    {activeHeads.length === 0 ? (
                        <p className="text-[11px] font-bold text-rose-500">
                            پہلے آمدن و خرچ سیٹ اَپ میں {formData.type === 'income' ? 'آمدن' : 'خرچ'} کی مد شامل کریں۔
                        </p>
                    ) : (
                        <p className="text-[11px] font-bold text-[var(--color-text-muted)]">
                            یہ فہرست آمدن و خرچ سیٹ اَپ میں admin کی بنائی ہوئی مدوں سے آ رہی ہے۔
                        </p>
                    )}

                    <div className="flex justify-end border-t border-[var(--color-border)] pt-4">
                        <button disabled={isSaving || isLoading} className="flex w-full md:w-[260px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-4 font-black text-[#0b1120] shadow-lg transition-all hover:bg-[var(--color-primary-hover)] disabled:opacity-60">
                            <Save size={18} />
                            {isSaving ? 'محفوظ ہو رہا ہے...' : editingEntry ? 'تبدیلی محفوظ کریں' : 'محفوظ کریں'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
                    <div className="flex flex-col gap-4 border-b border-[var(--color-border)] p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <h2 className="text-lg font-black">حالیہ ریکارڈز</h2>
                            <span className="text-xs text-[var(--color-text-muted)]">کل {meta.totalItems || 0} ریکارڈ</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                            <div className="relative lg:col-span-3">
                                <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    value={filters.search}
                                    onChange={(event) => handleFilterChange('search', event.target.value)}
                                    onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
                                    placeholder="سلپ، مد یا تفصیل تلاش کریں..."
                                    className="h-[50px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] pr-10 pl-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>

                            <select
                                value={filters.type}
                                onChange={(event) => handleFilterChange('type', event.target.value)}
                                className="h-[50px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)] lg:col-span-2"
                            >
                                <option value="">تمام اقسام</option>
                                <option value="income">آمدن</option>
                                <option value="expense">خرچ</option>
                            </select>

                            <select
                                value={filters.financeHeadId}
                                onChange={(event) => handleFilterChange('financeHeadId', event.target.value)}
                                className="h-[50px] rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)] lg:col-span-2"
                            >
                                <option value="">تمام مدیں</option>
                                {(filters.type === 'income' ? incomeHeads : filters.type === 'expense' ? expenseHeads : allHeads).map((head) => (
                                    <option key={`${head.type || 'head'}-${head.id}`} value={head.id}>{head.name}</option>
                                ))}
                            </select>

                            <DateField
                                value={filters.fromDate}
                                onChange={(nextValue) => handleFilterChange('fromDate', getFieldValue(nextValue))}
                                max={filters.toDate || undefined}
                                placeholder="شروع"
                                size="sm"
                                className="lg:col-span-2 [&_button]:h-[50px]"
                            />

                            <DateField
                                value={filters.toDate}
                                onChange={(nextValue) => handleFilterChange('toDate', getFieldValue(nextValue))}
                                min={filters.fromDate || undefined}
                                placeholder="اختتام"
                                size="sm"
                                className="lg:col-span-2 [&_button]:h-[50px]"
                            />

                            <div className="flex gap-2 lg:col-span-1">
                                <button type="button" onClick={applyFilters} disabled={isLoading} className="flex-1 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-xs font-black text-[#0b1120] disabled:opacity-60">
                                    فلٹر
                                </button>
                                <button type="button" onClick={clearFilters} disabled={isLoading} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-black text-[var(--color-text-muted)] disabled:opacity-60">
                                    صاف
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-right">
                                <thead className="bg-[var(--color-bg)] text-[11px] text-[var(--color-text-muted)]">
                                    <tr>
                                        <th className="p-4">تاریخ</th>
                                        <th className="p-4">قسم</th>
                                        <th className="p-4">مد</th>
                                        <th className="p-4">ادائیگی</th>
                                        <th className="p-4">حالت</th>
                                        <th className="p-4">سلپ</th>
                                        <th className="p-4">رقم</th>
                                        <th className="p-4">تفصیل</th>
                                        <th className="p-4 text-center">کارروائی</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan={9} className="p-8 text-center text-[var(--color-text-muted)]">ریکارڈز لوڈ ہو رہے ہیں...</td></tr>
                                    ) : entries.length ? entries.map((entry) => (
                                        <tr key={entry.id} className="border-t border-[var(--color-border)]">
                                            <td className="p-4 text-xs font-mono">{formatDate(entry.transactionDate)}</td>
                                            <td className="p-4">
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-black ${entry.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {entry.type === 'income' ? 'آمدن' : 'خرچ'}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold">{entry.financeHead?.name || '---'}</td>
                                            <td className="p-4 text-sm">{entry.paymentMode || '---'}</td>
                                            <td className="p-4 text-sm">{entry.paymentStatus || '---'}</td>
                                            <td className="p-4 text-xs font-mono">{entry.slipNo || '---'}</td>
                                            <td className="p-4 font-black text-[var(--color-primary)]">{formatAmount(entry.amount)}/-</td>
                                            <td className="p-4 text-sm text-[var(--color-text-muted)]">{entry.details || '---'}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button type="button" onClick={() => startEdit(entry)} className="rounded-xl bg-blue-500/10 p-2 text-blue-400 transition-all hover:bg-blue-500 hover:text-white" aria-label="تبدیل کریں">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteTarget(entry)} className="rounded-xl bg-rose-500/10 p-2 text-rose-400 transition-all hover:bg-rose-500 hover:text-white" aria-label="حذف کریں">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={9} className="p-8 text-center text-[var(--color-text-muted)]">کوئی ریکارڈ نہیں ملا</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-xs font-bold text-[var(--color-text-muted)]">
                            صفحہ {meta.currentPage || page} از {meta.totalPages || 1}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => canGoPrev && loadEntries(page - 1, filters)}
                                disabled={!canGoPrev || isLoading}
                                className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-xs font-bold disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                                پچھلا
                            </button>
                            <button
                                type="button"
                                onClick={() => canGoNext && loadEntries(page + 1, filters)}
                                disabled={!canGoNext || isLoading}
                                className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-xs font-bold disabled:opacity-40"
                            >
                                اگلا
                                <ChevronLeft size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {deleteTarget ? (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                            <div className="flex items-start justify-between gap-4">
                                <div className="text-right">
                                    <h3 className="text-xl font-black text-[var(--color-text-main)]">ریکارڈ حذف کریں؟</h3>
                                    <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                        کیا آپ واقعی <span className="text-rose-500">{deleteTarget.financeHead?.name || 'یہ ریکارڈ'}</span> حذف کرنا چاہتے ہیں؟
                                    </p>
                                </div>
                                <button type="button" onClick={() => !isDeleting && setDeleteTarget(null)} className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500" aria-label="بند کریں">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:opacity-60">
                                    منسوخ کریں
                                </button>
                                <button type="button" onClick={confirmDelete} disabled={isDeleting} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:opacity-70">
                                    {isDeleting ? 'حذف ہو رہا ہے...' : 'حذف کریں'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const SummaryCard = ({ icon, label, value, tone }) => (
    <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-[var(--color-text-muted)]">{label}</p>
                <p className={`mt-2 text-2xl font-black ${tone === 'expense' ? 'text-rose-500' : 'text-[var(--color-primary)]'}`}>{value}</p>
            </div>
            <div className={`rounded-xl p-3 ${tone === 'expense' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-[var(--color-primary)]'}`}>
                {icon}
            </div>
        </div>
    </div>
);
