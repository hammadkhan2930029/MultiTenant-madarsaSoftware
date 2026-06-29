import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit3, FileText, Printer, RefreshCcw, Search, Trash2, X } from 'lucide-react';
import { getClasses, getSessions, getSubjects } from '../../Constant/AcademicSetupApi';
import { deleteExamSchedule, getExamSchedules, updateExamSchedule } from '../../Constant/ExamSchedulesApi';
import { getAdminSession } from '../../Constant/AdminAuth';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';

const text = {
    title: 'امتحانی شیڈول فہرست',
    subtitle: 'تمام بنائے گئے امتحانی شیڈول یہاں دیکھیں، ترمیم کریں، حذف کریں یا پرنٹ کریں',
    searchPlaceholder: 'امتحان، مضمون، کلاس، نگران یا کمرہ تلاش کریں...',
    allSessions: 'تمام سیشن',
    allClasses: 'تمام کلاسیں',
    loading: 'شیڈول لوڈ ہو رہا ہے...',
    empty: 'ابھی کوئی امتحانی شیڈول موجود نہیں',
    edit: 'ترمیم',
    delete: 'حذف',
    print: 'پرنٹ',
    save: 'تبدیلی محفوظ کریں',
    saving: 'محفوظ ہو رہا ہے...',
    cancel: 'بند کریں',
    deleted: 'شیڈول حذف کر دیا گیا۔',
    updated: 'شیڈول اپڈیٹ ہو گیا۔',
    loadError: 'امتحانی شیڈول لوڈ نہیں ہو سکا۔',
    required: 'براہ کرم امتحان، سیشن، کلاس، مضمون، تاریخ اور وقت مکمل کریں۔',
};

const today = () => new Date().toISOString().split('T')[0];
const activeOnly = (items) => (items || []).filter((item) => !item.status || item.status === 'active');
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('ur-PK') : '---');
const toDateInputValue = (value) => (value ? new Date(value).toISOString().split('T')[0] : '');

const createEmptyForm = () => ({
    examName: '',
    sessionId: '',
    classId: '',
    subjectId: '',
    examDate: today(),
    startTime: '',
    endTime: '',
    totalMarks: '',
    room: '',
    invigilator: '',
    notes: '',
});

const mapScheduleFromApi = (schedule) => ({
    id: schedule.id,
    examName: schedule.examName || '',
    sessionId: String(schedule.session?.id || ''),
    classId: String(schedule.class?.id || ''),
    subjectId: String(schedule.subject?.id || ''),
    examDate: toDateInputValue(schedule.examDate),
    startTime: schedule.startTime || '',
    endTime: schedule.endTime || '',
    totalMarks: schedule.totalMarks ? String(schedule.totalMarks) : '',
    room: schedule.room || '',
    invigilator: schedule.invigilator || '',
    notes: schedule.notes || '',
    sessionName: schedule.session?.name || '',
    className: schedule.class?.name || '',
    subjectName: schedule.subject?.name || '',
});

const buildPayload = (formData) => ({
    examName: formData.examName.trim(),
    sessionId: Number(formData.sessionId),
    classId: Number(formData.classId),
    subjectId: Number(formData.subjectId),
    examDate: formData.examDate,
    startTime: formData.startTime.trim(),
    endTime: formData.endTime.trim(),
    totalMarks: formData.totalMarks ? Number(formData.totalMarks) : undefined,
    room: formData.room.trim() || undefined,
    invigilator: formData.invigilator.trim() || undefined,
    notes: formData.notes.trim() || undefined,
    status: 'active',
});

const isValidForm = (formData) =>
    formData.examName.trim() &&
    formData.sessionId &&
    formData.classId &&
    formData.subjectId &&
    formData.examDate &&
    formData.startTime &&
    formData.endTime;

export const ExamScheduleIndex = () => {
    const [schedules, setSchedules] = useState([]);
    const [classOptions, setClassOptions] = useState([]);
    const [sessionOptions, setSessionOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [filters, setFilters] = useState({ search: '', classId: '', sessionId: '' });
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [editForm, setEditForm] = useState(createEmptyForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    useNotificationBridge({ error, success: message });

    const filteredSchedules = useMemo(() => {
        const query = filters.search.trim().toLowerCase();
        return schedules.filter((schedule) => {
            const searchOk = !query || [
                schedule.examName,
                schedule.sessionName,
                schedule.className,
                schedule.subjectName,
                schedule.invigilator,
                schedule.room,
            ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
            const classOk = !filters.classId || String(schedule.classId) === String(filters.classId);
            const sessionOk = !filters.sessionId || String(schedule.sessionId) === String(filters.sessionId);
            return searchOk && classOk && sessionOk;
        });
    }, [filters, schedules]);

    const loadData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [classesResult, sessionsResult, subjectsResult, schedulesResult] = await Promise.all([
                getClasses('page=1&limit=100'),
                getSessions('page=1&limit=100'),
                getSubjects('page=1&limit=100'),
                getExamSchedules('page=1&limit=100&status=active'),
            ]);
            setClassOptions(activeOnly(classesResult.items));
            setSessionOptions(activeOnly(sessionsResult.items));
            setSubjectOptions(activeOnly(subjectsResult.items));
            setSchedules((schedulesResult.items || []).map(mapScheduleFromApi));
        } catch (loadError) {
            setError(loadError.message || text.loadError);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openEdit = (schedule) => {
        setMessage('');
        setError('');
        setEditTarget(schedule);
        setEditForm({
            examName: schedule.examName,
            sessionId: schedule.sessionId,
            classId: schedule.classId,
            subjectId: schedule.subjectId,
            examDate: schedule.examDate,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            totalMarks: schedule.totalMarks,
            room: schedule.room,
            invigilator: schedule.invigilator,
            notes: schedule.notes,
        });
    };

    const handleUpdate = async (event) => {
        event.preventDefault();
        if (!editTarget) return;
        setMessage('');
        setError('');

        if (!isValidForm(editForm)) {
            setError(text.required);
            return;
        }

        setIsSaving(true);
        try {
            const updatedSchedule = await updateExamSchedule(editTarget.id, buildPayload(editForm));
            const mappedSchedule = mapScheduleFromApi(updatedSchedule);
            setSchedules((current) => current.map((item) => (item.id === mappedSchedule.id ? mappedSchedule : item)));
            setEditTarget(null);
            setMessage(text.updated);
        } catch (updateError) {
            setError(updateError.message || text.loadError);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeletingId(deleteTarget.id);
        setMessage('');
        setError('');
        try {
            await deleteExamSchedule(deleteTarget.id);
            setSchedules((current) => current.filter((item) => item.id !== deleteTarget.id));
            setDeleteTarget(null);
            setMessage(text.deleted);
        } catch (deleteError) {
            setError(deleteError.message || text.loadError);
        } finally {
            setDeletingId(null);
        }
    };

    const buildTimetableRows = (items) => items
        .slice()
        .sort((a, b) => `${a.examDate} ${a.startTime}`.localeCompare(`${b.examDate} ${b.startTime}`))
        .map((schedule, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${formatDate(schedule.examDate)}</td>
                <td>${new Date(schedule.examDate).toLocaleDateString('ur-PK', { weekday: 'long' })}</td>
                <td>${schedule.subjectName || ''}</td>
                <td dir="ltr">${schedule.startTime} - ${schedule.endTime}</td>
                <td>${schedule.totalMarks || ''}</td>
                <td>${schedule.room || ''}</td>
                <td>${schedule.invigilator || ''}</td>
                <td>${schedule.notes || ''}</td>
            </tr>
        `).join('');

    const handlePrint = (targetSchedule = null) => {
        const profile = getAdminSession()?.madrassaProfile || {};
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) return;

        const printItems = targetSchedule
            ? schedules.filter((schedule) => String(schedule.classId) === String(targetSchedule.classId) && String(schedule.sessionId) === String(targetSchedule.sessionId))
            : filteredSchedules;
        const sample = targetSchedule || printItems[0] || {};
        const rows = buildTimetableRows(printItems);

        printWindow.document.write(`
            <!doctype html>
            <html lang="ur" dir="rtl">
                <head>
                    <meta charset="utf-8" />
                    <title>Exam Schedule</title>
                    <style>
                        body { font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif; direction: rtl; padding: 28px; color: #111827; }
                        .header { text-align: center; margin-bottom: 18px; }
                        h1 { margin: 0; font-size: 28px; }
                        p { margin: 6px 0 0; color: #4b5563; }
                        .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
                        .meta div { border: 1px solid #d1d5db; border-radius: 10px; padding: 10px; font-weight: 700; }
                        .meta span { color: #047857; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #d1d5db; padding: 10px; text-align: right; }
                        th { background: #064e3b; color: #ffffff; }
                        tr:nth-child(even) td { background: #f8fafc; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${profile.name || 'امتحانی شیڈول'}</h1>
                        <p>${profile.address || ''}</p>
                        <p>کلاس وائز امتحانی ٹائم ٹیبل</p>
                    </div>
                    <div class="meta">
                        <div>امتحان: <span>${sample.examName || '---'}</span></div>
                        <div>سیشن: <span>${sample.sessionName || '---'}</span></div>
                        <div>کلاس: <span>${sample.className || '---'}</span></div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>تاریخ</th>
                                <th>دن</th>
                                <th>مضمون</th>
                                <th>وقت</th>
                                <th>نمبر</th>
                                <th>کمرہ</th>
                                <th>نگران</th>
                                <th>نوٹ</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="9">کوئی شیڈول موجود نہیں</td></tr>'}</tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] p-3 text-[var(--color-text-main)] font-urdu md:p-6" dir="rtl">
            <div className="mx-auto max-w-7xl space-y-5">
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-[var(--color-primary)] md:text-3xl">{text.title}</h1>
                            <p className="mt-5 text-sm font-bold text-[var(--color-text-muted)]">{text.subtitle}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={loadData} type="button" className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-xs font-black">
                                <RefreshCcw size={16} /> ریفریش
                            </button>
                            <button onClick={() => handlePrint()} type="button" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-xs font-black text-[#0b1120]">
                                <Printer size={16} /> {text.print}
                            </button>
                        </div>
                    </div>
                </div>

                {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-bold text-rose-400">{error}</div> : null}
                {message ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-400">{message}</div> : null}

                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                        <div className="relative lg:col-span-6">
                            <Search size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <input
                                value={filters.search}
                                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                                placeholder={text.searchPlaceholder}
                                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] pr-11 pl-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>
                        <select value={filters.sessionId} onChange={(event) => setFilters((prev) => ({ ...prev, sessionId: event.target.value }))} className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none lg:col-span-3">
                            <option value="">{text.allSessions}</option>
                            {sessionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <select value={filters.classId} onChange={(event) => setFilters((prev) => ({ ...prev, classId: event.target.value }))} className="h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none lg:col-span-3">
                            <option value="">{text.allClasses}</option>
                            {classOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
                    {isLoading ? (
                        <div className="p-10 text-center text-sm font-black text-[var(--color-text-muted)]">{text.loading}</div>
                    ) : filteredSchedules.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] text-right text-sm">
                                <thead className="bg-[var(--color-bg)] text-xs font-black text-[var(--color-text-muted)]">
                                    <tr>
                                        <th className="p-4">امتحان</th>
                                        <th className="p-4">سیشن</th>
                                        <th className="p-4">کلاس</th>
                                        <th className="p-4">مضمون</th>
                                        <th className="p-4">تاریخ</th>
                                        <th className="p-4">وقت</th>
                                        <th className="p-4">نمبر</th>
                                        <th className="p-4">کمرہ / نگران</th>
                                        <th className="p-4 text-center">ایکشن</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {filteredSchedules.map((schedule) => (
                                        <tr key={schedule.id} className="transition-colors hover:bg-[var(--color-bg)]/50">
                                            <td className="p-4 font-black text-[var(--color-primary)]">{schedule.examName}</td>
                                            <td className="p-4 font-bold">{schedule.sessionName || '---'}</td>
                                            <td className="p-4 font-bold">{schedule.className || '---'}</td>
                                            <td className="p-4 font-bold">{schedule.subjectName || '---'}</td>
                                            <td className="p-4 font-bold">{formatDate(schedule.examDate)}</td>
                                            <td className="p-4 font-bold" dir="ltr">{schedule.startTime} - {schedule.endTime}</td>
                                            <td className="p-4 font-bold">{schedule.totalMarks || '---'}</td>
                                            <td className="p-4">
                                                <div className="font-bold">{schedule.room || '---'}</div>
                                                <div className="mt-1 text-xs text-[var(--color-text-muted)]">{schedule.invigilator || '---'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <IconButton label={text.print} onClick={() => handlePrint(schedule)}><Printer size={16} /></IconButton>
                                                    <IconButton label={text.edit} onClick={() => openEdit(schedule)}><Edit3 size={16} /></IconButton>
                                                    <IconButton label={text.delete} tone="danger" disabled={deletingId === schedule.id} onClick={() => setDeleteTarget(schedule)}><Trash2 size={16} /></IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                            <FileText size={30} className="text-[var(--color-primary)]" />
                            <p className="mt-3 text-sm font-black text-[var(--color-text-muted)]">{text.empty}</p>
                        </div>
                    )}
                </div>
            </div>

            {editTarget ? (
                <EditModal
                    formData={editForm}
                    setFormData={setEditForm}
                    sessionOptions={sessionOptions}
                    classOptions={classOptions}
                    subjectOptions={subjectOptions}
                    isSaving={isSaving}
                    onClose={() => setEditTarget(null)}
                    onSubmit={handleUpdate}
                />
            ) : null}

            {deleteTarget ? (
                <DeleteModal
                    schedule={deleteTarget}
                    isDeleting={deletingId === deleteTarget.id}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}
        </div>
    );
};

const IconButton = ({ children, label, tone = 'default', disabled, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={label}
        aria-label={label}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:opacity-50 ${
            tone === 'danger'
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white'
                : 'bg-emerald-500/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[#0b1120]'
        }`}
    >
        {children}
    </button>
);

const EditModal = ({ formData, setFormData, sessionOptions, classOptions, subjectOptions, isSaving, onClose, onSubmit }) => {
    const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3" dir="rtl">
            <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl">
                <div className="mb-5 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                    <div className="flex items-center gap-3">
                        <CalendarDays className="text-[var(--color-primary)]" size={22} />
                        <h2 className="text-xl font-black">شیڈول ترمیم</h2>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg)]">
                        <X size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormInput label="امتحان کا نام" value={formData.examName} onChange={(value) => updateField('examName', value)} className="md:col-span-3" required />
                    <FormSelect label="سیشن" value={formData.sessionId} onChange={(value) => updateField('sessionId', value)} options={sessionOptions} required />
                    <FormSelect label="کلاس" value={formData.classId} onChange={(value) => updateField('classId', value)} options={classOptions} required />
                    <FormSelect label="مضمون" value={formData.subjectId} onChange={(value) => updateField('subjectId', value)} options={subjectOptions} required />
                    <FormInput label="تاریخ" type="date" value={formData.examDate} onChange={(value) => updateField('examDate', value)} required />
                    <FormInput label="شروع وقت" type="time" value={formData.startTime} onChange={(value) => updateField('startTime', value)} required />
                    <FormInput label="اختتام وقت" type="time" value={formData.endTime} onChange={(value) => updateField('endTime', value)} required />
                    <FormInput label="کل نمبر" type="number" value={formData.totalMarks} onChange={(value) => updateField('totalMarks', value)} />
                    <FormInput label="کمرہ" value={formData.room} onChange={(value) => updateField('room', value)} />
                    <FormInput label="نگران" value={formData.invigilator} onChange={(value) => updateField('invigilator', value)} />
                    <div className="md:col-span-3">
                        <FieldLabel>نوٹ</FieldLabel>
                        <textarea value={formData.notes} onChange={(event) => updateField('notes', event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 py-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button type="submit" disabled={isSaving} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-black text-[#0b1120] disabled:opacity-60">
                        {isSaving ? text.saving : text.save}
                    </button>
                    <button type="button" onClick={onClose} className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-black">
                        {text.cancel}
                    </button>
                </div>
            </form>
        </div>
    );
};

const DeleteModal = ({ schedule, isDeleting, onClose, onConfirm }) => (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
            <div className="flex items-start justify-between gap-4">
                <div className="text-right">
                    <h3 className="text-xl font-black text-[var(--color-text)]">شیڈول حذف کرنے کی تصدیق</h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                        کیا آپ واقعی <span className="text-rose-500">{schedule.examName}</span> کو حذف کرنا چاہتے ہیں؟
                        یہ عمل واپس نہیں ہو گا۔
                    </p>
                    <p className="mt-3 text-xs font-bold leading-6 text-[var(--color-text-muted)]">
                        {schedule.className || '---'} / {schedule.subjectName || '---'} ۔ <span dir="ltr">{schedule.startTime} - {schedule.endTime}</span>
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => !isDeleting && onClose()}
                    className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="mt-8 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    منسوخ کریں
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isDeleting}
                    className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isDeleting ? 'حذف ہو رہی ہے...' : 'تصدیق کریں'}
                </button>
            </div>
        </div>
    </div>
);

const FieldLabel = ({ children, required = false }) => (
    <label className="mb-2 mr-2 block text-[11px] font-black text-[var(--color-text-muted)]">
        {children}{required ? <span className="text-red-500"> *</span> : null}
    </label>
);

const FormInput = ({ label, value, onChange, type = 'text', icon, className = '', required = false }) => (
    <div className={className}>
        <FieldLabel required={required}>{label}</FieldLabel>
        <div className="relative">
            {icon ? <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">{icon}</span> : null}
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                dir={type === 'time' ? 'ltr' : undefined}
                className={`h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)] ${type === 'time' ? 'exam-native-time text-left font-sans text-[var(--color-text-main)]' : ''} ${icon ? 'pr-10' : ''}`}
            />
        </div>
    </div>
);

const FormSelect = ({ label, value, onChange, options, required = false }) => (
    <div>
        <FieldLabel required={required}>{label}</FieldLabel>
        <select value={value} onChange={(event) => onChange(event.target.value)} required={required} className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]">
            <option value="">منتخب کریں</option>
            {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
    </div>
);


