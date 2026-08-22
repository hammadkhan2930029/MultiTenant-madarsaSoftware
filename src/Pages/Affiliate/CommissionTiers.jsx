import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Percent, Plus, Save, Settings2, X } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import StatusBadge from '../../Components/Common/StatusBadge';
import { DateField, InputField, SelectField } from '../../Components/HR/FormElements';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { isSuperAdmin } from '../../Constant/AdminAuth';
import {
  createCommissionTier,
  getAffiliateSettings,
  getCommissionTiers,
  updateAffiliateSettings,
  updateCommissionTier,
  updateCommissionTierStatus,
  previewAffiliateCommissionReconciliation,
  runAffiliateCommissionReconciliation,
} from '../../Constant/AffiliateApi';

const today = new Date().toISOString().slice(0, 10);
const emptyForm = {
  minReferrals: '',
  maxReferrals: '',
  percentage: '',
  effectiveFrom: today,
  effectiveTo: '',
  status: 'active',
};

const defaultSettings = {
  withdrawalIntervalDays: '0',
  allowBlankWithdrawalAmount: 'true',
  allowOnlyOnePendingRequest: 'true',
  minimumWithdrawalAmount: '',
  status: 'active',
};

export const CommissionTiers = () => {
  const superAdminAccount = isSuperAdmin();
  const [tiers, setTiers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [reconciliation, setReconciliation] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useNotificationBridge({ error, success });

  const loadTiers = useCallback(async () => {
    if (!superAdminAccount) return;
    setLoading(true);
    setError('');
    try {
      const result = await getCommissionTiers({ page: 1, limit: 100, status: statusFilter });
      setTiers(result.items || []);
    } catch (requestError) {
      setError(requestError.message || 'کمیشن درجات لوڈ نہیں ہو سکے۔');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, superAdminAccount]);

  useEffect(() => { loadTiers(); }, [loadTiers]);

  const loadReconciliationPreview = useCallback(async () => {
    if (!superAdminAccount) return;
    try { setReconciliation(await previewAffiliateCommissionReconciliation()); } catch (requestError) { setError(requestError.message || 'کمیشن ریکارڈز کا جائزہ لوڈ نہیں ہو سکا۔'); }
  }, [superAdminAccount]);

  useEffect(() => { loadReconciliationPreview(); }, [loadReconciliationPreview]);

  useEffect(() => {
    if (!superAdminAccount) return undefined;
    let mounted = true;
    setSettingsLoading(true);
    getAffiliateSettings()
      .then((data) => {
        if (!mounted || !data) return;
        setSettings({
          withdrawalIntervalDays: String(data.withdrawalIntervalDays ?? 0),
          allowBlankWithdrawalAmount: String(data.allowBlankWithdrawalAmount ?? true),
          allowOnlyOnePendingRequest: String(data.allowOnlyOnePendingRequest ?? true),
          minimumWithdrawalAmount: data.minimumWithdrawalAmount || '',
          status: data.status || 'active',
        });
      })
      .catch((requestError) => { if (mounted) setError(requestError.message || 'افیلیئیٹ سیٹنگز لوڈ نہیں ہو سکیں۔'); })
      .finally(() => { if (mounted) setSettingsLoading(false); });
    return () => { mounted = false; };
  }, [superAdminAccount]);

  if (!superAdminAccount) return <Navigate to="/dashboard" replace />;

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, effectiveFrom: new Date().toISOString().slice(0, 10) });
  };

  const reconcileCommissions = async () => {
    setReconciling(true); setError(''); setSuccess('');
    try {
      const result = await runAffiliateCommissionReconciliation();
      setReconciliation(result);
      setSuccess(`کمیشن ریکارڈز مکمل ہو گئے۔ نئے: ${result.created}، تبدیل: ${result.updated}`);
    } catch (requestError) { setError(requestError.message || 'کمیشن ریکارڈز مکمل نہیں ہو سکے۔'); } finally { setReconciling(false); }
  };

  const startEdit = (tier) => {
    setEditingId(tier.id);
    setForm({
      minReferrals: String(tier.minReferrals),
      maxReferrals: tier.maxReferrals === null ? '' : String(tier.maxReferrals),
      percentage: String(tier.percentage),
      effectiveFrom: tier.effectiveFrom,
      effectiveTo: tier.effectiveTo || '',
      status: tier.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const minReferrals = Number(form.minReferrals);
    const maxReferrals = form.maxReferrals === '' ? null : Number(form.maxReferrals);
    const percentage = Number(form.percentage);
    if (!Number.isInteger(minReferrals) || minReferrals < 1) return setError('کم از کم ریفرلز 1 یا اس سے زیادہ ہونے چاہئیں۔');
    if (maxReferrals !== null && (!Number.isInteger(maxReferrals) || maxReferrals < minReferrals)) return setError('زیادہ سے زیادہ ریفرلز درست درج کریں۔');
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) return setError('فیصد 0 سے 100 کے درمیان ہونا چاہیے۔');
    if (!form.effectiveFrom) return setError('تاریخ آغاز ضروری ہے۔');
    if (form.effectiveTo && form.effectiveTo < form.effectiveFrom) return setError('تاریخ اختتام، تاریخ آغاز سے پہلے نہیں ہو سکتی۔');

    setSaving(true);
    try {
      const payload = {
        minReferrals,
        maxReferrals,
        percentage: form.percentage,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
        status: form.status,
      };
      if (editingId) {
        await updateCommissionTier(editingId, payload);
        setSuccess('کمیشن درجہ کامیابی سے اپڈیٹ ہو گیا۔');
      } else {
        await createCommissionTier(payload);
        setSuccess('کمیشن درجہ کامیابی سے شامل ہو گیا۔');
      }
      resetForm();
      await loadTiers();
    } catch (requestError) {
      setError(requestError.message || 'کمیشن درجہ محفوظ نہیں ہو سکا۔');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (tier) => {
    setError('');
    setSuccess('');
    try {
      const nextStatus = tier.status === 'active' ? 'inactive' : 'active';
      await updateCommissionTierStatus(tier.id, nextStatus);
      setSuccess(nextStatus === 'active' ? 'کمیشن درجہ فعال ہو گیا۔' : 'کمیشن درجہ غیر فعال ہو گیا۔');
      await loadTiers();
    } catch (requestError) {
      setError(requestError.message || 'حالت تبدیل نہیں ہو سکی۔');
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const intervalDays = Number(settings.withdrawalIntervalDays);
    const minimumAmount = settings.minimumWithdrawalAmount === '' ? null : Number(settings.minimumWithdrawalAmount);
    if (!Number.isInteger(intervalDays) || intervalDays < 0 || intervalDays > 3650) return setError('درخواستوں کے درمیان دن 0 سے 3650 تک مکمل عدد ہونے چاہئیں۔');
    if (minimumAmount !== null && (!Number.isFinite(minimumAmount) || minimumAmount <= 0)) return setError('کم از کم نکلوائی رقم صفر سے زیادہ ہونی چاہیے۔');

    setSettingsSaving(true);
    try {
      const saved = await updateAffiliateSettings({
        withdrawalIntervalDays: intervalDays,
        allowBlankWithdrawalAmount: settings.allowBlankWithdrawalAmount === 'true',
        allowOnlyOnePendingRequest: settings.allowOnlyOnePendingRequest === 'true',
        minimumWithdrawalAmount: settings.minimumWithdrawalAmount || null,
        status: settings.status,
      });
      setSettings({
        withdrawalIntervalDays: String(saved.withdrawalIntervalDays ?? 0),
        allowBlankWithdrawalAmount: String(saved.allowBlankWithdrawalAmount),
        allowOnlyOnePendingRequest: String(saved.allowOnlyOnePendingRequest),
        minimumWithdrawalAmount: saved.minimumWithdrawalAmount || '',
        status: saved.status,
      });
      setSuccess('افیلیئیٹ سیٹنگز کامیابی سے محفوظ ہو گئیں۔');
    } catch (requestError) {
      setError(requestError.message || 'افیلیئیٹ سیٹنگز محفوظ نہیں ہو سکیں۔');
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--color-bg)] p-4 text-[var(--color-text-main)] md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div><h1 className="text-2xl font-black">افیلیئیٹ سیٹنگز</h1><p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">والٹ سے رقم نکلوانے کی درخواستوں کے عمومی اصول مقرر کریں۔</p></div>
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-[var(--color-primary)]"><Settings2 size={28} /></div>
          </div>
          {settingsLoading ? <div className="py-8 text-center font-bold text-[var(--color-text-muted)]">سیٹنگز لوڈ ہو رہی ہیں...</div> : (
            <form onSubmit={saveSettings} className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <InputField label="دوبارہ درخواست دینے کا وقفہ (دن)" required type="number" min="0" max="3650" value={settings.withdrawalIntervalDays} onChange={(event) => setSettings((old) => ({ ...old, withdrawalIntervalDays: event.target.value }))} />
              <InputField label="کم از کم نکلوائی رقم (اختیاری)" type="number" min="0.01" step="0.01" placeholder="کوئی کم از کم حد نہیں" value={settings.minimumWithdrawalAmount} onChange={(event) => setSettings((old) => ({ ...old, minimumWithdrawalAmount: event.target.value }))} />
              <SelectField label="خالی رقم پر مکمل بیلنس کی درخواست" value={settings.allowBlankWithdrawalAmount} onChange={(event) => setSettings((old) => ({ ...old, allowBlankWithdrawalAmount: event.target.value }))} options={[{ value: 'true', label: 'اجازت ہے' }, { value: 'false', label: 'اجازت نہیں' }]} />
              <SelectField label="ایک وقت میں صرف ایک زیر التوا درخواست" value={settings.allowOnlyOnePendingRequest} onChange={(event) => setSettings((old) => ({ ...old, allowOnlyOnePendingRequest: event.target.value }))} options={[{ value: 'true', label: 'ہاں' }, { value: 'false', label: 'نہیں' }]} />
              <SelectField label="افیلیئیٹ نظام کی حالت" value={settings.status} onChange={(event) => setSettings((old) => ({ ...old, status: event.target.value }))} options={[{ value: 'active', label: 'فعال' }, { value: 'inactive', label: 'غیر فعال' }]} />
              <div className="flex items-end"><button disabled={settingsSaving} type="submit" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-8 font-black text-white disabled:opacity-60"><Save size={19} />{settingsSaving ? 'محفوظ ہو رہا ہے...' : 'سیٹنگز محفوظ کریں'}</button></div>
            </form>
          )}
        </section>
        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5"><div><h2 className="text-xl font-black">کمیشن ریکارڈز کی مطابقت</h2><p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">پرانے یا زیرِ حساب ریفرلز کا محفوظ جائزہ؛ ادا شدہ اور مکمل تاریخی ریکارڈ تبدیل نہیں ہوں گے۔</p></div><button type="button" disabled={reconciling || !reconciliation || (!reconciliation.missingRecords && !reconciliation.pendingEligible)} onClick={reconcileCommissions} className="min-h-14 rounded-2xl bg-[var(--color-primary)] px-7 font-black text-white disabled:opacity-50">{reconciling ? 'مکمل ہو رہا ہے...' : 'ریکارڈز مکمل کریں'}</button></div>
          {reconciliation ? <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">{[['کل ریفرلز', reconciliation.totalReferrals], ['غائب ریکارڈ', reconciliation.missingRecords], ['زیر حساب', reconciliation.pendingEligible], ['درجہ دستیاب نہیں', reconciliation.withoutApplicableTier], ['محفوظ تاریخی ریکارڈ', reconciliation.protectedHistoricalRecords]].map(([label, value]) => <div key={label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"><p className="text-xs font-bold text-[var(--color-text-muted)]">{label}</p><p className="mt-2 text-xl font-black">{value}</p></div>)}</div> : null}
        </section>
        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black">افیلیئیٹ کمیشن درجات</h1>
              <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">ریفر کیے گئے مدارس کی تعداد کے مطابق کمیشن فیصد مقرر کریں۔</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-[var(--color-primary)]"><Percent size={28} /></div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <InputField label="کم از کم ریفرلز" required type="number" min="1" value={form.minReferrals} onChange={(event) => setForm((old) => ({ ...old, minReferrals: event.target.value }))} />
            <InputField label="زیادہ سے زیادہ ریفرلز (اختیاری)" type="number" min="1" placeholder="آخری درجہ کے لیے خالی چھوڑیں" value={form.maxReferrals} onChange={(event) => setForm((old) => ({ ...old, maxReferrals: event.target.value }))} />
            <InputField label="کمیشن فیصد" required type="number" min="0" max="100" step="0.01" value={form.percentage} onChange={(event) => setForm((old) => ({ ...old, percentage: event.target.value }))} />
            <DateField label="تاریخ آغاز" required value={form.effectiveFrom} onChange={(value) => setForm((old) => ({ ...old, effectiveFrom: value }))} />
            <DateField label="تاریخ اختتام (اختیاری)" value={form.effectiveTo} min={form.effectiveFrom} onChange={(value) => setForm((old) => ({ ...old, effectiveTo: value }))} />
            <SelectField label="حالت" value={form.status} onChange={(event) => setForm((old) => ({ ...old, status: event.target.value }))} options={[{ value: 'active', label: 'فعال' }, { value: 'inactive', label: 'غیر فعال' }]} />
            <div className="flex items-end gap-3 md:col-span-2 xl:col-span-3">
              <button disabled={saving} type="submit" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-8 font-black text-white disabled:opacity-60">
                {editingId ? <Save size={19} /> : <Plus size={19} />}{saving ? 'محفوظ ہو رہا ہے...' : editingId ? 'تبدیلی محفوظ کریں' : 'نیا درجہ شامل کریں'}
              </button>
              {editingId ? <button type="button" onClick={resetForm} className="flex min-h-14 items-center gap-2 rounded-2xl border border-[var(--color-border)] px-6 font-black"><X size={18} /> منسوخ کریں</button> : null}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 md:p-8">
            <h2 className="text-xl font-black">موجودہ کمیشن درجات</h2>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-input)] px-5 font-bold outline-none">
              <option value="">تمام حالتیں</option><option value="active">فعال</option><option value="inactive">غیر فعال</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right">
              <thead className="bg-[var(--color-bg)] text-sm text-[var(--color-text-muted)]"><tr><th className="p-5">نمبر</th><th className="p-5">ریفرل حد</th><th className="p-5">فیصد</th><th className="p-5">تاریخ آغاز</th><th className="p-5">تاریخ اختتام</th><th className="p-5">حالت</th><th className="p-5">کارروائی</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="7" className="p-10 text-center font-bold text-[var(--color-text-muted)]">لوڈ ہو رہا ہے...</td></tr> : tiers.length ? tiers.map((tier, index) => (
                  <tr key={tier.id} className="border-t border-[var(--color-border)]">
                    <td className="p-5 font-bold">{index + 1}</td>
                    <td className="p-5 font-black" dir="ltr">{tier.minReferrals} - {tier.maxReferrals ?? '∞'}</td>
                    <td className="p-5 font-black text-[var(--color-primary)]" dir="ltr">{tier.percentage}%</td>
                    <td className="p-5 font-bold" dir="ltr">{tier.effectiveFrom}</td>
                    <td className="p-5 font-bold" dir="ltr">{tier.effectiveTo || '-'}</td>
                    <td className="p-5"><StatusBadge status={tier.status} /></td>
                    <td className="p-5"><div className="flex gap-2"><button type="button" onClick={() => startEdit(tier)} title="ترمیم کریں" className="rounded-xl bg-blue-500/10 p-3 text-blue-500"><Edit2 size={17} /></button><button type="button" onClick={() => toggleStatus(tier)} className={`rounded-xl px-4 py-2 text-xs font-black ${tier.status === 'active' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-[var(--color-primary)]'}`}>{tier.status === 'active' ? 'غیر فعال کریں' : 'فعال کریں'}</button></div></td>
                  </tr>
                )) : <tr><td colSpan="7" className="p-10 text-center font-bold text-[var(--color-text-muted)]">کوئی کمیشن درجہ موجود نہیں۔</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
