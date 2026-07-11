import React, { useEffect, useRef, useState } from 'react';
import {
    LayoutDashboard, Users, GraduationCap, UserCheck,
    BookOpen, Wallet, Settings, LogOut, Search,
    Bell, MessageSquare, Menu, ChevronDown,
    ClipboardList, GraduationCap as ExamIcon, HeartHandshake,
    BadgeCent, Library, Store, X, Moon, Sun, UserPlus, TrendingUp, TrendingDown, Landmark, Settings2, KeyRound, Sparkles, Building2
} from 'lucide-react';
import { Avatar } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ThemeToggle } from '../ThemToggle/ThemToggle'
import { refreshPermissions, fetchMadrassaProfile, getAdminSession, resolveApiAssetUrl, logoutAdmin, MADRASSA_PROFILE_UPDATED_EVENT } from '../../Constant/AdminAuth'
import { usePermissions } from '../../Hooks/usePermissions';
import { getPagePermission, SUPER_ADMIN_ROLE } from '../../Constant/Permissions';

const profileRoleDisplayNames = {
    super_admin: 'سپر ایڈمن',
    admin: 'ایڈمن',
    accountant: 'اکاؤنٹنٹ',
    teacher: 'استاد',
    store_manager: 'اسٹور مینیجر',
    viewer: 'صرف دیکھنے والا',
};

const getRoleName = (role) => {
    if (!role) return '';
    if (typeof role === 'string') return role;
    return role.roleName || role.role_name || role.name || '';
};

export const SideBar = () => {
    //--------------------------------------------------------------------

    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [openSubMenu, setOpenSubMenu] = useState(null);
    const [openSubSubMenu, setOpenSubSubMenu] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isDark] = useState(() => localStorage.getItem('theme') === 'dark');
    const [adminProfile, setAdminProfile] = useState(() => getAdminSession()?.admin || null);
    const [madrassaProfile, setMadrassaProfile] = useState(() => getAdminSession()?.madrassaProfile || null);
    const [avatarSrc, setAvatarSrc] = useState('');
    const profileMenuRef = useRef(null);
    const floatingSettingsRef = useRef(null);
    const menuItemRefs = useRef({});
    const subMenuItemRefs = useRef({});
    const { isSuperAdmin, hasPermission, hasAnyPermission } = usePermissions();
    //--------------------------------------------------------------------

    useEffect(() => {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, [isDark]);

    useEffect(() => () => {
        if (avatarSrc?.startsWith('blob:')) {
            URL.revokeObjectURL(avatarSrc);
        }
    }, [avatarSrc]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            const target = event.target;
            const clickedInsideProfile = profileMenuRef.current?.contains(target);
            const clickedInsideSettings = floatingSettingsRef.current?.contains(target);

            if (isProfileOpen && !clickedInsideProfile) {
                setIsProfileOpen(false);
            }

            if (openSubMenu === 'floating_settings' && !clickedInsideSettings) {
                setOpenSubMenu(null);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isProfileOpen, openSubMenu]);

    useEffect(() => {
        let isMounted = true;

        const applyMadrassaProfile = async (profile) => {
            if (!isMounted || !profile) return;

            setMadrassaProfile(profile);
            if (profile.logoUrl) {
                const resolvedLogoUrl = await resolveApiAssetUrl(profile.logoUrl);
                if (isMounted) {
                    setAvatarSrc(resolvedLogoUrl || '');
                }
            } else {
                setAvatarSrc('');
            }
        };

        const handleMadrassaProfileUpdated = (event) => {
            applyMadrassaProfile(event.detail || getAdminSession()?.madrassaProfile || null);
        };

        window.addEventListener(MADRASSA_PROFILE_UPDATED_EVENT, handleMadrassaProfileUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener(MADRASSA_PROFILE_UPDATED_EVENT, handleMadrassaProfileUpdated);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const syncAdminProfile = async () => {
            try {
                const [profile, madrassa] = await Promise.all([
                    refreshPermissions(),
                    fetchMadrassaProfile(),
                ]);
                if (isMounted) {
                    setAdminProfile(profile);
                    setMadrassaProfile(madrassa);
                    if (madrassa?.logoUrl) {
                        const resolvedLogoUrl = await resolveApiAssetUrl(madrassa.logoUrl);
                        if (isMounted) {
                            setAvatarSrc(resolvedLogoUrl || '');
                        }
                    } else {
                        setAvatarSrc('');
                    }
                }
            } catch (error) {
                const message = error?.message?.toLowerCase() || '';
                if (
                    message.includes('session') ||
                    message.includes('token') ||
                    message.includes('expired') ||
                    message.includes('inactive') ||
                    message.includes('not found')
                ) {
                    logoutAdmin();
                    navigate('/admin', { replace: true });
                }
            }
        };

        syncAdminProfile();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    const isActive = (path) => path && location.pathname === path;
    const currentSession = getAdminSession();
    const madrassaName = madrassaProfile?.name?.trim() || currentSession?.madrassaProfile?.name?.trim() || 'Madarsa Management';
    const sidebarTitle = madrassaName;
    const profileRoleNameRaw = isSuperAdmin
        ? SUPER_ADMIN_ROLE
        : getRoleName(adminProfile?.roleDetails)
        || getRoleName(adminProfile?.role)
        || getRoleName(currentSession?.role)
        || getRoleName(currentSession?.user?.role)
        || 'admin';
    const profileRoleName = String(profileRoleNameRaw || 'admin').trim().toLowerCase();
    const profileRoleLabel = profileRoleDisplayNames[profileRoleName] || profileRoleName || 'ایڈمن';
    const sidebarBadge = madrassaProfile?.city?.trim() || 'Main Campus';
    const hasMadrassaLogo = Boolean(avatarSrc);
    const handleLogout = () => {
        logoutAdmin();
        setIsProfileOpen(false);
        navigate('/admin', { replace: true });
    };

    const canAccessItem = (item) => {
        const permissionList = [
            ...(item.permission ? [item.permission] : []),
            ...(item.permissions || []),
        ];

        if (item.id === 'tenant_management' || permissionList.includes('tenant_management.view')) {
            return isSuperAdmin;
        }

        if (isSuperAdmin) return true;
        if (item.permission) return hasPermission(item.permission);
        if (item.permissions) return hasAnyPermission(item.permissions);
        if (item.path) {
            const permission = getPagePermission(item.path);
            return permission ? hasPermission(permission) : false;
        }
        return false;
    };

    const filterMenuItems = (items = []) => items.reduce((visibleItems, item) => {
        if (item.hidden) return visibleItems;

        const subMenu = filterMenuItems(item.subMenu || []);
        const subSubMenu = filterMenuItems(item.subSubMenu || []);
        const hasNestedItems = Boolean(item.subMenu?.length || item.subSubMenu?.length);
        const hasVisibleNestedItems = Boolean(subMenu.length || subSubMenu.length);
        const shouldShowItem = hasNestedItems ? hasVisibleNestedItems : canAccessItem(item);

        if (shouldShowItem) {
            visibleItems.push({
                ...item,
                ...(item.subMenu ? { subMenu } : {}),
                ...(item.subSubMenu ? { subSubMenu } : {}),
            });
        }

        return visibleItems;
    }, []);
    //--------------------------------------------------------------------

    const menuItems = [
        ...(isSuperAdmin ? [{
            id: 'tenant_management',
            label: 'مدارس کا انتظام',
            icon: Building2,
            path: '/tenant-management',
            permission: 'tenant_management.view',
        }] : []),
        {
            id: 'dashboard',
            label: 'ڈیش بورڈ',
            icon: LayoutDashboard,
            path: '/dashboard'
        },
        {
            id: 'class_mgmt',
            label: 'کلاس مینجمنٹ',
            icon: ClipboardList,
            subMenu: [
                { id: 'classes', label: ' جماعت', path: '/class-management/Classes' },
                { id: 'sections', label: 'جماعت سیکشن مینجمنٹ', path: '/class-management/sections' },
                { id: 'session', label: 'سیشن ', path: '/class-management/session' },
                { id: 'subjects', label: 'مظامین ', path: '/class-management/subjects' },
            ]
        },
        {

            id: 'hifz',
            label: 'شعبہ حفظ',
            icon: HeartHandshake,
            path: '/hifz',
            subMenu: [

                {
                    id: 'hifz_daily',
                    label: 'یومیہ جائزہ',
                    path: '/hifz/daily',
                    subSubMenu: [
                        { id: 'daily_entry', label: 'یومیہ جائزے کا اندراج', path: '/hifz/daily/entry' },
                        { id: 'daily_list', label: 'یومیہ جائزے کی فہرست', path: '/hifz/daily/list' }
                    ]
                },

                {
                    id: 'hifz_weekly',
                    label: 'ہفتہ وار جائزہ',
                    subSubMenu: [
                        { id: 'weekly_entry', label: 'ہفتہ وار جائزے کا اندراج', path: '/hifz/weekly/entry' },
                        { id: 'weekly_list', label: 'ہفتہ وار جائزے کی فہرست', path: '/hifz/weekly/list' }
                    ]
                },

                {
                    id: 'hifz_monthly',
                    label: 'ماہانہ جائزہ',
                    subSubMenu: [
                        { id: 'monthly_entry', label: 'ماہانہ جائزے کا اندراج', path: '/hifz/monthly/entry' },
                        { id: 'monthly_list', label: 'ماہانہ جائزے کی فہرست', path: '/hifz/monthly/list' }
                    ]
                },

                {
                    id: 'hifz_para',
                    label: 'پارہ جائزہ',
                    subSubMenu: [
                        { id: 'para_entry', label: 'پارہ جائزے کا اندراج', path: '/hifz/para/entry' },
                        { id: 'para_list', label: 'پارہ جائزے کی فہرست', path: '/hifz/para/list' }
                    ]
                },
            ]
        },
        {
            id: 'students',
            label: 'طلباء',
            icon: GraduationCap,
            subMenu: [
                { id: 'std_parents', label: 'سرپرست', path: '/students/parents' },
                { id: 'std_admission', label: 'داخلہ فارم', path: '/students/admission' },
                { id: 'std_list', label: 'طلباء کی فہرست', path: '/students/list' },
                { id: 'std_id_card', label: 'آئی ڈی کارڈ بنائیں', path: '/students/create-id-card' },
                { id: 'std_attendance', label: 'طلبہ کی حاضری', path: '/students/attendance' },
                { id: 'std_class_asign', label: 'طلبہ کو کلاس میں ایڈ کریں', path: '/students/class_asign' },
                { id: 'std_schedule ', label: 'نظام الاوقات', path: '/students/schedule' },
                { id: 'std_fees ', label: 'فیس جینریشن', path: '/students/fees' },

            ]
        },
        {
            id: 'teachers',
            label: 'اساتذہ',
            icon: UserCheck,
            subMenu: [
                { id: 't_add', label: 'نیا استاد شامل کریں', path: '/HRManagement' },
                { id: 't_list', label: 'فہرست اساتذہ', path: '/teachers/list' },
                { id: 't_attendance', label: 'حاضری', path: '/teachers/attendance' },
                { id: 't_schedule ', label: 'نظام الاوقات', path: '/teachers/schedule' },
                { id: 't_salary_increment', label: 'تنخواہ انکریمنٹ', path: '/teachers/salary-increments' },
                { id: 't_salary', label: 'تنخواہ کی ادائیگی', path: '/finance/expenses/payroll' },
            ]
        },

        //----------------------------------------------------------------------------------------
        {
            id: 'finance',
            label: 'مالیات',
            icon: Wallet,
            path: '/finance',
            permissions: ['fees.view', 'finance.view'],
            subMenu: [
                {
                    id: 'income-heads-config',
                    label: 'آمدن و خرچ سیٹ اَپ',
                    icon: Settings2,
                    path: '/finance/setup/income-expence',
                    permissions: ['fees.view', 'finance.view'],
                    heads: ['Yahan admin naye purpose add kare ga']
                },
                // --- Income Section ---
                {
                    id: 'income',
                    label: 'عطیات',
                    icon: TrendingUp,
                    path: '/finance/income',
                    subSubMenu: [
                        {
                            id: 'fee-collection',
                            label: 'فنڈ وصولی',
                            path: '/finance/income/fund-collection',
                            permissions: ['fees.create', 'finance.create'],
                            heads: ['Monthly Fee', 'Admission Fee', 'Exam Fee', 'Transport Fee', 'Late Fee Fine']
                        },
                        {
                            id: 'fund-list',
                            label: 'عطیات کی فہرست',
                            path: '/finance/income/fund-list',
                            permissions: ['fees.view', 'finance.view'],
                            heads: ['Donations', 'Books & Uniform Sale', 'Bank Interest', 'Event Fund']
                        }
                        // {
                        //     id: 'other-income',
                        //     label: 'دیگر آمدنی',
                        //     path: '/finance/income/other-income',
                        //     heads: ['Donations', 'Books & Uniform Sale', 'Bank Interest', 'Event Fund']
                        // }
                    ]
                },
                // --- Expenses Section ---
                {
                    id: 'expenses',
                    label: 'دیگر آمدن و خرچ',
                    icon: TrendingDown,
                    path: '/finance/other-income-expense',
                    permissions: ['fees.view', 'finance.view']
                },
                {
                    id: 'finance_reports',
                    label: 'رپورٹس',
                    path: '/finance/reports/financial-statements',
                    permissions: ['reports.view', 'reports.export', 'finance.reports.view']
                },
                {
                    id: 'accounts',
                    label: 'بینک اور کیش',
                    icon: Landmark,
                    hidden: true,
                    path: '/finance/accounts',
                    subSubMenu: [
                        {
                            id: 'cash-management',
                            label: 'کیش مینیجمنٹ',
                            path: '/finance/accounts/cash-management'
                        },
                        {
                            id: 'bank-management',
                            label: 'بینک اکاؤنٹس',
                            path: '/finance/accounts/bank-management'
                        }
                    ]
                },
            ]
        },
        //--------------------------------------------------------------------------------------
        {
            id: 'HRManagement',
            label: 'عملہ',
            icon: UserPlus,
            path: '/HRManagement',
            subMenu: [
                { id: 'staff_add', label: 'نیا عملہ شامل کریں', path: '/HRManagement?staffType=staff' },
                { id: 'staff_list', label: 'دیگر عملہ فہرست', path: '/staff/list' },
                { id: 'staff_salary_increment', label: 'تنخواہ انکریمنٹ', path: '/teachers/salary-increments' },
                { id: 'staff_salary', label: 'تنخواہ کی ادائیگی', path: '/finance/expenses/payroll', permissions: ['fees.view', 'finance.view'] }
            ]
        },
        {
            id: 'exams',
            label: 'امتحان',
            icon: ExamIcon,
            path: '/exams',
            subMenu: [
                { id: 'exam_schedule', label: '\u0627\u0645\u062a\u062d\u0627\u0646\u06cc \u0634\u06cc\u0688\u0648\u0644', path: '/exams/schedule' },
                { id: 'exam_schedule_list', label: 'امتحانی شیڈول فہرست', path: '/exams/schedule-list' },
                { id: 'exam_result', label: 'امتحانی رزلٹ', path: '/exams/result' },
                { id: 'exam_result_list', label: 'رزلٹ فہرست', path: '/exams/result-list' }
            ]
        },
        {
            id: 'store',
            label: 'اسٹور',
            icon: Store,
            path: '/store',
            subMenu: [
                { id: 'store_dashboard', label: 'ڈیش بورڈ', path: '/store/dashboard' },
                { id: 'store_items', label: 'اشیاء', path: '/store/items' },
                { id: 'store_units', label: 'اکائیاں', path: '/store/units' },
                { id: 'store_categories', label: 'کیٹیگریز', path: '/store/categories' },
                { id: 'store_purchases', label: 'خریداری', path: '/store/purchases' },
                { id: 'store_stock_issues', label: 'اسٹاک اجراء', path: '/store/stock-issues' },
                { id: 'store_returns', label: 'واپسی', path: '/store/returns' },
                { id: 'store_damaged_stock', label: 'خراب / گم شدہ اسٹاک', path: '/store/damaged-stock' },
                { id: 'store_approvals', label: 'منظوریاں', path: '/store/approvals' },
                { id: 'store_reports', label: 'رپورٹس', path: '/store/reports' },
                { id: 'store_suppliers', label: 'سپلائرز', path: '/store/suppliers' },
            ]
        },
        {
            id: 'scholarship',
            label: 'وظیفہ',
            icon: BadgeCent,
            path: '/scholarship'
        },
        {
            id: 'books',
            label: 'کتاب',
            icon: Library,
            path: '/books'
        },
    ];
    //--------------------------------------------------------------------
    const profileMenuItems = [
        { id: 'settings', label: 'پروفائل سیٹنگ', path: '/Profile/setting', icon: Settings, permissions: ['settings.view', 'settings.update', 'profile.view'] },
        // { id: 'change_password', label: 'پاس ورڈ تبدیل کریں', path: '/Profile/change-password', icon: KeyRound },
        { id: 'cities', label: 'شہر', path: '/Profile/cities', icon: UserCheck, permissions: ['settings.view', 'settings.update', 'settings.cities.view'] },
        { id: 'support', label: 'سپورٹ', path: '/Profile/support', icon: MessageSquare },
        { id: 'suggestions', label: 'تجاویز', path: '/Profile/suggestions', icon: Sparkles },
    ];

    const scrollMenuItemIntoView = (itemRef) => {
        window.setTimeout(() => {
            itemRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    // const toggleSubMenu = (id) => setOpenSubMenu(openSubMenu === id ? null : id);
    const toggleSubMenu = (id) => {
        const shouldOpen = openSubMenu !== id;
        setOpenSubMenu(shouldOpen ? id : null);
        setOpenSubSubMenu(null); // Level 1 change ho to Level 2 reset ho jaye
        if (shouldOpen && id !== 'floating_settings') {
            scrollMenuItemIntoView(menuItemRefs.current[id]);
        }
    };

    const toggleSubSubMenu = (id) => {
        const shouldOpen = openSubSubMenu !== id;
        setOpenSubSubMenu(shouldOpen ? id : null);
        if (shouldOpen) {
            scrollMenuItemIntoView(subMenuItemRefs.current[id]);
        }
    };
    //--------------------------------------------------------------------
    const setting = [
        {
            id: 'setting',
            label: 'ترتیبات',
            icon: Settings,
            subMenu: [
                { id: 'shift', label: 'شفٹ کا انتظام', path: '/setting/shift', permissions: ['settings.view', 'settings.update', 'settings.shifts.view'] },
                { id: 'department', label: 'شعبہ جات کا انتظام', path: '/setting/department', permissions: ['settings.view', 'settings.update', 'settings.departments.view'] },
                { id: 'degree', label: 'تعلیمی اسناد کے نام', path: '/setting/degree-name', permissions: ['settings.view', 'settings.update', 'settings.degrees.view'] },
                { id: 'role_management', label: 'کردار مینجمنٹ', path: '/role-management', permissions: ['roles.view', 'roles.manage'] },
                { id: 'user_management', label: 'صارفین مینجمنٹ', path: '/role-management/users', permissions: ['users.view', 'users.manage'] },
                { id: 'tenant_management', label: 'مدارس کا انتظام', path: '/tenant-management', permission: 'tenant_management.view' },

            ]
        }

    ];

    const urduMenuLabels = {
        dashboard: 'ڈیش بورڈ',
        class_mgmt: 'کلاس مینجمنٹ',
        classes: 'جماعت',
        sections: 'جماعت سیکشن مینجمنٹ',
        session: 'سیشن',
        subjects: 'مضامین',
        hifz: 'شعبہ حفظ',
        hifz_daily: 'یومیہ جائزہ',
        daily_entry: 'یومیہ جائزے کا اندراج',
        daily_list: 'یومیہ جائزے کی فہرست',
        hifz_weekly: 'ہفتہ وار جائزہ',
        weekly_entry: 'ہفتہ وار جائزے کا اندراج',
        weekly_list: 'ہفتہ وار جائزے کی فہرست',
        hifz_monthly: 'ماہانہ جائزہ',
        monthly_entry: 'ماہانہ جائزے کا اندراج',
        monthly_list: 'ماہانہ جائزے کی فہرست',
        hifz_para: 'پارہ جائزہ',
        para_entry: 'پارہ جائزے کا اندراج',
        para_list: 'پارہ جائزے کی فہرست',
        students: 'طلباء',
        std_parents: 'سرپرست',
        std_admission: 'داخلہ فارم',
        std_list: 'طلباء کی فہرست',
        std_id_card: 'آئی ڈی کارڈ بنائیں',
        std_attendance: 'طلباء کی حاضری',
        std_class_asign: 'طلباء کو کلاس میں شامل کریں',
        'std_schedule ': 'نظام الاوقات',
        'std_fees ': 'فیس جنریشن',
        teachers: 'اساتذہ',
        t_add: 'نیا استاد شامل کریں',
        t_list: 'اساتذہ کی فہرست',
        t_attendance: 'حاضری',
        't_schedule ': 'نظام الاوقات',
        t_salary_increment: 'تنخواہ انکریمنٹ',
        t_salary: 'تنخواہ کی ادائیگی',
        finance: 'مالیات',
        'income-heads-config': 'آمدن و خرچ سیٹ اپ',
        income: 'عطیات',
        'fee-collection': 'فنڈ وصولی',
        'fund-list': 'عطیات کی فہرست',
        expenses: 'دیگر آمدن و خرچ',
        finance_reports: 'رپورٹس',
        accounts: 'بینک اور کیش',
        'cash-management': 'کیش مینجمنٹ',
        'bank-management': 'بینک اکاؤنٹس',
        HRManagement: 'عملہ',
        staff_add: 'نیا عملہ شامل کریں',
        staff_list: 'دیگر عملہ فہرست',
        staff_salary_increment: 'تنخواہ انکریمنٹ',
        staff_salary: 'تنخواہ کی ادائیگی',
        exams: 'امتحان',
        exam_schedule: 'امتحانی شیڈول',
        exam_schedule_list: 'امتحانی شیڈول فہرست',
        exam_result: 'امتحانی رزلٹ',
        exam_result_list: 'رزلٹ فہرست',
        store: 'اسٹور',
        store_dashboard: 'ڈیش بورڈ',
        store_items: 'اشیاء',
        store_units: 'اکائیاں',
        store_categories: 'کیٹیگریز',
        store_purchases: 'خریداری',
        store_stock_issues: 'اسٹاک اجراء',
        store_returns: 'واپسی',
        store_damaged_stock: 'خراب / گم شدہ اسٹاک',
        store_approvals: 'منظوریاں',
        store_reports: 'رپورٹس',
        store_suppliers: 'سپلائرز',
        scholarship: 'وظیفہ',
        books: 'کتاب',
        settings: 'پروفائل سیٹنگ',
        cities: 'شہر',
        support: 'سپورٹ',
        suggestions: 'تجاویز',
        setting: 'ترتیبات',
        shift: 'شفٹ کا انتظام',
        department: 'شعبہ جات کا انتظام',
        degree: 'تعلیمی اسناد کے نام',
        role_management: 'کردار مینجمنٹ',
        user_management: 'صارفین مینجمنٹ',
        tenant_management: 'مدارس کا انتظام',
    };

    const cp1252ByteMap = {
        '€': 0x80,
        '‚': 0x82,
        'ƒ': 0x83,
        '„': 0x84,
        '…': 0x85,
        '†': 0x86,
        '‡': 0x87,
        'ˆ': 0x88,
        '‰': 0x89,
        'Š': 0x8a,
        '‹': 0x8b,
        'Œ': 0x8c,
        'Ž': 0x8e,
        '‘': 0x91,
        '’': 0x92,
        '“': 0x93,
        '”': 0x94,
        '•': 0x95,
        '–': 0x96,
        '—': 0x97,
        '˜': 0x98,
        '™': 0x99,
        'š': 0x9a,
        '›': 0x9b,
        'œ': 0x9c,
        'ž': 0x9e,
        'Ÿ': 0x9f,
    };

    const decodeUrduLabel = (value) => {
        if (typeof value !== 'string' || !/[ØÙÛÚ]/.test(value)) return value;

        try {
            const bytes = Array.from(value).map((character) => cp1252ByteMap[character] ?? character.charCodeAt(0));
            return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        } catch {
            return value;
        }
    };

    const applyUrduLabels = (items = []) => items.map((item) => ({
        ...item,
        label: decodeUrduLabel(urduMenuLabels[item.id] || item.label),
        ...(item.subMenu ? { subMenu: applyUrduLabels(item.subMenu) } : {}),
        ...(item.subSubMenu ? { subSubMenu: applyUrduLabels(item.subSubMenu) } : {}),
    }));

    const visibleMenuItems = filterMenuItems(applyUrduLabels([...menuItems, ...setting]));
    const visibleProfileMenuItems = filterMenuItems(applyUrduLabels(profileMenuItems));
    const visibleSetting = filterMenuItems(applyUrduLabels(setting));
    const canViewResultGrades = hasPermission('result_grades.view');
    const quickMenuItems = [
        ...(visibleSetting[0]?.subMenu || []).filter((sub) => sub?.path && sub?.label),
        ...(canViewResultGrades ? [{ id: 'result_grades_quick', path: '/exams/result-grades', label: 'رزلٹ فیصد رینج' }] : []),
    ];

    //----------------------------------------------------------------------

    return (
        <div className="min-h-screen bg-themeBg flex font-urdu transition-colors duration-300" dir="rtl">
            <style dangerouslySetInnerHTML={{
                __html: `
                .vip-scrollbar::-webkit-scrollbar { width: 5px; }
                .vip-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .vip-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .vip-scrollbar:hover::-webkit-scrollbar-thumb { background: #00d094; opacity: 0.3; }
                .animate-spin-slow {
                       animation: spin 4s linear infinite;
                 }
                @keyframes spin {
                       from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                 }
            `}} />

            {/* --- SIDEBAR --- */}


            <aside className={`fixed inset-y-0 right-0 z-[60] w-64 bg-gradient-to-b from-[#004d61] to-[#002a33] text-white p-4 transition-all duration-500 ease-in-out shadow-[10px_0_30px_rgba(0,0,0,0.1)] ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                <button className="md:hidden absolute left-4 top-6 text-white/50" onClick={() => setIsSidebarOpen(false)}>
                    <X size={24} />
                </button>

                <div className="flex items-center gap-3 mb-8 px-2 py-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/10 shadow-lg shrink-0 flex items-center justify-center">
                        {hasMadrassaLogo ? (
                            <img src={avatarSrc} alt={sidebarTitle} className="h-full w-full object-cover" />
                        ) : (
                            <GraduationCap className="text-[#00d094]" size={26} />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-white text-[24px] font-black text-base leading-tight break-words" title={sidebarTitle}>{sidebarTitle}</h1>
                        <p className="text-[18px] text-[#00d094] font-bold tracking-[0.16em] uppercase truncate" title={sidebarBadge}>{sidebarBadge}</p>
                    </div>
                </div>
                {/* //--------------------------------------------------------------// */}

                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)] vip-scrollbar px-1 " dir="ltr">
                    {visibleMenuItems.map((item) => (
                        <div
                            key={item.id}
                            ref={(element) => {
                                menuItemRefs.current[item.id] = element;
                            }}
                            dir="rtl"
                        >
                            {/* --- Level 1: Main Menu --- */}
                            <div
                                onClick={() => item.subMenu ? toggleSubMenu(item.id) : (navigate(item.path), setIsSidebarOpen(false))}
                                className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${isActive(item.path) || (item.subMenu && item.subMenu.some(s => isActive(s.path)))
                                    ? 'bg-[#00d094] text-white shadow-lg shadow-emerald-900/20'
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {item.icon && <item.icon size={20} className={isActive(item.path) ? 'text-white' : 'text-[#00d094]/70'} />}
                                    <span className="text-[18px] font-bold">{item.label}</span>
                                </div>
                                {item.subMenu && <ChevronDown size={14} className={`transition-transform duration-300 ${openSubMenu === item.id ? 'rotate-180' : ''}`} />}
                            </div>

                            {/* --- Level 2: Sub Menu --- */}
                            {item.subMenu && openSubMenu === item.id && (
                                <div className="mt-2 mr-6 space-y-1 border-r border-white/10 pr-2">
                                    {item.subMenu.map((sub) => (
                                        <div
                                            key={sub.id}
                                            ref={(element) => {
                                                subMenuItemRefs.current[sub.id] = element;
                                            }}
                                            className="perspective-1000"
                                        >
                                            <div
                                                onClick={() => sub.subSubMenu ? toggleSubSubMenu(sub.id) : (navigate(sub.path), setIsSidebarOpen(false))}
                                                className={`text-[16px] p-2.5 rounded-xl  cursor-pointer flex items-center justify-between transition-all ${isActive(sub.path) || (sub.subSubMenu && sub.subSubMenu.some(ss => isActive(ss.path)))
                                                    ? 'text-[#00d094] font-bold bg-[#00d094]/5'
                                                    : 'text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive(sub.path) ? 'bg-[#00d094] scale-125' : 'bg-gray-600'}`} />
                                                    {sub.icon && <sub.icon size={20} className={isActive(sub.path) ? 'text-white' : 'text-[#00d094]/70'} />}
                                                    {sub.label}
                                                </div>
                                                {sub.subSubMenu && <ChevronDown size={12} className={`transition-transform duration-200 ${openSubSubMenu === sub.id ? 'rotate-180' : ''}`} />}
                                            </div>

                                            {/* --- Level 3: Sub-Sub Menu (Finance Heads) --- */}
                                            {sub.subSubMenu && openSubSubMenu === sub.id && (
                                                <div className="mt-1 mr-8 space-y-1 bg-[#00d094]/5 border-r-3 border-[#00d094] pr-3 animate-in fade-in zoom-in-95 duration-200">
                                                    {sub.subSubMenu.map((subSub) => (
                                                        <div
                                                            key={subSub.id}
                                                            onClick={() => {
                                                                if (subSub.path) navigate(subSub.path);
                                                                setIsSidebarOpen(false);
                                                            }}
                                                            className="text-[16px] p-2 text-gray-400 hover:text-[#00d094] hover:bg-[#00d094]/9 rounded-lg cursor-pointer transition-all flex items-center gap-2"
                                                        >
                                                            <span>•</span>
                                                            {subSub.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {/* //--------------------------------------------------------------// */}



                {/* --------------------------------------setting---------------------------------------------------- */}
                <div className={`fixed top-1/2 -translate-y-1/2 z-[70] transition-all duration-500 ${isSidebarOpen ? 'right-64' : 'right-0 md:right-64'}`}>
                    <div ref={floatingSettingsRef} className="relative group">
                        {/* --- Floating Button --- */}
                        <button
                            onClick={() => toggleSubMenu('floating_settings')}
                            style={{ backgroundColor: 'var(--color-primary)' }}
                            className="flex items-center justify-center w-10 h-12 text-white rounded-l-full shadow-lg hover:w-14 transition-all duration-300 group"
                        >
                            <Settings size={22} className={`${openSubMenu === 'floating_settings' ? 'rotate-90' : 'animate-spin-slow'}`} />
                        </button>

                        {/* --- Floating Quick Menu --- */}
                        {openSubMenu === 'floating_settings' && (
                            <div
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-main)'
                                }}
                                className="absolute top-0   -right-62 lg:right-12 md:right-8 w-72 max-h-[40vh]  overflow-y-auto backdrop-blur-xl border shadow-2xl rounded-[2rem] p-4 animate-in slide-in-from-left-5 fade-in duration-300"
                            >
                                <p
                                    style={{ color: 'var(--color-primary)' }}
                                    className="text-base font-black mb-4 px-3"
                                >
                                    فوری اختیارات
                                </p>

                                <div className="space-y-2">
                                    {quickMenuItems.length ? quickMenuItems.map((sub) => (
                                        <button
                                            key={sub.id}
                                            onClick={() => { navigate(sub.path); setOpenSubMenu(null); }}
                                            style={{ '--hover-bg': 'var(--color-bg)' }}
                                            className="w-full flex items-center justify-between px-3 py-3.5 rounded-xl transition-all group/item hover:bg-[var(--hover-bg)]"
                                        >
                                            <span
                                                style={{ color: 'var(--color-text-main)' }}
                                                className="text-base font-bold group-hover/item:text-[var(--color-primary)] transition-colors"
                                            >
                                                {sub.label}
                                            </span>

                                            <div
                                                style={{
                                                    backgroundColor: 'var(--color-text-muted)',
                                                    borderColor: 'var(--color-border)'
                                                }}
                                                className="w-1.5 h-1.5 rounded-full group-hover/item:bg-[var(--color-primary)] transition-all"
                                            />
                                        </button>
                                    )) : (
                                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-5 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                            کوئی فوری اختیار دستیاب نہیں۔
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
            {/* ------------------------------------------------------------------------------------------ */}


            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 md:mr-64 flex flex-col min-h-screen overflow-x-hidden">

                {/* --- TOP NAVBAR (Fixed UI) --- */}
                <nav className="h-20 bg-themeSurface/70 backdrop-blur-md border border-transparent dark:border-themeBorder  shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-6 md:px-10 flex items-center justify-between sticky top-4 z-50 rounded-[2.5rem] mx-2 md:mx-4 transition-all">

                    <div className="flex items-center gap-4">
                        <div ref={profileMenuRef} className="relative">
                            <div className="flex items-center gap-5 cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                <div className="relative group/avatar">
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00d094] border-2 border-themeSurface rounded-full z-10 animate-pulse" />
                                    <Avatar
                                        src={avatarSrc}
                                        alt={madrassaName}
                                        className="w-12 h-12 border-2 border-emerald-100 shadow-sm"
                                        sx={{ bgcolor: '#ffffff', '& img': { objectFit: 'cover', padding: 0 } }}
                                    />
                                </div>
                                <div className="hidden sm:flex min-w-0 max-w-[15rem] flex-col items-end text-right leading-none">
                                    <p className="max-w-full truncate p-1 text-md font-black text-themeText" title={madrassaName}>{madrassaName}</p>
                                    <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] leading-none">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <p className="text-themeMuted font-bold">{profileRoleLabel}</p>
                                    </div>
                                </div>
                            </div>
                            {isProfileOpen && (
                                <>
                                    {/* Overlay */}
                                    <div className="fixed inset-0 z-[998]" onClick={() => setIsProfileOpen(false)} />

                                    {/* Profile Dropdown Container */}
                                    <div className="absolute top-full right-0 mt-3 w-64 bg-gradient-to-b from-[#004d61] to-[#002a33] border border-white/10 shadow-2xl rounded-[2rem] z-[999] overflow-hidden p-2">

                                        <div className="space-y-1">
                                            {visibleProfileMenuItems.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => { navigate(item.path); setIsProfileOpen(false); }}
                                                    className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl text-white hover:bg-white/5 transition-all group"
                                                >
                                                    <item.icon size={20} className="text-gray-400 group-hover:text-[#00d094]" />
                                                    <span className="text-sm font-bold text-right flex-1 group-hover:text-[#00d094]">{item.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Separator */}
                                        <div className="h-px bg-white/5 my-2 mx-3" />

                                        {/* Logout Button */}
                                        <button onClick={handleLogout} className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all group">
                                            <LogOut size={20} />
                                            <span className="text-sm font-bold text-right flex-1">لاگ آؤٹ</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        <ThemeToggle />
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end md:justify-center">
                        <div
                            className="
                                  hidden md:flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 group relative w-full max-w-md 
                                  bg-[var(--color-input)] border border-[var(--color-border)]
                                  shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] 
                                  focus-within:max-w-lg focus-within:border-[var(--color-primary)] focus-within:bg-[var(--color-surface)] focus-within:shadow-md
                                  ">

                            <div className="flex-none transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                                <div className="group-focus-within:text-[var(--color-primary)]">
                                    <Search size={18} />
                                </div>
                            </div>

                            <kbd
                                style={{
                                    backgroundColor: 'var(--color-bg)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-muted)'
                                }}
                                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase transition-opacity group-focus-within:opacity-0"
                            >
                                Ctrl K
                            </kbd>

                            <input
                                type="text"
                                placeholder="کچھ بھی تلاش کریں..."
                                style={{ color: 'var(--color-text-main)' }}
                                className="bg-transparent outline-none text-[13px] text-right font-medium flex-grow placeholder:text-[var(--color-text-muted)] focus:placeholder-transparent transition-all duration-300"
                            />
                        </div>

                        <div className="hidden lg:flex items-center gap-2">
                            <button className="p-2.5 text-themeMuted hover:bg-emerald-50/10 hover:text-[#00d094] rounded-xl relative transition-all">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-themeSurface" />
                            </button>
                            <button className="p-2.5 text-themeMuted hover:bg-emerald-50/10 hover:text-[#00d094] rounded-xl transition-all"><MessageSquare size={20} /></button>
                        </div>
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 bg-gradient-to-br from-[#004d61] to-[#003a49] text-white rounded-2xl">
                            <Menu size={20} />
                        </button>
                    </div>
                </nav>

                <main className="p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
            {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-[55] md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
        </div>
    );
};

