import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Edit2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { createSession, deactivateSession, getSessions, updateSession } from '../../../Constant/AcademicSetupApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

const emptyForm = {
    name: '',
    startDate: '',
    endDate: '',
};

const formatDateInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

export const CreateSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [editMode, setEditMode] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    const totalSessions = useMemo(() => sessions.length, [sessions]);

    const loadSessions = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await getSessions('page=1&limit=100');
            setSessions(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'سیشنز کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
        setIsFormOpen(false);
    };

    const handleEdit = (session) => {
        setEditMode(session.id);
        setFormData({
            name: session.name || '',
            startDate: formatDateInput(session.startDate),
            endDate: formatDateInput(session.endDate),
        });
        setError('');
        setSuccess('');
        setIsFormOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
            setError('سیشن کا نام، شروع کی تاریخ اور اختتامی تاریخ درج کرنا ضروری ہیں۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                name: formData.name.trim(),
                startDate: formData.startDate,
                endDate: formData.endDate,
            };

            if (editMode) {
                await updateSession(editMode, payload);
                setSuccess('سیشن کامیابی سے اپڈیٹ ہو گیا۔');
            } else {
                await createSession(payload);
                setSuccess('سیشن کامیابی سے شامل ہو گیا۔');
            }

            resetForm();
            await loadSessions();
        } catch (saveError) {
            setError(saveError.message || 'سیشن محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivate = async (sessionId) => {
        setError('');
        setSuccess('');

        try {
            await deactivateSession(sessionId);
            setSuccess('سیشن غیر فعال کر دیا گیا۔');
            await loadSessions();
        } catch (actionError) {
            setError(actionError.message || 'سیشن غیر فعال نہیں ہو سکا۔');
        }
    };

    const filteredSessions = sessions.filter((session) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;

        return [session.name, formatDateInput(session.startDate), formatDateInput(session.endDate)]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tight">تعلیمی سیشن</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل ریکارڈ: {totalSessions}</p>
                </div>

                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                    <div className="relative md:w-72">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="سیشن تلاش کریں"
                            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none"
                        />
                    </div>

                    <button
                        onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
                        className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-all ${
                            isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white'
                        }`}
                    >
                        {isFormOpen ? 'بند کریں' : 'نیا سیشن'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                        <span>{editMode ? 'سیشن اپڈیٹ کریں' : 'نیا سیشن اندراج'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">سیشن نام</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="مثلاً 2026-2027"
                                    className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">شروع تاریخ</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">اختتام تاریخ</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                            />
                        </div>
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
                            {editMode ? 'اپڈیٹ' : 'محفوظ کریں'}
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
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">سیشن</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">شروع تاریخ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">اختتام تاریخ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">اسٹیٹس</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        سیشنز کی فہرست لوڈ ہو رہی ہے...
                                    </td>
                                </tr>
                            ) : filteredSessions.length ? (
                                filteredSessions.map((session) => (
                                    <tr key={session.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{session.name}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{formatDateInput(session.startDate)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{formatDateInput(session.endDate)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-xl px-3 py-1 text-xs font-black ${session.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {session.status === 'active' ? 'فعال' : 'غیر فعال'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-start gap-2">
                                                <button
                                                    onClick={() => handleEdit(session)}
                                                    className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivate(session.id)}
                                                    disabled={session.status === 'inactive'}
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
                                        کوئی سیشن ریکارڈ نہیں ملا۔
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
