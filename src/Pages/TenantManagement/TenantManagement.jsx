import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, Edit2, Eye, Globe2, Plus, Save, Search } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { InputField, SelectField } from '../../Components/HR/FormElements';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { getUsers } from '../../Constant/UserManagementApi';
import { createTenant, getTenantById, getTenants, updateTenant } from '../../Constant/TenantManagementApi';
import { usePermissions } from '../../Hooks/usePermissions';

const emptyForm = {
  tenantCode: '',
  name: '',
  subdomain: '',
  customDomain: '',
  ownerAdminId: '',
  status: 'active',
  adminName: '',
  adminEmail: '',
  adminUsername: '',
  adminPassword: '',
  profileEmail: '',
  phone1: '',
  phone2: '',
  address: '',
  branch: 'مرکزی کیمپس',
  city: '',
  regNo: '',
};

const statusOptions = [
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیر فعال' },
];

const normalizeDomain = (value) => {
  let domain = String(value || '').trim().toLowerCase();
  domain = domain.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  domain = domain.split('/')[0];
  domain = domain.split('?')[0];
  domain = domain.split('#')[0];
  domain = domain.replace(/\.$/, '');
  if (!domain.includes('::')) domain = domain.replace(/:\d+$/, '');
  return domain;
};

const buildPayload = (formData, mode) => {
  const payload = {
    name: formData.name.trim(),
    subdomain: normalizeDomain(formData.subdomain) || null,
    customDomain: normalizeDomain(formData.customDomain) || null,
    ownerAdminId: formData.ownerAdminId ? Number(formData.ownerAdminId) : null,
    status: formData.status,
  };

  if (mode === 'create') {
    payload.tenantCode = normalizeDomain(formData.tenantCode);
    payload.admin = {
      name: formData.adminName.trim(),
      email: formData.adminEmail.trim(),
      username: formData.adminUsername.trim(),
      password: formData.adminPassword,
    };
    payload.profile = {
      name: formData.name.trim(),
      email: formData.profileEmail.trim() || formData.adminEmail.trim(),
      phone1: formData.phone1.trim(),
      phone2: formData.phone2.trim(),
      address: formData.address.trim(),
      branch: formData.branch.trim(),
      city: formData.city.trim(),
      regNo: formData.regNo.trim(),
    };
  }

  return payload;
};

const getOwnerLabel = (owner) => {
  if (!owner) return 'مالک منتخب کریں';
  const roleLabel = owner.roleName || owner.role || 'ایڈمن';
  return `${owner.name || owner.username} (${roleLabel})`;
};

export const TenantManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useParams();
  const { isSuperAdmin } = usePermissions();

  const [tenants, setTenants] = useState([]);
  const [owners, setOwners] = useState([]);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useNotificationBridge({ error, success });

  const mode = useMemo(() => {
    if (location.pathname.endsWith('/create')) return 'create';
    if (location.pathname.endsWith('/edit')) return 'edit';
    if (tenantId) return 'details';
    return 'list';
  }, [location.pathname, tenantId]);

  const ownerOptions = useMemo(() => [
    { value: '', label: 'مالک منتخب کریں' },
    ...owners.map((owner) => ({
      value: String(owner.id),
      label: getOwnerLabel(owner),
    })),
  ], [owners]);

  const loadOwners = useCallback(async () => {
    if (!isSuperAdmin) return;
    const result = await getUsers({ page: 1, limit: 100 });
    setOwners(result.items || []);
  }, [isSuperAdmin]);

  const loadTenants = useCallback(async () => {
    if (!isSuperAdmin) return;

    setIsLoading(true);
    setError('');
    try {
      const result = await getTenants({ page: 1, limit: 100, search, status: statusFilter });
      setTenants(result.items || []);
    } catch (loadError) {
      setError(loadError.message || 'مدارس کی فہرست لوڈ نہیں ہو سکی۔');
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, search, statusFilter]);

  const loadTenant = useCallback(async () => {
    if (!isSuperAdmin || !tenantId || mode === 'list' || mode === 'create') return;

    setIsLoading(true);
    setError('');
    try {
      const tenant = await getTenantById(tenantId);
      setCurrentTenant(tenant);
      setFormData({
        tenantCode: tenant?.tenantCode || '',
        name: tenant?.name || '',
        subdomain: tenant?.subdomain || '',
        customDomain: tenant?.customDomain || '',
        ownerAdminId: tenant?.ownerAdminId ? String(tenant.ownerAdminId) : '',
        status: tenant?.status || 'active',
      });
    } catch (loadError) {
      setError(loadError.message || 'مدرسہ کی تفصیل لوڈ نہیں ہو سکی۔');
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, mode, tenantId]);

  useEffect(() => {
    loadOwners().catch((ownerError) => setError(ownerError.message || 'مالکان کی فہرست لوڈ نہیں ہو سکی۔'));
  }, [loadOwners]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setIsLoading(false);
      return undefined;
    }

    if (mode === 'list') {
      const timer = setTimeout(loadTenants, 250);
      return () => clearTimeout(timer);
    }

    if (mode === 'create') {
      setCurrentTenant(null);
      setFormData(emptyForm);
      setIsLoading(false);
      return undefined;
    }

    loadTenant();
    return undefined;
  }, [isSuperAdmin, loadTenant, loadTenants, mode]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return setError('مدرسہ کا نام ضروری ہے۔');
    if (mode === 'create' && !formData.tenantCode.trim()) return setError('مدرسہ کوڈ ضروری ہے۔');
    if (mode === 'create' && !formData.adminName.trim()) return setError('مدرسہ ایڈمن کا نام ضروری ہے۔');
    if (mode === 'create' && !formData.adminEmail.trim()) return setError('مدرسہ ایڈمن کا ای میل ضروری ہے۔');
    if (mode === 'create' && !formData.adminUsername.trim()) return setError('مدرسہ ایڈمن کا صارف نام ضروری ہے۔');
    if (mode === 'create' && formData.adminPassword.length < 8) return setError('مدرسہ ایڈمن کا پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔');

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = buildPayload(formData, mode);

      if (mode === 'edit') {
        await updateTenant(tenantId, payload);
        setSuccess('مدرسہ کامیابی سے اپ ڈیٹ ہو گیا۔');
        navigate(`/tenant-management/${tenantId}`);
      } else {
        const createdTenant = await createTenant(payload);
        setSuccess('مدرسہ کامیابی سے بن گیا۔');
        navigate(createdTenant?.id ? `/tenant-management/${createdTenant.id}` : '/tenant-management');
      }
    } catch (saveError) {
      setError(saveError.message || 'مدرسہ محفوظ نہیں ہو سکا۔');
    } finally {
      setIsSaving(false);
    }
  };

  const renderHeader = () => (
    <div className="flex flex-col gap-5 rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] md:flex-row md:items-center md:justify-between md:p-6">
      <div className="text-right">
        <h1 className="text-2xl font-black text-[var(--color-text-main)]">مدارس کا انتظام</h1>
        <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">مدارس، ڈومینز، حالت اور مالک ایڈمنز کا انتظام کریں۔</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {mode !== 'list' ? (
          <button type="button" onClick={() => navigate('/tenant-management')} className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-main)] transition-all hover:bg-[var(--color-bg)]">
            <ArrowRight size={18} />
            واپس
          </button>
        ) : null}

        {mode === 'list' ? (
          <button type="button" onClick={() => navigate('/tenant-management/create')} style={{ backgroundColor: 'var(--color-primary)' }} className="flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#00d094]/20 transition-all active:scale-95">
            <Plus size={18} />
            نیا مدرسہ
          </button>
        ) : null}

        <div style={{ backgroundColor: 'var(--color-primary)' }} className="hidden h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-[#00d094]/20 md:flex">
          <Building2 size={24} />
        </div>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InputField label="مدرسہ کوڈ" required={mode === 'create'} disabled={mode === 'edit'} placeholder="madarsa_001" value={formData.tenantCode} onChange={(event) => setFormData((prev) => ({ ...prev, tenantCode: event.target.value }))} />
        <InputField label="مدرسہ کا نام" required placeholder="مدرسہ کا نام" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
        <InputField label="سب ڈومین" placeholder="demo" value={formData.subdomain} onChange={(event) => setFormData((prev) => ({ ...prev, subdomain: event.target.value }))} />
        <InputField label="کسٹم ڈومین" placeholder="school.example.com" value={formData.customDomain} onChange={(event) => setFormData((prev) => ({ ...prev, customDomain: event.target.value }))} />
        {mode === 'edit' ? (
          <SelectField label="مالک / ایڈمن" options={ownerOptions} value={formData.ownerAdminId} onChange={(event) => setFormData((prev) => ({ ...prev, ownerAdminId: event.target.value }))} />
        ) : null}
        <SelectField label="حالت" options={statusOptions} value={formData.status} onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))} />
      </div>

      {mode === 'create' ? (
        <>
          <div className="mt-8 border-t border-[var(--color-border)] pt-8">
            <h2 className="text-right text-lg font-black text-[var(--color-text-main)]">مدرسہ ایڈمن</h2>
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField label="ایڈمن کا نام" required placeholder="ایڈمن کا نام" value={formData.adminName} onChange={(event) => setFormData((prev) => ({ ...prev, adminName: event.target.value }))} />
              <InputField label="ایڈمن ای میل" required type="email" placeholder="admin@example.com" value={formData.adminEmail} onChange={(event) => setFormData((prev) => ({ ...prev, adminEmail: event.target.value }))} />
              <InputField label="ایڈمن صارف نام" required placeholder="admin_username" value={formData.adminUsername} onChange={(event) => setFormData((prev) => ({ ...prev, adminUsername: event.target.value }))} />
              <InputField label="ایڈمن پاس ورڈ" required type="password" placeholder="کم از کم 8 حروف" value={formData.adminPassword} onChange={(event) => setFormData((prev) => ({ ...prev, adminPassword: event.target.value }))} />
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--color-border)] pt-8">
            <h2 className="text-right text-lg font-black text-[var(--color-text-main)]">ابتدائی مدرسہ پروفائل</h2>
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField label="پروفائل ای میل" type="email" placeholder="profile@example.com" value={formData.profileEmail} onChange={(event) => setFormData((prev) => ({ ...prev, profileEmail: event.target.value }))} />
              <InputField label="برانچ" placeholder="مرکزی کیمپس" value={formData.branch} onChange={(event) => setFormData((prev) => ({ ...prev, branch: event.target.value }))} />
              <InputField label="فون 1" placeholder="0300-0000000" value={formData.phone1} onChange={(event) => setFormData((prev) => ({ ...prev, phone1: event.target.value }))} />
              <InputField label="فون 2" placeholder="0321-0000000" value={formData.phone2} onChange={(event) => setFormData((prev) => ({ ...prev, phone2: event.target.value }))} />
              <InputField label="شہر" placeholder="شہر" value={formData.city} onChange={(event) => setFormData((prev) => ({ ...prev, city: event.target.value }))} />
              <InputField label="رجسٹریشن نمبر" placeholder="REG-001" value={formData.regNo} onChange={(event) => setFormData((prev) => ({ ...prev, regNo: event.target.value }))} />
              <InputField label="پتہ" placeholder="پتہ" className="md:col-span-2" value={formData.address} onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))} />
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-end">
        <button type="button" onClick={() => navigate('/tenant-management')} className="rounded-2xl border border-[var(--color-border)] px-6 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)]">
          منسوخ کریں
        </button>
        <button type="button" onClick={handleSubmit} disabled={isSaving} style={{ backgroundColor: 'var(--color-primary)' }} className="flex items-center justify-center gap-3 rounded-2xl px-8 py-3 text-sm font-black text-white shadow-lg shadow-[#00d094]/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
          {isSaving ? 'محفوظ ہو رہا ہے...' : 'مدرسہ محفوظ کریں'}
          <Save size={18} />
        </button>
      </div>
    </div>
  );

  const renderDetails = () => {
    if (isLoading) {
      return <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">مدرسہ کی تفصیل لوڈ ہو رہی ہے...</div>;
    }

    if (!currentTenant) {
      return <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">مدرسہ نہیں ملا۔</div>;
    }

    const owner = owners.find((item) => Number(item.id) === Number(currentTenant.ownerAdminId));

    return (
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">{currentTenant.tenantCode}</p>
            <h2 className="mt-3 text-2xl font-black text-[var(--color-text-main)]">{currentTenant.name}</h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-[var(--color-text-muted)]">
              <span>{currentTenant.subdomain || 'سب ڈومین موجود نہیں'}</span>
              <span>{currentTenant.customDomain || 'کسٹم ڈومین موجود نہیں'}</span>
              <span>{owner ? getOwnerLabel(owner) : 'مالک مقرر نہیں'}</span>
              <span className={`rounded-xl px-3 py-1 font-black ${currentTenant.status === 'active' ? 'bg-emerald-500/10 text-[#00d094]' : 'bg-rose-500/10 text-rose-500'}`}>
                {currentTenant.status === 'active' ? 'فعال' : 'غیر فعال'}
              </span>
            </div>
          </div>

          <button type="button" onClick={() => navigate(`/tenant-management/${currentTenant.id}/edit`)} className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-3 text-sm font-black text-blue-500 transition-all hover:bg-blue-500 hover:text-white">
            <Edit2 size={16} />
            ترمیم کریں
          </button>
        </div>
      </div>
    );
  };

  const renderList = () => (
    <>
      <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-bold text-[var(--color-text-muted)]">کل مدارس: {tenants.length}</div>
        <div className="grid w-full grid-cols-1 gap-3 md:w-auto md:grid-cols-[20rem_12rem]">
          <div className="relative">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="مدرسہ تلاش کریں" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]">
            <option value="">تمام حالتیں</option>
            <option value="active">فعال</option>
            <option value="inactive">غیر فعال</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">مدرسہ</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">سب ڈومین</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کسٹم ڈومین</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">مالک</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">عمل</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">مدارس لوڈ ہو رہے ہیں...</td></tr>
              ) : tenants.length ? (
                tenants.map((tenant) => {
                  const owner = owners.find((item) => Number(item.id) === Number(tenant.ownerAdminId));

                  return (
                    <tr key={tenant.id} className="border-t border-[var(--color-border)]/60">
                      <td className="px-6 py-4">
                        <div className="font-black text-[var(--color-text-main)]">{tenant.name}</div>
                        <div className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">{tenant.tenantCode}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-main)]">{tenant.subdomain || '-'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-main)]">
                        <span className="inline-flex items-center gap-2">
                          <Globe2 size={15} className="text-[var(--color-text-muted)]" />
                          {tenant.customDomain || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-main)]">{owner ? getOwnerLabel(owner) : '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-xl px-3 py-1 text-xs font-black ${tenant.status === 'active' ? 'bg-emerald-500/10 text-[#00d094]' : 'bg-rose-500/10 text-rose-500'}`}>
                          {tenant.status === 'active' ? 'فعال' : 'غیر فعال'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-start gap-2">
                          <button type="button" onClick={() => navigate(`/tenant-management/${tenant.id}`)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white" title="دیکھیں">
                            <Eye size={16} />
                          </button>
                          <button type="button" onClick={() => navigate(`/tenant-management/${tenant.id}/edit`)} className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500 transition-all hover:bg-blue-500 hover:text-white" title="ترمیم کریں">
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">ابھی کوئی مدرسہ موجود نہیں۔</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  if (!isSuperAdmin) {
    return (
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-muted)]" dir="rtl">
        یہ اسکرین صرف سپر ایڈمن کے لیے ہے۔
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pt-6 md:pt-0 lg:pt-0" dir="rtl">
      {renderHeader()}
      {mode === 'list' ? renderList() : null}
      {mode === 'create' || mode === 'edit' ? renderForm() : null}
      {mode === 'details' ? renderDetails() : null}
    </div>
  );
};


