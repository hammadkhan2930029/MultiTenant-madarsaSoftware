import React, { useEffect, useState } from 'react';
import { ArrowRight, CreditCard, Plus, ReceiptText, Store } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import {
    createStoreSupplierPayment,
    getStoreSupplierById,
    getStoreSupplierPayments,
    getStoreSupplierPurchases,
} from '../../../Constant/StoreApi';
import { formatAmountInput, parseAmountInput } from '../storeAmountFormat';

const today = () => new Date().toISOString().slice(0, 10);
const formatNumber = (value) => new Intl.NumberFormat('ur-PK', { maximumFractionDigits: 2 }).format(Number(value || 0));

const emptyPayment = {
    amount: '',
    paymentDate: today(),
    paymentMethod: 'cash',
    note: '',
};

const paymentMethods = [
    { value: 'cash', label: 'نقد' },
    { value: 'bank', label: 'بینک' },
    { value: 'online', label: 'آن لائن' },
    { value: 'cheque', label: 'چیک' },
];

export const StoreSupplierDetail = () => {
    const { supplierId } = useParams();
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [payments, setPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('purchases');
    const [paymentForm, setPaymentForm] = useState(emptyPayment);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const loadDetail = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [supplierResult, purchasesResult, paymentsResult] = await Promise.all([
                getStoreSupplierById(supplierId),
                getStoreSupplierPurchases(supplierId),
                getStoreSupplierPayments(supplierId),
            ]);
            setSupplier(supplierResult);
            setPurchases(purchasesResult.items || []);
            setPayments(paymentsResult.items || []);
        } catch (loadError) {
            setError(loadError.message || 'سپلائر کی تفصیل لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
    }, [supplierId]);

    const handlePaymentSubmit = async () => {
        if (parseAmountInput(paymentForm.amount) <= 0) {
            setError('ادائیگی کی رقم درست درج کریں۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            await createStoreSupplierPayment(supplierId, {
                amount: parseAmountInput(paymentForm.amount),
                paymentDate: paymentForm.paymentDate,
                paymentMethod: paymentForm.paymentMethod,
                note: paymentForm.note.trim(),
            });
            setPaymentForm(emptyPayment);
            setSuccess('ادائیگی کامیابی سے محفوظ ہو گئی۔');
            await loadDetail();
            setActiveTab('payments');
        } catch (saveError) {
            setError(saveError.message || 'ادائیگی محفوظ نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                <button type="button" onClick={() => navigate('/store/suppliers')} className="mb-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-bg)] px-4 py-2 text-sm font-black text-[var(--color-text-muted)]">
                    <ArrowRight size={16} />
                    واپس جائیں
                </button>

                {isLoading ? (
                    <div className="h-28 animate-pulse rounded-2xl bg-[var(--color-bg)]" />
                ) : supplier ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
                        <div className="text-right">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                                <Store size={18} />
                                سپلائر تفصیل
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">{supplier.supplierName}</h2>
                            <p className="mt-3 text-sm font-bold text-[var(--color-text-muted)]">{supplier.shopName || 'دکان کا نام موجود نہیں'} - {supplier.mobileNumber || 'موبائل نمبر موجود نہیں'}</p>
                            <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">{supplier.address || 'پتہ موجود نہیں'}</p>
                        </div>
                        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 text-right">
                            <p className="text-xs font-black text-[var(--color-text-muted)]">موجودہ بیلنس</p>
                            <p className="mt-2 text-2xl font-black text-[var(--color-text)]">روپے {formatNumber(supplier.balance)}</p>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
                <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
                    <div className="mb-4 flex gap-2">
                        <button type="button" onClick={() => setActiveTab('purchases')} className={`rounded-2xl px-5 py-3 text-sm font-black transition-all ${activeTab === 'purchases' ? 'bg-[#00d094] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'}`}>
                            خریداری تاریخ
                        </button>
                        <button type="button" onClick={() => setActiveTab('payments')} className={`rounded-2xl px-5 py-3 text-sm font-black transition-all ${activeTab === 'payments' ? 'bg-[#00d094] text-white' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'}`}>
                            ادائیگی تاریخ
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        {activeTab === 'purchases' ? (
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="text-[var(--color-text-muted)]">
                                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest">تاریخ</th>
                                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest">انوائس</th>
                                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest">کل رقم</th>
                                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest">ادا شدہ</th>
                                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest">باقی</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.length ? purchases.map((purchase) => (
                                        <tr key={purchase.id} className="border-t border-[var(--color-border)]/60">
                                            <td className="px-4 py-3 text-sm font-bold text-[var(--color-text-muted)]">{String(purchase.purchaseDate).slice(0, 10)}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-[var(--color-text)]">{purchase.invoiceNumber || '-'}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-[var(--color-text)]">روپے {formatNumber(purchase.totalAmount)}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-[var(--color-text-muted)]">روپے {formatNumber(purchase.paidAmount)}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-rose-500">روپے {formatNumber(purchase.remainingAmount)}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="px-4 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی خریداری موجود نہیں۔</td></tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="text-[var(--color-text-muted)]">
                                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest">تاریخ</th>
                                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest">رقم</th>
                                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest">طریقہ</th>
                                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest">نوٹ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length ? payments.map((payment) => (
                                        <tr key={payment.id} className="border-t border-[var(--color-border)]/60">
                                            <td className="px-4 py-3 text-sm font-bold text-[var(--color-text-muted)]">{String(payment.paymentDate).slice(0, 10)}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-[var(--color-text)]">روپے {formatNumber(payment.amount)}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-[var(--color-text-muted)]">{payment.paymentMethod || '-'}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-[var(--color-text-muted)]">{payment.note || '-'}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="px-4 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی ادائیگی موجود نہیں۔</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2 font-black text-[#00d094]">
                        <CreditCard size={20} />
                        <span>ادائیگی شامل کریں</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">رقم</label>
                            <input type="text" inputMode="decimal" value={paymentForm.amount} onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: formatAmountInput(event.target.value) }))} placeholder="0" className="mt-2 h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none" />
                        </div>
                        <div>
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">تاریخ</label>
                            <input type="date" value={paymentForm.paymentDate} onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentDate: event.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none" />
                        </div>
                        <div>
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">ادائیگی طریقہ</label>
                            <select value={paymentForm.paymentMethod} onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentMethod: event.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none">
                                {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">نوٹ</label>
                            <textarea rows={3} value={paymentForm.note} onChange={(event) => setPaymentForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="اختیاری نوٹ" className="mt-2 w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right text-sm font-bold text-[var(--color-text)] outline-none" />
                        </div>
                        <button type="button" onClick={handlePaymentSubmit} disabled={isSaving} className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#218838] px-8 py-3 text-sm font-black text-white transition-all hover:bg-[#1a6d2c] disabled:opacity-70">
                            {isSaving ? 'محفوظ ہو رہی ہے...' : 'ادائیگی محفوظ کریں'}
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
