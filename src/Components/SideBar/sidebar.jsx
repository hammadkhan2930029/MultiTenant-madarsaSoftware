import React, { useEffect, useState } from 'react';
import {
    LayoutDashboard, Users, GraduationCap, UserCheck,
    BookOpen, Wallet, Settings, LogOut, Search,
    Bell, MessageSquare, Menu, ChevronDown,
    ClipboardList, GraduationCap as ExamIcon, HeartHandshake,
    BadgeCent, Library, Store, X, Moon, Sun, UserPlus, TrendingUp, TrendingDown, Landmark, BarChart3, Settings2, KeyRound
} from 'lucide-react';
import { Avatar } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ThemeToggle } from '../ThemToggle/ThemToggle'
import { fetchCurrentAdminProfile, fetchMadrassaProfile, getAdminSession, resolveApiAssetUrl, logoutAdmin, MADRASSA_PROFILE_UPDATED_EVENT } from '../../Constant/AdminAuth'


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
    const sidebarTitle = madrassaProfile?.name?.trim() || 'Madarsa Management';
    const profileName = madrassaProfile?.name?.trim() || adminProfile?.name || 'Admin';
    const sidebarBadge = madrassaProfile?.city?.trim() || 'Main Campus';
    const hasMadrassaLogo = Boolean(avatarSrc);
    const handleLogout = () => {
        logoutAdmin();
        setIsProfileOpen(false);
        navigate('/login');
    };
    //--------------------------------------------------------------------

    const menuItems = [
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
                { id: 'sections', label: 'جماعت سیکشنز', path: '/class-management/sections' },
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
                { id: 'std_parents', label: 'والدین', path: '/students/parents' },
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
                { id: 't_list', label: 'فہرست اساتذہ', path: '/teachers/list' },
                { id: 't_attendance', label: 'حاضری', path: '/teachers/attendance' },
                { id: 't_schedule ', label: 'نظام الاوقات', path: '/teachers/schedule' },



            ]
        },

        //----------------------------------------------------------------------------------------
        {
            id: 'finance',
            label: 'مالیات',
            icon: Wallet,
            path: '/finance',
            subMenu: [
                {
                    id: 'income-heads-config',
                    label: 'آمدن و خرچ سیٹ اَپ',
                    icon: Settings2,
                    path: '/finance/setup/income-expence',
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
                            heads: ['Monthly Fee', 'Admission Fee', 'Exam Fee', 'Transport Fee', 'Late Fee Fine']
                        },
                        {
                            id: 'fund-list',
                            label: 'عطیات کی فہرست',
                            path: '/finance/income/fund-list',
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
                    path: '/finance/other-income-expense'
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
                {
                    id: 'reports_finance',
                    label: 'رپورٹس اور آڈٹ',
                    icon: BarChart3,
                    path: '/finance/reports',
                    subSubMenu: [
                        {
                            id: 'financial-statements',
                            label: 'مالیاتی گوشوارے',
                            path: '/finance/reports/financial-statements'
                        },
                        {
                            id: 'defaulters',
                            label: 'بقایا جات',
                            path: '/finance/reports/defaulters'
                        }
                    ]
                }
            ]
        },
        //--------------------------------------------------------------------------------------
        {
            id: 'HRManagement',
            label: 'عملہ',
            icon: UserPlus,
            path: '/HRManagement'
        },
        {
            id: 'exams',
            label: 'امتحان',
            icon: ExamIcon,
            path: '/exams',
            subMenu: [
                { id: 'exam_schedule', label: '\u0627\u0645\u062a\u062d\u0627\u0646\u06cc \u0634\u06cc\u0688\u0648\u0644', path: '/exams/schedule' }
            ]
        },
        {
            id: 'scholarship',
            label: 'وظیفہ',
            icon: BadgeCent,
            path: '/scholarship'
        },
        {
            id: 'reports',
            label: 'رپورٹس',
            icon: ClipboardList,
            path: '/reports'
        },
        {
            id: 'books',
            label: 'کتاب',
            icon: Library,
            path: '/books'
        },
        {
            id: 'store',
            label: 'اسٹور',
            icon: Store,
            path: '/store'
        },
    ];
    //--------------------------------------------------------------------
    const profileMenuItems = [
        { id: 'settings', label: 'پروفائل سیٹنگ', path: '/Profile/setting', icon: Settings },
        { id: 'change_password', label: 'پاس ورڈ تبدیل کریں', path: '/Profile/change-password', icon: KeyRound },
        { id: 'cities', label: 'شہر', path: '/Profile/cities', icon: UserCheck },
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
            label: 'ترتیبات',
            icon: Settings,
            subMenu: [
                { id: 'shift', label: 'شفٹ کا انتظام', path: '/setting/shift' },
                { id: 'department', label: 'شعبہ جات کا انتظام', path: '/setting/department' },
                { id: 'degree', label: 'تعلیمی اسناد کے نام', path: '/setting/degree-name' },

            ]
        }

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
                            <img src={avatarSrc} alt={sidebarTitle} className="w-full h-full object-cover" />
                        ) : (
                            <GraduationCap className="text-[#00d094]" size={26} />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-white font-black text-base leading-tight break-words" title={sidebarTitle}>{sidebarTitle}</h1>
                        <p className="text-[9px] text-[#00d094] font-bold tracking-[0.16em] uppercase truncate" title={sidebarBadge}>{sidebarBadge}</p>
                    </div>
                </div>
                {/* //--------------------------------------------------------------// */}

                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)] vip-scrollbar px-1 ">
                    {menuItems.filter((item) => !item.hidden).map((item) => (
                        <div key={item.id}>
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
                                    <span className="text-[13px] font-bold">{item.label}</span>
                                </div>
                                {item.subMenu && <ChevronDown size={14} className={`transition-transform duration-300 ${openSubMenu === item.id ? 'rotate-180' : ''}`} />}
                            </div>

                            {/* --- Level 2: Sub Menu --- */}
                            {item.subMenu && openSubMenu === item.id && (
                                <div className="mt-2 mr-6 space-y-1 border-r border-white/10 pr-2">
                                    {item.subMenu.filter((sub) => !sub.hidden).map((sub) => (
                                        <div key={sub.id} className="perspective-1000">
                                            <div
                                                onClick={() => sub.subSubMenu ? toggleSubSubMenu(sub.id) : (navigate(sub.path), setIsSidebarOpen(false))}
                                                className={`text-[12px] p-2.5 rounded-xl  cursor-pointer flex items-center justify-between transition-all ${isActive(sub.path) || (sub.subSubMenu && sub.subSubMenu.some(ss => isActive(ss.path)))
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
                                                    {sub.subSubMenu.filter((subSub) => !subSub.hidden).map((subSub) => (
                                                        <div
                                                            key={subSub.id}
                                                            onClick={() => {
                                                                if (subSub.path) navigate(subSub.path);
                                                                setIsSidebarOpen(false);
                                                            }}
                                                            className="text-[12px] p-2 text-gray-400 hover:text-[#00d094] hover:bg-[#00d094]/9 rounded-lg cursor-pointer transition-all flex items-center gap-2"
                                                        >
                                                            <span >•</span>
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
                    <div className="relative group">
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
                                className="absolute top-0 -right-60 lg:right-12 md:right-8 w-56 backdrop-blur-xl border shadow-2xl rounded-[2rem] p-3 animate-in slide-in-from-left-5 fade-in duration-300"
                            >
                                <p
                                    style={{ color: 'var(--color-primary)' }}
                                    className="text-[10px] font-black uppercase tracking-widest mb-3 px-3"
                                >
                                    Quick Actions
                                </p>

                                <div className="space-y-1">
                                    {setting[0].subMenu.map((sub) => (
                                        <button
                                            key={sub.id}
                                            onClick={() => { navigate(sub.path); setOpenSubMenu(null); }}
                                            style={{ '--hover-bg': 'var(--color-bg)' }}
                                            className="w-full flex items-center justify-between p-3 rounded-xl transition-all group/item hover:bg-[var(--hover-bg)]"
                                        >
                                            <span
                                                style={{ color: 'var(--color-text-main)' }}
                                                className="text-xs font-bold group-hover/item:text-[var(--color-primary)] transition-colors"
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
                                    ))}
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
                        <div className="relative">
                            <div className="flex items-center gap-5 cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                                <div className="relative group/avatar">
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00d094] border-2 border-themeSurface rounded-full z-10 animate-pulse" />
                                    <Avatar src={avatarSrc} alt={profileName} className="w-11 h-11 border-2 border-emerald-100 shadow-sm" />
                                </div>
                                <div className="hidden sm:flex flex-col items-end text-right leading-none min-w-0 max-w-[11rem]">
                                    <p className="font-black text-sm text-themeText max-w-full truncate p-1" title={profileName}>{profileName}</p>
                                    <div className="flex items-center justify-end gap-1.5 text-[10px] leading-none">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <p className="text-themeMuted font-bold uppercase tracking-[0.12em]">{adminProfile?.role || 'Admin'}</p>
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
                                            {profileMenuItems.map((item) => (
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
                                ⌘ K
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

