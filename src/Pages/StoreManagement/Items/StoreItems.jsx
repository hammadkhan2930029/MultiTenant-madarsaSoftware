import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes, Edit2, Eye, PackagePlus, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { createStoreItem, deleteStoreItem, getStoreItems, updateStoreItem } from '../../../Constant/StoreApi';
import { getStoreCategories } from '../../../Constant/StoreCategoriesApi';
import { usePermissions } from '../../../Hooks/usePermissions';

const emptyForm = {
    itemName: '',
    category: '',
    description: '',
    status: 'active',
};

const statusLabels = {
    active: 'فعال',
    inactive: 'غیر فعال',
};

export const StoreItems = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const formSectionRef = useRef(null);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState(() => searchParams.get('search') || '');
    const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || '');
    const [formData, setFormData] = useState(emptyForm);
    const [editMode, setEditMode] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [viewTarget, setViewTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { isSuperAdmin, hasPermission } = usePermissions();
    const canCreateItem = isSuperAdmin || hasPermission('store.items.create');
    const canEditItem = isSuperAdmin || hasPermission('store.items.edit');
    const canDeleteItem = isSuperAdmin || hasPermission('store.items.delete');

    useNotificationBridge({ error, success });

    const loadSetupData = async () => {
        try {
            const categoryResult = await getStoreCategories({ activeOnly: 'true' });
            const nextCategories = categoryResult.items || [];
            setCategories(nextCategories);
            setFormData((prev) => ({
                ...prev,
                category: prev.category || nextCategories[0]?.name || '',
            }));
        } catch (setupError) {
            setError(setupError.message || 'کیٹیگریز لوڈ نہیں ہو سکیں۔');
        }
    };

    const loadItems = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getStoreItems({
                search: search.trim(),
                category: categoryFilter,
                includeInactive: 'true',
            });
            setItems(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'اشیاء کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSetupData();
    }, []);

    useEffect(() => {
        const nextParams = new URLSearchParams();
        if (search.trim()) nextParams.set('search', search.trim());
        if (categoryFilter) nextParams.set('category', categoryFilter);
        setSearchParams(nextParams, { replace: true });

        const timer = setTimeout(loadItems, 250);
        return () => clearTimeout(timer);
    }, [search, categoryFilter]);

    const resetFilters = () => {
        setSearch('');
        setCategoryFilter('');
    };

    const categoryOptions = useMemo(() => {
        const options = categories.map((category) => category.name).filter(Boolean);
        if (categoryFilter && !options.includes(categoryFilter)) options.push(categoryFilter);
        return options;
    }, [categories, categoryFilter]);

    const activeCategoryNames = useMemo(() => new Set(categories.map((category) => category.name).filter(Boolean)), [categories]);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
        setIsFormOpen(false);
    };

    const scrollToForm = () => {
        window.setTimeout(() => {
            formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    const handleEdit = (item) => {
        const canKeepCategory = activeCategoryNames.has(item.category);
        setEditMode(item.id);
        setFormData({
            itemName: item.itemName || '',
            category: canKeepCategory ? item.category || '' : '',
            description: item.description || '',
            status: item.status || 'active',
        });
        setError('');
        setSuccess('');
        setIsFormOpen(true);
        scrollToForm();
    };

    const validateForm = () => {
        const itemName = formData.itemName.trim();
        const category = formData.category.trim();
        if (!category) return 'کیٹیگری منتخب کریں۔';
        if (!activeCategoryNames.has(category)) return 'فعال کیٹیگری منتخب کریں۔';
        if (!itemName) return 'شے کا نام درج کرنا ضروری ہے۔';
        if (!['active', 'inactive'].includes(formData.status)) return 'حالت درست منتخب کریں۔';

        const duplicate = items.some((item) => (
            Number(item.id) !== Number(editMode)
            && String(item.category || '').trim() === category
            && String(item.itemName || '').trim().toLowerCase() === itemName.toLowerCase()
        ));
        if (duplicate) return 'اسی کیٹیگری میں یہ شے پہلے سے موجود ہے۔';

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
                itemName: formData.itemName.trim(),
                category: formData.category.trim(),
                description: formData.description.trim(),
                status: formData.status,
            };

            if (editMode) {
                await updateStoreItem(editMode, payload);
                setSuccess('شے کامیابی سے اپ ڈیٹ ہو گئی۔');
            } else {
                await createStoreItem(payload);
                setSuccess('نئی شے کامیابی سے شامل ہو گئی۔');
            }

            resetForm();
            await loadItems();
        } catch (saveError) {
            setError(saveError.message || 'شے محفوظ نہیں ہو سکی۔');
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
            await deleteStoreItem(deleteTarget.id);
            if (editMode === deleteTarget.id) resetForm();
            setDeleteTarget(null);
            setSuccess('شے غیر فعال کر دی گئی ہے۔');
            await loadItems();
        } catch (deleteError) {
            setError(deleteError.message || 'شے حذف نہیں ہو سکی۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const renderStatusBadge = (status = 'active') => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${status === 'active' ? 'bg-emerald-500/10 text-[#00d094]' : 'bg-rose-500/10 text-rose-500'}`}>
            {statusLabels[status] || status}
        </span>
    );

    const renderActions = (item) => (
        <div className="flex items-center justify-start gap-2">
            <button
                type="button"
                onClick={() => setViewTarget(item)}
                className="rounded-xl bg-sky-500/10 p-2.5 text-sky-500 transition-all hover:bg-sky-500 hover:text-white"
                title="دیکھیں"
            >
                <Eye size={16} />
            </button>
            {canEditItem ? (
                <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"
                    title="ترمیم"
                >
                    <Edit2 size={16} />
                </button>
            ) : null}
            {canDeleteItem ? (
                <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                    title="حذف"
                >
                    <Trash2 size={16} />
                </button>
            ) : null}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="grid gap-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                <div className="flex flex-col gap-3 text-right sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                            <Boxes size={18} />
                            اسٹور مینجمنٹ
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">اشیاء مینجمنٹ</h2>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-muted)]">کل اشیاء: {items.length}</p>
                </div>

                <div className="grid w-full grid-cols-1 items-center gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="relative min-w-0">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="شے کا نام تلاش کریں"
                            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none"
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(event) => setCategoryFilter(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold text-[var(--color-text)] outline-none"
                    >
                        <option value="">تمام کیٹیگریز</option>
                        {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <button type="button" onClick={resetFilters} className="h-12 w-full whitespace-nowrap rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 text-sm font-black text-[var(--color-text)]">
                        فلٹر صاف کریں
                    </button>

                    {canCreateItem ? (
                        <button
                            type="button"
                            onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
                            className={`flex h-12 w-full items-center justify-center gap-3 whitespace-nowrap rounded-2xl px-6 text-sm font-black transition-all active:scale-95 ${
                                isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white shadow-lg shadow-emerald-500/20'
                            }`}
                        >
                            {isFormOpen ? 'بند کریں' : 'نئی شے شامل کریں'}
                            {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                        </button>
                    ) : null}
                </div>
            </div>

            {isFormOpen ? (
                <div ref={formSectionRef} className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <PackagePlus size={20} />}
                        <span>{editMode ? 'شے میں ترمیم' : 'نئی شے کا اندراج'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">کیٹیگری منتخب کریں<span className="text-red-500"> *</span></label>
                            <select value={formData.category} onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                <option value="">کیٹیگری منتخب کریں</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.name}>{category.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">شے کا نام<span className="text-red-500"> *</span></label>
                            <input value={formData.itemName} onChange={(event) => setFormData((prev) => ({ ...prev, itemName: event.target.value }))} placeholder="مثلاً کتاب" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">حالت<span className="text-red-500"> *</span></label>
                            <select value={formData.status} onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                <option value="active">فعال</option>
                                <option value="inactive">غیر فعال</option>
                            </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">مختصر تفصیل</label>
                            <textarea value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} placeholder="اختیاری تفصیل لکھیں" rows="3" className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        {editMode ? (
                            <button type="button" onClick={resetForm} className="rounded-xl px-5 py-3 text-sm font-black text-[var(--color-text-muted)]">
                                منسوخ کریں
                            </button>
                        ) : null}
                        <button type="button" onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-3 rounded-xl bg-[#218838] px-8 py-3 text-sm font-black text-white transition-all hover:bg-[#1a6d2c] disabled:opacity-70">
                            {isSaving ? 'محفوظ ہو رہا ہے...' : editMode ? 'اپ ڈیٹ کریں' : 'محفوظ کریں'}
                            {editMode ? <Save size={18} /> : <Plus size={18} />}
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="hidden overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm md:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr  className="text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-input)]/50">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">شے کا نام</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کیٹیگری</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کارروائی</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">اشیاء لوڈ ہو رہی ہیں...</td></tr>
                            ) : items.length ? (
                                items.map((item) => (
                                    <tr key={item.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{item.itemName}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{item.category}</td>
                                        <td className="px-6 py-4">{renderStatusBadge(item.status)}</td>
                                        <td className="px-6 py-4">{renderActions(item)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی شے موجود نہیں۔</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
                {isLoading ? (
                    [1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]" />)
                ) : items.length ? (
                    items.map((item) => (
                        <div key={item.id} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="text-right">
                                    <h3 className="text-lg font-black text-[var(--color-text)]">{item.itemName}</h3>
                                    <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">{item.category}</p>
                                    <div className="mt-3">{renderStatusBadge(item.status)}</div>
                                </div>
                                <div className="rounded-2xl bg-emerald-500/10 p-3 text-[#00d094]"><Boxes size={20} /></div>
                            </div>
                            <div className="mt-5">{renderActions(item)}</div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                        کوئی شے موجود نہیں۔
                    </div>
                )}
            </div>

            {viewTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text)]">شے کی تفصیل</h3>
                                <p className="mt-3 text-sm font-bold text-[var(--color-text-muted)]">{viewTarget.itemName}</p>
                            </div>
                            <button type="button" onClick={() => setViewTarget(null)} className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="mt-6 space-y-4 text-sm font-bold">
                            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                                <span className="text-[var(--color-text-muted)]">کیٹیگری</span>
                                <span className="text-[var(--color-text)]">{viewTarget.category}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                                <span className="text-[var(--color-text-muted)]">حالت</span>
                                {renderStatusBadge(viewTarget.status)}
                            </div>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                                <p className="mb-2 text-[var(--color-text-muted)]">مختصر تفصیل</p>
                                <p className="leading-7 text-[var(--color-text)]">{viewTarget.description || '---'}</p>
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
                                <h3 className="text-xl font-black text-[var(--color-text)]">شے حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                    کیا آپ واقعی <span className="text-rose-500">{deleteTarget.itemName}</span> کو حذف کرنا چاہتے ہیں؟
                                </p>
                            </div>
                            <button type="button" onClick={() => !isDeleting && setDeleteTarget(null)} className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60">
                                منسوخ کریں
                            </button>
                            <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70">
                                {isDeleting ? 'حذف ہو رہی ہے...' : 'تصدیق کریں'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
