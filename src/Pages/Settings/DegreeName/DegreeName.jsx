import React, { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Plus, Edit2, Trash2, FileCheck, Award, BookOpen, X } from 'lucide-react';
import { InputField } from '../../../Components/HR/FormElements';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { createQualification, deleteQualification, getQualifications, updateQualification } from '../../../Constant/QualificationApi';

const emptyForm = {
    title: '',
    category: '',
    level: '',
};

export const QualificationManagement = () => {
    const [qualifications, setQualifications] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editMode, setEditMode] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const loadQualifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const result = await getQualifications('page=1&limit=100');
            setQualifications(result.items || []);
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
        setEditMode(null);
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            setError('سند / ڈگری کا نام ضروری ہے۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                title: formData.title.trim(),
                category: formData.category.trim(),
                level: formData.level.trim(),
            };

            if (editMode) {
                await updateQualification(editMode, payload);
                setSuccess('تعلیمی سند کامیابی سے اپڈیٹ ہو گئی۔');
            } else {
                await createQualification(payload);
                setSuccess('نئی تعلیمی سند کامیابی سے شامل ہو گئی۔');
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
        });
        setEditMode(qualification.id);
        setError('');
        setSuccess('');
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

    return (
        <div className="space-y-8 animate-in fade-in duration-700 lg:pt-0 md:pt-0 pt-6" dir="rtl">
            <div className="flex flex-row justify-between items-center gap-6 bg-[var(--color-surface)] p-4 md:p-6 rounded-[3rem] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] border border-[var(--color-border)]">
                <div>
                    <h1 style={{ color: 'var(--color-text-main)' }} className="text-2xl font-black">تعلیمی اسناد کی ترتیب</h1>
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-sm font-medium mt-7">تعلیمی ڈگریوں اور سرٹیفکیٹس کے نام یہاں رجسٹر کریں</p>
                </div>
                <div style={{ backgroundColor: 'var(--color-primary)' }} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#00d094]/20">
                    <GraduationCap size={24} />
                </div>
            </div>

            <div
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                className="border rounded-[2.5rem] p-6 md:p-8 shadow-sm"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <InputField
                            type="text"
                            label={'سند / ڈگری کا نام'}
                            required
                            placeholder="مثلاً: بی ایس سی ایس"
                            value={formData.title}
                            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <InputField
                            type="text"
                            label={'کیٹیگری'}
                            placeholder="مثلاً: گریجویشن"
                            value={formData.category}
                            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <InputField
                            type="text"
                            label={'تعلیمی لیول'}
                            placeholder="مثلاً: 16 سالہ تعلیم"
                            value={formData.level}
                            onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 md:flex-row">
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        style={{ backgroundColor: 'var(--color-primary)' }}
                        className="w-full md:w-auto px-10 py-4 rounded-2xl text-white font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#00d094]/20 disabled:opacity-70"
                    >
                        <Plus size={20} />
                        <span>{isSaving ? 'محفوظ ہو رہا ہے...' : editMode ? 'سند اپڈیٹ کریں' : 'نئی سند شامل کریں'}</span>
                    </button>
                    {editMode ? (
                        <button
                            onClick={resetForm}
                            disabled={isSaving}
                            className="w-full md:w-auto px-8 py-4 rounded-2xl font-black bg-[var(--color-input)] text-[var(--color-text-muted)] disabled:opacity-70"
                        >
                            منسوخ کریں
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isLoading ? (
                    <div
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        className="border rounded-[2rem] p-5 text-center text-sm font-bold text-[var(--color-text-muted)]"
                    >
                        تعلیمی اسناد لوڈ ہو رہی ہیں...
                    </div>
                ) : qualifications.length > 0 ? (
                    qualifications.map((edu) => (
                        <div
                            key={edu.id}
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                            className="group border rounded-[2rem] p-5 flex items-center justify-between hover:border-[var(--color-primary)] transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center gap-5">
                                <div style={{ backgroundColor: 'var(--color-input)' }} className="w-14 h-14 rounded-2xl flex items-center justify-center text-[var(--color-primary)] group-hover:scale-110 transition-transform">
                                    <FileCheck size={26} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--color-text-main)' }} className="font-bold text-lg">
                                        {edu.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 mt-1">
                                        <span style={{ color: 'var(--color-text-muted)' }} className="text-xs flex items-center gap-1 font-medium">
                                            <BookOpen size={12} /> {edu.category || '-'}
                                        </span>
                                        <span style={{ color: 'var(--color-text-muted)' }} className="text-xs flex items-center gap-1 font-medium">
                                            <Award size={12} /> {edu.level || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
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
                        </div>
                    ))
                ) : (
                    <div
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
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
