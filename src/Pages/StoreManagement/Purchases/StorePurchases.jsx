import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Edit2, FileImage, PackagePlus, Plus, Printer, ReceiptText, Save, Search, Trash2, X } from 'lucide-react';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import {
    createStorePurchase,
    deleteStorePurchase,
    getStoreItems,
    getStorePurchases,
    getStoreSuppliers,
    openStorePrintPage,
    updateStorePurchase,
} from '../../../Constant/StoreApi';
import { getStoreUnits } from '../../../Constant/StoreUnitsApi';
import { formatAmountInput, parseAmountInput } from '../storeAmountFormat';

const today = () => new Date().toISOString().slice(0, 10);

const emptyItem = { itemId: '', quantity: '1', unitId: '', rate: '', total: 0 };

const emptyForm = {
    purchaseDate: today(),
    supplierId: '',
    supplierName: '',
    invoiceNumber: '',
    items: [emptyItem],
    paidAmount: '',
    paymentMethod: 'cash',
    invoiceImage: null,
};

const paymentMethods = [
    { value: 'cash', label: 'نقد' },
    { value: 'bank', label: 'بینک' },
    { value: 'online', label: 'آن لائن' },
    { value: 'cheque', label: 'چیک' },
];

const formatNumber = (value) => new Intl.NumberFormat('ur-PK', { maximumFractionDigits: 2 }).format(Number(value || 0));

export const StorePurchases = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [purchases, setPurchases] = useState([]);
    const [items, setItems] = useState([]);
    const [units, setUnits] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [search, setSearch] = useState(() => searchParams.get('search') || '');
    const [supplierFilter, setSupplierFilter] = useState(() => searchParams.get('supplierId') || '');
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

    const loadDependencies = async () => {
        setError('');
        const [itemsResult, suppliersResult, unitsResult] = await Promise.allSettled([
            getStoreItems(),
            getStoreSuppliers(),
            getStoreUnits({ activeOnly: 'true' }),
        ]);

        if (itemsResult.status === 'fulfilled') {
            setItems((itemsResult.value.items || []).filter((item) => item.status !== 'inactive'));
        } else {
            setItems([]);
            setError(itemsResult.reason?.message || 'اشیاء لوڈ نہیں ہو سکیں۔');
        }

        if (suppliersResult.status === 'fulfilled') {
            setSuppliers(suppliersResult.value.items || []);
        } else {
            setSuppliers([]);
            setError(suppliersResult.reason?.message || 'سپلائرز لوڈ نہیں ہو سکے۔');
        }

        if (unitsResult.status === 'fulfilled') {
            setUnits((unitsResult.value.items || []).filter((unit) => unit.status === 'active'));
        } else {
            setUnits([]);
            setError(unitsResult.reason?.message || 'اکائیاں لوڈ نہیں ہو سکیں۔');
        }
    };

    const loadPurchases = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getStorePurchases({
                search: search.trim(),
                supplierId: supplierFilter,
                fromDate,
                toDate,
            });
            setPurchases(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'خریداری کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDependencies().catch((loadError) => setError(loadError.message || 'ضروری معلومات لوڈ نہیں ہو سکیں۔'));
    }, []);

    useEffect(() => {
        const nextParams = new URLSearchParams();
        if (search.trim()) nextParams.set('search', search.trim());
        if (supplierFilter) nextParams.set('supplierId', supplierFilter);
        if (fromDate) nextParams.set('fromDate', fromDate);
        if (toDate) nextParams.set('toDate', toDate);
        setSearchParams(nextParams, { replace: true });

        const timer = setTimeout(loadPurchases, 250);
        return () => clearTimeout(timer);
    }, [search, supplierFilter, fromDate, toDate]);

    const resetFilters = () => {
        setSearch('');
        setSupplierFilter('');
        setFromDate('');
        setToDate('');
    };

    const totalAmount = useMemo(() => formData.items.reduce((sum, item) => sum + Number(item.total || 0), 0), [formData.items]);
    const paidAmount = parseAmountInput(formData.paidAmount);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
        setIsFormOpen(false);
    };

    const getItemDefaultUnitId = (itemId) => {
        const selectedItem = items.find((item) => Number(item.id) === Number(itemId));
        if (!selectedItem?.unit) return '';
        const unitName = String(selectedItem.unit).trim().toLowerCase();
        const matchedUnit = units.find((unit) => (
            String(unit.id) === String(selectedItem.unit)
            || String(unit.name || '').trim().toLowerCase() === unitName
            || String(unit.shortName || '').trim().toLowerCase() === unitName
        ));
        return matchedUnit ? String(matchedUnit.id) : '';
    };

    const updatePurchaseItem = (index, field, value) => {
        setFormData((prev) => {
            const nextItems = prev.items.map((item, itemIndex) => {
                if (itemIndex !== index) return item;
                const nextItem = { ...item, [field]: value };
                if (field === 'itemId' && !nextItem.unitId) {
                    nextItem.unitId = getItemDefaultUnitId(value);
                }
                const quantity = Number(nextItem.quantity || 0);
                const rate = parseAmountInput(nextItem.rate);
                return { ...nextItem, total: quantity * rate };
            });
            return { ...prev, items: nextItems };
        });
    };

    const addItemRow = () => {
        setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem] }));
    };

    const removeItemRow = (index) => {
        setFormData((prev) => ({ ...prev, items: prev.items.length > 1 ? prev.items.filter((_, itemIndex) => itemIndex !== index) : prev.items }));
    };

    const handleEdit = (purchase) => {
        setEditMode(purchase.id);
        setFormData({
            purchaseDate: purchase.purchaseDate ? String(purchase.purchaseDate).slice(0, 10) : today(),
            supplierId: String(purchase.supplierId || ''),
            supplierName: '',
            invoiceNumber: purchase.invoiceNumber || '',
            items: purchase.items?.length
                ? purchase.items.map((item) => ({
                      itemId: String(item.itemId),
                      quantity: String(item.quantity ?? 1),
                      unitId: item.unitId ? String(item.unitId) : getItemDefaultUnitId(item.itemId),
                      rate: formatAmountInput(item.unitPrice ?? item.rate ?? ''),
                      total: Number(item.total || 0),
                  }))
                : [emptyItem],
            paidAmount: formatAmountInput(purchase.paidAmount ?? ''),
            paymentMethod: purchase.paymentMethod || 'cash',
            invoiceImage: null,
        });
        setError('');
        setSuccess('');
        setIsFormOpen(true);
    };

    const validateForm = () => {
        if (!formData.purchaseDate) return 'خریداری کی تاریخ درج کرنا ضروری ہے۔';
        if (!formData.supplierId && !formData.supplierName.trim()) return 'سپلائر منتخب یا درج کرنا ضروری ہے۔';
        if (!formData.items.length) return 'کم از کم ایک شے شامل کریں۔';
        if (formData.items.some((item) => !item.itemId || Number(item.quantity) <= 0 || !item.unitId || parseAmountInput(item.rate) < 0 || item.rate === '')) return 'شے، مقدار، اکائی اور فی اکائی رقم درست درج کریں۔';
        if (parseAmountInput(formData.paidAmount) < 0) return 'ادا شدہ رقم درست درج کریں۔';
        if (parseAmountInput(formData.paidAmount) > totalAmount) return 'ادا شدہ رقم کل رقم سے زیادہ نہیں ہو سکتی۔';
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
                purchaseDate: formData.purchaseDate,
                supplierId: formData.supplierId,
                supplierName: formData.supplierName.trim(),
                invoiceNumber: formData.invoiceNumber.trim(),
                items: formData.items.map((item) => ({
                    itemId: Number(item.itemId),
                    quantity: Number(item.quantity),
                    unitId: Number(item.unitId),
                    unitPrice: parseAmountInput(item.rate),
                    rate: parseAmountInput(item.rate),
                    total: Number(item.total || 0),
                })),
                paidAmount: parseAmountInput(formData.paidAmount),
                paymentMethod: formData.paymentMethod,
                invoiceImage: formData.invoiceImage,
            };

            if (editMode) {
                await updateStorePurchase(editMode, payload);
                setSuccess('خریداری کامیابی سے اپ ڈیٹ ہو گئی۔');
            } else {
                await createStorePurchase(payload);
                setSuccess('خریداری کامیابی سے محفوظ ہو گئی۔');
            }

            resetForm();
            await Promise.all([loadDependencies(), loadPurchases()]);
        } catch (saveError) {
            setError(saveError.message || 'خریداری محفوظ نہیں ہو سکی۔');
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
            await deleteStorePurchase(deleteTarget.id);
            if (editMode === deleteTarget.id) resetForm();
            setDeleteTarget(null);
            setSuccess('خریداری کامیابی سے حذف ہو گئی۔');
            await Promise.all([loadDependencies(), loadPurchases()]);
        } catch (deleteError) {
            setError(deleteError.message || 'خریداری حذف نہیں ہو سکی۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const getItemName = (itemId) => items.find((item) => Number(item.id) === Number(itemId))?.itemName || 'شے';
    const getUnitName = (unitId) => units.find((unit) => Number(unit.id) === Number(unitId))?.name || '';
    const getUnitPriceLabel = (unitId) => (unitId ? `فی ${getUnitName(unitId) || 'اکائی'} رقم` : 'فی اکائی رقم');

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                <div className="shrink-0 text-right">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                        <ReceiptText size={18} />
                        اسٹور مینجمنٹ
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">خریداری مینجمنٹ</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل خریداری ریکارڈ: {purchases.length}</p>
                </div>

                <div className="flex w-full flex-col gap-3 md:flex-row md:flex-wrap md:justify-end xl:w-auto xl:flex-nowrap xl:items-center">
                    <div className="relative md:w-64 xl:w-60">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="سپلائر یا انوائس تلاش کریں"
                            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none"
                        />
                    </div>

                    <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none md:w-48 xl:w-44">
                        <option value="">تمام سپلائرز</option>
                        {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>{supplier.supplierName}</option>
                        ))}
                    </select>

                    <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none md:w-40" />
                    <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none md:w-40" />

                    <button type="button" onClick={resetFilters} className="h-12 shrink-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-black text-[var(--color-text)]">
                        فلٹر صاف کریں
                    </button>

                    <button
                        type="button"
                        onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
                        className={`flex shrink-0 items-center justify-center gap-3 rounded-2xl px-5 py-3 text-sm font-black transition-all active:scale-95 ${
                            isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white shadow-lg shadow-emerald-500/20'
                        }`}
                    >
                        {isFormOpen ? 'بند کریں' : 'نئی خریداری'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <PackagePlus size={20} />}
                        <span>{editMode ? 'خریداری میں ترمیم' : 'نئی خریداری کا اندراج'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">خریداری تاریخ</label>
                            <input type="date" value={formData.purchaseDate} onChange={(event) => setFormData((prev) => ({ ...prev, purchaseDate: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">سپلائر</label>
                            <select value={formData.supplierId} onChange={(event) => setFormData((prev) => ({ ...prev, supplierId: event.target.value, supplierName: '' }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                <option value="">نیا سپلائر درج کریں</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.supplierName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">نیا سپلائر نام</label>
                            <input disabled={Boolean(formData.supplierId)} value={formData.supplierName} onChange={(event) => setFormData((prev) => ({ ...prev, supplierName: event.target.value }))} placeholder="سپلائر کا نام" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none disabled:opacity-60 focus:border-[#00d094]" />
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">انوائس نمبر</label>
                            <input value={formData.invoiceNumber} onChange={(event) => setFormData((prev) => ({ ...prev, invoiceNumber: event.target.value }))} placeholder="انوائس نمبر" className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">ادائیگی طریقہ</label>
                            <select value={formData.paymentMethod} onChange={(event) => setFormData((prev) => ({ ...prev, paymentMethod: event.target.value }))} className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]">
                                {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">انوائس تصویر</label>
                            <label className="flex h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold text-[var(--color-text-muted)]">
                                <span className="truncate">{formData.invoiceImage?.name || 'تصویر منتخب کریں'}</span>
                                <FileImage size={18} />
                                <input type="file" accept="image/*" className="hidden" onChange={(event) => setFormData((prev) => ({ ...prev, invoiceImage: event.target.files?.[0] || null }))} />
                            </label>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-[var(--color-text)]">اشیاء کی فہرست</h3>
                            <button type="button" onClick={addItemRow} className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                                <Plus size={16} /> شے شامل کریں
                            </button>
                        </div>

                        {formData.items.map((purchaseItem, index) => (
                            <div key={index} className="grid grid-cols-1 gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 md:grid-cols-[2fr_1fr_1.2fr_1fr_1fr_auto]">
                                <select value={purchaseItem.itemId} onChange={(event) => updatePurchaseItem(index, 'itemId', event.target.value)} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none">
                                    <option value="">{items.length ? 'شے منتخب کریں' : 'کوئی شے موجود نہیں'}</option>
                                    {items.map((item) => <option key={item.id} value={item.id}>{item.itemName}</option>)}
                                </select>
                                <input type="number" min="0" value={purchaseItem.quantity} onChange={(event) => updatePurchaseItem(index, 'quantity', event.target.value)} placeholder="مقدار" className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none" />
                                <select value={purchaseItem.unitId || ''} onChange={(event) => updatePurchaseItem(index, 'unitId', event.target.value)} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none">
                                    <option value="">{units.length ? 'اکائی منتخب کریں' : 'کوئی اکائی موجود نہیں'}</option>
                                    {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                                </select>
                                <input type="text" inputMode="decimal" value={purchaseItem.rate} onChange={(event) => updatePurchaseItem(index, 'rate', formatAmountInput(event.target.value))} placeholder={getUnitPriceLabel(purchaseItem.unitId)} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none" />
                                <div className="flex h-12 items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-black text-[var(--color-text)]">روپے {formatNumber(purchaseItem.total)}</div>
                                <button type="button" onClick={() => removeItemRow(index)} className="h-12 rounded-xl bg-rose-500/10 px-4 text-rose-500 transition-all hover:bg-rose-500 hover:text-white">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                            <p className="text-xs font-black text-[var(--color-text-muted)]">کل رقم</p>
                            <p className="mt-2 text-xl font-black text-[var(--color-text)]">روپے {formatNumber(totalAmount)}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                            <p className="text-xs font-black text-[var(--color-text-muted)]">ادا شدہ رقم</p>
                            <input type="text" inputMode="decimal" value={formData.paidAmount} onChange={(event) => setFormData((prev) => ({ ...prev, paidAmount: formatAmountInput(event.target.value) }))} placeholder="0" className="mt-2 h-10 w-full bg-transparent text-right text-xl font-black text-[var(--color-text)] outline-none" />
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                            <p className="text-xs font-black text-[var(--color-text-muted)]">باقی رقم</p>
                            <p className="mt-2 text-xl font-black text-[var(--color-text)]">روپے {formatNumber(remainingAmount)}</p>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        {editMode ? <button type="button" onClick={resetForm} className="rounded-xl px-5 py-3 text-sm font-black text-[var(--color-text-muted)]">منسوخ کریں</button> : null}
                        <button type="button" onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-3 rounded-xl bg-[#218838] px-8 py-3 text-sm font-black text-white transition-all hover:bg-[#1a6d2c] disabled:opacity-70">
                            {isSaving ? 'محفوظ ہو رہی ہے...' : editMode ? 'اپ ڈیٹ کریں' : 'محفوظ کریں'}
                            {editMode ? <Save size={18} /> : <Plus size={18} />}
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr  className="text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-input)]/50">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">تاریخ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">سپلائر</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">انوائس</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">اشیاء</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کل رقم</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ادا شدہ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">باقی</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">عمل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">خریداری ریکارڈ لوڈ ہو رہے ہیں...</td></tr>
                            ) : purchases.length ? (
                                purchases.map((purchase) => (
                                    <tr key={purchase.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{String(purchase.purchaseDate).slice(0, 10)}</td>
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{purchase.supplierName}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{purchase.invoiceNumber || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{purchase.items?.map((item) => item.itemName || getItemName(item.itemId)).join('، ')}</td>
                                        <td className="px-6 py-4 text-sm font-black text-[var(--color-text)]">روپے {formatNumber(purchase.totalAmount)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">روپے {formatNumber(purchase.paidAmount)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-rose-500">روپے {formatNumber(purchase.remainingAmount)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-start gap-2">
                                                <button type="button" onClick={() => openStorePrintPage(`/store/print/invoice/${purchase.id}`)} className="rounded-xl bg-sky-500/10 p-2.5 text-sky-500 transition-all hover:bg-sky-500 hover:text-white" title="انوائس پرنٹ کریں"><Printer size={16} /></button>
                                                <button type="button" onClick={() => handleEdit(purchase)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"><Edit2 size={16} /></button>
                                                <button type="button" onClick={() => setDeleteTarget(purchase)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی خریداری ریکارڈ موجود نہیں۔</td></tr>
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
                                <h3 className="text-xl font-black text-[var(--color-text)]">خریداری حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">کیا آپ واقعی یہ خریداری ریکارڈ حذف کرنا چاہتے ہیں؟</p>
                            </div>
                            <button type="button" onClick={() => !isDeleting && setDeleteTarget(null)} className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"><X size={18} /></button>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:opacity-60">منسوخ کریں</button>
                            <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:opacity-70">{isDeleting ? 'حذف ہو رہی ہے...' : 'تصدیق کریں'}</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
