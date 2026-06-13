import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Users, Target, Shield } from 'lucide-react';
import { InputField } from '../../../Components/HR/FormElements';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { createDepartment, deleteDepartment, getDepartments, updateDepartment } from '../../../Constant/DepartmentApi';

const emptyForm = {
    name: '',
    code: '',
    head: '',
};

export const DepartmentManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editMode, setEditMode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const loadDepartments = useCallback(async () => {
        try {
            setIsLoading(true);
            const result = await getDepartments('page=1&limit=100');
            setDepartments(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'شعبہ جات لوڈ نہیں ہو سکے۔');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('ڈیپارٹمنٹ کا نام ضروری ہے۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                name: formData.name.trim(),
                code: formData.code.trim(),
                head: formData.head.trim(),
            };

            if (editMode) {
                await updateDepartment(editMode, payload);
                setSuccess('ڈیپارٹمنٹ کامیابی سے اپڈیٹ ہو گیا۔');
            } else {
                await createDepartment(payload);
                setSuccess('نیا ڈیپارٹمنٹ کامیابی سے شامل ہو گیا۔');
            }

            resetForm();
            await loadDepartments();
        } catch (saveError) {
            setError(saveError.message || 'ڈیپارٹمنٹ محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (department) => {
        setFormData({
            name: department.name || '',
            code: department.code || '',
            head: department.head || '',
        });
        setEditMode(department.id);
        setError('');
        setSuccess('');
    };

    const handleDelete = async (departmentId) => {
        const isConfirmed = window.confirm('کیا آپ واقعی اس ڈیپارٹمنٹ کو حذف کرنا چاہتے ہیں؟');
        if (!isConfirmed) return;

        try {
            setError('');
            setSuccess('');
            await deleteDepartment(departmentId);
            setSuccess('ڈیپارٹمنٹ کامیابی سے حذف ہو گیا۔');
            await loadDepartments();
        } catch (deleteError) {
            setError(deleteError.message || 'ڈیپارٹمنٹ حذف نہیں ہو سکا۔');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700  lg:pt-0 md:pt-0 pt-6" dir="rtl">

            <div className="flex flex-row justify-between items-center gap-6 bg-[var(--color-surface)] p-4 md:p-6 rounded-[3rem] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] border border-[var(--color-border)]">
                <div>
                    <h1 style={{ color: 'var(--color-text-main)' }} className="text-2xl font-black">ڈیپارٹمنٹ مینجمنٹ</h1>
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-sm font-medium mt-7">نئے شعبے بنائیں اور ٹیم کی ساخت کو منظم کریں</p>
                </div>
                <div style={{ backgroundColor: 'var(--color-primary)' }} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#00d094]/20">
                    <Building2 size={24} />
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
                            label={'ڈیپارٹمنٹ کا نام'}
                            required
                            placeholder="مثلاً: مارکیٹنگ"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <InputField
                            type="text"
                            label={'ڈیپارٹمنٹ کوڈ'}
                            placeholder="مثلاً: MKT"
                            value={formData.code}
                            onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <InputField
                            type="text"
                            label={'ڈیپارٹمنٹ ہیڈ'}
                            placeholder="نام درج کریں"
                            value={formData.head}
                            onChange={(e) => setFormData((prev) => ({ ...prev, head: e.target.value }))}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    style={{ backgroundColor: 'var(--color-primary)' }}
                    className="mt-8 w-full md:w-auto px-10 py-4 rounded-2xl text-white font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#00d094]/20 disabled:opacity-70"
                >
                    <Plus size={20} />
                    <span>{isSaving ? 'محفوظ ہو رہا ہے...' : editMode ? 'ڈیپارٹمنٹ اپڈیٹ کریں' : 'نیا ڈیپارٹمنٹ شامل کریں'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isLoading ? (
                    <div
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        className="border rounded-[2rem] p-5 text-center text-sm font-bold text-[var(--color-text-muted)]"
                    >
                        شعبہ جات لوڈ ہو رہے ہیں...
                    </div>
                ) : departments.length > 0 ? (
                    departments.map((dept) => (
                        <div
                            key={dept.id}
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                            className="group border rounded-[2rem] p-5 flex items-center justify-between hover:border-[var(--color-primary)] transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center gap-5">
                                <div style={{ backgroundColor: 'var(--color-input)' }} className="w-14 h-14 rounded-2xl flex items-center justify-center text-[var(--color-primary)] group-hover:scale-110 transition-transform">
                                    <Target size={26} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--color-text-main)' }} className="font-bold text-lg">
                                        {dept.name} <span className="text-[10px] opacity-50 px-2">#{dept.code || '-'}</span>
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 mt-1">
                                        <span style={{ color: 'var(--color-text-muted)' }} className="text-xs flex items-center gap-1 font-medium">
                                            <Shield size={12} /> ہیڈ: {dept.head || '-'}
                                        </span>
                                        <span style={{ color: 'var(--color-text-muted)' }} className="text-xs flex items-center gap-1 font-medium">
                                            <Users size={12} /> {dept.members || 0} ممبرز
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(dept)}
                                    className="p-3 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(dept.id)}
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
                        ابھی تک کوئی ڈیپارٹمنٹ شامل نہیں کیا گیا۔
                    </div>
                )}
            </div>
        </div>
    );
};
