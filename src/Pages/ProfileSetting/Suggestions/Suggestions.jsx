import React, { useState } from 'react';
import { Lightbulb, ListChecks, MessageSquarePlus, Send, Sparkles, ThumbsUp } from 'lucide-react';
import { createSuggestion } from '../../../Constant/SuggestionsApi';
import { getAdminSession } from '../../../Constant/AdminAuth';
import { useNotifier } from '../../../Components/Notifications/useNotifier';

const suggestionTypes = ['نیا فیچر', 'بہتری کی تجویز', 'رپورٹ / پرنٹ', 'UI / ڈیزائن', 'رفتار / کارکردگی', 'دیگر'];

const suggestionCards = [
    {
        title: 'عملی تجویز',
        description: 'وہ تجویز لکھیں جو روزمرہ کام کو آسان، تیز یا واضح بنائے۔',
        icon: Lightbulb,
    },
    {
        title: 'ترجیح بتائیں',
        description: 'تجویز کتنی اہم ہے، اس سے ٹیم کو کام ترتیب دینے میں مدد ملتی ہے۔',
        icon: ListChecks,
    },
    {
        title: 'واضح مثال',
        description: 'اگر ممکن ہو تو بتائیں کہ یہ فیچر کس صفحے یا عمل میں چاہیے۔',
        icon: ThumbsUp,
    },
];

const initialFormData = {
    type: '',
    title: '',
    priority: 'normal',
    description: '',
};

export const Suggestions = () => {
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
            const savedSuggestion = await createSuggestion(formData);
            const emailText = savedSuggestion?.emailStatus === 'sent'
                ? ' اور ای میل بھی بھیج دی گئی ہے۔'
                : ' ای میل سیٹنگ مکمل نہ ہونے کی وجہ سے صرف ڈیٹا بیس میں محفوظ ہوئی ہے۔';

            const successMessage = `آپ کی تجویز محفوظ کر لی گئی ہے${emailText}`;
            setSuccess(successMessage);
            notify.success(successMessage, 'تجویز محفوظ ہو گئی');
            setFormData(initialFormData);
        } catch (submitError) {
            const errorMessage = submitError?.message || 'تجویز محفوظ نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔';
            setError(errorMessage);
            notify.error(errorMessage, 'محفوظ کرنے میں مسئلہ');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 p-2 animate-in fade-in duration-700" dir="rtl">
            <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-right">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-[var(--color-primary)]">
                            <MessageSquarePlus size={18} />
                            تجاویز
                        </div>
                        <h1 className="text-3xl font-black text-[var(--color-text-main)] md:text-4xl">اپنی تجویز شامل کریں</h1>
                        <p className="mt-4 max-w-3xl text-base font-bold leading-8 text-[var(--color-text-muted)]">
                            سسٹم کو بہتر بنانے، نئے فیچرز شامل کرنے یا کسی موجودہ عمل کو آسان بنانے کے لیے اپنی رائے یہاں درج کریں۔
                        </p>
                    </div>
                    <div className="grid h-20 w-20 place-items-center rounded-[2rem] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        <Sparkles size={34} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {suggestionCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.title} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                <Icon size={22} />
                            </div>
                            <h2 className="text-xl font-black text-[var(--color-text-main)]">{card.title}</h2>
                            <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">{card.description}</p>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-[var(--color-primary)]">
                        <Send size={20} />
                        <h2 className="text-2xl font-black">تجویز فارم</h2>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right">
                        <div className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">جمع کروانے والا</div>
                        <div className="mt-1 text-sm font-black text-[var(--color-text-main)]">{admin.name || admin.username || 'Admin'}</div>
                        <div className="text-xs font-bold text-[var(--color-text-muted)]" dir="ltr">{admin.email || '---'}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">تجویز کی قسم</label>
                        <select
                            value={formData.type}
                            onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}
                            required
                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                        >
                            <option value="">قسم منتخب کریں</option>
                            {suggestionTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">ترجیح</label>
                        <select
                            value={formData.priority}
                            onChange={(event) => setFormData((prev) => ({ ...prev, priority: event.target.value }))}
                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                        >
                            <option value="normal">عام</option>
                            <option value="important">اہم</option>
                            <option value="urgent">فوری</option>
                        </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">عنوان</label>
                        <input
                            value={formData.title}
                            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                            required
                            placeholder="مثلاً: فیس رپورٹ میں نیا فلٹر"
                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="mr-2 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">تفصیل</label>
                        <textarea
                            value={formData.description}
                            onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                            rows={6}
                            required
                            placeholder="اپنی تجویز مکمل تفصیل کے ساتھ درج کریں"
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
                    {isSubmitting ? 'محفوظ ہو رہی ہے...' : 'تجویز محفوظ کریں'}
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};
