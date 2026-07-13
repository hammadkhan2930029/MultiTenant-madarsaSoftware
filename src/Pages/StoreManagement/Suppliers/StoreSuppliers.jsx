import React, { useEffect, useState } from 'react';
import { Edit2, Eye, Plus, Save, Search, Store, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { createStoreSupplier, deleteStoreSupplier, getStoreSuppliers, updateStoreSupplier } from '../../../Constant/StoreApi';
import { formatAmountInput, parseAmountInput } from '../storeAmountFormat';

const emptyForm = {
    supplierName: '',
    mobileNumber: '',
    address: '',
    shopName: '',
    balance: '0',
};

const formatNumber = (value) => new Intl.NumberFormat('ur-PK', { maximumFractionDigits: 2 }).format(Number(value || 0));

export const StoreSuppliers = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [search, setSearch] = useState('');
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

    const loadSuppliers = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getStoreSuppliers();
            setSuppliers(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'سپلائرز کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    const filteredSuppliers = suppliers.filter((supplier) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return [supplier.supplierName, supplier.mobileNumber, supplier.shopName, supplier.address]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
    });

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
        setIsFormOpen(false);
    };

    const handleEdit = (supplier) => {
        setEditMode(supplier.id);
        setFormData({
            supplierName: supplier.supplierName || '',
            mobileNumber: supplier.mobileNumber || '',
            address: supplier.address || '',
            shopName: supplier.shopName || '',
            balance: formatAmountInput(supplier.balance ?? 0),
        });
        setIsFormOpen(true);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async () => {
        if (!formData.supplierName.trim()) {
            setError('سپلائر کا نام درج کرنا ضروری ہے۔');
            return;
        }

        if (parseAmountInput(formData.balance) < 0) {
            setError('بیلنس درست درج کریں۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                supplierName: formData.supplierName.trim(),
                mobileNumber: formData.mobileNumber.trim(),
                address: formData.address.trim(),
                shopName: formData.shopName.trim(),
                balance: parseAmountInput(formData.balance),
            };

            if (editMode) {
                await updateStoreSupplier(editMode, payload);
                setSuccess('سپلائر کامیابی سے اپ ڈیٹ ہو گیا۔');
            } else {
                await createStoreSupplier(payload);
                setSuccess('نیا سپلائر کامیابی سے شامل ہو گیا۔');
            }

            resetForm();
            await loadSuppliers();
        } catch (saveError) {
            setError(saveError.message || 'سپلائر محفوظ نہیں ہو سکا۔');
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
            await deleteStoreSupplier(deleteTarget.id);
            if (editMode === deleteTarget.id) resetForm();
            setDeleteTarget(null);
            setSuccess('سپلائر کامیابی سے حذف ہو گیا۔');
            await loadSuppliers();
        } catch (deleteError) {
            setError(deleteError.message || 'سپلائر حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                        <Store size={18} />
                        اسٹور مینجمنٹ
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">سپلائر مینجمنٹ</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل سپلائرز: {filteredSuppliers.length}</p>
                </div>

                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                    <div className="relative md:w-72">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="سپلائر تلاش کریں" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none" />
                    </div>
                    <button type="button" onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))} className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-all active:scale-95 ${isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white shadow-lg shadow-emerald-500/20'}`}>
                        {isFormOpen ? 'بند کریں' : 'نیا سپلائر'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                        <span>{editMode ? 'سپلائر میں ترمیم' : 'نیا سپلائر'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">سپلائر کا نام<span className="text-red-500"> *</span></label>
                            <input value={formData.supplierName} onChange={(event) => setFormData((prev) => ({ ...prev, supplierName: event.target.value }))} placeholder="سپلائر کا نام" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">موبائل نمبر</label>
                            <input value={formData.mobileNumber} onChange={(event) => setFormData((prev) => ({ ...prev, mobileNumber: event.target.value }))} placeholder="موبائل نمبر" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">دکان کا نام</label>
                            <input value={formData.shopName} onChange={(event) => setFormData((prev) => ({ ...prev, shopName: event.target.value }))} placeholder="دکان کا نام" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">بیلنس</label>
                            <input type="text" inputMode="decimal" value={formData.balance} onChange={(event) => setFormData((prev) => ({ ...prev, balance: formatAmountInput(event.target.value) }))} placeholder="0" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">پتہ</label>
                            <input value={formData.address} onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))} placeholder="مکمل پتہ" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
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
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">سپلائر</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">موبائل</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">دکان</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">بیلنس</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">عمل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">سپلائرز لوڈ ہو رہے ہیں...</td></tr>
                            ) : filteredSuppliers.length ? (
                                filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{supplier.supplierName}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{supplier.mobileNumber || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{supplier.shopName || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-black text-[var(--color-text)]">روپے {formatNumber(supplier.balance)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-start gap-2">
                                                <button type="button" onClick={() => navigate(`/store/suppliers/${supplier.id}`)} className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500 transition-all hover:bg-blue-500 hover:text-white"><Eye size={16} /></button>
                                                <button type="button" onClick={() => handleEdit(supplier)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"><Edit2 size={16} /></button>
                                                <button type="button" onClick={() => setDeleteTarget(supplier)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی سپلائر موجود نہیں۔</td></tr>
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
                                <h3 className="text-xl font-black text-[var(--color-text)]">سپلائر حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">کیا آپ واقعی <span className="text-rose-500">{deleteTarget.supplierName}</span> کو حذف کرنا چاہتے ہیں؟</p>
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
