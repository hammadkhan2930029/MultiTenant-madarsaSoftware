import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Edit2, Eye, Plus, Save, Search, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { InputField, SelectField } from '../../Components/HR/FormElements';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { SUPER_ADMIN_ROLE } from '../../Constant/Permissions';
import { getRoles } from '../../Constant/RoleManagementApi';
import { assignUserRole, createUser, getUserById, getUsers, updateUser } from '../../Constant/UserManagementApi';
import { refreshPermissions } from '../../Constant/AdminAuth';
import { usePermissions } from '../../Hooks/usePermissions';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  confirmPassword: '',
  roleId: '',
  status: 'active',
};

const roleDisplayNames = {
  super_admin: 'سپر ایڈمن',
  admin: 'ایڈمن',
  accountant: 'اکاؤنٹنٹ',
  teacher: 'استاد',
  receptionist: 'ریسپشنسٹ',
  read_only: 'صرف دیکھنے والا',
  store_manager: 'اسٹور مینیجر',
  viewer: 'صرف دیکھنے والا',
};

const moduleDisplayNames = {
  dashboard: 'ڈیش بورڈ',
  role_management: 'کردار مینجمنٹ',
  roles: 'کردار',
  users: 'صارفین',
  students: 'طلباء',
  student_fees: 'طلباء فیس',
  parents: 'والدین',
  attendance: 'حاضری',
  teachers: 'اساتذہ',
  staff: 'عملہ',
  classes: 'جماعتیں',
  sections: 'سیکشنز',
  sessions: 'سیشنز',
  subjects: 'مضامین',
  finance: 'مالیات',
  funds: 'عطیات',
  fees: 'فیس',
  salary: 'تنخواہ',
  hifz: 'حفظ',
  exams: 'امتحانات',
  exam_results: 'امتحانی نتائج',
  result_grades: 'رزلٹ گریڈز',
  store: 'اسٹور',
  settings: 'ترتیبات',
  profile: 'پروفائل',
  support: 'سپورٹ',
  suggestions: 'تجاویز',
  reports: 'رپورٹس',
};

const permissionDisplayNames = {
  'dashboard.view': 'ڈیش بورڈ دیکھیں',
  'role_management.view': 'کردار مینجمنٹ دیکھیں',
  'roles.view': 'کردار دیکھیں',
  'roles.manage': 'کردار مینج کریں',
  'roles.create': 'کردار بنائیں',
  'roles.edit': 'کردار میں ترمیم کریں',
  'roles.delete': 'کردار حذف کریں',
  'roles.assign_permissions': 'کردار کو اجازتیں دیں',
  'users.view': 'صارفین دیکھیں',
  'users.manage': 'صارفین مینج کریں',
  'users.create': 'صارف بنائیں',
  'users.edit': 'صارف میں ترمیم کریں',
  'users.delete': 'صارف حذف کریں',
  'students.view': 'طلباء دیکھیں',
  'students.create': 'طالب علم شامل کریں',
  'students.update': 'طالب علم میں ترمیم کریں',
  'students.edit': 'طالب علم میں ترمیم کریں',
  'students.delete': 'طالب علم حذف کریں',
  'attendance.view': 'حاضری دیکھیں',
  'attendance.mark': 'حاضری درج کریں',
  'teachers.view': 'اساتذہ دیکھیں',
  'fees.view': 'فیس دیکھیں',
  'reports.view': 'رپورٹس دیکھیں',
  'settings.view': 'ترتیبات دیکھیں',
};

const actionDisplayNames = {
  view: 'دیکھیں',
  create: 'بنائیں',
  add: 'شامل کریں',
  edit: 'ترمیم کریں',
  update: 'تبدیل کریں',
  delete: 'حذف کریں',
  manage: 'مینج کریں',
  mark: 'درج کریں',
  approve: 'منظوری دیں',
  export: 'ایکسپورٹ کریں',
  assign: 'تفویض کریں',
  assign_class: 'کلاس تفویض کریں',
  assign_permissions: 'اجازتیں دیں',
  change_password: 'پاس ورڈ تبدیل کریں',
};

const getRoleName = (user) => (
  user?.roleName ||
  user?.role_name ||
  user?.roleDetails?.roleName ||
  user?.roleDetails?.role_name ||
  user?.role?.roleName ||
  user?.role?.role_name ||
  user?.role ||
  ''
);

const getRoleRecordName = (role) => role?.roleName || role?.role_name || role?.name || '';
const getRoleDisplayName = (roleName) => roleDisplayNames[roleName] || roleName || '-';
const getRoleStatus = (role) => String(role?.status || 'active').toLowerCase();
const getUserStatus = (user) => String(user?.status || 'active').toLowerCase();
const isSuperAdminUser = (user) => getRoleName(user) === SUPER_ADMIN_ROLE;
const getUserPhone = (user) => user?.phone || user?.phoneNumber || user?.phone_number || '---';

const formatDate = (value) => {
  if (!value) return '---';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '---';
  return date.toLocaleDateString('ur-PK', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getPermissionKey = (permission) => (
  typeof permission === 'string' ? permission : permission?.permissionKey || permission?.permission_key || ''
);

const getPermissionName = (permission) => {
  const key = getPermissionKey(permission);
  const rawName = typeof permission === 'string' ? '' : permission?.permissionName || permission?.permission_name || '';

  if (permissionDisplayNames[key]) return permissionDisplayNames[key];
  if (rawName && !/[A-Za-z]/.test(rawName)) return rawName;

  const [modulePart, ...actionParts] = String(key).split('.');
  const moduleLabel = moduleDisplayNames[modulePart] || modulePart;
  const actionKey = actionParts.join('.');
  const actionLabel = actionDisplayNames[actionKey] || actionDisplayNames[actionParts[actionParts.length - 1]] || '';

  return moduleLabel && actionLabel ? `${moduleLabel} ${actionLabel}` : rawName || key;
};

export const UserManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const { hasPermission } = usePermissions();
  const canManageUsers = hasPermission('users.manage');

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useNotificationBridge({ error, success });

  const mode = useMemo(() => {
    if (location.pathname.endsWith('/create')) return 'create';
    if (location.pathname.endsWith('/edit')) return 'edit';
    if (userId) return 'details';
    return 'list';
  }, [location.pathname, userId]);

  const roleOptions = useMemo(() => {
    const lockSuperAdminRole = mode === 'edit' && isSuperAdminUser(currentUser);
    const visibleRoles = roles.filter((role) => {
      const roleName = getRoleRecordName(role);
      const isCurrentRole = currentUser?.roleId && Number(currentUser.roleId) === Number(role.id);
      const active = getRoleStatus(role) === 'active';
      return (active || (lockSuperAdminRole && isCurrentRole)) && (roleName !== SUPER_ADMIN_ROLE || lockSuperAdminRole);
    });

    return [
      { value: '', label: 'کردار منتخب کریں' },
      ...visibleRoles.map((role) => ({ value: String(role.id), label: getRoleDisplayName(getRoleRecordName(role)) })),
    ];
  }, [currentUser, mode, roles]);

  const roleFilterOptions = useMemo(() => [
    { value: '', label: 'تمام کردار' },
    ...roles.map((role) => ({ value: String(role.id), label: getRoleDisplayName(getRoleRecordName(role)) })),
  ], [roles]);

  const loadRoles = useCallback(async () => {
    const result = await getRoles({ page: 1, limit: 100 });
    setRoles(result.items || []);
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getUsers({ page: 1, limit: 100, search, roleId: roleFilter, status: statusFilter });
      setUsers(result.items || []);
    } catch (loadError) {
      setError(loadError.message || 'صارفین لوڈ نہیں ہو سکے۔');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, search, statusFilter]);

  const loadUser = useCallback(async () => {
    if (!userId || mode === 'list' || mode === 'create') return;

    setIsLoading(true);
    setError('');
    try {
      const user = await getUserById(userId);
      setCurrentUser(user);
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        username: user?.username || '',
        password: '',
        confirmPassword: '',
        roleId: user?.roleId ? String(user.roleId) : '',
        status: user?.status || 'active',
      });
    } catch (loadError) {
      setError(loadError.message || 'صارف کی تفصیل لوڈ نہیں ہو سکی۔');
    } finally {
      setIsLoading(false);
    }
  }, [mode, userId]);

  useEffect(() => {
    loadRoles().catch((roleError) => setError(roleError.message || 'کردار لوڈ نہیں ہو سکے۔'));
  }, [loadRoles]);

  useEffect(() => {
    if (mode === 'list') {
      const timer = setTimeout(loadUsers, 250);
      return () => clearTimeout(timer);
    }

    if (mode === 'create') {
      setCurrentUser(null);
      setFormData(emptyForm);
      setIsLoading(false);
      return undefined;
    }

    loadUser();
    return undefined;
  }, [loadUser, loadUsers, mode]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return setError('صارف کا نام ضروری ہے۔');
    if (!formData.email.trim()) return setError('ای میل ضروری ہے۔');
    if (!formData.username.trim()) return setError('صارف نام ضروری ہے۔');
    if (mode === 'create' && !formData.password.trim()) return setError('پاس ورڈ ضروری ہے۔');
    if (!formData.password.trim() && formData.confirmPassword.trim()) return setError('پاس ورڈ بھی درج کریں۔');
    if (formData.password.trim() && formData.password !== formData.confirmPassword) {
      return setError('پاس ورڈ اور تصدیقی پاس ورڈ ایک جیسے ہونے چاہئیں۔');
    }
    if (!formData.roleId && !isSuperAdminUser(currentUser)) return setError('کردار منتخب کریں۔');

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        username: formData.username.trim(),
        status: formData.status,
      };

      if (mode === 'create' && !isSuperAdminUser(currentUser)) {
        payload.roleId = Number(formData.roleId);
      }

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      if (mode === 'edit') {
        await updateUser(userId, payload);
        if (!isSuperAdminUser(currentUser) && Number(formData.roleId) !== Number(currentUser?.roleId || 0)) {
          await assignUserRole(userId, Number(formData.roleId));
        }
        refreshPermissions().catch(() => {});
        setSuccess('صارف کامیابی سے اپڈیٹ ہو گیا۔');
        navigate(`/role-management/users/${userId}`);
      } else {
        await createUser(payload);
        setFormData(emptyForm);
        setSuccess('نیا صارف کامیابی سے محفوظ ہو گیا۔');
      }
    } catch (saveError) {
      setError(saveError.message || 'صارف محفوظ نہیں ہو سکا۔');
    } finally {
      setIsSaving(false);
    }

    return undefined;
  };

  const handleDeactivateUser = async () => {
    if (!deactivateTarget || isSuperAdminUser(deactivateTarget)) return;

    setIsDeactivating(true);
    setError('');
    setSuccess('');

    try {
      await updateUser(deactivateTarget.id, { status: 'inactive' });
      setDeactivateTarget(null);
      refreshPermissions().catch(() => {});
      setSuccess('صارف کامیابی سے غیر فعال ہو گیا۔');
      await loadUsers();
    } catch (deactivateError) {
      setError(deactivateError.message || 'صارف غیر فعال نہیں ہو سکا۔');
    } finally {
      setIsDeactivating(false);
    }
  };

  const renderHeader = () => (
    <div className="flex flex-col gap-5 bg-[var(--color-surface)] p-4 md:p-6 rounded-[3rem] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] border border-[var(--color-border)] md:flex-row md:items-center md:justify-between">
      <div className="text-right">
        <h1 style={{ color: 'var(--color-text-main)' }} className="text-2xl font-black">User Management / Users</h1>
        <p style={{ color: 'var(--color-text-muted)' }} className="text-sm font-medium mt-4">
          صارفین بنائیں، کردار منتخب کریں اور اجازتیں دیکھیں۔
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {mode !== 'list' ? (
          <button type="button" onClick={() => navigate('/role-management/users')} className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-main)] transition-all hover:bg-[var(--color-bg)]">
            <ArrowRight size={18} />
            واپس
          </button>
        ) : null}

        {mode === 'list' && canManageUsers ? (
          <button type="button" onClick={() => navigate('/role-management/users/create')} style={{ backgroundColor: 'var(--color-primary)' }} className="flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#00d094]/20 transition-all active:scale-95">
            <Plus size={18} />
            نیا صارف
          </button>
        ) : null}

        <div style={{ backgroundColor: 'var(--color-primary)' }} className="hidden h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-[#00d094]/20 md:flex">
          <UserPlus size={24} />
        </div>
      </div>
    </div>
  );

  const renderForm = () => {
    const lockSuperAdminRole = mode === 'edit' && isSuperAdminUser(currentUser);

    return (
      <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="border rounded-[2.5rem] p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InputField label="نام" required placeholder="صارف کا نام" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
          <InputField label="ای میل" required type="email" placeholder="user@example.com" value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} />
          <InputField label="فون" placeholder="0300xxxxxxx" value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} />
          <InputField label="صارف نام" required placeholder="username" value={formData.username} onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))} />
          <InputField label={mode === 'edit' ? 'نیا پاس ورڈ' : 'پاس ورڈ'} required={mode === 'create'} type="password" placeholder={mode === 'edit' ? 'خالی چھوڑیں اگر تبدیل نہیں کرنا' : 'کم از کم 8 حروف'} value={formData.password} onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))} />
          <InputField label="تصدیقی پاس ورڈ" required={mode === 'create'} type="password" placeholder="پاس ورڈ دوبارہ لکھیں" value={formData.confirmPassword} onChange={(event) => setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))} />
          <SelectField label="کردار منتخب کریں" required options={roleOptions} value={formData.roleId} disabled={lockSuperAdminRole} onChange={(event) => setFormData((prev) => ({ ...prev, roleId: event.target.value }))} />
          <SelectField label="حالت" options={[{ value: 'active', label: 'فعال' }, { value: 'inactive', label: 'غیر فعال' }]} value={formData.status} onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))} />
        </div>

        {lockSuperAdminRole ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold leading-7 text-[var(--color-text-main)]">
            سپر ایڈمن صارف کا کردار محفوظ رکھا گیا ہے تاکہ رسائی غلطی سے محدود نہ ہو۔
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-end">
          <button type="button" onClick={() => navigate('/role-management/users')} className="rounded-2xl border border-[var(--color-border)] px-6 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)]">
            منسوخ کریں
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSaving} style={{ backgroundColor: 'var(--color-primary)' }} className="flex items-center justify-center gap-3 rounded-2xl px-8 py-3 text-sm font-black text-white shadow-lg shadow-[#00d094]/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
            {isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
            <Save size={18} />
          </button>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    if (isLoading) {
      return <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">صارف کی تفصیل لوڈ ہو رہی ہے...</div>;
    }

    if (!currentUser) {
      return <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">صارف موجود نہیں۔</div>;
    }

    const permissions = Array.isArray(currentUser.permissions) && currentUser.permissions.length
      ? currentUser.permissions
      : currentUser.permissionKeys || [];

    return (
      <>
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">صارف کا کردار</p>
              <h2 className="mt-3 text-2xl font-black text-[var(--color-text-main)]">{currentUser.name}</h2>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-[var(--color-text-muted)]">
                <span>{currentUser.email}</span>
                <span>{currentUser.username}</span>
                <span>{getUserPhone(currentUser)}</span>
                <span className="rounded-xl bg-emerald-500/10 px-3 py-1 font-black text-[#00d094]">{getRoleDisplayName(getRoleName(currentUser))}</span>
              </div>
            </div>

            {canManageUsers ? (
              <button type="button" onClick={() => navigate(`/role-management/users/${currentUser.id}/edit`)} className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-3 text-sm font-black text-blue-500 transition-all hover:bg-blue-500 hover:text-white">
                <Edit2 size={16} />
                ترمیم کریں
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
          <div className="mb-5 flex items-center gap-2 text-xl font-black text-[var(--color-text-main)]">
            <ShieldCheck size={22} className="text-[var(--color-primary)]" />
            اجازتیں
          </div>

          {permissions.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {permissions.map((permission) => {
                const key = getPermissionKey(permission);
                return (
                  <div key={key} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm font-bold text-[var(--color-text-main)]">
                    {getPermissionName(permission)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 text-center text-sm font-bold text-[var(--color-text-muted)]">
              کوئی اجازت موجود نہیں۔
            </div>
          )}
        </div>
      </>
    );
  };

  const renderList = () => (
    <>
      <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-bold text-[var(--color-text-muted)]">کل صارفین: {users.length}</div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <SelectField options={roleFilterOptions} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-12 py-0 md:w-48" />
          <SelectField
            options={[
              { value: '', label: 'تمام اسٹیٹس' },
              { value: 'active', label: 'فعال' },
              { value: 'inactive', label: 'غیر فعال' },
            ]}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-12 py-0 md:w-44"
          />
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="صارف تلاش کریں" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-right">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">نام</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ای میل</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">فون</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کردار</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">آخری لاگ اِن</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">عمل</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">صارفین لوڈ ہو رہے ہیں...</td></tr>
              ) : users.length ? (
                users.map((user) => {
                  const active = getUserStatus(user) === 'active';

                  return (
                    <tr key={user.id} className="border-t border-[var(--color-border)]/60">
                      <td className="px-6 py-4">
                        <div className="font-black text-[var(--color-text-main)]">{user.name}</div>
                        <div className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">{user.username}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-main)]">{user.email}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]" dir="ltr">{getUserPhone(user)}</td>
                      <td className="px-6 py-4 text-sm font-black text-[var(--color-text-main)]">{getRoleDisplayName(getRoleName(user))}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-xl px-3 py-1 text-xs font-black ${active ? 'bg-emerald-500/10 text-[#00d094]' : 'bg-rose-500/10 text-rose-500'}`}>
                          {active ? 'فعال' : 'غیر فعال'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{formatDate(user.lastLoginAt || user.last_login_at || user.lastLogin || user.last_login)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-start gap-2">
                          {hasPermission('users.view') ? (
                            <button type="button" onClick={() => navigate(`/role-management/users/${user.id}`)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white" title="دیکھیں">
                              <Eye size={16} />
                            </button>
                          ) : null}
                          {canManageUsers ? (
                            <button type="button" onClick={() => navigate(`/role-management/users/${user.id}/edit`)} className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500 transition-all hover:bg-blue-500 hover:text-white" title="ترمیم کریں">
                              <Edit2 size={16} />
                            </button>
                          ) : null}
                          {canManageUsers ? (
                            <button type="button" onClick={() => navigate(`/role-management/users/${user.id}/edit`)} className="rounded-xl bg-[var(--color-primary)]/10 p-2.5 text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)] hover:text-white" title="کردار تبدیل کریں">
                              <ShieldCheck size={16} />
                            </button>
                          ) : null}
                          {canManageUsers && active && !isSuperAdminUser(user) ? (
                            <button type="button" onClick={() => setDeactivateTarget(user)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white" title="غیر فعال کریں">
                              <Trash2 size={16} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="7" className="px-6 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی صارف موجود نہیں۔ سرچ یا فلٹر تبدیل کریں۔</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 lg:pt-0 md:pt-0 pt-6" dir="rtl">
      {renderHeader()}
      {mode === 'list' ? renderList() : null}
      {mode === 'create' || mode === 'edit' ? renderForm() : null}
      {mode === 'details' ? renderDetails() : null}

      {deactivateTarget ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
            <div className="flex items-start justify-between gap-4">
              <div className="text-right">
                <h3 className="text-xl font-black text-[var(--color-text-main)]">صارف غیر فعال کرنے کی تصدیق</h3>
                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                  کیا آپ واقعی <span className="text-rose-500">{deactivateTarget.name}</span> کو غیر فعال کرنا چاہتے ہیں؟
                </p>
              </div>
              <button type="button" onClick={() => !isDeactivating && setDeactivateTarget(null)} className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500">
                <X size={18} />
              </button>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setDeactivateTarget(null)} disabled={isDeactivating} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60">
                منسوخ کریں
              </button>
              <button type="button" onClick={handleDeactivateUser} disabled={isDeactivating} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70">
                {isDeactivating ? 'غیر فعال ہو رہا ہے...' : 'غیر فعال کریں'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
