import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Landmark, Search, XCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import StatusBadge from '../../Components/Common/StatusBadge';
import { DateField, InputField, SelectField } from '../../Components/HR/FormElements';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { isSuperAdmin } from '../../Constant/AdminAuth';
import { getAffiliateWithdrawals, payAffiliateWithdrawal, rejectAffiliateWithdrawal } from '../../Constant/AffiliateApi';

const today = new Date().toISOString().slice(0, 10);
export const AffiliateWithdrawals = () => {
  const allowed = isSuperAdmin();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('');
  const [form, setForm] = useState({ paymentMethod: '', transactionReference: '', paymentDate: today, note: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useNotificationBridge({ error, success });
  const load = useCallback(async () => {
    if (!allowed) return; setLoading(true); setError('');
    try { setItems((await getAffiliateWithdrawals({ page: 1, limit: 100, status, search })).items || []); } catch (e) { setError(e.message || 'درخواستیں لوڈ نہیں ہو سکیں۔'); } finally { setLoading(false); }
  }, [allowed, search, status]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  if (!allowed) return <Navigate to="/dashboard" replace />;
  const open = (row, nextMode) => { setSelected(row); setMode(nextMode); setForm({ paymentMethod: '', transactionReference: '', paymentDate: today, note: '' }); };
  const close = () => { setSelected(null); setMode(''); };
  const submit = async (event) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (mode === 'reject' && !form.note.trim()) return setError('درخواست مسترد کرنے کی وجہ درج کریں۔');
    if (mode === 'pay' && (!form.paymentMethod.trim() || !form.paymentDate)) return setError('ادائیگی کا طریقہ اور تاریخ ضروری ہیں۔');
    setSaving(true);
    try {
      if (mode === 'reject') await rejectAffiliateWithdrawal(selected.id, form.note); else await payAffiliateWithdrawal(selected.id, form);
      setSuccess(mode === 'reject' ? 'درخواست مسترد کر دی گئی۔' : 'ادائیگی کامیابی سے ریکارڈ ہو گئی۔'); close(); await load();
    } catch (e) { setError(e.message || 'کارروائی مکمل نہیں ہو سکی۔'); } finally { setSaving(false); }
  };
  return <div dir="rtl" className="min-h-screen bg-[var(--color-bg)] p-4 text-[var(--color-text-main)] md:p-8"><div className="mx-auto max-w-7xl space-y-8">
    <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black">افیلیئیٹ ادائیگیاں</h1><p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">Tenant Admin کی رقم نکلوانے کی درخواستوں کا انتظام</p></div><div className="rounded-2xl bg-emerald-500/10 p-4 text-[var(--color-primary)]"><Landmark size={28} /></div></div></section>
    {selected ? <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8"><h2 className="mb-2 text-xl font-black">{mode === 'pay' ? 'ادائیگی ریکارڈ کریں' : 'درخواست مسترد کریں'}</h2><p className="mb-6 text-[var(--color-text-muted)]">{selected.tenant.name} — <span dir="ltr">{selected.requestedAmount} {selected.currency}</span></p><form onSubmit={submit} className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{mode === 'pay' ? <><InputField label="ادائیگی کا طریقہ" required value={form.paymentMethod} onChange={(e) => setForm((old) => ({ ...old, paymentMethod: e.target.value }))} /><InputField label="ٹرانزیکشن ریفرنس (اختیاری)" value={form.transactionReference} onChange={(e) => setForm((old) => ({ ...old, transactionReference: e.target.value }))} /><DateField label="ادائیگی کی تاریخ" required value={form.paymentDate} onChange={(value) => setForm((old) => ({ ...old, paymentDate: value }))} /></> : null}<InputField label={mode === 'reject' ? 'مسترد کرنے کی وجہ' : 'نوٹ (اختیاری)'} required={mode === 'reject'} value={form.note} onChange={(e) => setForm((old) => ({ ...old, note: e.target.value }))} /><div className="flex items-end gap-3"><button disabled={saving} className={`min-h-14 rounded-2xl px-6 font-black text-white ${mode === 'reject' ? 'bg-rose-500' : 'bg-[var(--color-primary)]'}`}>{saving ? 'محفوظ ہو رہا ہے...' : mode === 'reject' ? 'مسترد کریں' : 'ادائیگی مکمل کریں'}</button><button type="button" onClick={close} className="min-h-14 rounded-2xl border border-[var(--color-border)] px-5">منسوخ</button></div></form></section> : null}
    <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]"><div className="flex flex-wrap items-center justify-between gap-4 p-6 md:p-8"><h2 className="text-xl font-black">درخواستوں کی فہرست</h2><div className="flex flex-wrap gap-3"><label className="flex min-h-12 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-input)] px-4"><Search size={17} /><input className="bg-transparent outline-none" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="مدرسہ تلاش کریں" /></label><SelectField value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: 'تمام حالتیں' }, { value: 'pending', label: 'زیر التوا' }, { value: 'paid', label: 'ادا شدہ' }, { value: 'rejected', label: 'مسترد' }]} /></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-right"><thead className="bg-[var(--color-bg)]"><tr><th className="p-5">مدرسہ</th><th className="p-5">رقم</th><th className="p-5">اکاؤنٹ</th><th className="p-5">تاریخ</th><th className="p-5">حالت</th><th className="p-5">کارروائی</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="p-10 text-center">لوڈ ہو رہا ہے...</td></tr> : items.length ? items.map((row) => <tr key={row.id} className="border-t border-[var(--color-border)]"><td className="p-5 font-black">{row.tenant.name}<div className="mt-1 text-xs text-[var(--color-text-muted)]">{row.tenant.tenantCode}</div></td><td className="p-5 font-black" dir="ltr">{row.requestedAmount} {row.currency}</td><td className="p-5">{row.paymentAccountSnapshot?.accountTitle || '-'}<div className="mt-1 text-xs" dir="ltr">{row.paymentAccountSnapshot?.accountNumber || row.paymentAccountSnapshot?.iban || row.paymentAccountSnapshot?.walletPhone || ''}</div></td><td className="p-5" dir="ltr">{new Date(row.requestedAt).toLocaleDateString()}</td><td className="p-5"><StatusBadge status={row.status} /></td><td className="p-5">{row.status === 'pending' ? <div className="flex gap-2"><button onClick={() => open(row, 'pay')} className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 font-black text-[var(--color-primary)]"><CheckCircle2 size={17} /> ادا کریں</button><button onClick={() => open(row, 'reject')} className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3 font-black text-rose-500"><XCircle size={17} /> مسترد</button></div> : row.payment?.transactionReference || row.adminNote || '-'}</td></tr>) : <tr><td colSpan="6" className="p-10 text-center text-[var(--color-text-muted)]">کوئی درخواست موجود نہیں۔</td></tr>}</tbody></table></div>
    </section>
  </div></div>;
};
