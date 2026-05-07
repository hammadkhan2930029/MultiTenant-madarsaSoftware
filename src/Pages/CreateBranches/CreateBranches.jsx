import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Edit2, Hash, MapPin, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { createBranch, deactivateBranch, getBranches, updateBranch } from '../../Constant/AcademicSetupApi';

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
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const totalActiveBranches = useMemo(
        () => branches.filter((branch) => branch.status === 'active').length,
        [branches],
    );

    const loadBranches = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getBranches('page=1&limit=100');
            setBranches(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'Branches load nahi ho sakin.');
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
            setError('Branch name zaroori hai.');
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
                setSuccess('Branch update ho gayi.');
            } else {
                await createBranch(payload);
                setSuccess('Branch create ho gayi.');
            }

            resetForm();
            await loadBranches();
        } catch (saveError) {
            setError(saveError.message || 'Branch save nahi ho saki.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivate = async (branchId) => {
        setError('');
        setSuccess('');

        try {
            await deactivateBranch(branchId);
            setSuccess('Branch inactive kar di gayi.');
            await loadBranches();
        } catch (actionError) {
            setError(actionError.message || 'Branch inactive nahi ho saki.');
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
                    <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)]">کل فعال برانچز: {totalActiveBranches}</p>
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

                    {error ? <MessageBox tone="error" message={error} /> : null}
                    {success ? <MessageBox tone="success" message={success} /> : null}

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
                            {editMode ? 'اپڈیٹ' : 'محفوظ کریں'}
                            {editMode ? <Save size={18} /> : <Plus size={18} />}
                        </button>
                    </div>
                </div>
            ) : null}

            {error && !isFormOpen ? <MessageBox tone="error" message={error} /> : null}
            {success && !isFormOpen ? <MessageBox tone="success" message={success} /> : null}

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="text-[var(--color-text-muted)]">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">برانچ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کوڈ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">پتہ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">اسٹیٹس</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        Branches load ho rahi hain...
                                    </td>
                                </tr>
                            ) : filteredBranches.length ? (
                                filteredBranches.map((branch) => (
                                    <tr key={branch.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{branch.name}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{branch.code || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{branch.address || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-xl px-3 py-1 text-xs font-black ${branch.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {branch.status === 'active' ? 'فعال' : 'غیر فعال'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-start gap-2">
                                                <button
                                                    onClick={() => handleEdit(branch)}
                                                    className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivate(branch.id)}
                                                    disabled={branch.status === 'inactive'}
                                                    className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        Koi branch record nahi mila.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, value, onChange, placeholder, icon }) => (
    <div className="space-y-2">
        <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
            {label}
        </label>
        <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">{icon}</div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
            />
        </div>
    </div>
);

const MessageBox = ({ tone, message }) => (
    <div className={`mt-6 rounded-2xl px-4 py-3 text-sm font-bold ${tone === 'error' ? 'border border-red-500/20 bg-red-500/10 text-red-400' : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>
        {message}
    </div>
);
