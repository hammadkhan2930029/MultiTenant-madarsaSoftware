import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, Edit2, Eye, Globe2, Plus, Save, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { InputField, SelectField } from '../../Components/HR/FormElements';
import { DeleteConfirmationModal } from '../../Components/Common/DeleteConfirmationModal';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { getCities } from '../../Constant/CityApi';
import { getUsers } from '../../Constant/UserManagementApi';
import {
  createTenant,
  getTenantBranchSettings,
  getTenantBranches,
  getTenantBranchSummary,
  getTenantById,
  updateTenant,
  updateTenantBranchLimit,
  updateTenantBranchSettings,
} from '../../Constant/TenantManagementApi';
import { usePermissions } from '../../Hooks/usePermissions';

const emptyForm = {
  tenantCode: '',
  name: '',
  subdomain: '',
  customDomain: '',
  ownerAdminId: '',
  status: 'active',
  branchEnabled: 'false',
  branchLimit: '',
  adminName: '',
  adminPhone: '',
  adminEmail: '',
  adminUsername: '',
  adminPassword: '',
  adminCity: '',
  adminProvince: '',
  profileName: '',
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

const provinceOptions = [
  { value: '', label: 'صوبہ منتخب کریں' },
  { value: 'پنجاب', label: 'پنجاب' },
  { value: 'سندھ', label: 'سندھ' },
  { value: 'خیبر پختونخوا', label: 'خیبر پختونخوا' },
  { value: 'بلوچستان', label: 'بلوچستان' },
  { value: 'گلگت بلتستان', label: 'گلگت بلتستان' },
  { value: 'آزاد کشمیر', label: 'آزاد کشمیر' },
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
  const branchLimit = formData.branchLimit === '' ? null : Number(formData.branchLimit);
  const branchEnabled = formData.branchEnabled === 'true' || (Number.isInteger(branchLimit) && branchLimit >= 1);
  const payload = {
    name: formData.profileName.trim(),
    subdomain: normalizeDomain(formData.subdomain) || null,
    customDomain: normalizeDomain(formData.customDomain) || null,
    ownerAdminId: formData.ownerAdminId ? Number(formData.ownerAdminId) : null,
    status: formData.status,
    branchEnabled,
    branchLimit,
  };

  if (mode === 'create') {
    payload.tenantCode = normalizeDomain(formData.tenantCode);
    payload.admin = {
      name: formData.adminName.trim(),
      phone: formData.adminPhone.trim(),
      email: formData.adminEmail.trim(),
      username: formData.adminUsername.trim(),
      password: formData.adminPassword,
      city: formData.adminCity.trim(),
      province: formData.adminProvince.trim(),
    };
    payload.profile = {
      name: formData.profileName.trim(),
      email: formData.profileEmail.trim() || formData.adminEmail.trim(),
      phone1: formData.phone1.trim(),
      phone2: formData.phone2.trim(),
      address: formData.address.trim(),
      branch: formData.branch.trim(),
      city: formData.city.trim(),
      regNo: formData.regNo.trim(),
    };
  }

  if (mode === 'edit' && formData.adminPassword) {
    payload.adminPassword = formData.adminPassword;
  }

  if (mode === 'edit') {
    payload.admin = {
      name: formData.adminName.trim(),
      phone: formData.adminPhone.trim(),
      email: formData.adminEmail.trim(),
      username: formData.adminUsername.trim(),
      city: formData.adminCity.trim(),
      province: formData.adminProvince.trim(),
    };
    payload.profile = {
      name: formData.profileName.trim(),
      email: formData.profileEmail.trim(),
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

const getBranchErrorMessage = (message) => {
  const text = String(message || '');
  if (text.includes('less than existing branches count')) {
    return 'برانچ حد موجودہ برانچز کی تعداد سے کم نہیں ہو سکتی۔ موجودہ برانچ ڈیٹا حذف نہیں کیا جائے گا۔';
  }
  if (text.includes('at least 1') || text.includes('Branch limit is required')) {
    return 'برانچ سسٹم فعال ہو تو برانچ حد کم از کم 1 ہونا ضروری ہے۔';
  }
  if (text.includes('negative')) {
    return 'برانچ حد منفی نہیں ہو سکتی۔';
  }
  return text;
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ur-PK');
};

export const TenantManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useParams();
  const { isSuperAdmin } = usePermissions();

  const [tenants, setTenants] = useState([]);
  const [owners, setOwners] = useState([]);
  const [cities, setCities] = useState([]);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [tenantBranches, setTenantBranches] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchLimitInputs, setBranchLimitInputs] = useState({});
  const [branchAction, setBranchAction] = useState(null);
  const [tenantDeleteAction, setTenantDeleteAction] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBranchSaving, setIsBranchSaving] = useState(false);
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

  const cityOptions = useMemo(() => [
    { value: '', label: 'شہر منتخب کریں' },
    ...cities.map((city) => ({
      value: city.name,
      label: city.name,
    })),
  ], [cities]);

  const loadOwners = useCallback(async () => {
    if (!isSuperAdmin) return;
    const result = await getUsers({ page: 1, limit: 100 });
    setOwners(result.items || []);
  }, [isSuperAdmin]);

  const loadCities = useCallback(async () => {
    if (!isSuperAdmin) return;
    const result = await getCities('page=1&limit=100&status=active');
    setCities(result.items || []);
  }, [isSuperAdmin]);

  const loadTenants = useCallback(async () => {
    if (!isSuperAdmin) return;

    setIsLoading(true);
    setError('');
    try {
      const result = await getTenantBranchSettings({ page: 1, limit: 100, search, status: statusFilter });
      const items = result.items || [];
      setTenants(items);
      setBranchLimitInputs(
        items.reduce((values, tenant) => ({
          ...values,
          [tenant.tenantId || tenant.id]: tenant.branchLimit ?? '',
        }), {})
      );
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
      const tenant = mode === 'edit'
        ? await getTenantById(tenantId)
        : await getTenantBranchSummary(tenantId);
      const branchesResult = mode === 'details'
        ? await getTenantBranches(tenantId, { page: 1, limit: 100 })
        : { items: [] };
      setCurrentTenant(tenant);
      setTenantBranches(branchesResult.items || []);
      const tenantAdmin = tenant?.tenantAdmin || {};
      const madrassaProfile = tenant?.madrassaProfile || {};
      setFormData({
        tenantCode: tenant?.tenantCode || '',
        name: tenant?.name || tenant?.tenantName || '',
        subdomain: tenant?.subdomain || '',
        customDomain: tenant?.customDomain || '',
        ownerAdminId: tenant?.ownerAdminId ? String(tenant.ownerAdminId) : '',
        status: tenant?.status || 'active',
        branchEnabled: tenant?.branchEnabled ? 'true' : 'false',
        branchLimit: tenant?.branchLimit ?? '',
        adminName: tenantAdmin.name || '',
        adminPhone: tenantAdmin.phone || '',
        adminEmail: tenantAdmin.email || '',
        adminUsername: tenantAdmin.username || '',
        adminPassword: '',
        adminCity: tenantAdmin.city || '',
        adminProvince: tenantAdmin.province || '',
        profileName: madrassaProfile.name || tenant?.name || tenant?.tenantName || '',
        profileEmail: madrassaProfile.email || '',
        phone1: madrassaProfile.phone1 || '',
        phone2: madrassaProfile.phone2 || '',
        address: madrassaProfile.address || '',
        branch: madrassaProfile.branch || 'مرکزی کیمپس',
        city: madrassaProfile.city || '',
        regNo: madrassaProfile.regNo || '',
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
    loadCities().catch((cityError) => setError(cityError.message || 'شہروں کی فہرست لوڈ نہیں ہو سکی۔'));
  }, [loadCities]);

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
      setTenantBranches([]);
      setFormData(emptyForm);
      setIsLoading(false);
      return undefined;
    }

    loadTenant();
    return undefined;
  }, [isSuperAdmin, loadTenant, loadTenants, mode]);

  const handleSubmit = async () => {
    if (isSaving) return undefined;

    const nextErrors = {};
    if (!formData.profileName.trim()) return setError('مدرسہ کا نام ضروری ہے۔');
    if (mode === 'create' && !formData.tenantCode.trim()) return setError('مدرسہ کوڈ ضروری ہے۔');
    if (!formData.adminName.trim()) return setError('مدرسہ ایڈمن کا نام ضروری ہے۔');
    if (!formData.adminEmail.trim()) return setError('مدرسہ ایڈمن کا ای میل ضروری ہے۔');
    if (!formData.adminUsername.trim()) return setError('مدرسہ ایڈمن کا صارف نام ضروری ہے۔');
    if (mode === 'create' && formData.adminPassword.length < 8) return setError('مدرسہ ایڈمن کا پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔');
    if (mode === 'edit' && formData.adminPassword && formData.adminPassword.length < 8) return setError('نیا ایڈمن پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔');
    if (formData.branchEnabled === 'true' && (!formData.branchLimit || Number(formData.branchLimit) < 1)) {
      nextErrors.branchLimit = 'برانچ سسٹم فعال ہو تو برانچ حد کم از کم 1 ہونا ضروری ہے۔';
    }
    if (formData.branchLimit !== '' && Number(formData.branchLimit) < 0) {
      nextErrors.branchLimit = 'برانچ حد منفی نہیں ہو سکتی۔';
    }
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      setError(Object.values(nextErrors)[0]);
      return undefined;
    }

    setIsSaving(true);
    setFormErrors({});
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
      setError(getBranchErrorMessage(saveError.message) || 'مدرسہ محفوظ نہیں ہو سکا۔');
    } finally {
      setIsSaving(false);
    }

    return undefined;
  };

  const refreshBranchData = async (id = tenantId) => {
    if (mode === 'list') {
      await loadTenants();
      return;
    }

    if (id) {
      const [summary, branchesResult] = await Promise.all([
        getTenantBranchSummary(id),
        getTenantBranches(id, { page: 1, limit: 100 }),
      ]);
      setCurrentTenant(summary);
      setTenantBranches(branchesResult.items || []);
      setBranchLimitInputs((prev) => ({
        ...prev,
        [summary.tenantId || summary.id]: summary.branchLimit ?? '',
      }));
    }
  };

  const handleConfirmBranchToggle = async () => {
    if (!branchAction?.tenant) return;
    if (isBranchSaving) return;

    const targetTenant = branchAction.tenant;
    const nextEnabled = branchAction.type === 'enable';
    const targetTenantId = targetTenant.tenantId || targetTenant.id;
    const currentLimit = branchLimitInputs[targetTenantId] === ''
      ? targetTenant.branchLimit
      : branchLimitInputs[targetTenantId];
    const branchLimit = currentLimit === '' || currentLimit === null || currentLimit === undefined
      ? null
      : Number(currentLimit);

    if (nextEnabled && (!branchLimit || branchLimit < 1)) {
      setError('برانچ سسٹم فعال کرنے کے لیے برانچ حد کم از کم 1 درج کریں۔');
      setBranchAction(null);
      return;
    }

    setIsBranchSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateTenantBranchSettings(targetTenantId, {
        branchEnabled: nextEnabled,
        branchLimit,
      });
      setSuccess(nextEnabled ? 'برانچ سسٹم فعال ہو گیا۔' : 'برانچ سسٹم غیر فعال ہو گیا۔');
      setBranchAction(null);
      await refreshBranchData(targetTenantId);
    } catch (actionError) {
      setError(getBranchErrorMessage(actionError.message) || 'برانچ سیٹنگ محفوظ نہیں ہو سکی۔');
    } finally {
      setIsBranchSaving(false);
    }
  };

  const handleUpdateBranchLimit = async (tenant) => {
    if (isBranchSaving) return;

    const targetTenantId = tenant.tenantId || tenant.id;
    const value = branchLimitInputs[targetTenantId];
    const branchLimit = value === '' || value === null || value === undefined ? null : Number(value);

    if (tenant.branchEnabled && (!branchLimit || branchLimit < 1)) {
      setError('برانچ سسٹم فعال ہو تو برانچ حد کم از کم 1 ہونا ضروری ہے۔');
      return;
    }
    if (branchLimit !== null && branchLimit < 0) {
      setError('برانچ حد منفی نہیں ہو سکتی۔');
      return;
    }

    setIsBranchSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!tenant.branchEnabled && Number.isInteger(branchLimit) && branchLimit >= 1) {
        await updateTenantBranchSettings(targetTenantId, { branchEnabled: true, branchLimit });
        setSuccess('برانچ سسٹم فعال ہو گیا اور برانچ حد کامیابی سے اپ ڈیٹ ہو گئی۔');
      } else {
        await updateTenantBranchLimit(targetTenantId, { branchLimit });
        setSuccess('برانچ حد کامیابی سے اپ ڈیٹ ہو گئی۔');
      }
      await refreshBranchData(targetTenantId);
    } catch (limitError) {
      setError(getBranchErrorMessage(limitError.message) || 'برانچ حد اپ ڈیٹ نہیں ہو سکی۔');
    } finally {
      setIsBranchSaving(false);
    }
  };

  const handleConfirmTenantDelete = async () => {
    if (!tenantDeleteAction?.tenant || isSaving) return;

    const targetTenantId = tenantDeleteAction.tenant.tenantId || tenantDeleteAction.tenant.id;
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateTenant(targetTenantId, { status: 'inactive' });
      setSuccess('مدرسہ غیر فعال کر دیا گیا۔');
      setTenantDeleteAction(null);
      if (mode === 'list') {
        await loadTenants();
      } else {
        navigate('/tenant-management');
      }
    } catch (deleteError) {
      setError(deleteError.message || 'مدرسہ غیر فعال نہیں ہو سکا۔');
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
        <InputField label="سب ڈومین" placeholder="demo" value={formData.subdomain} onChange={(event) => setFormData((prev) => ({ ...prev, subdomain: event.target.value }))} />
        <InputField label="کسٹم ڈومین" placeholder="school.example.com" value={formData.customDomain} onChange={(event) => setFormData((prev) => ({ ...prev, customDomain: event.target.value }))} />
        <SelectField label="حالت" options={statusOptions} value={formData.status} onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))} />
      </div>

      <div className="mt-8 border-t border-[var(--color-border)] pt-8">
        <h2 className="text-right text-lg font-black text-[var(--color-text-main)]">برانچ سیٹنگز</h2>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <SelectField
            label="برانچ سسٹم"
            options={[
              { value: 'false', label: 'غیر فعال' },
              { value: 'true', label: 'فعال' },
            ]}
            value={formData.branchEnabled}
            onChange={(event) => setFormData((prev) => ({ ...prev, branchEnabled: event.target.value }))}
          />
        <InputField
            id="tenant-branch-limit"
            label="برانچ حد"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="مثلاً: 3"
            value={formData.branchLimit}
            error={formErrors.branchLimit}
            onChange={(event) => {
              const nextValue = event.target.value;
              setFormData((prev) => ({
                ...prev,
                branchLimit: nextValue,
                ...(Number(nextValue) >= 1 ? { branchEnabled: 'true' } : {}),
              }));
              setFormErrors((prev) => {
                if (!prev.branchLimit) return prev;
                const nextErrors = { ...prev };
                delete nextErrors.branchLimit;
                return nextErrors;
              });
            }}
          />
        </div>
      </div>

      <>
        <div className="mt-8 border-t border-[var(--color-border)] pt-8">
            <h2 className="text-right text-lg font-black text-[var(--color-text-main)]">مدرسہ ایڈمن</h2>
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField label="ایڈمن کا نام" required placeholder="ایڈمن کا نام" value={formData.adminName} onChange={(event) => setFormData((prev) => ({ ...prev, adminName: event.target.value }))} />
              <InputField label="ایڈمن فون نمبر" placeholder="0300-0000000" value={formData.adminPhone} onChange={(event) => setFormData((prev) => ({ ...prev, adminPhone: event.target.value }))} />
              <InputField label="ایڈمن ای میل" required type="email" placeholder="admin@example.com" value={formData.adminEmail} onChange={(event) => setFormData((prev) => ({ ...prev, adminEmail: event.target.value }))} />
              <InputField label="ایڈمن صارف نام" required placeholder="admin_username" value={formData.adminUsername} onChange={(event) => setFormData((prev) => ({ ...prev, adminUsername: event.target.value }))} />
              <InputField label={mode === 'edit' ? 'نیا ایڈمن پاس ورڈ' : 'ایڈمن پاس ورڈ'} required={mode === 'create'} type="password" placeholder="کم از کم 8 حروف" value={formData.adminPassword} onChange={(event) => setFormData((prev) => ({ ...prev, adminPassword: event.target.value }))} />
              <SelectField label="صوبہ" options={provinceOptions} value={formData.adminProvince} onChange={(event) => setFormData((prev) => ({ ...prev, adminProvince: event.target.value }))} />
              <SelectField label="شہر" options={cityOptions} value={formData.adminCity} onChange={(event) => setFormData((prev) => ({ ...prev, adminCity: event.target.value }))} />
            </div>
        </div>

        <div className="mt-8 border-t border-[var(--color-border)] pt-8">
            <h2 className="text-right text-lg font-black text-[var(--color-text-main)]">ابتدائی مدرسہ پروفائل</h2>
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField label="مدرسہ کا نام" required placeholder="مدرسہ کا نام" value={formData.profileName} onChange={(event) => setFormData((prev) => ({ ...prev, profileName: event.target.value, name: event.target.value }))} />
              <InputField label="پروفائل ای میل" type="email" placeholder="profile@example.com" value={formData.profileEmail} onChange={(event) => setFormData((prev) => ({ ...prev, profileEmail: event.target.value }))} />
              <InputField label="برانچ" placeholder="مرکزی کیمپس" value={formData.branch} onChange={(event) => setFormData((prev) => ({ ...prev, branch: event.target.value }))} />
              <InputField label="فون نمبر" placeholder="0300-0000000" value={formData.phone1} onChange={(event) => setFormData((prev) => ({ ...prev, phone1: event.target.value }))} />
              <SelectField label="شہر" options={cityOptions} value={formData.city} onChange={(event) => setFormData((prev) => ({ ...prev, city: event.target.value }))} />
            </div>
        </div>
      </>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-end">
        <button type="button" onClick={() => navigate('/tenant-management')} className="rounded-2xl border border-[var(--color-border)] px-6 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)]">
          منسوخ کریں
        </button>
        <button type="button" onClick={handleSubmit} disabled={isSaving} aria-busy={isSaving} style={{ backgroundColor: 'var(--color-primary)' }} className="flex items-center justify-center gap-3 rounded-2xl px-8 py-3 text-sm font-black text-white shadow-lg shadow-[#00d094]/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
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

    const owner = currentTenant.tenantAdmin || owners.find((item) => Number(item.id) === Number(currentTenant.ownerAdminId));
    const currentTenantId = currentTenant.tenantId || currentTenant.id;
    const profile = currentTenant.madrassaProfile || {};
    const detailSections = [
      {
        title: 'مدرسہ معلومات',
        rows: [
          ['مدرسہ کوڈ', currentTenant.tenantCode],
          ['سب ڈومین', currentTenant.subdomain || '-'],
          ['کسٹم ڈومین', currentTenant.customDomain || '-'],
          ['حالت', currentTenant.status === 'active' ? 'فعال' : 'غیر فعال'],
        ],
      },
      {
        title: 'مدرسہ ایڈمن',
        rows: [
          ['ایڈمن کا نام', owner?.name || '-'],
          ['ایڈمن فون نمبر', owner?.phone || '-'],
          ['ایڈمن ای میل', owner?.email || '-'],
          ['ایڈمن صارف نام', owner?.username || '-'],
          ['شہر', owner?.city || '-'],
          ['صوبہ', owner?.province || '-'],
        ],
      },
      {
        title: 'ابتدائی مدرسہ پروفائل',
        rows: [
          ['مدرسہ کا نام', profile.name || currentTenant.tenantName || currentTenant.name || '-'],
          ['پروفائل ای میل', profile.email || '-'],
          ['برانچ', profile.branch || '-'],
          ['فون نمبر', profile.phone1 || '-'],
          ['شہر', profile.city || '-'],
        ],
      },
    ];

    return (
      <div className="space-y-6">
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">{currentTenant.tenantCode}</p>
              <h2 className="mt-3 text-2xl font-black text-[var(--color-text-main)]">{currentTenant.tenantName || currentTenant.name}</h2>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-[var(--color-text-muted)]">
                <span>{currentTenant.subdomain || 'سب ڈومین موجود نہیں'}</span>
                <span>{currentTenant.customDomain || 'کسٹم ڈومین موجود نہیں'}</span>
                <span>{owner ? getOwnerLabel(owner) : 'مالک مقرر نہیں'}</span>
                <span className={`rounded-xl px-3 py-1 font-black ${currentTenant.status === 'active' ? 'bg-emerald-500/10 text-[#00d094]' : 'bg-rose-500/10 text-rose-500'}`}>
                  {currentTenant.status === 'active' ? 'فعال' : 'غیر فعال'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate(`/tenant-management/${currentTenantId}/edit`)} className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-3 text-sm font-black text-blue-500 transition-all hover:bg-blue-500 hover:text-white">
                <Edit2 size={16} />
                ترمیم کریں
              </button>
              <button type="button" onClick={() => setTenantDeleteAction({ tenant: currentTenant })} className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-500 transition-all hover:bg-rose-500 hover:text-white">
                <Trash2 size={16} />
                حذف کریں
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {detailSections.map((section) => (
            <div key={section.title} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <h3 className="text-right text-lg font-black text-[var(--color-text-main)]">{section.title}</h3>
              <div className="mt-4 space-y-3">
                {section.rows.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 border-b border-[var(--color-border)]/50 pb-3 last:border-b-0 last:pb-0">
                    <span className="text-sm font-black text-[var(--color-text-main)]">{value || '-'}</span>
                    <span className="shrink-0 text-xs font-bold text-[var(--color-text-muted)]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ['برانچ سسٹم', currentTenant.branchEnabled ? 'فعال' : 'غیر فعال'],
            ['برانچ حد', currentTenant.branchLimit ?? '-'],
            ['بن چکی برانچز', currentTenant.branchesCreated ?? 0],
            ['باقی برانچز', currentTenant.remainingBranches ?? 0],
            ['فعال برانچز', currentTenant.activeBranches ?? 0],
            ['غیر فعال برانچز', currentTenant.inactiveBranches ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <p className="text-xs font-black text-[var(--color-text-muted)]">{label}</p>
              <p className="mt-3 text-xl font-black text-[var(--color-text-main)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[var(--color-border)] p-5 md:flex-row md:items-center md:justify-between">
            <div className="text-right">
              <h3 className="text-xl font-black text-[var(--color-text-main)]">برانچ تفصیل</h3>
              <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">اس مدرسہ کی برانچز اور موجودہ رسائی کی معلومات</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-right">
              <thead>
                <tr className="text-[var(--color-text-muted)]">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">برانچ</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کوڈ</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">برانچ ایڈمن / صارف</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">تاریخ</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">اجازتیں</th>
                </tr>
              </thead>
              <tbody>
                {tenantBranches.length ? tenantBranches.map((branch) => (
                  <tr key={branch.id} className="border-t border-[var(--color-border)]/60">
                    <td className="px-6 py-4 font-black text-[var(--color-text-main)]">{branch.name}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-main)]">{branch.code || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-main)]">{branch.creator?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-xl px-3 py-1 text-xs font-black ${branch.status === 'active' ? 'bg-emerald-500/10 text-[#00d094]' : 'bg-rose-500/10 text-rose-500'}`}>
                        {branch.status === 'active' ? 'فعال' : 'غیر فعال'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{formatDate(branch.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">موجودہ کردار کے مطابق</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">ابھی کوئی برانچ موجود نہیں۔</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderList = () => (
    <>
      <div className="grid grid-cols-1 gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="text-sm font-bold text-[var(--color-text-muted)]">کل مدارس: {tenants.length}</div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(240px,400px)_minmax(150px,220px)] lg:justify-end">
          <div className="relative">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input id="tenant-search" aria-label="مدرسہ تلاش کریں" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="مدرسہ تلاش کریں" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]" />
          </div>
          <select id="tenant-status-filter" aria-label="حالت فلٹر" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]">
            <option value="">تمام حالتیں</option>
            <option value="active">فعال</option>
            <option value="inactive">غیر فعال</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] table-fixed text-right">
            <colgroup>
              <col className="w-[210px]" />
              <col className="w-[300px]" />
              <col className="w-[180px]" />
              <col className="w-[120px]" />
              <col className="w-[130px]" />
              <col className="w-[180px]" />
              <col className="w-[95px]" />
              <col className="w-[95px]" />
              <col className="w-[190px]" />
            </colgroup>
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">مدرسہ</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ڈومین / لنک</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ایڈمن</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">برانچ سسٹم</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حد</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">بن چکی</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">باقی</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ایکشن</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">مدارس لوڈ ہو رہے ہیں...</td></tr>
              ) : tenants.length ? (
                tenants.map((tenant) => {
                  const tenantRowId = tenant.tenantId || tenant.id;
                  const owner = tenant.tenantAdmin || owners.find((item) => Number(item.id) === Number(tenant.ownerAdminId));

                  return (
                    <tr key={tenantRowId} className="border-t border-[var(--color-border)]/60 align-top">
                      <td className="px-6 py-5">
                        <div className="break-words font-black leading-7 text-[var(--color-text-main)]">{tenant.tenantName || tenant.name}</div>
                        <div className="mt-1 break-all text-xs font-bold text-[var(--color-text-muted)]">{tenant.tenantCode}</div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-[var(--color-text-main)]">
                        <span className="flex min-w-0 items-start gap-2 break-words leading-7">
                          <Globe2 size={15} className="mt-1 shrink-0 text-[var(--color-text-muted)]" />
                          <span className="min-w-0 break-all">{tenant.link || tenant.customDomain || tenant.subdomain || '-'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold leading-7 text-[var(--color-text-main)]">{owner ? getOwnerLabel(owner) : '-'}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex min-w-[72px] justify-center rounded-xl px-3 py-1 text-xs font-black ${tenant.status === 'active' ? 'bg-emerald-500/10 text-[#00d094]' : 'bg-rose-500/10 text-rose-500'}`}>
                          {tenant.status === 'active' ? 'فعال' : 'غیر فعال'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex min-w-[72px] justify-center rounded-xl px-3 py-1 text-xs font-black ${tenant.branchEnabled ? 'bg-emerald-500/10 text-[#00d094]' : 'bg-rose-500/10 text-rose-500'}`}>
                          {tenant.branchEnabled ? 'فعال' : 'غیر فعال'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex min-w-[140px] items-center gap-2">
                          <input
                            aria-label={`${tenant.tenantName || tenant.name || 'مدرسہ'} کی برانچ حد`}
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={branchLimitInputs[tenantRowId] ?? ''}
                            onChange={(event) => setBranchLimitInputs((prev) => ({ ...prev, [tenantRowId]: event.target.value }))}
                            className="h-11 w-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-center text-sm font-black text-[var(--color-text-main)] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateBranchLimit(tenant)}
                            disabled={isBranchSaving}
                            className="rounded-xl bg-blue-500/10 px-3 py-2 text-sm font-black text-blue-500 transition-all hover:bg-blue-500 hover:text-white disabled:opacity-60"
                          >
                            محفوظ
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-[var(--color-text-main)]">{tenant.branchesCreated ?? 0}</td>
                      <td className="px-6 py-5 text-sm font-black text-[var(--color-text-main)]">{tenant.remainingBranches ?? 0}</td>
                      <td className="px-6 py-5">
                        <div className="flex min-w-[170px] items-center justify-start gap-2 whitespace-nowrap">
                          <button type="button" onClick={() => navigate(`/tenant-management/${tenantRowId}`)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white" title="دیکھیں">
                            <Eye size={16} />
                          </button>
                          <button type="button" onClick={() => navigate(`/tenant-management/${tenantRowId}/edit`)} className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500 transition-all hover:bg-blue-500 hover:text-white" title="ترمیم کریں">
                            <Edit2 size={16} />
                          </button>
                          <button type="button" onClick={() => setTenantDeleteAction({ tenant })} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white" title="حذف کریں">
                            <Trash2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setBranchAction({ type: tenant.branchEnabled ? 'disable' : 'enable', tenant })}
                            className={`rounded-xl p-2.5 transition-all ${tenant.branchEnabled ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-[#00d094] hover:bg-[#00d094] hover:text-white'}`}
                            title={tenant.branchEnabled ? 'برانچ سسٹم غیر فعال کریں' : 'برانچ سسٹم فعال کریں'}
                          >
                            <SlidersHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="9" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">ابھی کوئی مدرسہ موجود نہیں۔</td></tr>
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
      {branchAction ? (
        <DeleteConfirmationModal
          title={branchAction.type === 'enable' ? 'برانچ سسٹم فعال کرنے کی تصدیق' : 'برانچ سسٹم غیر فعال کرنے کی تصدیق'}
          message={branchAction.type === 'enable'
            ? 'کیا آپ واقعی اس مدرسہ کے لیے برانچ سسٹم فعال کرنا چاہتے ہیں؟'
            : 'کیا آپ واقعی اس مدرسہ کے لیے برانچ سسٹم غیر فعال کرنا چاہتے ہیں؟ موجودہ برانچز حذف نہیں ہوں گی۔'}
          targetName={branchAction.tenant?.tenantName || branchAction.tenant?.name || ''}
          isDeleting={isBranchSaving}
          onClose={() => setBranchAction(null)}
          onConfirm={handleConfirmBranchToggle}
          confirmText={branchAction.type === 'enable' ? 'فعال کریں' : 'غیر فعال کریں'}
          loadingText="محفوظ ہو رہا ہے..."
        />
      ) : null}
      {tenantDeleteAction ? (
        <DeleteConfirmationModal
          title="مدرسہ غیر فعال کرنے کی تصدیق"
          message="کیا آپ واقعی اس مدرسہ کو غیر فعال کرنا چاہتے ہیں؟ موجودہ ڈیٹا حذف نہیں ہو گا۔"
          targetName={tenantDeleteAction.tenant?.tenantName || tenantDeleteAction.tenant?.name || ''}
          isDeleting={isSaving}
          onClose={() => setTenantDeleteAction(null)}
          onConfirm={handleConfirmTenantDelete}
          confirmText="غیر فعال کریں"
          loadingText="محفوظ ہو رہا ہے..."
        />
      ) : null}
    </div>
  );
};


