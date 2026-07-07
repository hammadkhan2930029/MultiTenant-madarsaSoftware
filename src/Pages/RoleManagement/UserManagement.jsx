import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Edit2, Eye, Plus, Save, Search, ShieldCheck, UserPlus } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { InputField, SelectField } from '../../Components/HR/FormElements';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { SUPER_ADMIN_ROLE } from '../../Constant/Permissions';
import { getRoles } from '../../Constant/RoleManagementApi';
import { createUser, getUserById, getUsers, updateUser } from '../../Constant/UserManagementApi';
import { usePermissions } from '../../Hooks/usePermissions';

const emptyForm = {
  name: '',
  email: '',
  username: '',
  password: '',
  roleId: '',
  status: 'active',
};

const roleDisplayNames = {
  super_admin: 'سپر ایڈمن',
  admin: 'ایڈمن',
  accountant: 'اکاؤنٹنٹ',
  teacher: 'استاد',
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
};

const permissionDisplayNames = {
  'dashboard.view': 'ڈیش بورڈ دیکھیں',
  'role_management.view': 'کردار مینجمنٹ دیکھیں',
  'roles.view': 'کردار دیکھیں',
  'roles.create': 'کردار بنائیں',
  'roles.edit': 'کردار میں ترمیم کریں',
  'roles.delete': 'کردار حذف کریں',
  'roles.assign_permissions': 'کردار کو اجازتیں دیں',
  'users.view': 'صارفین دیکھیں',
  'users.create': 'صارف بنائیں',
  'users.edit': 'صارف میں ترمیم کریں',
  'users.delete': 'صارف حذف کریں',
  'students.view': 'طلباء دیکھیں',
  'students.create': 'طالب علم شامل کریں',
  'students.edit': 'طالب علم میں ترمیم کریں',
  'students.delete': 'طالب علم حذف کریں',
  'students.profile.view': 'طالب علم پروفائل دیکھیں',
  'students.id_card.view': 'آئی ڈی کارڈ دیکھیں',
  'students.assign_class': 'کلاس تفویض کریں',
  'students.schedule.view': 'طلباء شیڈول دیکھیں',
  'student_fees.view': 'طلباء فیس دیکھیں',
  'student_fees.create': 'طلباء فیس بنائیں',
  'student_fees.edit': 'طلباء فیس میں ترمیم کریں',
  'parents.view': 'والدین دیکھیں',
  'parents.create': 'والدین شامل کریں',
  'parents.edit': 'والدین میں ترمیم کریں',
  'parents.delete': 'والدین حذف کریں',
  'attendance.view': 'حاضری دیکھیں',
  'attendance.create': 'حاضری درج کریں',
  'attendance.edit': 'حاضری میں ترمیم کریں',
  'attendance.history.view': 'حاضری تاریخ دیکھیں',
  'teachers.view': 'اساتذہ دیکھیں',
  'teachers.create': 'استاد شامل کریں',
  'teachers.edit': 'استاد میں ترمیم کریں',
  'teachers.delete': 'استاد حذف کریں',
  'teachers.details.view': 'استاد کی تفصیل دیکھیں',
  'teachers.attendance.view': 'اساتذہ حاضری دیکھیں',
  'teachers.schedule.view': 'اساتذہ شیڈول دیکھیں',
  'teachers.salary_increments.view': 'تنخواہ انکریمنٹ دیکھیں',
  'staff.view': 'عملہ دیکھیں',
  'staff.create': 'عملہ شامل کریں',
  'staff.edit': 'عملہ میں ترمیم کریں',
  'staff.delete': 'عملہ حذف کریں',
  'classes.view': 'جماعتیں دیکھیں',
  'classes.create': 'جماعت بنائیں',
  'classes.edit': 'جماعت میں ترمیم کریں',
  'classes.delete': 'جماعت حذف کریں',
  'sections.view': 'سیکشن دیکھیں',
  'sections.create': 'سیکشن بنائیں',
  'sections.edit': 'سیکشن میں ترمیم کریں',
  'sections.delete': 'سیکشن حذف کریں',
  'sessions.view': 'سیشن دیکھیں',
  'subjects.view': 'مضامین دیکھیں',
  'finance.view': 'مالیات دیکھیں',
  'finance.heads.view': 'آمدن و اخراجات ہیڈز دیکھیں',
  'finance.transactions.view': 'آمدن و اخراجات اندراج دیکھیں',
  'finance.transactions.create': 'آمدن و اخراجات درج کریں',
  'finance.reports.view': 'مالی رپورٹس دیکھیں',
  'funds.view': 'عطیات دیکھیں',
  'funds.create': 'عطیہ درج کریں',
  'funds.edit': 'عطیہ میں ترمیم کریں',
  'funds.delete': 'عطیہ حذف کریں',
  'fees.view': 'فیس دیکھیں',
  'fees.create': 'فیس بنائیں',
  'fees.edit': 'فیس میں ترمیم کریں',
  'fees.delete': 'فیس حذف کریں',
  'fees.details.view': 'فیس تفصیل دیکھیں',
  'salary.view': 'تنخواہ دیکھیں',
  'salary.create': 'تنخواہ بنائیں',
  'salary.edit': 'تنخواہ میں ترمیم کریں',
  'salary.delete': 'تنخواہ حذف کریں',
  'hifz.view': 'حفظ دیکھیں',
  'hifz.daily.view': 'یومیہ جائزہ دیکھیں',
  'hifz.daily.create': 'یومیہ جائزہ درج کریں',
  'hifz.weekly.view': 'ہفتہ وار جائزہ دیکھیں',
  'hifz.weekly.create': 'ہفتہ وار جائزہ درج کریں',
  'hifz.monthly.view': 'ماہانہ جائزہ دیکھیں',
  'hifz.monthly.create': 'ماہانہ جائزہ درج کریں',
  'hifz.para.view': 'پارہ جائزہ دیکھیں',
  'hifz.para.create': 'پارہ جائزہ درج کریں',
  'exams.view': 'امتحانات دیکھیں',
  'exams.create': 'امتحان بنائیں',
  'exams.edit': 'امتحان میں ترمیم کریں',
  'exams.delete': 'امتحان حذف کریں',
  'exam_results.view': 'نتائج دیکھیں',
  'exam_results.create': 'نتیجہ درج کریں',
  'result_grades.view': 'نتیجہ گریڈ دیکھیں',
  'store.view': 'اسٹور دیکھیں',
  'store.approve': 'اسٹور منظوری دیں',
  'store.items.view': 'اشیاء دیکھیں',
  'store.items.create': 'شے شامل کریں',
  'store.items.edit': 'شے میں ترمیم کریں',
  'store.items.delete': 'شے حذف کریں',
  'store.categories.view': 'کیٹیگریز دیکھیں',
  'store.suppliers.view': 'سپلائرز دیکھیں',
  'store.purchases.view': 'خریداری دیکھیں',
  'store.stock_issues.view': 'اسٹاک اجرا دیکھیں',
  'store.returns.view': 'واپسی دیکھیں',
  'store.damaged_stock.view': 'خراب اسٹاک دیکھیں',
  'store.units.view': 'یونٹس دیکھیں',
  'store.reports': 'اسٹور رپورٹس دیکھیں',
  'settings.shifts.view': 'شفٹ دیکھیں',
  'settings.departments.view': 'شعبہ جات دیکھیں',
  'settings.degrees.view': 'ڈگری نام دیکھیں',
  'settings.cities.view': 'شہر دیکھیں',
  'profile.view': 'پروفائل دیکھیں',
  'profile.change_password': 'پاس ورڈ تبدیل کریں',
  'support.view': 'سپورٹ دیکھیں',
  'suggestions.view': 'تجاویز دیکھیں',
};

const actionDisplayNames = {
  view: 'دیکھیں',
  create: 'بنائیں',
  add: 'شامل کریں',
  edit: 'ترمیم کریں',
  update: 'اپڈیٹ کریں',
  delete: 'حذف کریں',
  generate: 'بنائیں',
  approve: 'منظوری دیں',
  assign_class: 'کلاس تفویض کریں',
  assign_permissions: 'اجازتیں دیں',
  change_password: 'پاس ورڈ تبدیل کریں',
};

const getRoleName = (user) => (
  user?.roleName || user?.role_name || user?.roleDetails?.roleName || user?.roleDetails?.role_name || user?.role?.roleName || user?.role?.role_name || user?.role || ''
);

const getRoleRecordName = (role) => role?.roleName || role?.role_name || '';
const getRoleDisplayName = (roleName) => roleDisplayNames[roleName] || roleName || '-';
const isSuperAdminUser = (user) => getRoleName(user) === SUPER_ADMIN_ROLE;

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      return roleName !== SUPER_ADMIN_ROLE || lockSuperAdminRole;
    });

    return [
      { value: '', label: 'کردار منتخب کریں' },
      ...visibleRoles.map((role) => {
        const roleName = getRoleRecordName(role);
        return { value: String(role.id), label: getRoleDisplayName(roleName) };
      }),
    ];
  }, [currentUser, mode, roles]);

  const loadRoles = useCallback(async () => {
    const result = await getRoles({ page: 1, limit: 100 });
    setRoles(result.items || []);
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getUsers({ page: 1, limit: 100, search });
      setUsers(result.items || []);
    } catch (loadError) {
      setError(loadError.message || 'صارفین لوڈ نہیں ہو سکے۔');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

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
        username: user?.username || '',
        password: '',
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
    if (!formData.roleId && !isSuperAdminUser(currentUser)) return setError('کردار منتخب کریں۔');

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        status: formData.status,
      };

      if (!isSuperAdminUser(currentUser)) {
        payload.roleId = Number(formData.roleId);
      }

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      if (mode === 'edit') {
        await updateUser(userId, payload);
        setSuccess('صارف کامیابی سے اپڈیٹ ہو گیا۔');
        navigate(`/role-management/users/${userId}`);
      } else {
        const createdUser = await createUser(payload);
        setSuccess('نیا صارف کامیابی سے محفوظ ہو گیا۔');
        navigate(createdUser?.id ? `/role-management/users/${createdUser.id}` : '/role-management/users');
      }
    } catch (saveError) {
      setError(saveError.message || 'صارف محفوظ نہیں ہو سکا۔');
    } finally {
      setIsSaving(false);
    }
  };

  const renderHeader = () => (
    <div className="flex flex-col gap-5 bg-[var(--color-surface)] p-4 md:p-6 rounded-[3rem] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] border border-[var(--color-border)] md:flex-row md:items-center md:justify-between">
      <div className="text-right">
        <h1 style={{ color: 'var(--color-text-main)' }} className="text-2xl font-black">صارفین مینجمنٹ</h1>
        <p style={{ color: 'var(--color-text-muted)' }} className="text-sm font-medium mt-4">صارفین بنائیں، کردار منتخب کریں اور اجازتیں دیکھیں۔</p>
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
          <InputField label="صارف نام" required placeholder="username" value={formData.username} onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))} />
          <InputField label={mode === 'edit' ? 'نیا پاس ورڈ' : 'پاس ورڈ'} required={mode === 'create'} type="password" placeholder={mode === 'edit' ? 'خالی چھوڑیں اگر تبدیل نہیں کرنا' : 'کم از کم 8 حروف'} value={formData.password} onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))} />
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
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="صارف تلاش کریں" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]" />
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">نام</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">صارف نام</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">صارف کا کردار</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">عمل</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">صارفین لوڈ ہو رہے ہیں...</td></tr>
              ) : users.length ? (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-[var(--color-border)]/60">
                    <td className="px-6 py-4">
                      <div className="font-black text-[var(--color-text-main)]">{user.name}</div>
                      <div className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-main)]">{user.username}</td>
                    <td className="px-6 py-4 text-sm font-black text-[var(--color-text-main)]">{getRoleDisplayName(getRoleName(user))}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-xl px-3 py-1 text-xs font-black ${user.status === 'active' ? 'bg-emerald-500/10 text-[#00d094]' : 'bg-rose-500/10 text-rose-500'}`}>
                        {user.status === 'active' ? 'فعال' : 'غیر فعال'}
                      </span>
                    </td>
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">ابھی تک کوئی صارف موجود نہیں۔</td></tr>
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
    </div>
  );
};
