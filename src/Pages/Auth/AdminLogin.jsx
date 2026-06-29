import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LockKeyhole, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import madarsaLogo from '../../assets/logos/madarsaLogotransparent.png';
import {
    fetchCurrentTenantBranding,
    getAdminCredentials,
    getApiAssetUrl,
    loginAdmin,
    logoutAdmin,
} from '../../Constant/AdminAuth';
import { SESSION_EXPIRED_MESSAGE_KEY } from '../../Constant/Api';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { getDefaultRouteForSession, getRoleName, isAdminRoleName } from './authLandingRoutes';

const staggerWrap = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};
const MotionDiv = motion.div;
const MotionForm = motion.form;
const MotionButton = motion.button;

const LoginForm = ({
    usernamePlaceholder,
    submitLabel,
    showDefaultCredentials = false,
    allowAdminRoles = false,
}) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tenantBranding, setTenantBranding] = useState(null);
    const credentials = getAdminCredentials();
    useNotificationBridge({ error });

    React.useEffect(() => {
        let isMounted = true;

        const expiredMessage = window.sessionStorage?.getItem(SESSION_EXPIRED_MESSAGE_KEY);
        if (expiredMessage) {
            setError(expiredMessage);
            window.sessionStorage?.removeItem(SESSION_EXPIRED_MESSAGE_KEY);
        }

        fetchCurrentTenantBranding()
            .then((brandingData) => {
                if (isMounted) {
                    setTenantBranding(brandingData?.branding || null);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setTenantBranding(null);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const loginLogo = React.useMemo(
        () => (tenantBranding?.logoUrl ? getApiAssetUrl(tenantBranding.logoUrl) : madarsaLogo),
        [tenantBranding?.logoUrl],
    );
    const loginLogoAlt = tenantBranding?.name || 'مدرسہ سافٹ ویئر';

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username.trim() || !formData.password) {
            setError('صارف نام اور پاس ورڈ درج کرنا ضروری ہیں۔');
            return;
        }

        setIsSubmitting(true);

        try {
            const { session } = await loginAdmin(formData);
            const roleName = getRoleName(session);

            if (!allowAdminRoles && isAdminRoleName(roleName)) {
                logoutAdmin();
                setError('ایڈمن لاگ اِن کے لیے براہ کرم /admin استعمال کریں۔');
                return;
            }

            navigate(getDefaultRouteForSession(session), { replace: true });
        } catch (loginError) {
            setError(loginError?.message || 'لاگ اِن نہیں ہو سکا۔');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] p-4 text-[var(--color-text-main)] md:p-8"
            dir="rtl"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.14),transparent_32%),linear-gradient(135deg,#07111f,#122033_55%,#1b2940)]" />
            <MotionDiv
                className="absolute -top-24 left-8 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl"
                animate={{ x: [0, 140, 30, 0], y: [0, 70, 160, 0], scale: [1, 1.14, 0.92, 1], opacity: [0.45, 0.72, 0.38, 0.45] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <MotionDiv
                className="absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-cyan-400/20 blur-3xl"
                animate={{ x: [0, -120, -15, 0], y: [0, -70, -160, 0], scale: [1, 0.9, 1.14, 1], opacity: [0.42, 0.7, 0.34, 0.42] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            />
            <MotionDiv
                className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"
                animate={{ x: [-80, 60, -35, -80], y: [-35, 50, 85, -35], scale: [0.95, 1.08, 1, 0.95], opacity: [0.22, 0.42, 0.16, 0.22] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative z-10 flex w-full justify-center">
                <MotionForm
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    variants={staggerWrap}
                    transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="relative w-full max-w-xl overflow-hidden rounded-[2.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-10"
                >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-teal-200 via-[var(--color-primary)] to-cyan-300" />

                    <div className="space-y-6 pt-2 text-right md:pt-0">
                        <MotionDiv initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                            <img
                                src={loginLogo}
                                alt={loginLogoAlt}
                                title={loginLogoAlt}
                                className="mx-auto mb-4 h-28 w-auto max-w-[20rem] object-contain md:h-32"
                                onError={(event) => {
                                    event.currentTarget.src = madarsaLogo;
                                }}
                            />
                        </MotionDiv>

                        <MotionDiv
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.32 }}
                            className="space-y-2"
                        >
                            <label className="m-2 text-xs font-black tracking-wide text-slate-300">صارف نام<span className="text-red-500"> *</span></label>
                            <div className="relative mt-3">
                                <UserRound className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-200" size={18} />
                                <input
                                    required
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => handleChange('username', e.target.value)}
                                    placeholder={usernamePlaceholder}
                                    className="h-14 w-full rounded-2xl border border-white/10 bg-[rgba(7,17,31,0.82)] pr-12 pl-4 text-base font-bold text-white outline-none transition-all placeholder:text-slate-400 focus:border-teal-300 focus:shadow-[0_0_0_5px_rgba(45,212,191,0.08)]"
                                />
                            </div>
                        </MotionDiv>

                        <MotionDiv
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.39 }}
                            className="space-y-2"
                        >
                            <label className="m-2 text-xs font-black tracking-wide text-slate-300">پاس ورڈ<span className="text-red-500"> *</span></label>
                            <div className="relative mt-3">
                                <LockKeyhole className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-200" size={18} />
                                <input
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    placeholder="پاس ورڈ درج کریں"
                                    className="h-14 w-full rounded-2xl border border-white/10 bg-[rgba(7,17,31,0.82)] pr-12 pl-4 text-base font-bold text-white outline-none transition-all placeholder:text-slate-400 focus:border-teal-300 focus:shadow-[0_0_0_5px_rgba(45,212,191,0.08)]"
                                />
                            </div>
                        </MotionDiv>

                        <MotionButton
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.46 }}
                            type="submit"
                            disabled={isSubmitting}
                            className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#2dd4bf,#67e8f9)] text-base font-black text-[#07111f] shadow-[0_20px_40px_rgba(45,212,191,0.24)] transition-all hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? 'لاگ اِن ہو رہا ہے...' : submitLabel}
                            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        </MotionButton>

                        {showDefaultCredentials && (
                            <MotionDiv
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.52 }}
                                className="rounded-[1.75rem] border border-white/10 bg-[rgba(7,17,31,0.82)] px-5 py-4 text-sm font-bold leading-7 text-slate-300"
                            >
                                ڈیفالٹ صارف نام:
                                <span className="text-white"> {credentials.username} </span>
                                <span className="block">
                                    ڈیفالٹ پاس ورڈ:
                                    <span className="text-white"> {credentials.password} </span>
                                </span>
                                <span className="block text-slate-400">لاگ اِن بیک اینڈ API اور JWT ٹوکن کے ذریعے ہوگا۔</span>
                            </MotionDiv>
                        )}
                    </div>
                </MotionForm>
            </div>
        </div>
    );
};

export const AdminLogin = () => (
    <LoginForm
        usernamePlaceholder="ایڈمن صارف نام"
        submitLabel="ایڈمن لاگ اِن"
        allowAdminRoles
        showDefaultCredentials
    />
);

export const UserLogin = () => (
    <LoginForm
        usernamePlaceholder="صارف نام یا ای میل"
        submitLabel="لاگ اِن"
    />
);
