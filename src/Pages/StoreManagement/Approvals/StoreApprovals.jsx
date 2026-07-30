import React, { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCheck, RefreshCw, X } from 'lucide-react';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { approveStoreApproval, getStoreApprovals, rejectStoreApproval } from '../../../Constant/StoreApi';

const approvalTabs = [
    { key: 'purchases', moduleType: 'purchase', label: 'خریداری منظوریاں' },
    { key: 'stockOut', moduleType: 'stock-out', label: 'اسٹاک اجراء منظوریاں' },
    { key: 'damages', moduleType: 'damage', label: 'خرابی منظوریاں' },
    { key: 'adjustments', moduleType: 'adjustment', label: 'اسٹاک ایڈجسٹمنٹ منظوریاں' },
];

const formatNumber = (value) => new Intl.NumberFormat('ur-PK', { maximumFractionDigits: 2 }).format(Number(value || 0));
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('ur-PK') : '-');

const getRequestTitle = (tabKey, item) => {
    if (tabKey === 'purchases') return item.supplierName || 'سپلائر';
    if (tabKey === 'stockOut') return item.itemName || 'اسٹاک اجراء';
    if (tabKey === 'damages') return item.itemName || 'خراب اسٹاک';
    return item.itemName || 'اسٹاک ایڈجسٹمنٹ';
};

const getRequestDate = (tabKey, item) => {
    if (tabKey === 'purchases') return item.purchaseDate;
    if (tabKey === 'stockOut') return item.issueDate;
    if (tabKey === 'damages') return item.date;
    return item.createdAt;
};

const getRequestDetail = (tabKey, item) => {
    if (tabKey === 'purchases') return `انوائس: ${item.invoiceNumber || '-'} | کل رقم: روپے ${formatNumber(item.totalAmount)}`;
    if (tabKey === 'stockOut') return `شعبہ: ${item.department || '-'} | مقدار: ${formatNumber(item.quantity)} ${item.unit || ''}`;
    if (tabKey === 'damages') return `وجہ: ${item.reason || '-'} | نقصان: روپے ${formatNumber(item.amountLoss)}`;
    return `مقدار: ${formatNumber(item.quantity)} | وجہ: ${item.reason || '-'}`;
};

export const StoreApprovals = () => {
    const [activeTab, setActiveTab] = useState('purchases');
    const [approvalData, setApprovalData] = useState({ purchases: [], stockOut: [], damages: [], adjustments: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [actionModal, setActionModal] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const activeConfig = useMemo(() => approvalTabs.find((tab) => tab.key === activeTab) || approvalTabs[0], [activeTab]);
    const activeItems = approvalData[activeTab] || [];

    const loadApprovals = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await getStoreApprovals();
            setApprovalData({
                purchases: result.purchases || [],
                stockOut: result.stockOut || [],
                damages: result.damages || [],
                adjustments: result.adjustments || [],
            });
        } catch (loadError) {
            setError(loadError.message || 'منظوری درخواستیں لوڈ نہیں ہو سکیں۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadApprovals();
    }, []);

    const openActionModal = (type, item) => {
        setRemarks('');
        setActionModal({ type, item, moduleType: activeConfig.moduleType });
    };

    const handleAction = async () => {
        if (!actionModal) return;
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            if (actionModal.type === 'approve') {
                await approveStoreApproval(actionModal.moduleType, actionModal.item.id, remarks.trim());
                setSuccess('درخواست منظور ہو گئی۔');
            } else {
                await rejectStoreApproval(actionModal.moduleType, actionModal.item.id, remarks.trim());
                setSuccess('درخواست رد ہو گئی۔');
            }
            setActionModal(null);
            await loadApprovals();
        } catch (actionError) {
            setError(actionError.message || 'منظوری کا عمل مکمل نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[#00d094]">
                        <ClipboardCheck size={18} />
                        اسٹور مینجمنٹ
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">منظوری نظام</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">زیر التواء درخواستیں دیکھیں، منظور کریں یا رد کریں</p>
                </div>

                <button type="button" onClick={loadApprovals} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 text-sm font-black text-[var(--color-text)] disabled:opacity-60">
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    تازہ کریں
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm md:grid-cols-4">
                {approvalTabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const count = approvalData[tab.key]?.length || 0;
                    return (
                        <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-right text-sm font-black transition-all ${isActive ? 'border-[#00d094]/30 bg-[#00d094] text-white shadow-lg shadow-emerald-500/20' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]'}`}>
                            <span>{tab.label}</span>
                            <span className={`rounded-full px-2 py-1 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-[#00d094]'}`}>{formatNumber(count)}</span>
                        </button>
                    );
                })}
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="border-b border-[var(--color-border)] px-6 py-4 text-right">
                    <h3 className="text-lg font-black text-[var(--color-text)]">{activeConfig.label}</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="text-[var(--color-text-muted)]">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">تاریخ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">درخواست</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">تفصیل</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">منظوری درخواستیں لوڈ ہو رہی ہیں...</td></tr>
                            ) : activeItems.length ? (
                                activeItems.map((item) => (
                                    <tr key={`${activeTab}-${item.id}`} className="border-t border-[var(--color-border)] text-[var(--color-text)]">
                                        <td className="px-6 py-4 text-sm font-bold">{formatDate(getRequestDate(activeTab, item))}</td>
                                        <td className="px-6 py-4 text-sm font-black">{getRequestTitle(activeTab, item)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{getRequestDetail(activeTab, item)}</td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-500">زیر التواء</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button" onClick={() => openActionModal('approve', item)} className="inline-flex items-center gap-2 rounded-xl bg-[#218838] px-4 py-2 text-xs font-black text-white">
                                                    <Check size={15} /> منظور
                                                </button>
                                                <button type="button" onClick={() => openActionModal('reject', item)} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-black text-white">
                                                    <X size={15} /> رد
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی زیر التواء درخواست موجود نہیں۔</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {actionModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl" dir="rtl">
                        <h3 className="text-right text-xl font-black text-[var(--color-text)]">{actionModal.type === 'approve' ? 'منظوری ریمارکس' : 'رد کرنے کے ریمارکس'}</h3>
                        <p className="mt-2 text-right text-sm font-bold text-[var(--color-text-muted)]">{getRequestTitle(activeTab, actionModal.item)}</p>
                        <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={4} placeholder="ریمارکس درج کریں" className="mt-5 w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right text-sm font-bold text-[var(--color-text)] outline-none focus:border-[#00d094]" />
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => setActionModal(null)} disabled={isSaving} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 text-sm font-black text-[var(--color-text)]">بند کریں</button>
                            <button type="button" onClick={handleAction} disabled={isSaving} className={`rounded-xl px-5 py-3 text-sm font-black text-white disabled:opacity-70 ${actionModal.type === 'approve' ? 'bg-[#218838]' : 'bg-rose-500'}`}>
                                {isSaving ? 'محفوظ ہو رہا ہے...' : actionModal.type === 'approve' ? 'منظور کریں' : 'رد کریں'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
