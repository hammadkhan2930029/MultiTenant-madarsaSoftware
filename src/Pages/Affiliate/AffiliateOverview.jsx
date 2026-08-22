import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Eye, Search, Users, Wallet } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../../Components/Common/StatusBadge';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { isSuperAdmin } from '../../Constant/AdminAuth';
import { getAffiliateOverview, getAffiliateTenantDetail } from '../../Constant/AffiliateApi';

const moneyText = (items = []) => items.length
  ? items.map((item) => `${item.amount} ${item.currency}`).join('، ')
  : '0.00';

const remainingText = (earned = [], paid = []) => {
  const values = {};
  earned.forEach((item) => { values[item.currency] = (values[item.currency] || 0) + Number(item.amount); });
  paid.forEach((item) => { values[item.currency] = (values[item.currency] || 0) - Number(item.amount); });
  const rows = Object.entries(values).map(([currency, amount]) => `${Math.max(0, amount).toFixed(2)} ${currency}`);
  return rows.length ? rows.join('، ') : '0.00';
};

export const AffiliateOverview = () => {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const superAdminAccount = isSuperAdmin();
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useNotificationBridge({ error });

  const loadData = useCallback(async () => {
    if (!superAdminAccount) return;
    setLoading(true);
    setError('');
    try {
      if (tenantId) setDetail(await getAffiliateTenantDetail(tenantId));
      else setItems((await getAffiliateOverview({ page: 1, limit: 100, search })).items || []);
    } catch (requestError) {
      setError(requestError.message || 'افیلیئیٹ تفصیلات لوڈ نہیں ہو سکیں۔');
    } finally { setLoading(false); }
  }, [search, superAdminAccount, tenantId]);

  useEffect(() => { const timer = setTimeout(loadData, 250); return () => clearTimeout(timer); }, [loadData]);
  const summary = useMemo(() => detail?.tenant || null, [detail]);
  if (!superAdminAccount) return <Navigate to="/dashboard" replace />;

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--color-bg)] p-4 text-[var(--color-text-main)] md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h1 className="text-2xl font-black">افیلیئیٹ تفصیلات</h1><p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">ریفر کیے گئے مدارس، کمیشن، ادا شدہ اور باقی رقم کی تفصیل</p></div>
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-[var(--color-primary)]"><Wallet size={28} /></div>
          </div>
        </section>

        {tenantId && summary ? <>
          <button type="button" onClick={() => navigate('/affiliate/overview')} className="flex items-center gap-2 font-black text-[var(--color-primary)]"><ArrowRight size={18} /> فہرست پر واپس جائیں</button>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[['مدرسہ', summary.name], ['کل ریفرلز', summary.referralCount], ['کل کمیشن', moneyText(summary.earned)], ['باقی رقم', remainingText(summary.earned, summary.paid)]].map(([label, value]) => <div key={label} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"><p className="text-sm font-bold text-[var(--color-text-muted)]">{label}</p><p className="mt-3 text-xl font-black">{value}</p></div>)}
          </section>
          <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="p-6 md:p-8"><h2 className="text-xl font-black">ریفر کیے گئے مدارس</h2></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-right"><thead className="bg-[var(--color-bg)] text-sm text-[var(--color-text-muted)]"><tr><th className="p-5">مدرسہ</th><th className="p-5">فروخت</th><th className="p-5">فیصد</th><th className="p-5">کمیشن</th><th className="p-5">حالت</th><th className="p-5">تاریخ</th></tr></thead><tbody>
              {detail.referrals?.length ? detail.referrals.map((row) => <tr key={row.id} className="border-t border-[var(--color-border)]"><td className="p-5 font-black">{row.tenant.name}<div className="mt-1 text-xs text-[var(--color-text-muted)]">{row.tenant.tenantCode}</div></td><td className="p-5" dir="ltr">{row.tenant.saleAmount ? `${row.tenant.saleAmount} ${row.tenant.saleCurrency || ''}` : '-'}</td><td className="p-5" dir="ltr">{row.percentage ? `${row.percentage}%` : '-'}</td><td className="p-5" dir="ltr">{row.commissionAmount ? `${row.commissionAmount} ${row.currency || ''}` : '-'}</td><td className="p-5"><StatusBadge status={row.status} /></td><td className="p-5" dir="ltr">{row.earnedAt ? new Date(row.earnedAt).toLocaleDateString() : '-'}</td></tr>) : <tr><td colSpan="6" className="p-10 text-center text-[var(--color-text-muted)]">کوئی ریفرل موجود نہیں۔</td></tr>}
            </tbody></table></div>
          </section>
        </> : !tenantId ? <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 md:p-8"><h2 className="flex items-center gap-2 text-xl font-black"><Users size={22} /> ریفر کرنے والے مدارس</h2><label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-input)] px-5"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="bg-transparent outline-none" placeholder="مدرسہ یا ریفرل کوڈ تلاش کریں" /></label></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-right"><thead className="bg-[var(--color-bg)] text-sm text-[var(--color-text-muted)]"><tr><th className="p-5">مدرسہ</th><th className="p-5">ریفرل کوڈ</th><th className="p-5">کل ریفرلز</th><th className="p-5">کمیشن</th><th className="p-5">ادا شدہ</th><th className="p-5">باقی</th><th className="p-5">تفصیل</th></tr></thead><tbody>
            {loading ? <tr><td colSpan="7" className="p-10 text-center text-[var(--color-text-muted)]">لوڈ ہو رہا ہے...</td></tr> : items.length ? items.map((row) => <tr key={row.id} className="border-t border-[var(--color-border)]"><td className="p-5 font-black">{row.name}<div className="mt-1 text-xs text-[var(--color-text-muted)]">{row.tenantCode}</div></td><td className="p-5" dir="ltr">{row.referralCode}</td><td className="p-5 font-black">{row.referralCount}</td><td className="p-5" dir="ltr">{moneyText(row.earned)}</td><td className="p-5" dir="ltr">{moneyText(row.paid)}</td><td className="p-5 font-black text-[var(--color-primary)]" dir="ltr">{remainingText(row.earned, row.paid)}</td><td className="p-5"><button type="button" onClick={() => navigate(`/affiliate/overview/${row.id}`)} className="rounded-xl bg-emerald-500/10 p-3 text-[var(--color-primary)]" title="تفصیل"><Eye size={18} /></button></td></tr>) : <tr><td colSpan="7" className="p-10 text-center text-[var(--color-text-muted)]">کوئی ریفرل ریکارڈ موجود نہیں۔</td></tr>}
          </tbody></table></div>
        </section> : loading ? <div className="p-10 text-center">لوڈ ہو رہا ہے...</div> : null}
      </div>
    </div>
  );
};
