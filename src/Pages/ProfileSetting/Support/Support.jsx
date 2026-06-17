import React, { useState } from 'react';
import { HelpCircle, Mail, MessageCircle, Phone, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { createSupportRequest } from '../../../Constant/SupportApi';
import { getAdminSession } from '../../../Constant/AdminAuth';
import { useNotifier } from '../../../Components/Notifications/useNotifier';

const supportChannels = [
    {
        title: 'فون سپورٹ',
        value: '+92 300 0000000',
        description: 'فوری رہنمائی کے لیے ہماری ٹیم سے رابطہ کریں۔',
        icon: Phone,
    },
    {
        title: 'ای میل',
        value: 'info@cogentdevs.com',
        description: 'مسئلے کی تفصیل، اسکرین شاٹ یا درخواست بھیجیں۔',
        icon: Mail,
    },
    {
        title: 'واٹس ایپ',
        value: '+92 300 0000000',
        description: 'روزمرہ سوالات اور فوری اپڈیٹس کے لیے۔',
        icon: MessageCircle,
    },
];

const helpTopics = ['لاگ اِن مسئلہ', 'فیس / مالیات', 'اساتذہ / عملہ', 'اسٹور مینجمنٹ', 'رپورٹس', 'دیگر'];

const initialFormData = {
    topic: '',
    priority: 'normal',
    message: '',
};

export const Support = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const notify = useNotifier();

    const session = getAdminSession();
    const admin = session?.admin || {};

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSuccess('');
        setError('');
        setIsSubmitting(true);

        try {
            const savedRequest = await createSupportRequest(formData);
            const emailText = savedRequest?.emailStatus === 'sent'
                ? ' اور ای میل بھی بھیج دی گئی ہے۔'
                : ' ای میل سیٹنگ مکمل نہ ہونے کی وجہ سے صرف ڈیٹا بیس میں محفوظ ہوئی ہے۔';
            const successMessage = `آپ کی سپورٹ درخواست محفوظ کر لی گئی ہے${emailText}`;

            setSuccess(successMessage);
            notify.success(successMessage, 'سپورٹ درخواست محفوظ ہو گئی');
            setFormData(initialFormData);
        } catch (submitError) {
            const errorMessage = submitError?.message || 'سپورٹ درخواست محفوظ نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔';
            setError(errorMessage);
            notify.error(errorMessage, 'محفوظ کرنے میں مسئلہ');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 p-2 animate-in fade-in duration-700" dir="rtl">
            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_340px] lg:items-center">
                    <div className="text-right">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[var(--color-primary)]">
                            <HelpCircle size={18} />
                            سپورٹ سینٹر
                        </div>
                        <h1 className="text-3xl font-black text-[var(--color-text-main)] md:text-4xl">مدد اور رہنمائی</h1>
                        <p className="mt-4 max-w-3xl text-base font-bold leading-8 text-[var(--color-text-muted)]">
                            سسٹم کے استعمال، خرابی، اکاؤنٹ، رپورٹس یا کسی بھی فیچر کے بارے میں مدد کے لیے یہاں سے رابطہ کریں۔
                        </p>
                    </div>

                    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-black text-[var(--color-text-main)]">سپورٹ کیفیت</p>
                                <p className="mt-2 text-xs font-bold text-[var(--color-text-muted)]">عام طور پر جواب: 24 گھنٹے</p>
                            </div>
                            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                <ShieldCheck size={26} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {supportChannels.map((channel) => {
                    const Icon = channel.icon;
                    return (
                        <div key={channel.title} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="text-right">
                                    <h2 className="text-xl font-black text-[var(--color-text-main)]">{channel.title}</h2>
                                    <p className="mt-2 text-sm font-black text-[var(--color-primary)]" dir="ltr">{channel.value}</p>
                                    <p className="mt-4 text-sm font-bold leading-7 text-[var(--color-text-muted)]">{channel.description}</p>
                                </div>
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                    <Icon size={22} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                <form onSubmit={handleSubmit} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
                    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 text-[var(--color-primary)]">
                            <Send size={20} />
                            <h2 className="text-2xl font-black">سپورٹ درخواست</h2>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right">
                            <div className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">جمع کروانے والا</div>
                            <div className="mt-1 text-sm font-black text-[var(--color-text-main)]">{admin.name || admin.username || 'Admin'}</div>
                            <div className="text-xs font-bold text-[var(--color-text-muted)]" dir="ltr">{admin.email || '---'}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">موضوع</label>
                            <select
                                value={formData.topic}
                                onChange={(event) => setFormData((prev) => ({ ...prev, topic: event.target.value }))}
                                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                                required
                            >
                                <option value="">موضوع منتخب کریں</option>
                                {helpTopics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">اہمیت</label>
                            <select
                                value={formData.priority}
                                onChange={(event) => setFormData((prev) => ({ ...prev, priority: event.target.value }))}
                                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                            >
                                <option value="normal">عام</option>
                                <option value="urgent">فوری</option>
                                <option value="critical">انتہائی ضروری</option>
                            </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">تفصیل</label>
                            <textarea
                                value={formData.message}
                                onChange={(event) => setFormData((prev) => ({ ...prev, message: event.target.value }))}
                                rows={5}
                                required
                                placeholder="اپنا مسئلہ یا سوال یہاں درج کریں"
                                className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-4 text-right text-sm font-bold leading-7 text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>
                    </div>

                    {success ? <p className="mt-5 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-black text-[var(--color-primary)]">{success}</p> : null}
                    {error ? <p className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-black text-red-400">{error}</p> : null}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-6 inline-flex h-12 items-center justify-center gap-3 rounded-2xl bg-[var(--color-primary)] px-7 text-sm font-black text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'محفوظ ہو رہی ہے...' : 'درخواست محفوظ کریں'}
                        <Send size={18} />
                    </button>
                </form>

                <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        <Sparkles size={22} />
                    </div>
                    <h2 className="text-2xl font-black text-[var(--color-text-main)]">مددگار نکات</h2>
                    <div className="mt-5 space-y-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                        <p>درخواست میں صفحہ کا نام، مسئلے کا وقت اور مختصر تفصیل ضرور لکھیں۔</p>
                        <p>اگر کوئی error آ رہا ہو تو اس کا اسکرین شاٹ بھی محفوظ رکھیں۔</p>
                        <p>فوری مسئلے کے لیے فون یا واٹس ایپ سپورٹ استعمال کریں۔</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
