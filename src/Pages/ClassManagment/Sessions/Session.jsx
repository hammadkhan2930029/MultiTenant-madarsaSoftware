import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Edit2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { createSession, deleteSession, getSessions, updateSession } from '../../../Constant/AcademicSetupApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { ExportExcelButton } from '../../../Components/Export/ExportExcelButton';
import { BRANCH_CONTEXT_UPDATED_EVENT } from '../../../Constant/AdminAuth';
import StatusBadge from '../../../Components/Common/StatusBadge';
import { DateField } from '../../../Components/HR/FormElements';

const emptyForm = {
    name: '',
    startDate: '',
    endDate: '',
    status: 'active',
};

const activeDuplicateMessage = 'درج کردہ معلومات پہلے سے موجود ہے۔ براہ کرام معلومات درست کیجیے۔';
const inactiveDuplicateMessage = 'درج کردہ معلومات پہلے سے موجود اور غیر فعال ہے۔ براہ کرام معلومات درست کیجیے۔';

const formatDateInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

export const CreateSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [formData, setFormData] = useState(emptyForm);
    const [editMode, setEditMode] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
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

    const loadSessions = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [activeResult, inactiveResult] = await Promise.all([
                getSessions('page=1&limit=100&status=active'),
                getSessions('page=1&limit=100&status=inactive'),
            ]);
            setSessions([...(activeResult.items || []), ...(inactiveResult.items || [])]);
        } catch (loadError) {
            setError(loadError.message || 'سیشنز کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, [statusFilter]);

    useEffect(() => {
        const handleBranchContextUpdated = () => {
            resetForm();
            loadSessions();
        };

        window.addEventListener(BRANCH_CONTEXT_UPDATED_EVENT, handleBranchContextUpdated);

        return () => {
            window.removeEventListener(BRANCH_CONTEXT_UPDATED_EVENT, handleBranchContextUpdated);
        };
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
            status: session.status || 'active',
        });
        setError('');
        setSuccess('');
        setIsFormOpen(true);
        scrollToForm();
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('سیشن نام درج کرنا ضروری ہے۔');
            return;
        }

        if (!formData.startDate) {
            setError('شروع تاریخ منتخب کرنا ضروری ہے۔');
            return;
        }

        if (!formData.endDate) {
            setError('اختتامی تاریخ منتخب کرنا ضروری ہے۔');
            return;
        }

        if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
            setError('سیشن کا نام، شروع کی تاریخ اور اختتامی تاریخ درج کرنا ضروری ہیں۔');
            return;
        }

        if (!editMode) {
            const normalizedName = formData.name.trim().toLowerCase();
            const existingSession = sessions.find(
                (session) => String(session.name || '').trim().toLowerCase() === normalizedName,
            );

            if (existingSession) {
                setError(existingSession.status === 'inactive' ? inactiveDuplicateMessage : activeDuplicateMessage);
                return;
            }
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                name: formData.name.trim(),
                startDate: formData.startDate,
                endDate: formData.endDate,
                ...(editMode ? { status: formData.status || 'active' } : {}),
            };

            if (editMode) {
                await updateSession(editMode, payload);
                setSuccess('سیشن کامیابی سے تبدیل ہو گیا ہے۔');
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

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setError('');
        setSuccess('');
        setIsDeleting(true);

        try {
            await deleteSession(deleteTarget.id);
            setSuccess('سیشن کامیابی سے حذف کر دیا گیا۔');
            if (editMode === deleteTarget.id) {
                resetForm();
            }
            setDeleteTarget(null);
            await loadSessions();
        } catch (actionError) {
            setError(actionError.message || 'سیشن حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredSessions = sessions.filter((session) => {
        if (session.status !== statusFilter) return false;
        const query = search.trim().toLowerCase();
        if (!query) return true;

        return [session.name, formatDateInput(session.startDate), formatDateInput(session.endDate)]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
    });

    const exportColumns = [
        { header: 'Session', accessor: 'name' },
        { header: 'Start Date', accessor: (session) => formatDateInput(session.startDate) },
        { header: 'End Date', accessor: (session) => formatDateInput(session.endDate) },
        { header: 'Status', accessor: (session) => session.status || '---' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <h2 className="text-3xl font-black tracking-tight text-[var(--color-text)]">تعلیمی سیشن</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل فہرست: {filteredSessions.length}</p>
                </div>

                <div className="flex w-full items-center flex-col gap-3 md:w-auto md:flex-row">
                    <ExportExcelButton rows={filteredSessions} columns={exportColumns} fileName="sessions-list" className="w-full md:w-auto" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold text-[var(--color-text)] outline-none md:min-w-40"
                    >
                        <option value="active">فعال</option>
                        <option value="inactive">غیر فعال</option>
                    </select>
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
                        className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-all ${isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white'
                            }`}
                    >
                        {isFormOpen ? 'بند کریں' : 'نیا سیشن'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div ref={formRef} className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                        <span className='text-3xl'>{editMode ? 'تبدیل کریں' : 'نیا سیشن اندراج'}</span>
                    </div>

                    <div className={`grid grid-cols-1 gap-6 ${editMode ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">سیشن نام<span className="text-red-500"> *</span></label>
                            <div className="relative">
                                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="مثلاً 2026-2027"
                                    className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                                />
                            </div>
                        </div>

                        <DateField className="[&>button]:h-14" label="شروع تاریخ" required value={formData.startDate} onChange={(value) => setFormData((prev) => ({ ...prev, startDate: value }))} />

                        <DateField className="[&>button]:h-14" label="اختتام تاریخ" required value={formData.endDate} onChange={(value) => setFormData((prev) => ({ ...prev, endDate: value }))} />

                        {editMode ? (
                            <div className="space-y-2">
                                <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">حالت<span className="text-red-500"> *</span></label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                                    className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                                >
                                    <option value="active">فعال</option>
                                    <option value="inactive">غیر فعال</option>
                                </select>
                            </div>
                        ) : null}
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
                    <table className="class-management-table w-full text-right">
                        <thead>
                            <tr className="text-[var(--color-text-muted)]">
                                <th className="w-[20%]  px-6 py-4 text-[11px] font-black uppercase tracking-widest">سیشن</th>
                                <th className="w-[20%]  px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">شروع تاریخ</th>
                                <th className="w-[20%]  px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">اختتام تاریخ</th>
                                <th className="w-[20%]  px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">حالت</th>
                                <th className="w-[20%]  px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">ایکشن</th>
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
                                        <td className="px-6 py-4 text-center align-middle font-black text-[var(--color-text)] ">{session.name}</td>
                                        <td className="px-6 py-4 text-center align-middle text-sm font-bold text-[var(--color-text-muted)]">{formatDateInput(session.startDate)}</td>
                                        <td className="px-6 py-4 text-center align-middle text-sm font-bold text-[var(--color-text-muted)]">{formatDateInput(session.endDate)}</td>
                                        <td className="px-6 py-4 text-center align-middle">
                                            <StatusBadge status={session.status} />
                                        </td>
                                        <td className="px-6 py-4 text-center align-middle flex justify-center">
                                            <div className="flex items-center justify-start gap-2">
                                                <button
                                                    onClick={() => handleEdit(session)}
                                                    className="rounded-xl   p-2.5 bg-blue-500/10 text-blue-500 transition-all hover:bg-[#00d094] hover:text-white"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(session)}
                                                    className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
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

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text)]">سیشن حذف کرنے کی تصدیق</h3>
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
