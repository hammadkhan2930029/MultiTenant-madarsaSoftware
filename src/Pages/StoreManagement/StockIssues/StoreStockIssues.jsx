import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Edit2, FileImage, PackageMinus, Plus, Printer, Save, Search, Trash2, X } from 'lucide-react';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import {
    approveStoreStockIssue,
    createStoreStockIssue,
    deleteStoreStockIssue,
    getStoreItems,
    getStoreStockIssues,
    openStorePrintPage,
    rejectStoreStockIssue,
    updateStoreStockIssue,
} from '../../../Constant/StoreApi';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
    issueDate: today(),
    itemId: '',
    quantity: '',
    department: '',
    receiverName: '',
    purpose: '',
    issuedBy: '',
    receiverSignature: null,
    approvalStatus: 'approved',
};

const formatNumber = (value) => new Intl.NumberFormat('ur-PK', { maximumFractionDigits: 2 }).format(Number(value || 0));

const statusLabel = {
    approved: 'منظور شدہ',
    pending: 'زیر التواء',
    rejected: 'رد شدہ',
};

export const StoreStockIssues = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [issues, setIssues] = useState([]);
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState(() => searchParams.get('search') || '');
    const [departmentFilter, setDepartmentFilter] = useState(() => searchParams.get('department') || '');
    const [fromDate, setFromDate] = useState(() => searchParams.get('fromDate') || '');
    const [toDate, setToDate] = useState(() => searchParams.get('toDate') || '');
    const [formData, setFormData] = useState(emptyForm);
    const [editMode, setEditMode] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const selectedItem = useMemo(() => items.find((item) => Number(item.id) === Number(formData.itemId)) || null, [items, formData.itemId]);

    const loadDependencies = async () => {
        const result = await getStoreItems();
        setItems(result.items || []);
    };

    const loadIssues = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await getStoreStockIssues({
                search: search.trim(),
                department: departmentFilter.trim(),
                fromDate,
                toDate,
            });
            setIssues(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'اسٹاک اجراء کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDependencies().catch((loadError) => setError(loadError.message || 'اشیاء لوڈ نہیں ہو سکیں۔'));
    }, []);

    useEffect(() => {
        const nextParams = new URLSearchParams();
        if (search.trim()) nextParams.set('search', search.trim());
        if (departmentFilter.trim()) nextParams.set('department', departmentFilter.trim());
        if (fromDate) nextParams.set('fromDate', fromDate);
        if (toDate) nextParams.set('toDate', toDate);
        setSearchParams(nextParams, { replace: true });

        const timer = setTimeout(loadIssues, 250);
        return () => clearTimeout(timer);
    }, [search, departmentFilter, fromDate, toDate]);

    const resetFilters = () => {
        setSearch('');
        setDepartmentFilter('');
        setFromDate('');
        setToDate('');
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
        setIsFormOpen(false);
    };

    const handleEdit = (issue) => {
        setEditMode(issue.id);
        setFormData({
            issueDate: issue.issueDate ? String(issue.issueDate).slice(0, 10) : today(),
            itemId: String(issue.itemId || ''),
            quantity: String(issue.quantity ?? ''),
            department: issue.department || '',
            receiverName: issue.receiverName || '',
            purpose: issue.purpose || '',
            issuedBy: issue.issuedBy || '',
            receiverSignature: null,
            approvalStatus: issue.approvalStatus || 'approved',
        });
        setError('');
        setSuccess('');
        setIsFormOpen(true);
    };

    const validateForm = () => {
        if (!formData.issueDate) return 'تاریخ درج کرنا ضروری ہے۔';
        if (!formData.itemId) return 'شے منتخب کرنا ضروری ہے۔';
        if (Number(formData.quantity || 0) <= 0) return 'مقدار درست درج کریں۔';
        if (!formData.department.trim()) return 'شعبہ درج کرنا ضروری ہے۔';
        if (!formData.receiverName.trim()) return 'وصول کرنے والے کا نام درج کرنا ضروری ہے۔';
        if (!formData.issuedBy.trim()) return 'اجراء کرنے والے کا نام درج کرنا ضروری ہے۔';
        if (!editMode && formData.approvalStatus === 'approved' && selectedItem && Number(formData.quantity) > Number(selectedItem.currentStock)) return 'موجودہ اسٹاک مطلوبہ مقدار سے کم ہے۔';
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
            const payload = {
                issueDate: formData.issueDate,
                itemId: formData.itemId,
                quantity: Number(formData.quantity),
                department: formData.department.trim(),
                receiverName: formData.receiverName.trim(),
                purpose: formData.purpose.trim(),
                issuedBy: formData.issuedBy.trim(),
                receiverSignature: formData.receiverSignature,
                approvalStatus: formData.approvalStatus,
            };

            if (editMode) {
                await updateStoreStockIssue(editMode, payload);
                setSuccess('اسٹاک اجراء کامیابی سے اپ ڈیٹ ہو گیا۔');
            } else {
                await createStoreStockIssue(payload);
                setSuccess('اسٹاک اجراء کامیابی سے محفوظ ہو گیا۔');
            }

            resetForm();
            await Promise.all([loadDependencies(), loadIssues()]);
        } catch (saveError) {
            setError(saveError.message || 'اسٹاک اجراء محفوظ نہیں ہو سکا۔');
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
            await deleteStoreStockIssue(deleteTarget.id);
            if (editMode === deleteTarget.id) resetForm();
            setDeleteTarget(null);
            setSuccess('اسٹاک اجراء کامیابی سے حذف ہو گیا۔');
            await Promise.all([loadDependencies(), loadIssues()]);
        } catch (deleteError) {
            setError(deleteError.message || 'اسٹاک اجراء حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleApprove = async (issue) => {
        try {
            setError('');
            setSuccess('');
            await approveStoreStockIssue(issue.id);
            setSuccess('اسٹاک اجراء منظور ہو گیا۔');
            await Promise.all([loadDependencies(), loadIssues()]);
        } catch (actionError) {
            setError(actionError.message || 'منظوری مکمل نہیں ہو سکی۔');
        }
    };

    const handleReject = async (issue) => {
        try {
            setError('');
            setSuccess('');
            await rejectStoreStockIssue(issue.id);
            setSuccess('اسٹاک اجراء رد ہو گیا۔');
            await Promise.all([loadDependencies(), loadIssues()]);
        } catch (actionError) {
            setError(actionError.message || 'رد کرنے کا عمل مکمل نہیں ہو سکا۔');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                <div className="shrink-0 text-right">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                        <PackageMinus size={18} />
                        اسٹور مینجمنٹ
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">اسٹاک اجراء مینجمنٹ</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل ریکارڈ: {issues.length}</p>
                </div>

                <div className="flex w-full flex-col gap-3 md:flex-row md:flex-wrap md:justify-end xl:w-auto xl:flex-nowrap xl:items-center">
                    <div className="relative md:w-64 xl:w-60">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="شے، شعبہ یا وصول کنندہ تلاش کریں" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none" />
                    </div>
                    <input value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} placeholder="شعبہ فلٹر کریں" className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none md:w-44 xl:w-40" />
                    <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none md:w-40" />
                    <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none md:w-40" />
                    <button type="button" onClick={resetFilters} className="h-12 shrink-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-black text-[var(--color-text)]">
                        فلٹر صاف کریں
                    </button>
                    <button type="button" onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))} className={`flex shrink-0 items-center justify-center gap-3 rounded-2xl px-5 py-3 text-sm font-black transition-all active:scale-95 ${isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white shadow-lg shadow-emerald-500/20'}`}>
                        {isFormOpen ? 'بند کریں' : 'نیا اجراء'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <PackageMinus size={20} />}
                        <span>{editMode ? 'اسٹاک اجراء میں ترمیم' : 'نیا اسٹاک اجراء'}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">تاریخ</label>
                            <input type="date" value={formData.issueDate} onChange={(event) => setFormData((prev) => ({ ...prev, issueDate: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">شے</label>
                            <select value={formData.itemId} onChange={(event) => setFormData((prev) => ({ ...prev, itemId: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                <option value="">شے منتخب کریں</option>
                                {items.map((item) => <option key={item.id} value={item.id}>{item.itemName}</option>)}
                            </select>
                            {selectedItem ? <p className="mr-2 text-xs font-bold text-[var(--color-text-muted)]">موجودہ اسٹاک: {formatNumber(selectedItem.currentStock)}</p> : null}
                        </div>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">مقدار</label>
                            <input type="number" min="0" value={formData.quantity} onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="0" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">شعبہ</label>
                            <input value={formData.department} onChange={(event) => setFormData((prev) => ({ ...prev, department: event.target.value }))} placeholder="شعبہ درج کریں" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">وصول کنندہ</label>
                            <input value={formData.receiverName} onChange={(event) => setFormData((prev) => ({ ...prev, receiverName: event.target.value }))} placeholder="نام درج کریں" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">اجراء کنندہ</label>
                            <input value={formData.issuedBy} onChange={(event) => setFormData((prev) => ({ ...prev, issuedBy: event.target.value }))} placeholder="نام درج کریں" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">منظوری حالت</label>
                            <select value={formData.approvalStatus} onChange={(event) => setFormData((prev) => ({ ...prev, approvalStatus: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                <option value="approved">منظور شدہ</option>
                                <option value="pending">زیر التواء</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">دستخط / تصویر</label>
                            <label className="flex h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold text-[var(--color-text-muted)]">
                                <span className="truncate">{formData.receiverSignature?.name || 'تصویر منتخب کریں'}</span>
                                <FileImage size={18} />
                                <input type="file" accept="image/*" className="hidden" onChange={(event) => setFormData((prev) => ({ ...prev, receiverSignature: event.target.files?.[0] || null }))} />
                            </label>
                        </div>
                        <div className="space-y-2 md:col-span-3">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">مقصد</label>
                            <textarea rows={3} value={formData.purpose} onChange={(event) => setFormData((prev) => ({ ...prev, purpose: event.target.value }))} placeholder="مقصد درج کریں" className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                        {editMode ? <button type="button" onClick={resetForm} className="rounded-xl px-5 py-3 text-sm font-black text-[var(--color-text-muted)]">منسوخ کریں</button> : null}
                        <button type="button" onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-3 rounded-xl bg-[#218838] px-8 py-3 text-sm font-black text-white transition-all hover:bg-[#1a6d2c] disabled:opacity-70">
                            {isSaving ? 'محفوظ ہو رہا ہے...' : editMode ? 'اپ ڈیٹ کریں' : 'محفوظ کریں'}
                            {editMode ? <Save size={18} /> : <Plus size={18} />}
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
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">شعبہ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">وصول کنندہ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">عمل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">ریکارڈ لوڈ ہو رہے ہیں...</td></tr>
                            ) : issues.length ? (
                                issues.map((issue) => (
                                    <tr key={issue.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{String(issue.issueDate).slice(0, 10)}</td>
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{issue.itemName}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{formatNumber(issue.quantity)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{issue.department}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{issue.receiverName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-xl px-3 py-1 text-xs font-black ${issue.approvalStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : issue.approvalStatus === 'rejected' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {statusLabel[issue.approvalStatus] || issue.approvalStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-start gap-2">
                                                {issue.approvalStatus === 'pending' ? (
                                                    <>
                                                        <button type="button" onClick={() => handleApprove(issue)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"><Check size={16} /></button>
                                                        <button type="button" onClick={() => handleReject(issue)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"><X size={16} /></button>
                                                    </>
                                                ) : null}
                                                <button type="button" onClick={() => openStorePrintPage(`/store/print/issue-slip/${issue.id}`)} className="rounded-xl bg-sky-500/10 p-2.5 text-sky-500 transition-all hover:bg-sky-500 hover:text-white" title="اجراء پرچی پرنٹ کریں"><Printer size={16} /></button>
                                                <button type="button" onClick={() => handleEdit(issue)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"><Edit2 size={16} /></button>
                                                <button type="button" onClick={() => setDeleteTarget(issue)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی اسٹاک اجراء ریکارڈ موجود نہیں۔</td></tr>
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
                                <h3 className="text-xl font-black text-[var(--color-text)]">اسٹاک اجراء حذف کرنے کی تصدیق</h3>
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
