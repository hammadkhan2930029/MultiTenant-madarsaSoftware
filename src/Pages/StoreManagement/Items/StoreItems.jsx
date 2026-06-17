import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes, Edit2, Grid2X2, List, PackagePlus, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { createStoreItem, deleteStoreItem, getStoreItems, updateStoreItem } from '../../../Constant/StoreApi';
import { getStoreCategories } from '../../../Constant/StoreCategoriesApi';
import { getStoreUnits } from '../../../Constant/StoreUnitsApi';

const emptyForm = {
    itemName: '',
    category: '',
    unit: '',
    itemCode: '',
    quantity: '',
    purchasePrice: '',
};

const formatNumber = (value) => new Intl.NumberFormat('ur-PK', { maximumFractionDigits: 2 }).format(Number(value || 0));

export const StoreItems = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [items, setItems] = useState([]);
    const [units, setUnits] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState(() => searchParams.get('search') || '');
    const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || '');
    const [lowStockOnly, setLowStockOnly] = useState(() => searchParams.get('lowStock') === 'true');
    const [outOfStockOnly, setOutOfStockOnly] = useState(() => searchParams.get('outOfStock') === 'true');
    const [viewMode, setViewMode] = useState('table');
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

    const loadSetupData = async () => {
        try {
            const [unitResult, categoryResult] = await Promise.all([
                getStoreUnits({ activeOnly: 'true' }),
                getStoreCategories({ activeOnly: 'true' }),
            ]);
            const nextUnits = unitResult.items || [];
            const nextCategories = categoryResult.items || [];
            setUnits(nextUnits);
            setCategories(nextCategories);
            setFormData((prev) => ({
                ...prev,
                unit: prev.unit || nextUnits[0]?.shortName || '',
                category: prev.category || nextCategories[0]?.name || '',
            }));
        } catch (setupError) {
            setError(setupError.message || 'اکائیاں اور کیٹیگریز لوڈ نہیں ہو سکیں۔');
        }
    };

    const loadItems = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getStoreItems({
                search: search.trim(),
                category: categoryFilter,
                lowStock: lowStockOnly ? 'true' : '',
                outOfStock: outOfStockOnly ? 'true' : '',
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
        if (lowStockOnly) nextParams.set('lowStock', 'true');
        if (outOfStockOnly) nextParams.set('outOfStock', 'true');
        setSearchParams(nextParams, { replace: true });

        const timer = setTimeout(loadItems, 250);
        return () => clearTimeout(timer);
    }, [search, categoryFilter, lowStockOnly, outOfStockOnly]);

    const resetFilters = () => {
        setSearch('');
        setCategoryFilter('');
        setLowStockOnly(false);
        setOutOfStockOnly(false);
    };

    const categoryOptions = useMemo(() => {
        const options = categories.map((category) => category.name).filter(Boolean);
        if (categoryFilter && !options.includes(categoryFilter)) options.push(categoryFilter);
        return options;
    }, [categories, categoryFilter]);

    const getUnitLabel = (value) => units.find((unit) => unit.shortName === value)?.name || value || '-';

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
        setIsFormOpen(false);
    };

    const handleEdit = (item) => {
        setEditMode(item.id);
        setFormData({
            itemName: item.itemName || '',
            category: item.category || '',
            unit: item.unit || units[0]?.shortName || '',
            itemCode: item.itemCode || '',
            quantity: String(item.currentStock ?? ''),
            purchasePrice: String(item.purchasePrice ?? ''),
        });
        setError('');
        setSuccess('');
        setIsFormOpen(true);
    };

    const validateForm = () => {
        if (!formData.itemName.trim()) return 'شے کا نام درج کرنا ضروری ہے۔';
        if (!formData.category.trim()) return 'کیٹیگری منتخب کریں۔';
        if (!formData.unit) return 'اکائی منتخب کریں۔';
        if (!formData.itemCode.trim()) return 'آئٹم کوڈ درج کرنا ضروری ہے۔';
        if (Number(formData.quantity) < 0 || formData.quantity === '') return 'مقدار درست درج کریں۔';
        if (Number(formData.purchasePrice) < 0 || formData.purchasePrice === '') return 'خریداری قیمت درست درج کریں۔';
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
                unit: formData.unit,
                itemCode: formData.itemCode.trim(),
                quantity: Number(formData.quantity),
                purchasePrice: Number(formData.purchasePrice),
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
            setSuccess('شے کامیابی سے حذف ہو گئی۔');
            await loadItems();
        } catch (deleteError) {
            setError(deleteError.message || 'شے حذف نہیں ہو سکی۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const renderActions = (item) => (
        <div className="flex items-center justify-start gap-2">
            <button
                type="button"
                onClick={() => handleEdit(item)}
                className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"
                title="ترمیم"
            >
                <Edit2 size={16} />
            </button>
            <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                title="حذف"
            >
                <Trash2 size={16} />
            </button>
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
                    <div className="flex h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-1">
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`flex h-10 flex-1 items-center justify-center rounded-xl transition-all ${viewMode === 'table' ? 'bg-[#00d094] text-white' : 'text-[var(--color-text-muted)]'}`}
                            title="فہرست"
                        >
                            <List size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('card')}
                            className={`flex h-10 flex-1 items-center justify-center rounded-xl transition-all ${viewMode === 'card' ? 'bg-[#00d094] text-white' : 'text-[var(--color-text-muted)]'}`}
                            title="کارڈ"
                        >
                            <Grid2X2 size={18} />
                        </button>
                    </div>

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

                    <label className="flex h-12 min-w-0 w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-black text-[var(--color-text)]">
                        <input type="checkbox" checked={lowStockOnly} onChange={(event) => { setLowStockOnly(event.target.checked); if (event.target.checked) setOutOfStockOnly(false); }} className="h-4 w-4 accent-[#00d094]" />
                        کم اسٹاک
                    </label>

                    <label className="flex h-12 min-w-0 w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-black text-[var(--color-text)]">
                        <input type="checkbox" checked={outOfStockOnly} onChange={(event) => { setOutOfStockOnly(event.target.checked); if (event.target.checked) setLowStockOnly(false); }} className="h-4 w-4 accent-[#00d094]" />
                        ختم اسٹاک
                    </label>

                    <button type="button" onClick={resetFilters} className="h-12 w-full whitespace-nowrap rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 text-sm font-black text-[var(--color-text)]">
                        فلٹر صاف کریں
                    </button>

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
                </div>
            </div>

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <PackagePlus size={20} />}
                        <span>{editMode ? 'شے میں ترمیم' : 'نئی شے کا اندراج'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">شے کا نام<span className="text-red-500"> *</span></label>
                            <input value={formData.itemName} onChange={(event) => setFormData((prev) => ({ ...prev, itemName: event.target.value }))} placeholder="مثلاً کتاب" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">کیٹیگری<span className="text-red-500"> *</span></label>
                            <select value={formData.category} onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                <option value="">کیٹیگری منتخب کریں</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.name}>{category.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">اکائی<span className="text-red-500"> *</span></label>
                            <select value={formData.unit} onChange={(event) => setFormData((prev) => ({ ...prev, unit: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                <option value="">اکائی منتخب کریں</option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.shortName}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">آئٹم کوڈ<span className="text-red-500"> *</span></label>
                            <input value={formData.itemCode} onChange={(event) => setFormData((prev) => ({ ...prev, itemCode: event.target.value }))} placeholder="مثلاً ITM-001" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">مقدار<span className="text-red-500"> *</span></label>
                            <input type="number" min="0" value={formData.quantity} onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="0" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">خریداری قیمت<span className="text-red-500"> *</span></label>
                            <input type="number" min="0" value={formData.purchasePrice} onChange={(event) => setFormData((prev) => ({ ...prev, purchasePrice: event.target.value }))} placeholder="0" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
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

            {viewMode === 'table' ? (
                <div className="hidden overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm md:block">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="text-[var(--color-text-muted)]">
                                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">شے</th>
                                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کیٹیگری</th>
                                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">اکائی</th>
                                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">آئٹم کوڈ</th>
                                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">مقدار</th>
                                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">خریداری قیمت</th>
                                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">عمل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="7" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">اشیاء لوڈ ہو رہی ہیں...</td></tr>
                                ) : items.length ? (
                                    items.map((item) => (
                                        <tr key={item.id} className="border-t border-[var(--color-border)]/60">
                                            <td className="px-6 py-4 font-black text-[var(--color-text)]">{item.itemName}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{item.category}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{getUnitLabel(item.unit)}</td>
                                            <td className="px-6 py-4 text-sm font-black text-[var(--color-text)]">{item.itemCode}</td>
                                            <td className="px-6 py-4 text-sm font-black text-[var(--color-text)]">{formatNumber(item.currentStock)}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">روپے {formatNumber(item.purchasePrice)}</td>
                                            <td className="px-6 py-4">{renderActions(item)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی شے موجود نہیں۔</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            <div className={`${viewMode === 'table' ? 'grid md:hidden' : 'grid'} grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`}>
                {isLoading ? (
                    [1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]" />)
                ) : items.length ? (
                    items.map((item) => (
                        <div key={item.id} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="text-right">
                                    <h3 className="text-lg font-black text-[var(--color-text)]">{item.itemName}</h3>
                                    <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">{item.category} - {getUnitLabel(item.unit)}</p>
                                </div>
                                <div className="rounded-2xl bg-emerald-500/10 p-3 text-[#00d094]"><Boxes size={20} /></div>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-bold">
                                <span className="text-[var(--color-text-muted)]">آئٹم کوڈ</span><span className="text-left text-[var(--color-text)]">{item.itemCode}</span>
                                <span className="text-[var(--color-text-muted)]">مقدار</span><span className="text-left text-[var(--color-text)]">{formatNumber(item.currentStock)}</span>
                                <span className="text-[var(--color-text-muted)]">خریداری قیمت</span><span className="text-left text-[var(--color-text)]">روپے {formatNumber(item.purchasePrice)}</span>
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
