import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Plus, Edit2, Trash2, X, Save, Sun, Moon, Coffee } from 'lucide-react';
import { InputField, SelectField } from '../../../Components/HR/FormElements';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { createShift, deleteShift, getShifts, updateShift } from '../../../Constant/ShiftApi';

const emptyForm = {
    name: '',
    startTime: '',
    endTime: '',
    type: 'Morning',
};

const shiftTypeOptions = [
    { label: 'مارننگ', value: 'Morning' },
    { label: 'آفٹرنون', value: 'Afternoon' },
    { label: 'ایوننگ', value: 'Evening' },
    { label: 'کسٹم', value: 'Custom' },
];

const formatTime = (value) => {
    if (!value) return '--';

    const [hoursString, minutes] = value.split(':');
    const hours = Number(hoursString);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;

    return `${String(normalizedHours).padStart(2, '0')}:${minutes} ${suffix}`;
};

const getShiftIcon = (type) => {
    if (type === 'Morning') return <Sun size={26} />;
    if (type === 'Afternoon') return <Coffee size={26} />;
    return <Moon size={26} />;
};

export const ShiftManagement = () => {
    const [shifts, setShifts] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editMode, setEditMode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
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

    const loadShifts = useCallback(async () => {
        try {
            setIsLoading(true);
            const result = await getShifts('page=1&limit=100');
            setShifts(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'شفٹس لوڈ نہیں ہو سکیں۔');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadShifts();
    }, [loadShifts]);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
    };

    const handleEdit = (shift) => {
        setFormData({
            name: shift.name || '',
            startTime: shift.startTime || '',
            endTime: shift.endTime || '',
            type: shift.type || 'Morning',
        });
        setEditMode(shift.id);
        setError('');
        setSuccess('');
        scrollToForm();
    };

    const handleSubmit = async () => {
        if (formData.startTime && !formData.endTime) {
            setError('اختتامی وقت منتخب کرنا ضروری ہے۔ شروع وقت کے ساتھ اختتامی وقت بھی منتخب کریں۔');
            return;
        }

        if (!formData.startTime && formData.endTime) {
            setError('شروع وقت منتخب کرنا ضروری ہے۔ اختتامی وقت کے ساتھ شروع وقت بھی منتخب کریں۔');
            return;
        }

        if (!formData.name.trim()) {
            setError('شفٹ کا نام ضروری ہے۔');
            return;
        }

        if (!formData.startTime || !formData.endTime) {
            setError('شفٹ کے اوقات درج کریں۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                name: formData.name.trim(),
                startTime: formData.startTime,
                endTime: formData.endTime,
                type: formData.type,
            };

            if (editMode) {
                await updateShift(editMode, payload);
                setSuccess('شفٹ کامیابی سے اپڈیٹ ہو گئی۔');
            } else {
                await createShift(payload);
                setSuccess('نئی شفٹ کامیابی سے شامل ہو گئی۔');
            }

            resetForm();
            await loadShifts();
        } catch (saveError) {
            setError(saveError.message || 'شفٹ محفوظ نہیں ہو سکی۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setIsDeleting(true);
            setError('');
            setSuccess('');
            await deleteShift(deleteTarget.id);
            setSuccess('شفٹ کامیابی سے حذف کر دی گئی۔');
            if (editMode === deleteTarget.id) resetForm();
            setDeleteTarget(null);
            await loadShifts();
        } catch (deleteError) {
            setError(deleteError.message || 'شفٹ حذف نہیں ہو سکی۔');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 lg:pt-0 md:pt-0 pt-6" dir="rtl">
            <div className="flex flex-row justify-between items-center gap-6 bg-[var(--color-surface)] p-4 md:p-6 rounded-[3rem] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] border border-[var(--color-border)]">
                <div>
                    <h1 style={{ color: 'var(--color-text-main)' }} className="text-2xl font-black">شفٹ کا انتظام</h1>
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-sm font-medium mt-7">نئی شفٹس بنائیں اور اوقات کو منظم کریں</p>
                </div>
                <div style={{ backgroundColor: 'var(--color-primary)' }} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#00d094]/20">
                    <Clock size={24} />
                </div>
            </div>

            <div
                ref={formRef}
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                className="border rounded-[2.5rem] p-6 md:p-8 shadow-sm"
            >
                <div className="mb-6 flex items-center gap-2 font-black text-[var(--color-primary)]">
                    {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                    <span>{editMode ? 'شفٹ اپڈیٹ کریں' : 'نئی شفٹ شامل کریں'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                        type="text"
                        label="شفٹ کا نام"
                        required
                        placeholder="مثلاً: مارننگ شفٹ"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <SelectField
                        label="شفٹ کی قسم"
                        required
                        options={shiftTypeOptions}
                        value={formData.type}
                        onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                    />
                    <InputField
                        type="time"
                        label="شروع ہونے کا وقت"
                        required
                        value={formData.startTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                    <InputField
                        type="time"
                        label="ختم ہونے کا وقت"
                        required
                        value={formData.endTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                </div>

                <div className="mt-8 flex flex-wrap justify-end gap-3">
                    {editMode ? (
                        <button
                            onClick={resetForm}
                            className="rounded-2xl border border-[var(--color-border)] px-6 py-4 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)]"
                        >
                            منسوخ
                        </button>
                    ) : null}
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        style={{ backgroundColor: 'var(--color-primary)' }}
                        className="px-10 py-4 rounded-2xl text-white font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#00d094]/20 disabled:opacity-70"
                    >
                        {editMode ? <Save size={20} /> : <Plus size={20} />}
                        <span>{isSaving ? 'محفوظ ہو رہی ہے...' : editMode ? 'تبدیل کریں' : 'نئی شفٹ شامل کریں'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isLoading ? (
                    <div className="col-span-full rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                        شفٹس لوڈ ہو رہی ہیں...
                    </div>
                ) : shifts.length > 0 ? (
                    shifts.map((shift) => (
                        <div
                            key={shift.id}
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                            className="group border rounded-[2rem] p-5 flex items-center justify-between hover:border-[var(--color-primary)] transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center gap-5">
                                <div style={{ backgroundColor: 'var(--color-input)' }} className="w-14 h-14 rounded-2xl flex items-center justify-center text-[var(--color-primary)] group-hover:scale-110 transition-transform">
                                    {getShiftIcon(shift.type)}
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--color-text-main)' }} className="font-bold text-lg">{shift.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span style={{ color: 'var(--color-text-muted)', unicodeBidi: 'isolate' }} dir="ltr" className="text-xs flex items-center gap-1 font-medium">
                                            <Clock size={12} /> {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs font-bold text-[var(--color-text-muted)]">{shift.type}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(shift)}
                                    className="p-3 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(shift)}
                                    className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                        ابھی تک کوئی شفٹ شامل نہیں کی گئی۔
                    </div>
                )}
            </div>

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text)]">شفٹ حذف کرنے کی تصدیق</h3>
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
