import React, { useEffect, useMemo, useState } from 'react';
import { Book, Edit2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { createSubject, deleteSubject, getSubjects, updateSubject } from '../../../Constant/AcademicSetupApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

const emptyForm = {
    name: '',
    detail: '',
};

export const CreateSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editMode, setEditMode] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    const loadSubjects = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getSubjects('page=1&limit=100');
            setSubjects(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'مضامین کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSubjects();
    }, []);

    const resetForm = () => {
        setIsFormOpen(false);
        setEditMode(null);
        setFormData(emptyForm);
    };

    const handleEdit = (subject) => {
        setEditMode(subject.id);
        setFormData({
            name: subject.name || '',
            detail: subject.detail || '',
        });
        setError('');
        setSuccess('');
        setIsFormOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('مضمون کا نام درج کرنا ضروری ہے۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                name: formData.name.trim(),
                detail: formData.detail.trim(),
            };

            if (editMode) {
                await updateSubject(editMode, payload);
                setSuccess('مضمون کامیابی سے اپڈیٹ ہو گیا۔');
            } else {
                await createSubject(payload);
                setSuccess('مضمون کامیابی سے شامل ہو گیا۔');
            }

            resetForm();
            await loadSubjects();
        } catch (saveError) {
            setError(saveError.message || 'مضمون محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setError('');
        setSuccess('');
        setIsDeleting(true);

        try {
            await deleteSubject(deleteTarget.id);
            setSuccess('مضمون کامیابی سے حذف کر دیا گیا۔');
            if (editMode === deleteTarget.id) {
                resetForm();
            }
            setDeleteTarget(null);
            await loadSubjects();
        } catch (actionError) {
            setError(actionError.message || 'مضمون حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredSubjects = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return subjects;

        return subjects.filter((subject) =>
            [subject.name, subject.detail]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query)),
        );
    }, [subjects, search]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col items-center justify-between gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm backdrop-blur-sm md:flex-row">
                <div className="text-right">
                    <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">مضامین کی فہرست</h2>
                    <p className="mt-4 text-right text-sm font-medium text-[var(--color-text-muted)]">کل ریکارڈ: {filteredSubjects.length}</p>
                </div>

                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                    <div className="relative md:w-72">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="مضمون تلاش کریں"
                            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none"
                        />
                    </div>

                    <button
                        onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
                        className={`flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-black shadow-lg transition-all active:scale-95 ${
                            isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white shadow-emerald-500/20'
                        }`}
                    >
                        {isFormOpen ? 'بند کریں' : 'نیا مضمون شامل کریں'}
                        {isFormOpen ? <X size={20} /> : <Plus size={20} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div className="animate-in slide-in-from-top rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl duration-500">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                        <span>{editMode ? 'مضمون تبدیل کریں' : 'نیا مضمون'}</span>
                    </div>

                    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
                        <div className="space-y-2 text-right">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">مضمون کا نام : *</label>
                            <input
                                type="text"
                                value={formData.name}
                                placeholder="نام درج کریں"
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                className="h-[64px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 pb-2 pt-1 text-right text-lg font-bold leading-[2.5] text-[var(--color-text)] outline-none transition-all focus:border-[#00d094] focus:ring-4 focus:ring-[#00d094]/5"
                            />
                        </div>

                        <div className="space-y-2 text-right">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">تفصیل / کوڈ</label>
                            <input
                                type="text"
                                value={formData.detail}
                                placeholder="مزید تفصیل"
                                onChange={(e) => setFormData((prev) => ({ ...prev, detail: e.target.value }))}
                                className="h-[64px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 pb-2 pt-1 text-right text-lg font-bold leading-[2.5] text-[var(--color-text)] outline-none transition-all focus:border-[#00d094] focus:ring-4 focus:ring-[#00d094]/5"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        {editMode ? (
                            <button onClick={resetForm} className="rounded-xl px-6 py-4 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)]">
                                کینسل
                            </button>
                        ) : null}
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center gap-3 rounded-xl bg-[#218838] px-10 py-4 text-sm font-black text-white shadow-xl shadow-green-900/20 transition-all disabled:opacity-70 hover:bg-[#1a6d2c]"
                        >
                            {editMode ? 'تبدیل کریں' : 'اندراج کریں'}
                            {editMode ? <Save size={20} /> : <Plus size={20} />}
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="text-[var(--color-text-muted)]">
                                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest">مضمون</th>
                                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest">تفصیل</th>
                                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest">اسٹیٹس</th>
                                <th className="px-6 py-4 pr-12 text-start text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        مضامین کی فہرست لوڈ ہو رہی ہے...
                                    </td>
                                </tr>
                            ) : filteredSubjects.length ? (
                                filteredSubjects.map((sub) => (
                                    <tr key={sub.id} className={`border-t border-[var(--color-border)]/60 ${editMode === sub.id ? 'ring-2 ring-[#00d094]' : ''}`}>
                                        <td className="px-6 py-4 text-right font-black text-[var(--color-text)]">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text-muted)]">
                                                    <Book size={16} />
                                                </div>
                                                <span>{sub.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-[var(--color-text-muted)]">{sub.detail || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-xl px-3 py-1 text-xs font-black ${sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {sub.status === 'active' ? 'فعال' : 'غیر فعال'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-start gap-2">
                                                <button
                                                    onClick={() => setDeleteTarget(sub)}
                                                    className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(sub)}
                                                    className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] shadow-sm transition-all hover:bg-[#00d094] hover:text-white"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        کوئی مضمون ریکارڈ نہیں ملا۔
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text)]">مضمون حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                    کیا آپ واقعی <span className="text-rose-500">{deleteTarget.name}</span> کو حذف کرنا چاہتے ہیں؟
                                    یہ عمل واپس نہیں ہو گا۔
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !isDeleting && setDeleteTarget(null)}
                                className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                منسوخ کریں
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isDeleting ? 'حذف ہو رہی ہے...' : 'تصدیق کریں'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
