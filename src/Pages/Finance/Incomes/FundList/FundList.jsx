import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Eye, FileText, Phone, Printer, Save, Trash2, Wallet, X } from 'lucide-react';
import { DateField, InputField } from '../../../../Components/HR/FormElements';
import { useNotificationBridge } from '../../../../Components/Notifications/useNotificationBridge';
import { deactivateFundCollection, getFundCollections, updateFundCollection } from '../../../../Constant/FundCollectionsApi';
import { printFundReceipt } from '../../../../Utils/FundReceiptPrint';

const PAGE_SIZE = 10;

const donationTypes = {
    'صدقات واجبہ': ['زکوٰۃ', 'عشر', 'فطرانہ', 'کفارہ', 'فدیہ'],
    'صدقات نافلہ': ['صدقہ', 'خیرات', 'تعمیرات', 'مدرسہ فنڈ', 'دیگر'],
};

const paymentModes = ['نقد', 'چیک', 'آن لائن'];

const formatAmount = (value) => Number(value || 0).toLocaleString('en-US');
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('ur-PK') : '---');
const toDateInputValue = (value) => (value ? new Date(value).toISOString().split('T')[0] : '');
const getFieldValue = (valueOrEvent) => valueOrEvent?.target?.value ?? valueOrEvent ?? '';

const createEditForm = (fund) => ({
    collectionGroupId: fund.collectionGroupId || `FG-${fund.id}`,
    donorName: fund.donorName || '',
    careOf: fund.careOf || '',
    phone: fund.phone || '',
    paymentMode: fund.paymentMode || 'نقد',
    donationType: fund.donationType || 'صدقات واجبہ',
    donationSubType: fund.donationSubType || 'زکوٰۃ',
    purpose: fund.purpose || '',
    amount: String(fund.amount || ''),
    receiptNo: fund.receiptNo || '',
    details: fund.details || '',
    paymentDate: toDateInputValue(fund.paymentDate),
    remarks: fund.remarks || '',
});

const buildQuery = ({ searchTerm, startDate, endDate, page }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), status: 'active' });
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (startDate) params.set('fromDate', startDate);
    if (endDate) params.set('toDate', endDate);
    return params.toString();
};

const toUrduFundError = (message, fallback) => {
    if (!message) return fallback;
    if (/phone|contact/i.test(message)) return 'درست رابطہ نمبر درج کریں، مثلاً 03001234567۔';
    if (/amount/i.test(message)) return 'رقم درست درج کریں۔';
    if (/date/i.test(message)) return 'درست تاریخ منتخب کریں۔';
    if (/not found/i.test(message)) return 'ریکارڈ نہیں ملا۔';
    return message;
};

export const FundList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [funds, setFunds] = useState([]);
    const [meta, setMeta] = useState({ totalItems: 0, totalPages: 1, currentPage: 1, perPage: PAGE_SIZE });
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFund, setSelectedFund] = useState(null);
    const [editingFund, setEditingFund] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const totalAmount = useMemo(
        () => funds.reduce((sum, fund) => sum + Number(fund.amount || 0), 0),
        [funds]
    );

    const loadFunds = async (nextPage = page) => {
        try {
            setIsLoading(true);
            setError('');
            const data = await getFundCollections(buildQuery({ searchTerm, startDate, endDate, page: nextPage }));
            setFunds(data.items || []);
            setMeta(data.meta || { totalItems: 0, totalPages: 1, currentPage: nextPage, perPage: PAGE_SIZE });
            setPage(nextPage);
        } catch (err) {
            setError(toUrduFundError(err?.message, 'عطیات کی فہرست لوڈ نہیں ہو سکی۔'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFunds(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => loadFunds(1);

    const handleSearchKeyDown = (event) => {
        if (event.key === 'Enter') handleSearch();
    };

    const handleGroupedPrint = async (fund) => {
        try {
            setError('');
            const groupId = fund.collectionGroupId || `FG-${fund.id}`;
            const data = await getFundCollections(`collectionGroupId=${encodeURIComponent(groupId)}&page=1&limit=100&status=active`);
            const receiptFunds = data.items?.length ? data.items : [fund];
            printFundReceipt({
                collectionGroupId: groupId,
                funds: receiptFunds,
                donorInfo: {
                    name: fund.donorName,
                    careOf: fund.careOf,
                    number: fund.phone,
                },
            });
        } catch (err) {
            setError(toUrduFundError(err?.message, 'رسید پرنٹ نہیں ہو سکی۔'));
        }
    };

    const startEdit = (fund) => {
        setEditingFund(fund);
        setEditForm(createEditForm(fund));
        setError('');
        setSuccess('');
    };

    const handleEditChange = (field, value) => {
        setEditForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'donationType') {
                next.donationSubType = donationTypes[value]?.[0] || '';
            }
            return next;
        });
    };

    const closeEdit = () => {
        setEditingFund(null);
        setEditForm(null);
    };

    const saveEdit = async (event) => {
        event.preventDefault();
        if (!editingFund || !editForm) return;

        setError('');
        setSuccess('');

        if (!editForm.donorName.trim() || !editForm.phone.trim() || !editForm.amount || !editForm.paymentDate) {
            setError('براہ کرم نام، رابطہ نمبر، رقم اور تاریخ مکمل کریں۔');
            return;
        }

        setIsSaving(true);
        try {
            await updateFundCollection(editingFund.id, {
                ...editForm,
                donorName: editForm.donorName.trim(),
                careOf: editForm.careOf.trim(),
                phone: editForm.phone.trim(),
                purpose: editForm.purpose.trim(),
                amount: Number(editForm.amount),
                receiptNo: editForm.receiptNo.trim(),
                details: editForm.details.trim(),
                remarks: editForm.remarks.trim(),
                status: 'active',
            });
            setSuccess('عطیہ کا ریکارڈ کامیابی سے تبدیل ہو گیا۔');
            closeEdit();
            await loadFunds(page);
        } catch (err) {
            setError(toUrduFundError(err?.message, 'عطیہ کا ریکارڈ تبدیل نہیں ہو سکا۔'));
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
            await deactivateFundCollection(deleteTarget.id);
            setSuccess('عطیہ کا ریکارڈ کامیابی سے حذف ہو گیا۔');
            setDeleteTarget(null);
            const nextPage = funds.length === 1 && page > 1 ? page - 1 : page;
            await loadFunds(nextPage);
        } catch (err) {
            setError(toUrduFundError(err?.message, 'عطیہ کا ریکارڈ حذف نہیں ہو سکا۔'));
        } finally {
            setIsDeleting(false);
        }
    };

    const canGoPrev = page > 1;
    const canGoNext = page < (meta.totalPages || 1);

    return (
        <div className="min-h-screen p-3 md:p-6 font-urdu bg-[var(--color-bg)] text-[var(--color-text-main)] transition-colors duration-300" dir="rtl">
            <div className="mb-6 flex flex-col gap-5 pb-6 px-4 md:px-6 py-5 rounded-[1.5rem] md:rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-xl md:text-2xl font-bold text-[var(--color-primary)]">عطیات کی فہرست</h1>
                    <div className="flex flex-wrap gap-2 justify-end">
                        <span className="text-[10px] md:text-sm px-5 py-3 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]">
                            کل ریکارڈ: {meta.totalItems || 0}
                        </span>
                        <span className="text-[10px] md:text-sm px-5 py-3 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]">
                            اس صفحہ کی رقم: {formatAmount(totalAmount)}/-
                        </span>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
                    <div className="relative w-full min-w-0 xl:flex-1">
                        <InputField
                            type="text"
                            placeholder="نام، رابطہ نمبر، مقصد یا رسید نمبر..."
                            className="w-full pr-10 pl-4 py-3 rounded-xl focus:outline-none border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-text-main)] focus:border-[var(--color-primary)] transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>

                    <div className="flex flex-row items-center gap-2 w-full xl:w-auto xl:shrink-0">
                        <div className="min-w-0 flex-1 xl:flex-none xl:w-[150px]">
                            <DateField
                                value={startDate}
                                onChange={(nextValue) => setStartDate(getFieldValue(nextValue))}
                                max={endDate || undefined}
                                placeholder="شروع"
                                size="sm"
                            />
                        </div>
                        <span className="text-[var(--color-text-muted)] text-[10px] font-bold">تا</span>
                        <div className="min-w-0 flex-1 xl:flex-none xl:w-[150px]">
                            <DateField
                                value={endDate}
                                onChange={(nextValue) => setEndDate(getFieldValue(nextValue))}
                                min={startDate || undefined}
                                placeholder="اختتام"
                                size="sm"
                            />
                        </div>
                    </div>

                    <button onClick={handleSearch} disabled={isLoading} className="w-full xl:w-[220px] xl:shrink-0 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-[14px] bg-[var(--color-primary)] text-[#0b1120] hover:bg-[var(--color-primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed">
                        {isLoading ? 'لوڈ ہو رہا ہے...' : 'تلاش کریں'}
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-right">
                        <thead className="bg-[var(--color-bg)] text-[11px] text-[var(--color-text-muted)]">
                            <tr>
                                <th className="p-4">تاریخ</th>
                                <th className="p-4">نام دہندہ</th>
                                <th className="p-4">رابطہ</th>
                                <th className="p-4">قسم</th>
                                <th className="p-4">ادائیگی</th>
                                <th className="p-4">رسید</th>
                                <th className="p-4">رقم</th>
                                <th className="p-4 text-center">کارروائی</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center text-[var(--color-text-muted)]">فہرست لوڈ ہو رہی ہے...</td>
                                </tr>
                            ) : funds.length ? funds.map((fund) => (
                                <tr key={fund.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg)]/50 transition-colors">
                                    <td className="p-4 text-xs font-mono whitespace-nowrap">{formatDate(fund.paymentDate)}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-[var(--color-text-main)]">{fund.donorName || '---'}</p>
                                        <p className="text-[10px] text-[var(--color-text-muted)]">{fund.careOf || '---'}</p>
                                    </td>
                                    <td className="p-4 text-sm font-semibold" dir="ltr">
                                        <span className="inline-flex items-center gap-2"><Phone size={14} />{fund.phone || '---'}</span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-bold">{fund.donationSubType || fund.donationType || '---'}</p>
                                        <p className="text-[10px] text-[var(--color-text-muted)]">{fund.donationType || '---'}</p>
                                    </td>
                                    <td className="p-4 text-sm">{fund.paymentMode || '---'}</td>
                                    <td className="p-4 text-xs font-mono">{fund.receiptNo || `#${fund.id}`}</td>
                                    <td className="p-4 text-[var(--color-primary)] font-extrabold whitespace-nowrap">
                                        <span className="inline-flex items-center gap-2"><Wallet size={15} />{formatAmount(fund.amount)}/-</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button type="button" onClick={() => setSelectedFund(fund)} className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all" aria-label="تفصیل">
                                                <Eye size={16} />
                                            </button>
                                            <button type="button" onClick={() => startEdit(fund)} className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-[#0b1120] transition-all" aria-label="تبدیل کریں">
                                                <Edit2 size={16} />
                                            </button>
                                            <button type="button" onClick={() => handleGroupedPrint(fund)} className="p-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[#0b1120] transition-all" aria-label="پرنٹ">
                                                <Printer size={16} />
                                            </button>
                                            <button type="button" onClick={() => setDeleteTarget(fund)} className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all" aria-label="حذف کریں">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center text-[var(--color-text-muted)]">کوئی ریکارڈ نہیں ملا</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3">
                    <p className="text-xs text-[var(--color-text-muted)]">
                        صفحہ {meta.currentPage || page} از {meta.totalPages || 1}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => canGoPrev && loadFunds(page - 1)}
                            disabled={!canGoPrev || isLoading}
                            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-xs font-bold disabled:opacity-40"
                        >
                            <ChevronRight size={16} />
                            پچھلا
                        </button>
                        <button
                            type="button"
                            onClick={() => canGoNext && loadFunds(page + 1)}
                            disabled={!canGoNext || isLoading}
                            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-xs font-bold disabled:opacity-40"
                        >
                            اگلا
                            <ChevronLeft size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedFund ? (
                <ViewModal fund={selectedFund} onClose={() => setSelectedFund(null)} onPrint={() => handleGroupedPrint(selectedFund)} />
            ) : null}

            {editingFund && editForm ? (
                <EditModal
                    editForm={editForm}
                    isSaving={isSaving}
                    onClose={closeEdit}
                    onSubmit={saveEdit}
                    onChange={handleEditChange}
                />
            ) : null}

            {deleteTarget ? (
                <DeleteModal
                    fund={deleteTarget}
                    isDeleting={isDeleting}
                    onCancel={() => !isDeleting && setDeleteTarget(null)}
                    onConfirm={confirmDelete}
                />
            ) : null}
        </div>
    );
};

const ViewModal = ({ fund, onClose, onPrint }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
                <h2 className="text-xl font-bold text-[var(--color-primary)]">عطیہ کی تفصیل</h2>
                <div className="flex items-center gap-2">
                    <button onClick={onPrint} className="p-2 rounded-lg bg-[var(--color-primary)] text-[#0b1120]" aria-label="پرنٹ">
                        <Printer size={18} />
                    </button>
                    <button onClick={onClose} className="p-2 rounded-lg bg-[var(--color-input)] text-[var(--color-text-main)]" aria-label="بند کریں">
                        <X size={18} />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <DetailItem label="نام دہندہ" value={fund.donorName} />
                <DetailItem label="رابطہ نمبر" value={fund.phone} dir="ltr" />
                <DetailItem label="ولدیت / ولد" value={fund.careOf} />
                <DetailItem label="ادائیگی کا طریقہ" value={fund.paymentMode} />
                <DetailItem label="عطیہ کی قسم" value={fund.donationType} />
                <DetailItem label="ذیلی قسم" value={fund.donationSubType} />
                <DetailItem label="مقصد" value={fund.purpose} />
                <DetailItem label="رسید نمبر" value={fund.receiptNo} />
                <DetailItem label="تاریخ" value={formatDate(fund.paymentDate)} />
                <DetailItem label="رقم" value={`${formatAmount(fund.amount)}/-`} />
                <div className="sm:col-span-2">
                    <DetailItem label="تفصیل" value={fund.details || fund.remarks} />
                </div>
            </div>
        </div>
    </div>
);

const EditModal = ({ editForm, isSaving, onClose, onSubmit, onChange }) => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <form onSubmit={onSubmit} className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
                <h2 className="text-xl font-bold text-[var(--color-primary)]">عطیہ تبدیل کریں</h2>
                <button type="button" onClick={onClose} className="p-2 rounded-lg bg-[var(--color-input)] text-[var(--color-text-main)]" aria-label="بند کریں">
                    <X size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="نام دہندہ" value={editForm.donorName} onChange={(e) => onChange('donorName', e.target.value)} />
                <InputField label="رابطہ نمبر" value={editForm.phone} onChange={(e) => onChange('phone', e.target.value)} />
                <InputField label="ولدیت / ولد" value={editForm.careOf} onChange={(e) => onChange('careOf', e.target.value)} />
                <InputField label="رقم" type="number" value={editForm.amount} onChange={(e) => onChange('amount', e.target.value)} />

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">ادائیگی کا طریقہ</label>
                    <select value={editForm.paymentMode} onChange={(e) => onChange('paymentMode', e.target.value)} className="w-full p-4 rounded-2xl border outline-none font-bold bg-[var(--color-input)] border-transparent focus:border-[var(--color-primary)]">
                        {paymentModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">عطیہ کی قسم</label>
                    <select value={editForm.donationType} onChange={(e) => onChange('donationType', e.target.value)} className="w-full p-4 rounded-2xl border outline-none font-bold bg-[var(--color-input)] border-transparent focus:border-[var(--color-primary)]">
                        {Object.keys(donationTypes).map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">ذیلی قسم</label>
                    <select value={editForm.donationSubType} onChange={(e) => onChange('donationSubType', e.target.value)} className="w-full p-4 rounded-2xl border outline-none font-bold bg-[var(--color-input)] border-transparent focus:border-[var(--color-primary)]">
                        {(donationTypes[editForm.donationType] || []).map((subType) => <option key={subType} value={subType}>{subType}</option>)}
                    </select>
                </div>

                <DateField label="تاریخ" value={editForm.paymentDate} onChange={(nextValue) => onChange('paymentDate', nextValue)} />
                <InputField label="مقصد" value={editForm.purpose} onChange={(e) => onChange('purpose', e.target.value)} />
                <InputField label="رسید نمبر" value={editForm.receiptNo} onChange={(e) => onChange('receiptNo', e.target.value)} />
                <div className="md:col-span-2">
                    <InputField label="تفصیل" value={editForm.details} onChange={(e) => onChange('details', e.target.value)} />
                </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:opacity-60">
                    منسوخ کریں
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-black text-[#0b1120] transition-all hover:bg-[var(--color-primary-hover)] disabled:opacity-70">
                    <Save size={16} />
                    {isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
                </button>
            </div>
        </form>
    </div>
);

const DeleteModal = ({ fund, isDeleting, onCancel, onConfirm }) => (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
            <div className="flex items-start justify-between gap-4">
                <div className="text-right">
                    <h3 className="text-xl font-black text-[var(--color-text-main)]">عطیہ ریکارڈ حذف کریں؟</h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                        کیا آپ واقعی <span className="text-rose-500">{fund.donorName || 'یہ ریکارڈ'}</span> کا عطیہ حذف کرنا چاہتے ہیں؟
                    </p>
                </div>
                <button type="button" onClick={onCancel} className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500" aria-label="بند کریں">
                    <X size={18} />
                </button>
            </div>

            <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={onCancel} disabled={isDeleting} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:opacity-60">
                    منسوخ کریں
                </button>
                <button type="button" onClick={onConfirm} disabled={isDeleting} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:opacity-70">
                    {isDeleting ? 'حذف ہو رہا ہے...' : 'حذف کریں'}
                </button>
            </div>
        </div>
    </div>
);

const DetailItem = ({ label, value, dir }) => (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
        <p dir={dir} className="font-bold text-[var(--color-text-main)]">{value || '---'}</p>
    </div>
);
