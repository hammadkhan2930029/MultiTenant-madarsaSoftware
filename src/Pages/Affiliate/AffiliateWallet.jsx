import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Plus, Save, Wallet, X } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import StatusBadge from '../../Components/Common/StatusBadge';
import { InputField, SelectField } from '../../Components/HR/FormElements';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { isBranchScopedSession, isTenantAdmin } from '../../Constant/AdminAuth';
import { createAffiliatePaymentAccount, createAffiliateWithdrawalRequest, deactivateAffiliatePaymentAccount, getAffiliateWallet, updateAffiliatePaymentAccount } from '../../Constant/AffiliateApi';

const emptyAccount = { accountType: 'bank', accountTitle: '', institutionName: '', accountNumber: '', iban: '', walletPhone: '', branchName: '', instructions: '', isDefault: false, status: 'active' };
const money = (items = []) => items.length ? items.map((row) => `${row.amount} ${row.currency}`).join('، ') : '0.00';

export const AffiliateWallet = () => {
  const allowed = isTenantAdmin() && !isBranchScopedSession();
  const [wallet, setWallet] = useState(null);
  const [form, setForm] = useState(emptyAccount);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawal, setWithdrawal] = useState({ paymentAccountId: '', currency: '', amount: '', requestNote: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useNotificationBridge({ error, success });

  const loadWallet = useCallback(async () => {
    if (!allowed) return;
    setLoading(true); setError('');
    try { setWallet(await getAffiliateWallet()); } catch (e) { setError(e.message || 'والیٹ لوڈ نہیں ہو سکا۔'); } finally { setLoading(false); }
  }, [allowed]);
  useEffect(() => { loadWallet(); }, [loadWallet]);
  if (!allowed) return <Navigate to="/dashboard" replace />;

  const edit = (account) => { setEditingId(account.id); setForm({ ...emptyAccount, ...account }); setShowForm(true); };
  const reset = () => { setEditingId(null); setForm(emptyAccount); setShowForm(false); };
  const submit = async (event) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (!form.accountTitle.trim()) return setError('اکاؤنٹ ہولڈر کا نام ضروری ہے۔');
    if (form.accountType === 'bank' && !form.accountNumber.trim() && !form.iban.trim()) return setError('اکاؤنٹ نمبر یا IBAN درج کریں۔');
    if (['easypaisa', 'jazzcash'].includes(form.accountType) && !form.walletPhone.trim()) return setError('والیٹ فون نمبر درج کریں۔');
    setSaving(true);
    try {
      if (editingId) await updateAffiliatePaymentAccount(editingId, form); else await createAffiliatePaymentAccount(form);
      setSuccess(editingId ? 'اکاؤنٹ کامیابی سے تبدیل ہو گیا۔' : 'اکاؤنٹ کامیابی سے شامل ہو گیا۔'); reset(); await loadWallet();
    } catch (e) { setError(e.message || 'اکاؤنٹ محفوظ نہیں ہو سکا۔'); } finally { setSaving(false); }
  };
  const deactivate = async (id) => { try { await deactivateAffiliatePaymentAccount(id); setSuccess('اکاؤنٹ غیر فعال ہو گیا۔'); await loadWallet(); } catch (e) { setError(e.message || 'اکاؤنٹ غیر فعال نہیں ہو سکا۔'); } };
  const submitWithdrawal = async (event) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (!withdrawal.paymentAccountId || !withdrawal.currency) return setError('ادائیگی اکاؤنٹ اور کرنسی منتخب کریں۔');
    setSaving(true);
    try {
      await createAffiliateWithdrawalRequest({ ...withdrawal, paymentAccountId: Number(withdrawal.paymentAccountId), amount: withdrawal.amount === '' ? null : Number(withdrawal.amount) });
      setSuccess('رقم نکلوانے کی درخواست کامیابی سے جمع ہو گئی۔');
      setShowWithdrawal(false); setWithdrawal({ paymentAccountId: '', currency: '', amount: '', requestNote: '' }); await loadWallet();
    } catch (e) { setError(e.message || 'درخواست جمع نہیں ہو سکی۔'); } finally { setSaving(false); }
  };

  return <div dir="rtl" className="min-h-screen bg-[var(--color-bg)] p-4 text-[var(--color-text-main)] md:p-8"><div className="mx-auto max-w-7xl space-y-8">
    <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black">میرا افیلیئیٹ والیٹ</h1><p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">آپ کے ریفرلز، کمیشن اور ادائیگی اکاؤنٹس</p></div><div className="rounded-2xl bg-emerald-500/10 p-4 text-[var(--color-primary)]"><Wallet size={28} /></div></div></section>
    {loading ? <div className="p-10 text-center">لوڈ ہو رہا ہے...</div> : wallet ? <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-5">{[['کل ریفرلز', wallet.referrals.length], ['کل کمیشن', money(wallet.earned)], ['ملنے والی رقم', money(wallet.paid)], ['زیر التوا رقم', money(wallet.pending)], ['دستیاب رقم', money(wallet.available)]].map(([label, value]) => <div key={label} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"><p className="text-sm font-bold text-[var(--color-text-muted)]">{label}</p><p className="mt-3 text-xl font-black">{value}</p></div>)}</section>
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-black">رقم نکلوانے کی درخواست</h2><p className="mt-2 text-sm text-[var(--color-text-muted)]">درخواستوں کے درمیان وقفہ: {wallet.withdrawalRules.withdrawalIntervalDays} دن {wallet.withdrawalRules.minimumWithdrawalAmount ? `— کم از کم رقم: ${wallet.withdrawalRules.minimumWithdrawalAmount}` : ''}</p></div><button type="button" disabled={!wallet.withdrawalRules.enabled || !wallet.accounts.some((a) => a.status === 'active') || !wallet.available.some((a) => Number(a.amount) > 0)} onClick={() => setShowWithdrawal(true)} className="min-h-12 rounded-2xl bg-[var(--color-primary)] px-6 font-black text-white disabled:opacity-50">درخواست دیں</button></div>
        {showWithdrawal ? <form onSubmit={submitWithdrawal} className="mt-6 grid grid-cols-1 gap-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 md:grid-cols-2 xl:grid-cols-4"><SelectField label="ادائیگی اکاؤنٹ" value={withdrawal.paymentAccountId} onChange={(e) => setWithdrawal((old) => ({ ...old, paymentAccountId: e.target.value }))} options={[{ value: '', label: 'اکاؤنٹ منتخب کریں' }, ...wallet.accounts.filter((a) => a.status === 'active').map((a) => ({ value: String(a.id), label: `${a.accountTitle} — ${a.institutionName || a.accountType}` }))]} /><SelectField label="کرنسی" value={withdrawal.currency} onChange={(e) => setWithdrawal((old) => ({ ...old, currency: e.target.value }))} options={[{ value: '', label: 'کرنسی منتخب کریں' }, ...wallet.available.filter((a) => Number(a.amount) > 0).map((a) => ({ value: a.currency, label: `${a.currency} — ${a.amount}` }))]} /><InputField label={`رقم ${wallet.withdrawalRules.allowBlankWithdrawalAmount ? '(خالی چھوڑنے پر مکمل دستیاب رقم)' : ''}`} type="number" min="0.01" step="0.01" required={!wallet.withdrawalRules.allowBlankWithdrawalAmount} value={withdrawal.amount} onChange={(e) => setWithdrawal((old) => ({ ...old, amount: e.target.value }))} /><InputField label="نوٹ (اختیاری)" value={withdrawal.requestNote} onChange={(e) => setWithdrawal((old) => ({ ...old, requestNote: e.target.value }))} /><div className="flex gap-3"><button disabled={saving} className="min-h-12 rounded-2xl bg-[var(--color-primary)] px-6 font-black text-white">جمع کریں</button><button type="button" onClick={() => setShowWithdrawal(false)} className="rounded-2xl border border-[var(--color-border)] px-5">منسوخ</button></div></form> : null}
      </section>
      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-black">ادائیگی اکاؤنٹس</h2><button type="button" onClick={() => { reset(); setShowForm(true); }} className="flex min-h-12 items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 font-black text-white"><Plus size={18} /> اکاؤنٹ شامل کریں</button></div>
        {showForm ? <form onSubmit={submit} className="mb-8 grid grid-cols-1 gap-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 md:grid-cols-2 xl:grid-cols-3"><SelectField label="اکاؤنٹ کی قسم" value={form.accountType} onChange={(e) => setForm((old) => ({ ...old, accountType: e.target.value }))} options={[{ value: 'bank', label: 'بینک' }, { value: 'easypaisa', label: 'ایزی پیسہ' }, { value: 'jazzcash', label: 'جاز کیش' }, { value: 'other', label: 'دیگر' }]} /><InputField label="اکاؤنٹ ہولڈر کا نام" required value={form.accountTitle} onChange={(e) => setForm((old) => ({ ...old, accountTitle: e.target.value }))} /><InputField label="ادارے/بینک کا نام" value={form.institutionName} onChange={(e) => setForm((old) => ({ ...old, institutionName: e.target.value }))} /><InputField label="اکاؤنٹ نمبر" value={form.accountNumber} onChange={(e) => setForm((old) => ({ ...old, accountNumber: e.target.value }))} /><InputField label="IBAN" value={form.iban} onChange={(e) => setForm((old) => ({ ...old, iban: e.target.value }))} /><InputField label="والیٹ فون نمبر" value={form.walletPhone} onChange={(e) => setForm((old) => ({ ...old, walletPhone: e.target.value }))} /><SelectField label="ڈیفالٹ اکاؤنٹ" value={String(form.isDefault)} onChange={(e) => setForm((old) => ({ ...old, isDefault: e.target.value === 'true' }))} options={[{ value: 'false', label: 'نہیں' }, { value: 'true', label: 'ہاں' }]} /><div className="flex items-end gap-3"><button disabled={saving} className="flex min-h-14 items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-6 font-black text-white"><Save size={18} /> محفوظ کریں</button><button type="button" onClick={reset} className="rounded-2xl border border-[var(--color-border)] p-4"><X size={18} /></button></div></form> : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{wallet.accounts.length ? wallet.accounts.map((account) => <div key={account.id} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5"><div className="flex justify-between"><div><p className="font-black">{account.accountTitle}</p><p className="mt-2 text-sm text-[var(--color-text-muted)]">{account.institutionName || account.accountType} — {account.accountNumber || account.iban || account.walletPhone || '-'}</p></div><StatusBadge status={account.status} /></div><div className="mt-4 flex gap-2"><button onClick={() => edit(account)} className="rounded-xl bg-blue-500/10 p-3 text-blue-500"><Edit2 size={17} /></button>{account.status === 'active' ? <button onClick={() => deactivate(account.id)} className="rounded-xl bg-rose-500/10 px-4 text-sm font-black text-rose-500">غیر فعال کریں</button> : null}</div></div>) : <p className="text-[var(--color-text-muted)]">کوئی ادائیگی اکاؤنٹ موجود نہیں۔</p>}</div>
      </section>
      <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]"><div className="p-6 md:p-8"><h2 className="text-xl font-black">میرے ریفرلز</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-right"><thead className="bg-[var(--color-bg)]"><tr><th className="p-5">مدرسہ</th><th className="p-5">فیصد</th><th className="p-5">کمیشن</th><th className="p-5">حالت</th></tr></thead><tbody>{wallet.referrals.length ? wallet.referrals.map((row) => <tr key={row.id} className="border-t border-[var(--color-border)]"><td className="p-5 font-black">{row.tenant.name}</td><td className="p-5" dir="ltr">{row.percentage ? `${row.percentage}%` : '-'}</td><td className="p-5" dir="ltr">{row.commissionAmount ? `${row.commissionAmount} ${row.currency || ''}` : '-'}</td><td className="p-5"><StatusBadge status={row.status} /></td></tr>) : <tr><td colSpan="4" className="p-10 text-center text-[var(--color-text-muted)]">کوئی ریفرل موجود نہیں۔</td></tr>}</tbody></table></div></section>
      <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]"><div className="p-6 md:p-8"><h2 className="text-xl font-black">نکلوائی کی درخواستیں</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-right"><thead className="bg-[var(--color-bg)]"><tr><th className="p-5">رقم</th><th className="p-5">اکاؤنٹ</th><th className="p-5">حالت</th><th className="p-5">درخواست کی تاریخ</th><th className="p-5">ایڈمن نوٹ</th></tr></thead><tbody>{wallet.withdrawals.length ? wallet.withdrawals.map((row) => <tr key={row.id} className="border-t border-[var(--color-border)]"><td className="p-5 font-black" dir="ltr">{row.requestedAmount} {row.currency}</td><td className="p-5">{row.paymentAccountSnapshot?.accountTitle || '-'}</td><td className="p-5"><StatusBadge status={row.status} /></td><td className="p-5" dir="ltr">{new Date(row.requestedAt).toLocaleDateString()}</td><td className="p-5">{row.adminNote || '-'}</td></tr>) : <tr><td colSpan="5" className="p-10 text-center text-[var(--color-text-muted)]">کوئی درخواست موجود نہیں۔</td></tr>}</tbody></table></div></section>
    </> : null}
  </div></div>;
};
