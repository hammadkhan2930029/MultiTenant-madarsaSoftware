import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GraduationCap, Plus, Edit2, Trash2, Award, BookOpen, X, Save } from 'lucide-react';
import { InputField } from '../../../Components/HR/FormElements';
import { MultipleEntryRows } from '../../../Components/Common/MultipleEntryRows';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { createQualification, deleteQualification, getQualifications, updateQualification } from '../../../Constant/QualificationApi';
import StatusBadge from '../../../Components/Common/StatusBadge';

const emptyForm = {
    title: '',
    category: '',
    level: '',
    status: 'active',
};

const createEmptyQualificationRow = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...emptyForm,
});

export const QualificationManagement = () => {
    const [qualifications, setQualifications] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [qualificationRows, setQualificationRows] = useState([createEmptyQualificationRow()]);
    const [editMode, setEditMode] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const formRef = useRef(null);

    useNotificationBridge({ error, success });

    const scrollToForm = () => {
        window.setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    const loadQualifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const [activeResult, inactiveResult] = await Promise.all([
                getQualifications('page=1&limit=100&status=active'),
                getQualifications('page=1&limit=100&status=inactive'),
            ]);
            setQualifications([...(activeResult.items || []), ...(inactiveResult.items || [])]);
        } catch (loadError) {
            setError(loadError.message || 'تعلیمی اسناد لوڈ نہیں ہو سکیں۔');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQualifications();
    }, [loadQualifications]);

    const resetForm = () => {
        setFormData(emptyForm);
        setQualificationRows([createEmptyQualificationRow()]);
        setEditMode(null);
    };

    const handleSubmit = async () => {
        const rowsToSave = editMode ? [formData] : qualificationRows;

        if (rowsToSave.some((row) => !row.title.trim())) {
            setError('سند / ڈگری کا نام ضروری ہے۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            if (editMode) {
                const payload = {
                    title: formData.title.trim(),
                    category: formData.category.trim(),
                    level: formData.level.trim(),
                    status: formData.status,
                };
                await updateQualification(editMode, payload);
                setSuccess('تعلیمی سند کامیابی سے تبدیل ہو گئی ہے۔');
            } else {
                await Promise.all(rowsToSave.map((row) => createQualification({
                    title: row.title.trim(),
                    category: row.category.trim(),
                    level: row.level.trim(),
                })));
                setSuccess('نئی تعلیمی اسناد کامیابی سے شامل ہو گئیں۔');
            }

            resetForm();
            await loadQualifications();
        } catch (saveError) {
            setError(saveError.message || 'تعلیمی سند محفوظ نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (qualification) => {
        setFormData({
            title: qualification.title || '',
            category: qualification.category || '',
            level: qualification.level || '',
            status: qualification.status || 'active',
        });
        setEditMode(qualification.id);
        setError('');
        setSuccess('');
        scrollToForm();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setIsDeleting(true);
            setError('');
            setSuccess('');
            await deleteQualification(deleteTarget.id);
            setSuccess('تعلیمی سند کامیابی سے حذف ہو گئی۔');
            if (editMode === deleteTarget.id) resetForm();
            setDeleteTarget(null);
            await loadQualifications();
        } catch (deleteError) {
            setError(deleteError.message || 'تعلیمی سند حذف نہیں ہو سکی۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const addQualificationRow = () => {
        setQualificationRows((prev) => [...prev, createEmptyQualificationRow()]);
    };

    const removeQualificationRow = (rowId) => {
        setQualificationRows((prev) => (
            prev.length === 1 ? prev : prev.filter((row) => row.id !== rowId)
        ));
    };

    const updateQualificationRow = (rowId, field, value) => {
        setQualificationRows((prev) => prev.map((row) => (
            row.id === rowId ? { ...row, [field]: value } : row
        )));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 lg:pt-0 md:pt-0 pt-6" dir="rtl">
            <div className="flex items-center gap-3 bg-[var(--color-surface)] p-4 md:p-6 rounded-[3rem] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] border border-[var(--color-border)]">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-[var(--color-primary)]">
                    <GraduationCap size={24} />
                </div>
                <div>
                    <h1 style={{ color: 'var(--color-text-main)' }} className="text-3xl font-black">تعلیمی اسناد کا انتظام</h1>
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-sm font-medium mt-5">تعلیمی ڈگریوں اور سرٹیفکیٹس کے نام یہاں رجسٹر کریں</p>
                </div>
            </div>

            <div
                ref={formRef}
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                className="border rounded-[2.5rem] p-6 md:p-8 shadow-sm"
            >
                <div className="mb-6 flex items-center gap-2 font-black text-[var(--color-primary)]">
                    {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                    <span>{editMode ? 'تعلیمی سند تبدیل کریں' : 'نئی تعلیمی سند شامل کریں'}</span>
                </div>
                {editMode ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <InputField
                            type="text"
                            label={'سند / ڈگری کا نام'}
                            required
                            placeholder="مثلاً: بی ایس سی ایس"
                            value={formData.title}
                            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        />
                        <InputField
                            type="text"
                            label={'قسم'}
                            placeholder="مثلاً: گریجویشن"
                            value={formData.category}
                            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        />
                        <InputField
                            type="text"
                            label={'تعلیمی لیول'}
                            placeholder="مثلاً: 16 سالہ تعلیم"
                            value={formData.level}
                            onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[var(--color-text-muted)]">حالت</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                                className="h-[58px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            >
                                <option value="active">فعال</option>
                                <option value="inactive">غیر فعال</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    <MultipleEntryRows
                        rows={qualificationRows}
                        onAdd={addQualificationRow}
                        onRemove={removeQualificationRow}
                        disabled={isSaving}
                        addLabel="نئی تعلیمی سند شامل کریں"
                        removeLabel="تعلیمی سند حذف کریں"
                        rowClassName="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-start"
                        actionsClassName="flex items-center justify-end gap-2 pt-0 xl:pt-8"
                        addButtonClassName="grid h-[58px] w-[58px] place-items-center rounded-2xl bg-[#00d094] text-white shadow-lg shadow-[#00d094]/20 transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                        removeButtonClassName="grid h-[58px] w-[58px] place-items-center rounded-2xl bg-rose-500/10 text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        renderFields={(row) => (
                            <>
                                <InputField
                                    type="text"
                                    label={'سند / ڈگری کا نام'}
                                    required
                                    placeholder="مثلاً: بی ایس سی ایس"
                                    value={row.title}
                                    onChange={(e) => updateQualificationRow(row.id, 'title', e.target.value)}
                                />
                                <InputField
                                    type="text"
                                    label={'قسم'}
                                    placeholder="مثلاً: گریجویشن"
                                    value={row.category}
                                    onChange={(e) => updateQualificationRow(row.id, 'category', e.target.value)}
                                />
                                <InputField
                                    type="text"
                                    label={'تعلیمی لیول'}
                                    placeholder="مثلاً: 16 سالہ تعلیم"
                                    value={row.level}
                                    onChange={(e) => updateQualificationRow(row.id, 'level', e.target.value)}
                                />
                            </>
                        )}
                    />
                )}

                <div className="mt-8 flex flex-wrap justify-end gap-3">
                    {editMode ? (
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={isSaving}
                            className="h-[58px] rounded-2xl border border-[var(--color-border)] px-6 text-base font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:opacity-70"
                        >
                            منسوخ
                        </button>
                    ) : null}
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        style={{ backgroundColor: 'var(--color-primary)' }}
                        className="h-[58px] px-10 rounded-2xl text-white text-base font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#00d094]/20 disabled:opacity-70"
                    >
                        {editMode ? <Save size={20} /> : <Plus size={20} />}
                        <span>{isSaving ? 'محفوظ ہو رہا ہے...' : editMode ? 'تبدیل کریں' : 'محفوظ کریں'}</span>
                    </button>
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                {isLoading ? (
                    <div
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                        }}
                        className="border rounded-[2rem] p-5 text-center text-sm font-bold text-[var(--color-text-muted)]"
                    >
                        تعلیمی اسناد لوڈ ہو رہی ہیں...
                    </div>
                ) : qualifications.length > 0 ? (
                    <div style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        className="border rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="w-full overflow-x-auto">
                            <table dir="rtl" className="settings-management-table w-full min-w-[800px] table-fixed">
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor: 'var(--color-bg)',
                                            borderColor: 'var(--color-border)',
                                        }}
                                        className="border-b"
                                    >
                                        <th
                                            style={{ color: 'var(--color-text-muted)' }}
                                            className="w-[25%] px-6 py-4 text-center text-sm font-bold"
                                        >
                                            تعلیمی سند
                                        </th>

                                        <th
                                            style={{ color: 'var(--color-text-muted)' }}
                                            className="w-[25%] px-6 py-4 text-center text-sm font-bold"
                                        >
                                            قسم
                                        </th>

                                        <th
                                            style={{ color: 'var(--color-text-muted)' }}
                                            className="w-[25%] px-6 py-4 text-center text-sm font-bold"
                                        >
                                           تعلیمی لیول
                                        </th>

                                        <th
                                            style={{ color: 'var(--color-text-muted)' }}
                                            className="w-[25%] px-6 py-4 text-center text-sm font-bold"
                                        >
                                            حالت
                                        </th>

                                        <th
                                            style={{ color: 'var(--color-text-muted)' }}
                                            className="w-[25%] px-6 py-4 text-center text-sm font-bold"
                                        >
                                         ایکشن
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="font-bold text-[var(--color-text-main)]">
                                    {qualifications.map((edu) => (
                                        <tr
                                            key={edu.id}
                                            style={{
                                                backgroundColor: 'var(--color-surface)',
                                                borderColor: 'var(--color-border)',
                                            }}
                                            className="group border-b last:border-b-0 hover:bg-[var(--color-input)] transition-all"
                                        >
                                            {/* Qualification */}
                                            <td className="px-6 py-4 text-center font-bold text-[var(--color-text-main)]">
                                                <div>
                                                    <span
                                                        style={{ color: 'var(--color-text-main)' }}
                                                        className="font-bold text-lg"
                                                    >
                                                        {edu.title}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-6 py-4 text-center font-bold text-[var(--color-text-main)]">
                                                <div
                                                    style={{ color: 'var(--color-text-main)' }}
                                                    className="flex items-center justify-center gap-2 text-sm font-medium"
                                                >
                                                    <BookOpen size={15} />
                                                    <span>{edu.category || '-'}</span>
                                                </div>
                                            </td>

                                            {/* Level */}
                                            <td className="px-6 py-4 text-center font-bold text-[var(--color-text-main)]">
                                                <div
                                                    style={{ color: 'var(--color-text-main)' }}
                                                    className="flex items-center justify-center gap-2 text-sm font-medium"
                                                >
                                                    <Award size={15} />
                                                    <span>{edu.level || '-'}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={edu.status} />
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(edu)}
                                                        className="p-3 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() => setDeleteTarget(edu)}
                                                        className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                        }}
                        className="border rounded-[2rem] p-5 text-center text-sm font-bold text-[var(--color-text-muted)]"
                    >
                        ابھی تک کوئی تعلیمی سند شامل نہیں کی گئی۔
                    </div>
                )}
            </div>

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text-main)]">تعلیمی سند حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                    کیا آپ واقعی <span className="text-rose-500">{deleteTarget.title}</span> کو حذف کرنا چاہتے ہیں؟
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
                                منسوخ
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
