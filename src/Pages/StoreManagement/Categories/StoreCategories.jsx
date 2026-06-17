import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, FolderTree, PackageCheck, Plus, Save, Search, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import { ExportExcelButton } from '../../../Components/Export/ExportExcelButton';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { createStoreCategory, deleteStoreCategory, getStoreCategories, updateStoreCategory } from '../../../Constant/StoreCategoriesApi';

const emptyForm = {
    name: '',
    description: '',
    status: 'active',
};

export const StoreCategories = () => {
    const [categories, setCategories] = useState([]);
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

    const loadCategories = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await getStoreCategories({ search });
            setCategories(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'کیٹیگریز لوڈ نہیں ہو سکیں۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(loadCategories, 250);
        return () => clearTimeout(timer);
    }, [search]);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
        setIsFormOpen(false);
    };

    const handleEdit = (category) => {
        setEditMode(category.id);
        setFormData({
            name: category.name || '',
            description: category.description || '',
            status: category.status || 'active',
        });
        setError('');
        setSuccess('');
        setIsFormOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) return setError('کیٹیگری کا نام درج کریں۔');

        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                status: formData.status,
            };

            if (editMode) {
                await updateStoreCategory(editMode, payload);
                setSuccess('کیٹیگری کامیابی سے اپ ڈیٹ ہو گئی۔');
            } else {
                await createStoreCategory(payload);
                setSuccess('نئی کیٹیگری کامیابی سے شامل ہو گئی۔');
            }

            resetForm();
            await loadCategories();
        } catch (saveError) {
            setError(saveError.message || 'کیٹیگری محفوظ نہیں ہو سکی۔');
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
            await deleteStoreCategory(deleteTarget.id);
            if (editMode === deleteTarget.id) resetForm();
            setDeleteTarget(null);
            setSuccess('کیٹیگری حذف کر دی گئی۔');
            await loadCategories();
        } catch (deleteError) {
            setError(deleteError.message || 'کیٹیگری حذف نہیں ہو سکی۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const exportColumns = useMemo(
        () => [
            { header: 'کیٹیگری', accessor: 'name' },
            { header: 'تفصیل', accessor: 'description' },
            { header: 'حالت', accessor: 'status' },
        ],
        [],
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                        <PackageCheck size={18} />
                        اسٹور مینجمنٹ
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">کیٹیگریز کا انتظام</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل کیٹیگریز: {categories.length}</p>
                </div>

                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                    <ExportExcelButton rows={categories} columns={exportColumns} fileName="store-categories-list" className="w-full md:w-auto" />
                    <div className="relative md:w-72">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="کیٹیگری تلاش کریں" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none" />
                    </div>
                    <button type="button" onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))} className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-all active:scale-95 ${isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white shadow-lg shadow-emerald-500/20'}`}>
                        {isFormOpen ? 'بند کریں' : 'نئی کیٹیگری'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                        <span>{editMode ? 'کیٹیگری میں ترمیم' : 'نئی کیٹیگری کا اندراج'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">کیٹیگری کا نام<span className="text-red-500"> *</span></label>
                            <div className="relative">
                                <FolderTree size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} placeholder="مثلاً راشن" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                            <div className="text-right">
                                <p className="text-sm font-black text-[var(--color-text)]">حالت</p>
                                <p className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">{formData.status === 'active' ? 'فعال کیٹیگری' : 'غیر فعال کیٹیگری'}</p>
                            </div>
                            <button type="button" onClick={() => setFormData((prev) => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }))} className={`rounded-xl p-2 transition-all ${formData.status === 'active' ? 'bg-emerald-500/10 text-[#00d094]' : 'bg-slate-500/10 text-[var(--color-text-muted)]'}`} title="حالت تبدیل کریں">
                                {formData.status === 'active' ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">تفصیل</label>
                            <textarea value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} placeholder="اختیاری تفصیل" rows={3} className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
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
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کیٹیگری</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">تفصیل</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">عمل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کیٹیگریز لوڈ ہو رہی ہیں...</td></tr>
                            ) : categories.length ? (
                                categories.map((category) => (
                                    <tr key={category.id} className={`border-t border-[var(--color-border)]/60 ${editMode === category.id ? 'bg-emerald-500/5' : ''}`}>
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{category.name}</td>
                                        <td className="max-w-md px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{category.description || '-'}</td>
                                        <td className="px-6 py-4"><span className={`rounded-xl px-3 py-1 text-xs font-black ${category.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{category.status === 'active' ? 'فعال' : 'غیر فعال'}</span></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-start gap-2">
                                                <button type="button" onClick={() => handleEdit(category)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white" title="ترمیم"><Edit2 size={16} /></button>
                                                <button type="button" onClick={() => setDeleteTarget(category)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white" title="حذف"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی کیٹیگری موجود نہیں۔</td></tr>
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
                                <h3 className="text-xl font-black text-[var(--color-text)]">کیٹیگری حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">کیا آپ واقعی <span className="text-rose-500">{deleteTarget.name}</span> کو حذف کرنا چاہتے ہیں؟</p>
                            </div>
                            <button type="button" onClick={() => !isDeleting && setDeleteTarget(null)} className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"><X size={18} /></button>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60">منسوخ کریں</button>
                            <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70">{isDeleting ? 'حذف ہو رہی ہے...' : 'حذف کریں'}</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
