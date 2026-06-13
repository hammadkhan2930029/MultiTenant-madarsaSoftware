import React, { useCallback, useEffect, useState } from 'react';
import { Award, Edit2, Plus, Save, Trash2, X } from 'lucide-react';
import { createResultGrade, deleteResultGrade, getResultGrades, updateResultGrade } from '../../Constant/ResultGradesApi';

const emptyForm = {
    title: '',
    code: '',
    from: '',
    to: '',
};

export const ResultGradeScale = () => {
    const [grades, setGrades] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editId, setEditId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const sortGrades = (items) => (items || []).slice().sort((a, b) => Number(b.from) - Number(a.from));

    const loadGrades = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await getResultGrades('page=1&limit=100');
            setGrades(sortGrades(result.items));
        } catch (loadError) {
            setError(loadError.message || 'رینجز لوڈ نہیں ہو سکیں۔');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGrades();
    }, [loadGrades]);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditId(null);
        setError('');
    };

    const handleEdit = (grade) => {
        setFormData({
            title: grade.title || '',
            code: grade.code || '',
            from: String(grade.from ?? ''),
            to: String(grade.to ?? ''),
        });
        setEditId(grade.id);
        setError('');
        setSuccess('');
    };

    const handleDelete = async (id) => {
        setError('');
        setSuccess('');
        try {
            await deleteResultGrade(id);
            setGrades((current) => current.filter((grade) => grade.id !== id));
            if (editId === id) resetForm();
            setSuccess('رینج حذف کر دی گئی۔');
        } catch (deleteError) {
            setError(deleteError.message || 'رینج حذف نہیں ہو سکی۔');
        }
    };

    const handleSave = async () => {
        const title = formData.title.trim();
        const code = formData.code.trim();
        const from = Number(formData.from);
        const to = Number(formData.to);

        setError('');
        setSuccess('');

        if (!title || Number.isNaN(from) || Number.isNaN(to)) {
            setError('براہ کرم نام، شروع فیصد اور اختتامی فیصد درج کریں۔');
            return;
        }

        if (from < 0 || to > 100 || from > to) {
            setError('فیصد رینج 0 سے 100 کے درمیان ہونی چاہیے، اور شروع فیصد اختتام سے کم ہو۔');
            return;
        }

        const hasOverlap = grades.some((grade) => {
            if (grade.id === editId) return false;
            return from <= Number(grade.to) && to >= Number(grade.from);
        });

        if (hasOverlap) {
            setError('یہ فیصد رینج پہلے سے موجود کسی رینج سے ٹکرا رہی ہے۔');
            return;
        }

        const payload = { title, code, from, to };

        setIsSaving(true);
        try {
            const savedGrade = editId ? await updateResultGrade(editId, payload) : await createResultGrade(payload);
            setGrades((current) => sortGrades(editId ? current.map((grade) => (grade.id === editId ? savedGrade : grade)) : [...current, savedGrade]));
            setSuccess(editId ? 'رینج اپڈیٹ ہو گئی۔' : 'نئی رینج شامل ہو گئی۔');
            resetForm();
        } catch (saveError) {
            setError(saveError.message || 'رینج محفوظ نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-3 text-[var(--color-text-main)] font-urdu md:p-6" dir="rtl">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-500/10 p-3 text-[var(--color-primary)]">
                            <Award size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[var(--color-primary)] md:text-3xl">رزلٹ فیصد رینج</h1>
                            <p className="mt-5 text-sm font-bold text-[var(--color-text-muted)]">یہاں منتظم طے کرے گا کہ کس فیصد سے کس فیصد تک کون سا درجہ دکھانا ہے۔</p>
                        </div>
                    </div>
                </div>

                {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-bold text-rose-400">{error}</div> : null}
                {success ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-400">{success}</div> : null}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl lg:col-span-4">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-black">{editId ? 'رینج اپڈیٹ کریں' : 'نئی رینج شامل کریں'}</h2>
                            {editId ? (
                                <button type="button" onClick={resetForm} className="rounded-xl bg-rose-500/10 p-2 text-rose-500">
                                    <X size={18} />
                                </button>
                            ) : null}
                        </div>

                        <div className="space-y-4">
                            <FormField label="درجہ / نام">
                                <input
                                    value={formData.title}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                                    placeholder="مثلاً ممتاز، بہتر، جید"
                                    className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                />
                            </FormField>
                            <FormField label="گریڈ کوڈ">
                                <input
                                    value={formData.code}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                                    placeholder="مثلاً A+، A، B، C"
                                    dir="ltr"
                                    className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-left font-sans text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                />
                            </FormField>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="فیصد سے">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.from}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, from: event.target.value }))}
                                        placeholder="80"
                                        className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-center font-bold outline-none focus:border-[var(--color-primary)]"
                                    />
                                </FormField>
                                <FormField label="فیصد تک">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.to}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, to: event.target.value }))}
                                        placeholder="100"
                                        className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-center font-bold outline-none focus:border-[var(--color-primary)]"
                                    />
                                </FormField>
                            </div>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-black text-[#0b1120] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {editId ? <Save size={17} /> : <Plus size={17} />}
                                {isSaving ? 'محفوظ ہو رہا ہے...' : editId ? 'رینج اپڈیٹ کریں' : 'رینج شامل کریں'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl lg:col-span-8">
                        <div className="border-b border-[var(--color-border)] p-5">
                            <h2 className="text-lg font-black">موجودہ فیصد رینجز</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-right text-sm">
                                <thead className="bg-[var(--color-bg)] text-xs font-black text-[var(--color-text-muted)]">
                                    <tr>
                                        <th className="p-4">درجہ</th>
                                        <th className="p-4">گریڈ</th>
                                        <th className="p-4">فیصد سے</th>
                                        <th className="p-4">فیصد تک</th>
                                        <th className="p-4 text-center">ایکشن</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center font-black text-[var(--color-text-muted)]">لوڈ ہو رہا ہے...</td>
                                        </tr>
                                    ) : grades.length ? grades.map((grade) => (
                                        <tr key={grade.id}>
                                            <td className="p-4 font-black text-[var(--color-primary)]">{grade.title}</td>
                                            <td className="p-4 text-left font-sans font-black" dir="ltr" style={{ unicodeBidi: 'isolate' }}>{grade.code || '---'}</td>
                                            <td className="p-4 font-sans font-black">{grade.from}%</td>
                                            <td className="p-4 font-sans font-black">{grade.to}%</td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <button type="button" onClick={() => handleEdit(grade)} className="rounded-xl bg-emerald-500/10 p-2.5 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[#0b1120]">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(grade.id)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400 hover:bg-rose-500 hover:text-white">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center font-black text-[var(--color-text-muted)]">ابھی کوئی رینج موجود نہیں۔</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FormField = ({ label, children }) => (
    <label className="block">
        <span className="mb-2 mr-2 block text-[11px] font-black text-[var(--color-text-muted)]">{label}</span>
        {children}
    </label>
);
