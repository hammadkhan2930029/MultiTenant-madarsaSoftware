import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckSquare, Edit2, Eye, Plus, Save, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { InputField } from '../../Components/HR/FormElements';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { ROLE_PERMISSION_MODULES, SUPER_ADMIN_ROLE } from '../../Constant/Permissions';
import { createRole, deleteRole, getRoleById, getRolePermissions, getRoles, updateRole } from '../../Constant/RoleManagementApi';
import { usePermissions } from '../../Hooks/usePermissions';

const emptyForm = { roleName: '', description: '' };

const roleDisplayNames = {
  super_admin: 'سپر ایڈمن',
  admin: 'ایڈمن',
  accountant: 'اکاؤنٹنٹ',
  teacher: 'استاد',
  store_manager: 'اسٹور مینیجر',
  viewer: 'صرف دیکھنے والا',
};

const roleDescriptionDisplayNames = {
  super_admin: 'سسٹم کا مکمل اختیار رکھنے والا کردار۔',
  admin: 'مدرسہ انتظامیہ کے عمومی کاموں کے لیے کردار۔',
  accountant: 'مالیات، فیس اور تنخواہ سے متعلق کاموں کے لیے کردار۔',
  teacher: 'اساتذہ اور تعلیمی ریکارڈ سے متعلق کاموں کے لیے کردار۔',
  store_manager: 'اسٹور، خریداری اور اسٹاک سے متعلق کاموں کے لیے کردار۔',
  viewer: 'صرف ریکارڈ دیکھنے کے لیے کردار۔',
};

const moduleDisplayNames = {
  dashboard: 'ڈیش بورڈ',
  role_management: 'کردار مینجمنٹ',
  roles: 'کردار',
  users: 'صارفین',
  students: 'طلباء',
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
  other: 'دیگر اجازتیں',
  class_management: 'کلاس مینجمنٹ',
  parents_attendance: 'والدین اور حاضری',
  teachers_staff: 'اساتذہ اور عملہ',
  hifz_exams: 'حفظ اور امتحانات',
  student_fees: 'طلباء فیس',
  student_fee: 'طلباء فیس',
  students_fees: 'طلباء فیس',
  fee_details: 'فیس تفصیل',
  student_id_cards: 'طلباء آئی ڈی کارڈز',
  teacher_attendance: 'اساتذہ حاضری',
  teacher_schedules: 'اساتذہ شیڈول',
  salary_increments: 'تنخواہ انکریمنٹ',
  fund_collections: 'عطیات وصولی',
  income_heads: 'آمدن ہیڈز',
  expense_heads: 'اخراجات ہیڈز',
  financial_reports: 'مالی رپورٹس',
  store_items: 'اسٹور اشیاء',
  stock_issues: 'اسٹاک اجرا',
  damaged_stock: 'خراب اسٹاک',
  store_suppliers: 'اسٹور سپلائرز',
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
  'student_fees.view': 'طلباء فیس دیکھیں',
  'student_fees.create': 'طلباء فیس بنائیں',
  'student_fees.generate': 'طلباء فیس بنائیں',
  'student_fees.edit': 'طلباء فیس میں ترمیم کریں',
  'student_fees.delete': 'طلباء فیس حذف کریں',
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

const moduleWordLabels = {
  dashboard: 'ڈیش بورڈ',
  role: 'کردار',
  roles: 'کردار',
  management: 'مینجمنٹ',
  user: 'صارف',
  users: 'صارفین',
  student: 'طلباء',
  students: 'طلباء',
  fee: 'فیس',
  fees: 'فیس',
  teacher: 'اساتذہ',
  teachers: 'اساتذہ',
  staff: 'عملہ',
  parent: 'والدین',
  parents: 'والدین',
  attendance: 'حاضری',
  class: 'کلاس',
  classes: 'جماعتیں',
  section: 'سیکشن',
  sections: 'سیکشنز',
  session: 'سیشن',
  sessions: 'سیشنز',
  subject: 'مضمون',
  subjects: 'مضامین',
  finance: 'مالیات',
  fund: 'عطیہ',
  funds: 'عطیات',
  salary: 'تنخواہ',
  hifz: 'حفظ',
  exam: 'امتحان',
  exams: 'امتحانات',
  result: 'نتیجہ',
  results: 'نتائج',
  grade: 'گریڈ',
  grades: 'گریڈز',
  store: 'اسٹور',
  setting: 'ترتیب',
  settings: 'ترتیبات',
  profile: 'پروفائل',
  report: 'رپورٹ',
  reports: 'رپورٹس',
  id: 'آئی ڈی',
  card: 'کارڈ',
  cards: 'کارڈز',
  detail: 'تفصیل',
  details: 'تفصیل',
};

const actionDisplayNames = {
  view: 'دیکھیں',
  create: 'بنائیں',
  add: 'شامل کریں',
  edit: 'ترمیم کریں',
  update: 'اپڈیٹ کریں',
  delete: 'حذف کریں',
  generate: 'بنائیں',
  assign_class: 'کلاس تفویض کریں',
  assign_permissions: 'اجازتیں دیں',
  approve: 'منظوری دیں',
  change_password: 'پاس ورڈ تبدیل کریں',
};

const getPermissionKey = (permission) => (
  typeof permission === 'string' ? permission : permission?.permissionKey || permission?.permission_key || ''
);

const getRoleName = (role) => role?.roleName || role?.role_name || '';
const getRoleDisplayName = (role) => roleDisplayNames[getRoleName(role)] || getRoleName(role);
const getRoleDescription = (role) => roleDescriptionDisplayNames[getRoleName(role)] || role?.description || 'تفصیل موجود نہیں۔';
const isSystemRole = (role) => getRoleName(role) === SUPER_ADMIN_ROLE;

const moduleLabelById = ROLE_PERMISSION_MODULES.reduce((labels, module) => {
  labels[module.id] = module.label;
  return labels;
}, {});

const formatUnknownModuleLabel = (moduleName) => {
  if (!moduleName) return 'دیگر اجازتیں';
  const words = String(moduleName).split(/[_\s-]+/).filter(Boolean);
  const translated = words.map((word) => moduleWordLabels[word.toLowerCase()] || word).join(' ');
  return /[A-Za-z]/.test(translated) ? translated.replace(/_/g, ' ') : translated;
};

const formatModuleLabel = (moduleName) => moduleDisplayNames[moduleName] || moduleLabelById[moduleName] || formatUnknownModuleLabel(moduleName);

const formatPermissionLabel = (permission) => {
  const key = getPermissionKey(permission);
  const rawName = permission?.permissionName || permission?.permission_name || permission?.name || '';

  if (permissionDisplayNames[key]) return permissionDisplayNames[key];
  if (rawName && !/[A-Za-z]/.test(rawName)) return rawName;

  const [modulePart, ...actionParts] = String(key).split('.');
  const actionKey = actionParts.join('.');
  const moduleLabel = formatModuleLabel(modulePart);
  const actionLabel = actionDisplayNames[actionKey] || actionDisplayNames[actionParts[actionParts.length - 1]] || '';

  if (moduleLabel && actionLabel) return `${moduleLabel} ${actionLabel}`;
  return moduleLabel || rawName || key;
};

const groupPermissionsByModule = (permissions = []) => {
  if (!permissions.length) return ROLE_PERMISSION_MODULES;

  const grouped = new Map();

  permissions.forEach((permission) => {
    const key = permission.permissionKey || permission.permission_key;
    if (!key) return;

    const moduleId = permission.moduleName || permission.module_name || 'other';
    if (!grouped.has(moduleId)) {
      grouped.set(moduleId, { id: moduleId, label: formatModuleLabel(moduleId), permissions: [] });
    }

    grouped.get(moduleId).permissions.push({
      key,
      name: formatPermissionLabel(permission),
    });
  });

  return Array.from(grouped.values());
};

export const RoleManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { roleId } = useParams();
  const { hasPermission } = usePermissions();

  const [roles, setRoles] = useState([]);
  const [permissionModules, setPermissionModules] = useState(ROLE_PERMISSION_MODULES);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useNotificationBridge({ error, success });

  const mode = useMemo(() => {
    if (location.pathname.endsWith('/create')) return 'create';
    if (location.pathname.endsWith('/edit')) return 'edit';
    if (roleId) return 'details';
    return 'list';
  }, [location.pathname, roleId]);

  const selectedSet = useMemo(() => new Set(selectedPermissions), [selectedPermissions]);
  const totalPermissions = useMemo(
    () => permissionModules.reduce((count, module) => count + module.permissions.length, 0),
    [permissionModules],
  );

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getRoles({ page: 1, limit: 100, search });
      setRoles(result.items || []);
    } catch (loadError) {
      setError(loadError.message || 'کردار لوڈ نہیں ہو سکے۔');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  const loadRole = useCallback(async () => {
    if (!roleId || mode === 'create' || mode === 'list') return;

    setIsLoading(true);
    setError('');
    try {
      const role = await getRoleById(roleId);
      const permissionKeys = (role?.permissions || []).map(getPermissionKey).filter(Boolean);
      setCurrentRole(role);
      setSelectedPermissions(permissionKeys);
      setFormData({ roleName: getRoleName(role), description: role?.description || '' });
    } catch (loadError) {
      setError(loadError.message || 'کردار کی تفصیل لوڈ نہیں ہو سکی۔');
    } finally {
      setIsLoading(false);
    }
  }, [mode, roleId]);

  const loadPermissions = useCallback(async () => {
    try {
      const permissions = await getRolePermissions();
      setPermissionModules(groupPermissionsByModule(permissions));
    } catch {
      setPermissionModules(ROLE_PERMISSION_MODULES);
    }
  }, []);

  useEffect(() => { loadPermissions(); }, [loadPermissions]);

  useEffect(() => {
    if (mode === 'list') {
      const timer = setTimeout(loadRoles, 250);
      return () => clearTimeout(timer);
    }

    if (mode === 'create') {
      setFormData(emptyForm);
      setSelectedPermissions([]);
      setCurrentRole(null);
      setIsLoading(false);
      return undefined;
    }

    loadRole();
    return undefined;
  }, [loadRole, loadRoles, mode]);

  const togglePermission = (permissionKey) => {
    setSelectedPermissions((prev) => (
      prev.includes(permissionKey) ? prev.filter((key) => key !== permissionKey) : [...prev, permissionKey]
    ));
  };

  const toggleModulePermissions = (module) => {
    const moduleKeys = module.permissions.map((permission) => permission.key);
    const isModuleSelected = moduleKeys.every((key) => selectedSet.has(key));

    setSelectedPermissions((prev) => {
      const nextSet = new Set(prev);
      moduleKeys.forEach((key) => {
        if (isModuleSelected) nextSet.delete(key);
        else nextSet.add(key);
      });
      return Array.from(nextSet);
    });
  };

  const handleSubmit = async () => {
    if (!formData.roleName.trim()) {
      setError('کردار کا نام ضروری ہے۔');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        roleName: formData.roleName.trim(),
        description: formData.description.trim(),
        permissionKeys: selectedPermissions,
      };

      if (mode === 'edit') {
        await updateRole(roleId, payload);
        setSuccess('کردار کامیابی سے اپڈیٹ ہو گیا۔');
        navigate(`/role-management/${roleId}`);
      } else {
        const createdRole = await createRole(payload);
        setSuccess('نیا کردار کامیابی سے محفوظ ہو گیا۔');
        navigate(createdRole?.id ? `/role-management/${createdRole.id}` : '/role-management');
      }
    } catch (saveError) {
      setError(saveError.message || 'کردار محفوظ نہیں ہو سکا۔');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteRole(deleteTarget.id);
      setDeleteTarget(null);
      setSuccess('کردار کامیابی سے حذف ہو گیا۔');
      if (mode === 'list') await loadRoles();
      else navigate('/role-management');
    } catch (deleteError) {
      setError(deleteError.message || 'کردار حذف نہیں ہو سکا۔');
    } finally {
      setIsDeleting(false);
    }
  };

  const pageTitle = {
    list: 'کردار مینجمنٹ',
    create: 'نیا کردار بنائیں',
    edit: 'کردار میں ترمیم',
    details: 'کردار کی تفصیل',
  }[mode];

  const renderHeader = () => (
    <div className="flex flex-col gap-5 bg-[var(--color-surface)] p-4 md:p-6 rounded-[3rem] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] border border-[var(--color-border)] md:flex-row md:items-center md:justify-between">
      <div>
        <h1 style={{ color: 'var(--color-text-main)' }} className="text-2xl font-black">{pageTitle}</h1>
        <p style={{ color: 'var(--color-text-muted)' }} className="text-sm font-medium mt-4">
          کردار بنائیں، اجازتیں منتخب کریں اور صفحات تک رسائی کنٹرول کریں۔
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {mode !== 'list' ? (
          <button
            type="button"
            onClick={() => navigate('/role-management')}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-main)] transition-all hover:bg-[var(--color-bg)]"
          >
            <ArrowRight size={18} />
            واپس
          </button>
        ) : null}

        {mode === 'list' && hasPermission('roles.create') ? (
          <button
            type="button"
            onClick={() => navigate('/role-management/create')}
            style={{ backgroundColor: 'var(--color-primary)' }}
            className="flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#00d094]/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            نیا کردار
          </button>
        ) : null}

        <div style={{ backgroundColor: 'var(--color-primary)' }} className="hidden h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-[#00d094]/20 md:flex">
          <ShieldCheck size={24} />
        </div>
      </div>
    </div>
  );

  const renderPermissionSelector = (readOnly = false) => (
    <div
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      className="border rounded-[2.5rem] p-6 md:p-8 shadow-sm"
    >
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-[var(--color-text-main)]">اجازتیں</h2>
          <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">
            منتخب اجازتیں: {selectedPermissions.length} / {totalPermissions}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {permissionModules.map((module) => {
          const moduleKeys = module.permissions.map((permission) => permission.key);
          const checkedCount = moduleKeys.filter((key) => selectedSet.has(key)).length;
          const isModuleSelected = checkedCount === moduleKeys.length && moduleKeys.length > 0;

          return (
            <div key={module.id} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-right">
                  <h3 className="text-base font-black text-[var(--color-text-main)]">{module.label}</h3>
                  <p className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">{checkedCount} / {moduleKeys.length}</p>
                </div>

                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => toggleModulePermissions(module)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${isModuleSelected ? 'bg-[#00d094] text-white' : 'bg-emerald-500/10 text-[#00d094]'}`}
                  >
                    <CheckSquare size={15} />
                    تمام منتخب کریں
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {module.permissions.map((permission) => {
                  const isChecked = selectedSet.has(permission.key);

                  return (
                    <label
                      key={permission.key}
                      className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${isChecked ? 'border-[#00d094]/30 bg-emerald-500/10 text-[var(--color-text-main)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'} ${readOnly ? 'cursor-default' : 'cursor-pointer hover:border-[#00d094]/50'}`}
                    >
                      <span className="flex-1 text-right leading-6">{permission.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={readOnly}
                        onChange={() => togglePermission(permission.key)}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderForm = () => (
    <>
      <div
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        className="border rounded-[2.5rem] p-6 md:p-8 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InputField
            type="text"
            label="کردار کا نام"
            required
            placeholder="مثلاً: اکاؤنٹنٹ"
            value={formData.roleName}
            onChange={(event) => setFormData((prev) => ({ ...prev, roleName: event.target.value }))}
            disabled={mode === 'edit' && isSystemRole(currentRole)}
          />

          <div className="space-y-2">
            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">تفصیل</label>
            <textarea
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="کردار کی مختصر تفصیل"
              rows={3}
              className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none transition-all focus:border-[var(--color-primary)]"
              disabled={mode === 'edit' && isSystemRole(currentRole)}
            />
          </div>
        </div>
      </div>

      {renderPermissionSelector(mode === 'edit' && isSystemRole(currentRole))}

      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={() => navigate('/role-management')}
          className="rounded-2xl border border-[var(--color-border)] px-6 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)]"
        >
          منسوخ کریں
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || (mode === 'edit' && isSystemRole(currentRole))}
          style={{ backgroundColor: 'var(--color-primary)' }}
          className="flex items-center justify-center gap-3 rounded-2xl px-8 py-3 text-sm font-black text-white shadow-lg shadow-[#00d094]/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
          <Save size={18} />
        </button>
      </div>
    </>
  );

  const renderDetails = () => {
    if (isLoading) {
      return (
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
          کردار کی تفصیل لوڈ ہو رہی ہے...
        </div>
      );
    }

    if (!currentRole) {
      return (
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
          کردار موجود نہیں۔
        </div>
      );
    }

    return (
      <>
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="w-full text-right" dir="rtl">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">کردار کا نام</p>
              <h2 className="mt-3 text-2xl font-black text-[var(--color-text-main)]">{getRoleDisplayName(currentRole)}</h2>
              <p className="mt-4 max-w-3xl text-right text-sm font-bold leading-7 text-[var(--color-text-muted)]">{getRoleDescription(currentRole)}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {hasPermission('roles.edit') && !isSystemRole(currentRole) ? (
                <button
                  type="button"
                  onClick={() => navigate(`/role-management/${currentRole.id}/edit`)}
                  className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-3 text-sm font-black text-blue-500 transition-all hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Edit2 size={16} />
                  ترمیم کریں
                </button>
              ) : null}
              {hasPermission('roles.delete') && !isSystemRole(currentRole) ? (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(currentRole)}
                  className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  حذف کریں
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {renderPermissionSelector(true)}
      </>
    );
  };

  const renderList = () => (
    <>
      <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-bold text-[var(--color-text-muted)]">کل کردار: {roles.length}</div>
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="کردار تلاش کریں"
            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کردار کا نام</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">تفصیل</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">صارفین</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">عمل</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">کردار لوڈ ہو رہے ہیں...</td></tr>
              ) : roles.length ? (
                roles.map((role) => (
                  <tr key={role.id} className="border-t border-[var(--color-border)]/60">
                    <td className="px-6 py-4">
                      <div className="font-black text-[var(--color-text-main)]">{getRoleDisplayName(role)}</div>
                      {isSystemRole(role) ? <span className="mt-2 inline-flex rounded-xl bg-emerald-500/10 px-3 py-1 text-xs font-black text-[#00d094]">سسٹم کردار</span> : null}
                    </td>
                    <td className="max-w-xl px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{getRoleDescription(role)}</td>
                    <td className="px-6 py-4 text-sm font-black text-[var(--color-text-main)]">{role.assignedUsers ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-start gap-2">
                        {hasPermission('roles.view') ? (
                          <button type="button" onClick={() => navigate(`/role-management/${role.id}`)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white" title="دیکھیں">
                            <Eye size={16} />
                          </button>
                        ) : null}
                        {hasPermission('roles.edit') && !isSystemRole(role) ? (
                          <button type="button" onClick={() => navigate(`/role-management/${role.id}/edit`)} className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500 transition-all hover:bg-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50" title="ترمیم کریں">
                            <Edit2 size={16} />
                          </button>
                        ) : null}
                        {hasPermission('roles.delete') && !isSystemRole(role) ? (
                          <button type="button" onClick={() => setDeleteTarget(role)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50" title="حذف کریں">
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">ابھی تک کوئی کردار موجود نہیں۔</td></tr>
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

      {deleteTarget ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
            <div className="flex items-start justify-between gap-4">
              <div className="text-right">
                <h3 className="text-xl font-black text-[var(--color-text-main)]">کردار حذف کرنے کی تصدیق</h3>
                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                  کیا آپ واقعی <span className="text-rose-500">{getRoleDisplayName(deleteTarget)}</span> کو حذف کرنا چاہتے ہیں؟
                </p>
              </div>
              <button type="button" onClick={() => !isDeleting && setDeleteTarget(null)} className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500">
                <X size={18} />
              </button>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60">
                منسوخ کریں
              </button>
              <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70">
                {isDeleting ? 'حذف ہو رہا ہے...' : 'حذف کریں'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
