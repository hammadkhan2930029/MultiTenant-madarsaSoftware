import React, { useEffect, useMemo, useState } from 'react';
import { Check, PackageX, Plus, Search, Trash2, X } from 'lucide-react';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import StatusBadge from '../../../Components/Common/StatusBadge';
import { DateField } from '../../../Components/HR/FormElements';
import {
    approveStoreDamagedStock,
    createStoreDamagedStock,
    deleteStoreDamagedStock,
    getStoreDamagedStock,
    getStoreItems,
    rejectStoreDamagedStock,
} from '../../../Constant/StoreApi';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
    itemId: '',
    quantity: '',
    reason: '',
    date: today(),
    responsiblePerson: '',
    note: '',
};

const statusLabel = {
    approved: 'منظور شدہ',
    pending: 'زیر التواء',
    rejected: 'رد شدہ',
};

const formatNumber = (value) => new Intl.NumberFormat('ur-PK', { maximumFractionDigits: 2 }).format(Number(value || 0));

export const StoreDamagedStock = () => {
    const [records, setRecords] = useState([]);
    const [items, setItems] = useState([]);
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

    const selectedItem = useMemo(() => items.find((item) => Number(item.id) === Number(formData.itemId)) || null, [items, formData.itemId]);
    const amountLoss = Number(formData.quantity || 0) * Number(selectedItem?.purchasePrice || 0);

    const loadItems = async () => {
        const result = await getStoreItems();
        setItems(result.items || []);
    };

    const loadRecords = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await getStoreDamagedStock({ search: search.trim() });
            setRecords(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'خراب یا گم شدہ اسٹاک کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadItems().catch((loadError) => setError(loadError.message || 'اشیاء لوڈ نہیں ہو سکیں۔'));
    }, []);

    useEffect(() => {
        const timer = setTimeout(loadRecords, 250);
        return () => clearTimeout(timer);
    }, [search]);

    const resetForm = () => {
        setFormData(emptyForm);
        setIsFormOpen(false);
    };

    const validateForm = () => {
        if (!formData.itemId) return 'شے منتخب کرنا ضروری ہے۔';
        if (Number(formData.quantity || 0) <= 0) return 'مقدار درست درج کریں۔';
        if (!formData.reason.trim()) return 'وجہ درج کرنا ضروری ہے۔';
        if (!formData.date) return 'تاریخ درج کرنا ضروری ہے۔';
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
            await createStoreDamagedStock({
                itemId: Number(formData.itemId),
                quantity: Number(formData.quantity),
                reason: formData.reason.trim(),
                date: formData.date,
                responsiblePerson: formData.responsiblePerson.trim(),
                note: formData.note.trim(),
            });
            setSuccess('خراب یا گم شدہ اسٹاک ریکارڈ محفوظ ہو گیا۔');
            resetForm();
            await loadRecords();
        } catch (saveError) {
            setError(saveError.message || 'ریکارڈ محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleApprove = async (record) => {
        try {
            setError('');
            setSuccess('');
            await approveStoreDamagedStock(record.id);
            setSuccess('ریکارڈ منظور ہو گیا۔');
            await Promise.all([loadItems(), loadRecords()]);
        } catch (actionError) {
            setError(actionError.message || 'منظوری مکمل نہیں ہو سکی۔');
        }
    };

    const handleReject = async (record) => {
        try {
            setError('');
            setSuccess('');
            await rejectStoreDamagedStock(record.id);
            setSuccess('ریکارڈ رد ہو گیا۔');
            await loadRecords();
        } catch (actionError) {
            setError(actionError.message || 'رد کرنے کا عمل مکمل نہیں ہو سکا۔');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        setError('');
        setSuccess('');
        try {
            await deleteStoreDamagedStock(deleteTarget.id);
            setDeleteTarget(null);
            setSuccess('ریکارڈ حذف ہو گیا۔');
            await Promise.all([loadItems(), loadRecords()]);
        } catch (deleteError) {
            setError(deleteError.message || 'ریکارڈ حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                        <PackageX size={18} />
                        اسٹور مینجمنٹ
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">خراب / گم شدہ اسٹاک</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل ریکارڈ: {records.length}</p>
                </div>

                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                    <div className="relative md:w-72">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="شے، وجہ یا ذمہ دار تلاش کریں" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none" />
                    </div>
                    <button type="button" onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))} className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-all active:scale-95 ${isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white shadow-lg shadow-emerald-500/20'}`}>
                        {isFormOpen ? 'بند کریں' : 'نیا ریکارڈ'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        <PackageX size={20} />
                        <span>خراب / گم شدہ اسٹاک کا اندراج</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">شے</label>
                            <select value={formData.itemId} onChange={(event) => setFormData((prev) => ({ ...prev, itemId: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                <option value="">شے منتخب کریں</option>
                                {items.map((item) => <option key={item.id} value={item.id}>{item.itemName}</option>)}
                            </select>
                            {selectedItem ? <p className="mr-2 text-xs font-bold text-[var(--color-text-muted)]">موجودہ اسٹاک: {formatNumber(selectedItem.currentStock)} | قیمت: روپے {formatNumber(selectedItem.purchasePrice)}</p> : null}
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">مقدار</label>
                            <input type="number" min="0" value={formData.quantity} onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="0" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>

                        <DateField label="تاریخ" value={formData.date} onChange={(value) => setFormData((prev) => ({ ...prev, date: value }))} />

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">وجہ</label>
                            <input value={formData.reason} onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))} placeholder="وجہ درج کریں" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">ذمہ دار شخص</label>
                            <input value={formData.responsiblePerson} onChange={(event) => setFormData((prev) => ({ ...prev, responsiblePerson: event.target.value }))} placeholder="اختیاری نام" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                            <p className="text-xs font-black text-[var(--color-text-muted)]">نقصان رقم</p>
                            <p className="mt-2 text-xl font-black text-[var(--color-text)]">روپے {formatNumber(amountLoss)}</p>
                        </div>

                        <div className="space-y-2 md:col-span-3">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">نوٹ</label>
                            <textarea rows={3} value={formData.note} onChange={(event) => setFormData((prev) => ({ ...prev, note: event.target.value }))} placeholder="اختیاری نوٹ" className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button type="button" onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-3 rounded-xl bg-[#218838] px-8 py-3 text-sm font-black text-white transition-all hover:bg-[#1a6d2c] disabled:opacity-70">
                            {isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
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
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">تاریخ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">شے</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">مقدار</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">وجہ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ذمہ دار</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">نقصان رقم</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">ریکارڈ لوڈ ہو رہے ہیں...</td></tr>
                            ) : records.length ? (
                                records.map((record) => (
                                    <tr key={record.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{String(record.date).slice(0, 10)}</td>
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{record.itemName}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{formatNumber(record.quantity)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{record.reason || record.note || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{record.responsiblePerson || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-black text-[var(--color-text)]">روپے {formatNumber(record.amountLoss)}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={record.approvalStatus} label={statusLabel[record.approvalStatus]} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-start gap-2">
                                                {record.approvalStatus === 'pending' ? (
                                                    <>
                                                        <button type="button" onClick={() => handleApprove(record)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"><Check size={16} /></button>
                                                        <button type="button" onClick={() => handleReject(record)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"><X size={16} /></button>
                                                    </>
                                                ) : null}
                                                <button type="button" onClick={() => setDeleteTarget(record)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی ریکارڈ موجود نہیں۔</td></tr>
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
                                <h3 className="text-xl font-black text-[var(--color-text)]">ریکارڈ حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">کیا آپ واقعی یہ ریکارڈ حذف کرنا چاہتے ہیں؟</p>
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
