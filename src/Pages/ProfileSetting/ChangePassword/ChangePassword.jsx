import React, { useState } from 'react';
import { CheckCircle2, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { changeAdminPassword, getAdminSession } from '../../../Constant/AdminAuth';

export const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const username = getAdminSession()?.admin?.username || 'admin';

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError('تمام فیلڈز بھرنا ضروری ہیں۔');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('نیا پاس ورڈ اور دوبارہ درج کیا گیا پاس ورڈ ایک جیسے نہیں ہیں۔');
            return;
        }

        const result = await changeAdminPassword({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
        });

        if (!result.success) {
            setError(result.message);
            return;
        }

        setSuccess('پاس ورڈ کامیابی سے تبدیل ہو گیا ہے۔');
        setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    };

    const inputClassName =
        'h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-base font-bold text-[var(--color-text-main)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]';

    return (
        <div className="mx-auto max-w-5xl space-y-8 pb-10" dir="rtl">
            <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-gradient-to-br from-[#004d61] to-[#002a33] p-8 text-white shadow-2xl md:p-10">
                <div className="absolute -left-16 -top-12 h-44 w-44 rounded-full bg-[#00d094]/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

                <div className="relative flex flex-col gap-6 text-right md:flex-row md:items-center md:justify-between">
                    <div className="order-2 space-y-4 md:order-1">
                        <p className="text-xs font-black tracking-[0.28em] text-emerald-300">سیکیورٹی</p>
                        <h1 className="text-3xl font-black leading-[1.2] md:text-5xl">پاس ورڈ تبدیل کریں</h1>
                        <p className="max-w-2xl text-sm font-bold leading-7 text-slate-200 md:text-base mt-7">
                            ایڈمن اکاؤنٹ کا پاس ورڈ محفوظ طریقے سے تبدیل کریں تاکہ سسٹم تک رسائی مزید بہتر اور محفوظ ہو۔
                        </p>
                    </div>

                    <div className="order-1 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/10 text-emerald-300 shadow-lg md:order-2">
                        <ShieldCheck size={36} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.72fr_1.28fr]">
                <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                    <div className="space-y-4 text-right">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            <KeyRound size={24} />
                        </div>

                        <h2 className="text-2xl font-black text-[var(--color-text-main)]">اکاؤنٹ معلومات</h2>

                        <div className="rounded-[2rem] bg-[var(--color-bg)] p-5">
                            <p className="text-[11px] font-black tracking-[0.2em] text-[var(--color-text-muted)]">
                                ایڈمن صارف نام
                            </p>
                            <p className="mt-3 text-lg font-black text-[var(--color-text-main)]">
                                {username}
                            </p>
                        </div>

                        <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/8 p-5 text-sm font-bold leading-7 text-[var(--color-text-main)]">
                            نیا پاس ورڈ کم از کم 6 حروف پر مشتمل رکھیں اور اسے محفوظ جگہ پر یاد رکھیں۔
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-6"
                >
                    <div className="space-y-6 text-right ">
                        <div className="space-y-6">
                            <p className="text-xs font-black tracking-[0.24em] text-[var(--color-primary)] p-5 ">
                                پاس ورڈ اپڈیٹ
                            </p>
                            <h2 className="text-2xl font-black leading-[1.3] text-[var(--color-text-main)] md:text-3xl mt-3">
                                نئی تفصیل درج کریں
                            </h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black tracking-wide text-[var(--color-text-muted)]">
                                موجودہ پاس ورڈ
                            </label>
                            <div className="relative">
                                <LockKeyhole className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <input
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={(e) => handleChange('currentPassword', e.target.value)}
                                    placeholder="موجودہ پاس ورڈ درج کریں"
                                    className={inputClassName}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black tracking-wide text-[var(--color-text-muted)]">
                                نیا پاس ورڈ
                            </label>
                            <div className="relative">
                                <LockKeyhole className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <input
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) => handleChange('newPassword', e.target.value)}
                                    placeholder="نیا پاس ورڈ درج کریں"
                                    className={inputClassName}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black tracking-wide text-[var(--color-text-muted)]">
                                دوبارہ نیا پاس ورڈ
                            </label>
                            <div className="relative">
                                <LockKeyhole className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                    placeholder="دوبارہ نیا پاس ورڈ درج کریں"
                                    className={inputClassName}
                                />
                            </div>
                        </div>

                        {error ? (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
                                {error}
                            </div>
                        ) : null}

                        {success ? (
                            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">
                                <CheckCircle2 size={18} />
                                {success}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            className="h-14 w-full rounded-2xl bg-[linear-gradient(90deg,var(--color-primary),#49e7be)] text-[#0b1120] font-black text-base shadow-[0_20px_40px_rgba(16,185,129,0.22)] transition-all hover:scale-[1.01] active:scale-95"
                        >
                            پاس ورڈ محفوظ کریں
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
