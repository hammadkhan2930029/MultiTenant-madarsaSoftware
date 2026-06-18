import React, { useEffect, useRef, useState } from 'react';
import {
    LayoutDashboard, Users, GraduationCap, UserCheck,
    BookOpen, Wallet, Settings, LogOut, Search,
    Bell, MessageSquare, Menu, ChevronDown,
    ClipboardList, GraduationCap as ExamIcon, HeartHandshake,
    BadgeCent, Library, Store, X, Moon, Sun, UserPlus, TrendingUp, TrendingDown, Landmark, Settings2, KeyRound, Sparkles
} from 'lucide-react';
import { Avatar } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ThemeToggle } from '../ThemToggle/ThemToggle'
import { fetchCurrentAdminProfile, fetchMadrassaProfile, getAdminSession, resolveApiAssetUrl, logoutAdmin, MADRASSA_PROFILE_UPDATED_EVENT } from '../../Constant/AdminAuth'
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
                    fetchCurrentAdminProfile(),
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
                    navigate('/login', { replace: true });
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
    const profileName = adminProfile?.name || currentSession?.admin?.name || currentSession?.user?.name || 'صارف';
    const profileRoleNameRaw = isSuperAdmin
        ? SUPER_ADMIN_ROLE
        : adminProfile?.roleDetails?.roleName
        || adminProfile?.roleDetails?.role_name
        || adminProfile?.role?.roleName
        || adminProfile?.role?.role_name
        || adminProfile?.role
        || currentSession?.role?.roleName
        || currentSession?.role?.role_name
        || currentSession?.user?.role
        || 'admin';
    const profileRoleName = String(profileRoleNameRaw || 'admin').trim().toLowerCase();
    const profileRoleLabel = profileRoleDisplayNames[profileRoleName] || profileRoleName || 'ایڈمن';
    const sidebarBadge = madrassaProfile?.city?.trim() || 'Main Campus';
    const hasMadrassaLogo = Boolean(avatarSrc);
    const handleLogout = () => {
        logoutAdmin();
        setIsProfileOpen(false);
        navigate('/login');
    };

    const canAccessItem = (item) => {
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
        {
            id: 'dashboard',
            label: 'ÚˆÛŒØ´ Ø¨ÙˆØ±Úˆ',
            icon: LayoutDashboard,
            path: '/dashboard'
        },
        {
            id: 'class_mgmt',
            label: 'Ú©Ù„Ø§Ø³ Ù…ÛŒÙ†Ø¬Ù…Ù†Ù¹',
            icon: ClipboardList,
            subMenu: [
                { id: 'classes', label: ' Ø¬Ù…Ø§Ø¹Øª', path: '/class-management/Classes' },
                { id: 'sections', label: 'Ø¬Ù…Ø§Ø¹Øª Ø³ÛŒÚ©Ø´Ù†Ø²', path: '/class-management/sections' },
                { id: 'session', label: 'Ø³ÛŒØ´Ù† ', path: '/class-management/session' },
                { id: 'subjects', label: 'Ù…Ø¸Ø§Ù…ÛŒÙ† ', path: '/class-management/subjects' },
            ]
        },
        {

            id: 'hifz',
            label: 'Ø´Ø¹Ø¨Û Ø­ÙØ¸',
            icon: HeartHandshake,
            path: '/hifz',
            subMenu: [

                {
                    id: 'hifz_daily',
                    label: 'ÛŒÙˆÙ…ÛŒÛ Ø¬Ø§Ø¦Ø²Û',
                    path: '/hifz/daily',
                    subSubMenu: [
                        { id: 'daily_entry', label: 'ÛŒÙˆÙ…ÛŒÛ Ø¬Ø§Ø¦Ø²Û’ Ú©Ø§ Ø§Ù†Ø¯Ø±Ø§Ø¬', path: '/hifz/daily/entry' },
                        { id: 'daily_list', label: 'ÛŒÙˆÙ…ÛŒÛ Ø¬Ø§Ø¦Ø²Û’ Ú©ÛŒ ÙÛØ±Ø³Øª', path: '/hifz/daily/list' }
                    ]
                },

                {
                    id: 'hifz_weekly',
                    label: 'ÛÙØªÛ ÙˆØ§Ø± Ø¬Ø§Ø¦Ø²Û',
                    subSubMenu: [
                        { id: 'weekly_entry', label: 'ÛÙØªÛ ÙˆØ§Ø± Ø¬Ø§Ø¦Ø²Û’ Ú©Ø§ Ø§Ù†Ø¯Ø±Ø§Ø¬', path: '/hifz/weekly/entry' },
                        { id: 'weekly_list', label: 'ÛÙØªÛ ÙˆØ§Ø± Ø¬Ø§Ø¦Ø²Û’ Ú©ÛŒ ÙÛØ±Ø³Øª', path: '/hifz/weekly/list' }
                    ]
                },

                {
                    id: 'hifz_monthly',
                    label: 'Ù…Ø§ÛØ§Ù†Û Ø¬Ø§Ø¦Ø²Û',
                    subSubMenu: [
                        { id: 'monthly_entry', label: 'Ù…Ø§ÛØ§Ù†Û Ø¬Ø§Ø¦Ø²Û’ Ú©Ø§ Ø§Ù†Ø¯Ø±Ø§Ø¬', path: '/hifz/monthly/entry' },
                        { id: 'monthly_list', label: 'Ù…Ø§ÛØ§Ù†Û Ø¬Ø§Ø¦Ø²Û’ Ú©ÛŒ ÙÛØ±Ø³Øª', path: '/hifz/monthly/list' }
                    ]
                },

                {
                    id: 'hifz_para',
                    label: 'Ù¾Ø§Ø±Û Ø¬Ø§Ø¦Ø²Û',
                    subSubMenu: [
                        { id: 'para_entry', label: 'Ù¾Ø§Ø±Û Ø¬Ø§Ø¦Ø²Û’ Ú©Ø§ Ø§Ù†Ø¯Ø±Ø§Ø¬', path: '/hifz/para/entry' },
                        { id: 'para_list', label: 'Ù¾Ø§Ø±Û Ø¬Ø§Ø¦Ø²Û’ Ú©ÛŒ ÙÛØ±Ø³Øª', path: '/hifz/para/list' }
                    ]
                },
            ]
        },
        {
            id: 'students',
            label: 'Ø·Ù„Ø¨Ø§Ø¡',
            icon: GraduationCap,
            subMenu: [
                { id: 'std_parents', label: 'ÙˆØ§Ù„Ø¯ÛŒÙ†', path: '/students/parents' },
                { id: 'std_admission', label: 'Ø¯Ø§Ø®Ù„Û ÙØ§Ø±Ù…', path: '/students/admission' },
                { id: 'std_list', label: 'Ø·Ù„Ø¨Ø§Ø¡ Ú©ÛŒ ÙÛØ±Ø³Øª', path: '/students/list' },
                { id: 'std_id_card', label: 'Ø¢Ø¦ÛŒ ÚˆÛŒ Ú©Ø§Ø±Úˆ Ø¨Ù†Ø§Ø¦ÛŒÚº', path: '/students/create-id-card' },
                { id: 'std_attendance', label: 'Ø·Ù„Ø¨Û Ú©ÛŒ Ø­Ø§Ø¶Ø±ÛŒ', path: '/students/attendance' },
                { id: 'std_class_asign', label: 'Ø·Ù„Ø¨Û Ú©Ùˆ Ú©Ù„Ø§Ø³ Ù…ÛŒÚº Ø§ÛŒÚˆ Ú©Ø±ÛŒÚº', path: '/students/class_asign' },
                { id: 'std_schedule ', label: 'Ù†Ø¸Ø§Ù… Ø§Ù„Ø§ÙˆÙ‚Ø§Øª', path: '/students/schedule' },
                { id: 'std_fees ', label: 'ÙÛŒØ³ Ø¬ÛŒÙ†Ø±ÛŒØ´Ù†', path: '/students/fees' },

            ]
        },
        {
            id: 'teachers',
            label: 'Ø§Ø³Ø§ØªØ°Û',
            icon: UserCheck,
            subMenu: [
                { id: 't_add', label: 'Ù†ÛŒØ§ Ø§Ø³ØªØ§Ø¯ Ø´Ø§Ù…Ù„ Ú©Ø±ÛŒÚº', path: '/HRManagement' },
                { id: 't_list', label: 'ÙÛØ±Ø³Øª Ø§Ø³Ø§ØªØ°Û', path: '/teachers/list' },
                { id: 't_attendance', label: 'Ø­Ø§Ø¶Ø±ÛŒ', path: '/teachers/attendance' },
                { id: 't_schedule ', label: 'Ù†Ø¸Ø§Ù… Ø§Ù„Ø§ÙˆÙ‚Ø§Øª', path: '/teachers/schedule' },
                { id: 't_salary_increment', label: 'ØªÙ†Ø®ÙˆØ§Û Ø§Ù†Ú©Ø±ÛŒÙ…Ù†Ù¹', path: '/teachers/salary-increments' },
                { id: 't_salary', label: 'ØªÙ†Ø®ÙˆØ§Û Ú©ÛŒ Ø§Ø¯Ø§Ø¦ÛŒÚ¯ÛŒ', path: '/finance/expenses/payroll' },
            ]
        },

        //----------------------------------------------------------------------------------------
        {
            id: 'finance',
            label: 'Ù…Ø§Ù„ÛŒØ§Øª',
            icon: Wallet,
            path: '/finance',
            subMenu: [
                {
                    id: 'income-heads-config',
                    label: 'Ø¢Ù…Ø¯Ù† Ùˆ Ø®Ø±Ú† Ø³ÛŒÙ¹ Ø§ÙŽÙ¾',
                    icon: Settings2,
                    path: '/finance/setup/income-expence',
                    heads: ['Yahan admin naye purpose add kare ga']
                },
                // --- Income Section ---
                {
                    id: 'income',
                    label: 'Ø¹Ø·ÛŒØ§Øª',
                    icon: TrendingUp,
                    path: '/finance/income',
                    subSubMenu: [
                        {
                            id: 'fee-collection',
                            label: 'ÙÙ†Úˆ ÙˆØµÙˆÙ„ÛŒ',
                            path: '/finance/income/fund-collection',
                            heads: ['Monthly Fee', 'Admission Fee', 'Exam Fee', 'Transport Fee', 'Late Fee Fine']
                        },
                        {
                            id: 'fund-list',
                            label: 'Ø¹Ø·ÛŒØ§Øª Ú©ÛŒ ÙÛØ±Ø³Øª',
                            path: '/finance/income/fund-list',
                            heads: ['Donations', 'Books & Uniform Sale', 'Bank Interest', 'Event Fund']
                        }
                        // {
                        //     id: 'other-income',
                        //     label: 'Ø¯ÛŒÚ¯Ø± Ø¢Ù…Ø¯Ù†ÛŒ',
                        //     path: '/finance/income/other-income',
                        //     heads: ['Donations', 'Books & Uniform Sale', 'Bank Interest', 'Event Fund']
                        // }
                    ]
                },
                // --- Expenses Section ---
                {
                    id: 'expenses',
                    label: 'Ø¯ÛŒÚ¯Ø± Ø¢Ù…Ø¯Ù† Ùˆ Ø®Ø±Ú†',
                    icon: TrendingDown,
                    path: '/finance/other-income-expense'
                },
                {
                    id: 'accounts',
                    label: 'Ø¨ÛŒÙ†Ú© Ø§ÙˆØ± Ú©ÛŒØ´',
                    icon: Landmark,
                    hidden: true,
                    path: '/finance/accounts',
                    subSubMenu: [
                        {
                            id: 'cash-management',
                            label: 'Ú©ÛŒØ´ Ù…ÛŒÙ†ÛŒØ¬Ù…Ù†Ù¹',
                            path: '/finance/accounts/cash-management'
                        },
                        {
                            id: 'bank-management',
                            label: 'Ø¨ÛŒÙ†Ú© Ø§Ú©Ø§Ø¤Ù†Ù¹Ø³',
                            path: '/finance/accounts/bank-management'
                        }
                    ]
                },
            ]
        },
        //--------------------------------------------------------------------------------------
        {
            id: 'HRManagement',
            label: 'Ø¹Ù…Ù„Û',
            icon: UserPlus,
            path: '/HRManagement',
            subMenu: [
                { id: 'staff_add', label: 'Ù†ÛŒØ§ Ø¹Ù…Ù„Û Ø´Ø§Ù…Ù„ Ú©Ø±ÛŒÚº', path: '/HRManagement?staffType=staff' },
                { id: 'staff_list', label: 'Ø¯ÛŒÚ¯Ø± Ø¹Ù…Ù„Û ÙÛØ±Ø³Øª', path: '/staff/list' },
                { id: 'staff_salary_increment', label: 'ØªÙ†Ø®ÙˆØ§Û Ø§Ù†Ú©Ø±ÛŒÙ…Ù†Ù¹', path: '/teachers/salary-increments' },
                { id: 'staff_salary', label: 'ØªÙ†Ø®ÙˆØ§Û Ú©ÛŒ Ø§Ø¯Ø§Ø¦ÛŒÚ¯ÛŒ', path: '/finance/expenses/payroll' }
            ]
        },
        {
            id: 'exams',
            label: 'Ø§Ù…ØªØ­Ø§Ù†',
            icon: ExamIcon,
            path: '/exams',
            subMenu: [
                { id: 'exam_schedule', label: '\u0627\u0645\u062a\u062d\u0627\u0646\u06cc \u0634\u06cc\u0688\u0648\u0644', path: '/exams/schedule' },
                { id: 'exam_schedule_list', label: 'Ø§Ù…ØªØ­Ø§Ù†ÛŒ Ø´ÛŒÚˆÙˆÙ„ ÙÛØ±Ø³Øª', path: '/exams/schedule-list' },
                { id: 'exam_result', label: 'Ø§Ù…ØªØ­Ø§Ù†ÛŒ Ø±Ø²Ù„Ù¹', path: '/exams/result' },
                { id: 'exam_result_list', label: 'Ø±Ø²Ù„Ù¹ ÙÛØ±Ø³Øª', path: '/exams/result-list' }
            ]
        },
        {
            id: 'store',
            label: 'Ø§Ø³Ù¹ÙˆØ±',
            icon: Store,
            path: '/store',
            subMenu: [
                { id: 'store_dashboard', label: 'ÚˆÛŒØ´ Ø¨ÙˆØ±Úˆ', path: '/store/dashboard' },
                { id: 'store_items', label: 'Ø§Ø´ÛŒØ§Ø¡', path: '/store/items' },
                { id: 'store_units', label: 'Ø§Ú©Ø§Ø¦ÛŒØ§Úº', path: '/store/units' },
                { id: 'store_categories', label: 'Ú©ÛŒÙ¹ÛŒÚ¯Ø±ÛŒØ²', path: '/store/categories' },
                { id: 'store_purchases', label: 'Ø®Ø±ÛŒØ¯Ø§Ø±ÛŒ', path: '/store/purchases' },
                { id: 'store_stock_issues', label: 'Ø§Ø³Ù¹Ø§Ú© Ø§Ø¬Ø±Ø§Ø¡', path: '/store/stock-issues' },
                { id: 'store_returns', label: 'ÙˆØ§Ù¾Ø³ÛŒ', path: '/store/returns' },
                { id: 'store_damaged_stock', label: 'Ø®Ø±Ø§Ø¨ / Ú¯Ù… Ø´Ø¯Û Ø§Ø³Ù¹Ø§Ú©', path: '/store/damaged-stock' },
                { id: 'store_approvals', label: 'Ù…Ù†Ø¸ÙˆØ±ÛŒØ§Úº', path: '/store/approvals' },
                { id: 'store_reports', label: 'Ø±Ù¾ÙˆØ±Ù¹Ø³', path: '/store/reports' },
                { id: 'store_suppliers', label: 'Ø³Ù¾Ù„Ø§Ø¦Ø±Ø²', path: '/store/suppliers' },
            ]
        },
        {
            id: 'scholarship',
            label: 'ÙˆØ¸ÛŒÙÛ',
            icon: BadgeCent,
            path: '/scholarship'
        },
        {
            id: 'books',
            label: 'Ú©ØªØ§Ø¨',
            icon: Library,
            path: '/books'
        },

    ];
    //--------------------------------------------------------------------
    const profileMenuItems = [
        { id: 'settings', label: 'Ù¾Ø±ÙˆÙØ§Ø¦Ù„ Ø³ÛŒÙ¹Ù†Ú¯', path: '/Profile/setting', icon: Settings },
        // { id: 'change_password', label: 'Ù¾Ø§Ø³ ÙˆØ±Úˆ ØªØ¨Ø¯ÛŒÙ„ Ú©Ø±ÛŒÚº', path: '/Profile/change-password', icon: KeyRound },
        { id: 'cities', label: 'Ø´ÛØ±', path: '/Profile/cities', icon: UserCheck },
        { id: 'support', label: 'Ø³Ù¾ÙˆØ±Ù¹', path: '/Profile/support', icon: MessageSquare },
        { id: 'suggestions', label: 'ØªØ¬Ø§ÙˆÛŒØ²', path: '/Profile/suggestions', icon: Sparkles },
    ];

    // const toggleSubMenu = (id) => setOpenSubMenu(openSubMenu === id ? null : id);
    const toggleSubMenu = (id) => {
        setOpenSubMenu(openSubMenu === id ? null : id);
        setOpenSubSubMenu(null); // Level 1 change ho to Level 2 reset ho jaye
    };

    const toggleSubSubMenu = (id) => {
        setOpenSubSubMenu(openSubSubMenu === id ? null : id);
    };
    //--------------------------------------------------------------------
    const setting = [
        {
            id: 'setting',
            label: 'ØªØ±ØªÛŒØ¨Ø§Øª',
            icon: Settings,
            subMenu: [
                { id: 'shift', label: 'Ø´ÙÙ¹ Ú©Ø§ Ø§Ù†ØªØ¸Ø§Ù…', path: '/setting/shift' },
                { id: 'department', label: 'Ø´Ø¹Ø¨Û Ø¬Ø§Øª Ú©Ø§ Ø§Ù†ØªØ¸Ø§Ù…', path: '/setting/department' },
                { id: 'degree', label: 'ØªØ¹Ù„ÛŒÙ…ÛŒ Ø§Ø³Ù†Ø§Ø¯ Ú©Û’ Ù†Ø§Ù…', path: '/setting/degree-name' },
                { id: 'role_management', label: 'Ú©Ø±Ø¯Ø§Ø± Ù…ÛŒÙ†Ø¬Ù…Ù†Ù¹', path: '/role-management', permission: 'role_management.view' },
                { id: 'user_management', label: 'ØµØ§Ø±ÙÛŒÙ† Ù…ÛŒÙ†Ø¬Ù…Ù†Ù¹', path: '/role-management/users', permission: 'users.view' },

            ]
        }

    ];

    const urduMenuLabels = {
        dashboard: 'ÚˆÛŒØ´ Ø¨ÙˆØ±Úˆ',
        class_mgmt: 'Ú©Ù„Ø§Ø³ Ù…ÛŒÙ†Ø¬Ù…Ù†Ù¹',
        classes: 'Ø¬Ù…Ø§Ø¹Øª',
        sections: 'Ø¬Ù…Ø§Ø¹Øª Ø³ÛŒÚ©Ø´Ù†Ø²',
        session: 'Ø³ÛŒØ´Ù†',
        subjects: 'Ù…Ø¶Ø§Ù…ÛŒÙ†',
        hifz: 'Ø´Ø¹Ø¨Û Ø­ÙØ¸',
        hifz_daily: 'ÛŒÙˆÙ…ÛŒÛ Ø¬Ø§Ø¦Ø²Û',
        daily_entry: 'ÛŒÙˆÙ…ÛŒÛ Ø¬Ø§Ø¦Ø²Û’ Ú©Ø§ Ø§Ù†Ø¯Ø±Ø§Ø¬',
        daily_list: 'ÛŒÙˆÙ…ÛŒÛ Ø¬Ø§Ø¦Ø²Û’ Ú©ÛŒ ÙÛØ±Ø³Øª',
        hifz_weekly: 'ÛÙØªÛ ÙˆØ§Ø± Ø¬Ø§Ø¦Ø²Û',
        weekly_entry: 'ÛÙØªÛ ÙˆØ§Ø± Ø¬Ø§Ø¦Ø²Û’ Ú©Ø§ Ø§Ù†Ø¯Ø±Ø§Ø¬',
        weekly_list: 'ÛÙØªÛ ÙˆØ§Ø± Ø¬Ø§Ø¦Ø²Û’ Ú©ÛŒ ÙÛØ±Ø³Øª',
        hifz_monthly: 'Ù…Ø§ÛØ§Ù†Û Ø¬Ø§Ø¦Ø²Û',
        monthly_entry: 'Ù…Ø§ÛØ§Ù†Û Ø¬Ø§Ø¦Ø²Û’ Ú©Ø§ Ø§Ù†Ø¯Ø±Ø§Ø¬',
        monthly_list: 'Ù…Ø§ÛØ§Ù†Û Ø¬Ø§Ø¦Ø²Û’ Ú©ÛŒ ÙÛØ±Ø³Øª',
        hifz_para: 'Ù¾Ø§Ø±Û Ø¬Ø§Ø¦Ø²Û',
        para_entry: 'Ù¾Ø§Ø±Û Ø¬Ø§Ø¦Ø²Û’ Ú©Ø§ Ø§Ù†Ø¯Ø±Ø§Ø¬',
        para_list: 'Ù¾Ø§Ø±Û Ø¬Ø§Ø¦Ø²Û’ Ú©ÛŒ ÙÛØ±Ø³Øª',
        students: 'Ø·Ù„Ø¨Ø§Ø¡',
        std_parents: 'ÙˆØ§Ù„Ø¯ÛŒÙ†',
        std_admission: 'Ø¯Ø§Ø®Ù„Û ÙØ§Ø±Ù…',
        std_list: 'Ø·Ù„Ø¨Ø§Ø¡ Ú©ÛŒ ÙÛØ±Ø³Øª',
        std_id_card: 'Ø¢Ø¦ÛŒ ÚˆÛŒ Ú©Ø§Ø±Úˆ Ø¨Ù†Ø§Ø¦ÛŒÚº',
        std_attendance: 'Ø·Ù„Ø¨Ø§Ø¡ Ú©ÛŒ Ø­Ø§Ø¶Ø±ÛŒ',
        std_class_asign: 'Ø·Ù„Ø¨Ø§Ø¡ Ú©Ùˆ Ú©Ù„Ø§Ø³ Ù…ÛŒÚº Ø´Ø§Ù…Ù„ Ú©Ø±ÛŒÚº',
        'std_schedule ': 'Ù†Ø¸Ø§Ù… Ø§Ù„Ø§ÙˆÙ‚Ø§Øª',
        'std_fees ': 'ÙÛŒØ³ Ø¬Ù†Ø±ÛŒØ´Ù†',
        teachers: 'Ø§Ø³Ø§ØªØ°Û',
        t_add: 'Ù†ÛŒØ§ Ø§Ø³ØªØ§Ø¯ Ø´Ø§Ù…Ù„ Ú©Ø±ÛŒÚº',
        t_list: 'Ø§Ø³Ø§ØªØ°Û Ú©ÛŒ ÙÛØ±Ø³Øª',
        t_attendance: 'Ø­Ø§Ø¶Ø±ÛŒ',
        't_schedule ': 'Ù†Ø¸Ø§Ù… Ø§Ù„Ø§ÙˆÙ‚Ø§Øª',
        t_salary_increment: 'ØªÙ†Ø®ÙˆØ§Û Ø§Ù†Ú©Ø±ÛŒÙ…Ù†Ù¹',
        t_salary: 'ØªÙ†Ø®ÙˆØ§Û Ú©ÛŒ Ø§Ø¯Ø§Ø¦ÛŒÚ¯ÛŒ',
        finance: 'Ù…Ø§Ù„ÛŒØ§Øª',
        'income-heads-config': 'Ø¢Ù…Ø¯Ù† Ùˆ Ø®Ø±Ú† Ø³ÛŒÙ¹ Ø§Ù¾',
        income: 'Ø¹Ø·ÛŒØ§Øª',
        'fee-collection': 'ÙÙ†Úˆ ÙˆØµÙˆÙ„ÛŒ',
        'fund-list': 'Ø¹Ø·ÛŒØ§Øª Ú©ÛŒ ÙÛØ±Ø³Øª',
        expenses: 'Ø¯ÛŒÚ¯Ø± Ø¢Ù…Ø¯Ù† Ùˆ Ø®Ø±Ú†',
        accounts: 'Ø¨ÛŒÙ†Ú© Ø§ÙˆØ± Ú©ÛŒØ´',
        'cash-management': 'Ú©ÛŒØ´ Ù…ÛŒÙ†Ø¬Ù…Ù†Ù¹',
        'bank-management': 'Ø¨ÛŒÙ†Ú© Ø§Ú©Ø§Ø¤Ù†Ù¹Ø³',
        HRManagement: 'Ø¹Ù…Ù„Û',
        staff_add: 'Ù†ÛŒØ§ Ø¹Ù…Ù„Û Ø´Ø§Ù…Ù„ Ú©Ø±ÛŒÚº',
        staff_list: 'Ø¯ÛŒÚ¯Ø± Ø¹Ù…Ù„Û ÙÛØ±Ø³Øª',
        staff_salary_increment: 'ØªÙ†Ø®ÙˆØ§Û Ø§Ù†Ú©Ø±ÛŒÙ…Ù†Ù¹',
        staff_salary: 'ØªÙ†Ø®ÙˆØ§Û Ú©ÛŒ Ø§Ø¯Ø§Ø¦ÛŒÚ¯ÛŒ',
        exams: 'Ø§Ù…ØªØ­Ø§Ù†',
        exam_schedule: 'Ø§Ù…ØªØ­Ø§Ù†ÛŒ Ø´ÛŒÚˆÙˆÙ„',
        exam_schedule_list: 'Ø§Ù…ØªØ­Ø§Ù†ÛŒ Ø´ÛŒÚˆÙˆÙ„ ÙÛØ±Ø³Øª',
        exam_result: 'Ø§Ù…ØªØ­Ø§Ù†ÛŒ Ø±Ø²Ù„Ù¹',
        exam_result_list: 'Ø±Ø²Ù„Ù¹ ÙÛØ±Ø³Øª',
        store: 'Ø§Ø³Ù¹ÙˆØ±',
        store_dashboard: 'ÚˆÛŒØ´ Ø¨ÙˆØ±Úˆ',
        store_items: 'Ø§Ø´ÛŒØ§Ø¡',
        store_units: 'Ø§Ú©Ø§Ø¦ÛŒØ§Úº',
        store_categories: 'Ú©ÛŒÙ¹ÛŒÚ¯Ø±ÛŒØ²',
        store_purchases: 'Ø®Ø±ÛŒØ¯Ø§Ø±ÛŒ',
        store_stock_issues: 'Ø§Ø³Ù¹Ø§Ú© Ø§Ø¬Ø±Ø§Ø¡',
        store_returns: 'ÙˆØ§Ù¾Ø³ÛŒ',
        store_damaged_stock: 'Ø®Ø±Ø§Ø¨ / Ú¯Ù… Ø´Ø¯Û Ø§Ø³Ù¹Ø§Ú©',
        store_approvals: 'Ù…Ù†Ø¸ÙˆØ±ÛŒØ§Úº',
        store_reports: 'Ø±Ù¾ÙˆØ±Ù¹Ø³',
        store_suppliers: 'Ø³Ù¾Ù„Ø§Ø¦Ø±Ø²',
        scholarship: 'ÙˆØ¸ÛŒÙÛ',
        books: 'Ú©ØªØ§Ø¨',
        settings: 'Ù¾Ø±ÙˆÙØ§Ø¦Ù„ Ø³ÛŒÙ¹Ù†Ú¯',
        cities: 'Ø´ÛØ±',
        support: 'Ø³Ù¾ÙˆØ±Ù¹',
        suggestions: 'ØªØ¬Ø§ÙˆÛŒØ²',
        setting: 'ØªØ±ØªÛŒØ¨Ø§Øª',
        shift: 'Ø´ÙÙ¹ Ú©Ø§ Ø§Ù†ØªØ¸Ø§Ù…',
        department: 'Ø´Ø¹Ø¨Û Ø¬Ø§Øª Ú©Ø§ Ø§Ù†ØªØ¸Ø§Ù…',
        degree: 'ØªØ¹Ù„ÛŒÙ…ÛŒ Ø§Ø³Ù†Ø§Ø¯ Ú©Û’ Ù†Ø§Ù…',
        role_management: 'Ú©Ø±Ø¯Ø§Ø± Ù…ÛŒÙ†Ø¬Ù…Ù†Ù¹',
        user_management: 'ØµØ§Ø±ÙÛŒÙ† Ù…ÛŒÙ†Ø¬Ù…Ù†Ù¹',
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

    const visibleMenuItems = filterMenuItems(applyUrduLabels(menuItems));
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
                            <img src={avatarSrc} alt={sidebarTitle} className="h-full w-full object-contain p-1" />
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
                        <div key={item.id} dir="rtl">
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
                                        <div key={sub.id} className="perspective-1000">
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
                                        sx={{ bgcolor: '#ffffff', '& img': { objectFit: 'contain', padding: '4px' } }}
                                    />
                                </div>
                                <div className="hidden sm:flex min-w-0 max-w-[15rem] flex-col items-end text-right leading-none">
                                    <p className="max-w-full truncate p-1 text-md font-black text-themeText" title={madrassaName}>{madrassaName}</p>
                                    <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] leading-none">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <p className="text-themeMuted font-bold">{profileRoleLabel}</p>
                                    </div>
                                    <p className="mt-2 max-w-full truncate text-[10px] font-bold text-themeMuted" title={profileName}>{profileName}</p>
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

