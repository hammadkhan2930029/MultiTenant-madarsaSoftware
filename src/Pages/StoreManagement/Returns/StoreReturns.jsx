import React, { useEffect, useMemo, useState } from 'react';
import { PackageCheck, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import StatusBadge from '../../../Components/Common/StatusBadge';
import { createStoreReturn, deleteStoreReturn, getStoreReturns, getStoreStockIssues } from '../../../Constant/StoreApi';

const emptyForm = {
    stockIssueId: '',
    returnQuantity: '',
    condition: 'good',
    addToStock: true,
    note: '',
};

const formatNumber = (value) => new Intl.NumberFormat('ur-PK', { maximumFractionDigits: 2 }).format(Number(value || 0));

const conditionLabel = {
    good: 'درست',
    damaged: 'خراب',
};

export const StoreReturns = () => {
    const [returns, setReturns] = useState([]);
    const [stockIssues, setStockIssues] = useState([]);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const selectedIssue = useMemo(
        () => stockIssues.find((issue) => Number(issue.id) === Number(formData.stockIssueId)) || null,
        [stockIssues, formData.stockIssueId],
    );

    const remainingQuantity = selectedIssue ? Math.max(Number(selectedIssue.quantity || 0) - Number(selectedIssue.returnedQuantity || 0), 0) : 0;

    const loadDependencies = async () => {
        const result = await getStoreStockIssues();
        setStockIssues((result.items || []).filter((issue) => issue.approvalStatus === 'approved' && Number(issue.quantity || 0) > Number(issue.returnedQuantity || 0)));
    };

    const loadReturns = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await getStoreReturns({ search: search.trim() });
            setReturns(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'واپسی کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDependencies().catch((loadError) => setError(loadError.message || 'اسٹاک اجراء ریکارڈ لوڈ نہیں ہو سکے۔'));
    }, []);

    useEffect(() => {
        const timer = setTimeout(loadReturns, 250);
        return () => clearTimeout(timer);
    }, [search]);

    const resetForm = () => {
        setFormData(emptyForm);
        setIsFormOpen(false);
    };

    const validateForm = () => {
        if (!formData.stockIssueId) return 'اسٹاک اجراء ریکارڈ منتخب کرنا ضروری ہے۔';
        if (Number(formData.returnQuantity || 0) <= 0) return 'واپسی مقدار درست درج کریں۔';
        if (Number(formData.returnQuantity || 0) > remainingQuantity) return 'واپسی مقدار باقی جاری شدہ مقدار سے زیادہ نہیں ہو سکتی۔';
        return '';
    };

    const handleSubmit = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            await createStoreReturn({
                stockIssueId: Number(formData.stockIssueId),
                returnQuantity: Number(formData.returnQuantity),
                condition: formData.condition,
                addToStock: formData.condition === 'good' ? Boolean(formData.addToStock) : false,
                note: formData.note.trim(),
            });
            setSuccess('واپسی کامیابی سے محفوظ ہو گئی۔');
            resetForm();
            await Promise.all([loadDependencies(), loadReturns()]);
        } catch (saveError) {
            setError(saveError.message || 'واپسی محفوظ نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        setError('');
        setSuccess('');
        try {
            await deleteStoreReturn(deleteTarget.id);
            setDeleteTarget(null);
            setSuccess('واپسی ریکارڈ حذف ہو گیا۔');
            await Promise.all([loadDependencies(), loadReturns()]);
        } catch (deleteError) {
            setError(deleteError.message || 'واپسی ریکارڈ حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                        <RotateCcw size={18} />
                        اسٹور مینجمنٹ
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">واپسی مینجمنٹ</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل واپسی ریکارڈ: {returns.length}</p>
                </div>

                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                    <div className="relative md:w-72">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="شے یا وصول کنندہ تلاش کریں" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none" />
                    </div>
                    <button type="button" onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))} className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-all active:scale-95 ${isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white shadow-lg shadow-emerald-500/20'}`}>
                        {isFormOpen ? 'بند کریں' : 'نئی واپسی'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        <PackageCheck size={20} />
                        <span>نئی واپسی کا اندراج</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">اسٹاک اجراء ریکارڈ</label>
                            <select value={formData.stockIssueId} onChange={(event) => setFormData((prev) => ({ ...prev, stockIssueId: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                <option value="">ریکارڈ منتخب کریں</option>
                                {stockIssues.map((issue) => (
                                    <option key={issue.id} value={issue.id}>
                                        {issue.itemName} - {issue.receiverName} - باقی {formatNumber(Number(issue.quantity || 0) - Number(issue.returnedQuantity || 0))}
                                    </option>
                                ))}
                            </select>
                            {selectedIssue ? (
                                <p className="mr-2 text-xs font-bold text-[var(--color-text-muted)]">
                                    شے: {selectedIssue.itemName} | جاری شدہ: {formatNumber(selectedIssue.quantity)} | واپس شدہ: {formatNumber(selectedIssue.returnedQuantity)} | باقی: {formatNumber(remainingQuantity)}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">واپسی مقدار</label>
                            <input type="number" min="0" value={formData.returnQuantity} onChange={(event) => setFormData((prev) => ({ ...prev, returnQuantity: event.target.value }))} placeholder="0" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">حالت</label>
                            <select value={formData.condition} onChange={(event) => setFormData((prev) => ({ ...prev, condition: event.target.value, addToStock: event.target.value === 'good' }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                <option value="good">درست</option>
                                <option value="damaged">خراب</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                            <div>
                                <p className="text-sm font-black text-[var(--color-text)]">اسٹاک میں شامل کریں</p>
                                <p className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">خراب حالت میں یہ ریکارڈ خراب اسٹاک میں جائے گا۔</p>
                            </div>
                            <input type="checkbox" checked={formData.condition === 'good' && formData.addToStock} disabled={formData.condition !== 'good'} onChange={(event) => setFormData((prev) => ({ ...prev, addToStock: event.target.checked }))} className="h-5 w-5 accent-[#00d094]" />
                        </div>

                        <div className="space-y-2 md:col-span-3">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">نوٹ</label>
                            <textarea rows={3} value={formData.note} onChange={(event) => setFormData((prev) => ({ ...prev, note: event.target.value }))} placeholder="اختیاری نوٹ" className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button type="button" onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-3 rounded-xl bg-[#218838] px-8 py-3 text-sm font-black text-white transition-all hover:bg-[#1a6d2c] disabled:opacity-70">
                            {isSaving ? 'محفوظ ہو رہی ہے...' : 'محفوظ کریں'}
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="text-[var(--color-text-muted)]">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">شے</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">واپسی مقدار</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">اسٹاک میں شامل</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">نوٹ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">واپسی ریکارڈ لوڈ ہو رہے ہیں...</td></tr>
                            ) : returns.length ? (
                                returns.map((item) => (
                                    <tr key={item.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{item.itemName}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{formatNumber(item.returnQuantity)}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={item.condition} label={conditionLabel[item.condition]} />
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{item.addToStock ? 'ہاں' : 'نہیں'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{item.note || '-'}</td>
                                        <td className="px-6 py-4">
                                            <button type="button" onClick={() => setDeleteTarget(item)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی واپسی ریکارڈ موجود نہیں۔</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text)]">واپسی ریکارڈ حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">کیا آپ واقعی یہ واپسی ریکارڈ حذف کرنا چاہتے ہیں؟</p>
                            </div>
                            <button type="button" onClick={() => !isDeleting && setDeleteTarget(null)} className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"><X size={18} /></button>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:opacity-60">منسوخ کریں</button>
                            <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:opacity-70">{isDeleting ? 'حذف ہو رہا ہے...' : 'تصدیق کریں'}</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
