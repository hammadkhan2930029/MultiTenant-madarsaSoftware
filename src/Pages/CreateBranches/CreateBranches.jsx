import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Edit2, Hash, MapPin, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { createBranch, deleteBranch, getBranches, updateBranch } from '../../Constant/AcademicSetupApi';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';

const emptyForm = {
    name: '',
    code: '',
    address: '',
};

export const CreateBranch = () => {
    const [branches, setBranches] = useState([]);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [editMode, setEditMode] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const totalBranches = useMemo(() => branches.length, [branches]);
    const isDefaultBranch = (branch) => branch?.name?.trim().toLowerCase() === 'main campus';

    const loadBranches = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getBranches('page=1&limit=100');
            setBranches(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'برانچز لوڈ نہیں ہو سکیں۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
        setIsFormOpen(false);
    };

    const handleEdit = (branch) => {
        setFormData({
            name: branch.name || '',
            code: branch.code || '',
            address: branch.address || '',
        });
        setEditMode(branch.id);
        setError('');
        setSuccess('');
        setIsFormOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('برانچ کا نام ضروری ہے۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                name: formData.name.trim(),
                code: formData.code.trim(),
                address: formData.address.trim(),
            };

            if (editMode) {
                await updateBranch(editMode, payload);
                setSuccess('برانچ کامیابی سے اپڈیٹ ہو گئی۔');
            } else {
                await createBranch(payload);
                setSuccess('نئی برانچ کامیابی سے شامل ہو گئی۔');
            }

            window.dispatchEvent(new Event('branches:updated'));
            resetForm();
            await loadBranches();
        } catch (saveError) {
            setError(saveError.message || 'برانچ محفوظ نہیں ہو سکی۔');
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
            await deleteBranch(deleteTarget.id);
            setSuccess('برانچ کامیابی سے حذف کر دی گئی۔');
            setDeleteTarget(null);
            window.dispatchEvent(new Event('branches:updated'));
            await loadBranches();
        } catch (deleteError) {
            setError(deleteError.message || 'برانچ حذف نہیں ہو سکی۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredBranches = branches.filter((branch) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;

        return [branch.name, branch.code, branch.address]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tight">برانچ مینجمنٹ</h2>
                    <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)]">کل برانچز: {totalBranches}</p>
                </div>

                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                    <div className="relative w-full md:w-72">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="برانچ تلاش کریں"
                            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none"
                        />
                    </div>

                    <button
                        onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
                        className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-all ${
                            isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white'
                        }`}
                    >
                        {isFormOpen ? 'بند کریں' : 'نئی برانچ'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                        <span>{editMode ? 'برانچ اپڈیٹ کریں' : 'نئی برانچ شامل کریں'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field
                            label="برانچ نام"
                            required
                            value={formData.name}
                            onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                            placeholder="مثلاً مین کیمپس"
                            icon={<Building2 size={18} />}
                        />
                        <Field
                            label="برانچ کوڈ"
                            value={formData.code}
                            onChange={(value) => setFormData((prev) => ({ ...prev, code: value }))}
                            placeholder="MC-01"
                            icon={<Hash size={18} />}
                        />
                    </div>

                    <div className="mt-6">
                        <Field
                            label="پتہ"
                            value={formData.address}
                            onChange={(value) => setFormData((prev) => ({ ...prev, address: value }))}
                            placeholder="مکمل پتہ درج کریں"
                            icon={<MapPin size={18} />}
                        />
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        {editMode ? (
                            <button onClick={resetForm} className="rounded-xl px-5 py-3 text-sm font-black text-[var(--color-text-muted)]">
                                منسوخ
                            </button>
                        ) : null}
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center gap-3 rounded-xl bg-[#218838] px-8 py-3 text-sm font-black text-white disabled:opacity-70"
                        >
                            {editMode ? 'تبدیل کریں' : 'محفوظ کریں'}
                            {editMode ? <Save size={18} /> : <Plus size={18} />}
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="text-[var(--color-text-muted)]">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">برانچ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کوڈ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">پتہ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        برانچز لوڈ ہو رہی ہیں...
                                    </td>
                                </tr>
                            ) : filteredBranches.length ? (
                                filteredBranches.map((branch) => (
                                    <tr key={branch.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{branch.name}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{branch.code || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{branch.address || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-start gap-2">
                                                <button
                                                    onClick={() => handleEdit(branch)}
                                                    className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"
                                                    title="برانچ ایڈٹ کریں"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {!isDefaultBranch(branch) ? (
                                                    <button
                                                        onClick={() => setDeleteTarget(branch)}
                                                        className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                                                        title="برانچ حذف کریں"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        کوئی برانچ ریکارڈ نہیں ملا۔
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
                                <h3 className="text-xl font-black text-[var(--color-text)]">برانچ حذف کرنے کی تصدیق</h3>
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

const Field = ({ label, value, onChange, placeholder, icon, required = false }) => (
    <div className="space-y-2">
        <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
            {label}{required ? <span className="text-red-500"> *</span> : null}
        </label>
        <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">{icon}</div>
            <input
                required={required}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
            />
        </div>
    </div>
);
