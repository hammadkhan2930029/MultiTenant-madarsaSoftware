import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Edit3, FileText, Layers, Plus, Printer, Search, Trash2, Users, X } from 'lucide-react';
import { DateField } from '../../Components/HR/FormElements';
import { getClasses, getSessions, getSubjects } from '../../Constant/AcademicSetupApi';
import { createExamSchedule, deleteExamSchedule, getExamSchedules, updateExamSchedule } from '../../Constant/ExamSchedulesApi';
import { getAdminSession } from '../../Constant/AdminAuth';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';

const text = {
    title: '\u0627\u0645\u062a\u062d\u0627\u0646\u06cc \u0634\u06cc\u0688\u0648\u0644',
    subtitle: '\u06a9\u0644\u0627\u0633\u060c \u0645\u0636\u0645\u0648\u0646 \u0627\u0648\u0631 \u0648\u0642\u062a \u06a9\u06d2 \u0633\u0627\u062a\u06be \u0627\u0645\u062a\u062d\u0627\u0646\u06cc \u067e\u0631\u0686\u06d2 \u0634\u06cc\u0688\u0648\u0644 \u06a9\u0631\u06cc\u06ba',
    formTitle: '\u0646\u06cc\u0627 \u0634\u06cc\u0688\u0648\u0644',
    listTitle: '\u0628\u0646\u0627\u06cc\u0627 \u06af\u06cc\u0627 \u0634\u06cc\u0688\u0648\u0644',
    examName: '\u0627\u0645\u062a\u062d\u0627\u0646 \u06a9\u0627 \u0646\u0627\u0645',
    examNamePlaceholder: '\u0645\u062b\u0644\u0627\u064b \u0633\u0627\u0644\u0627\u0646\u06c1 \u0627\u0645\u062a\u062d\u0627\u0646',
    session: '\u0633\u06cc\u0634\u0646',
    class: '\u06a9\u0644\u0627\u0633',
    subject: '\u0645\u0636\u0645\u0648\u0646',
    date: '\u062a\u0627\u0631\u06cc\u062e',
    startTime: '\u0634\u0631\u0648\u0639 \u0648\u0642\u062a',
    endTime: '\u0627\u062e\u062a\u062a\u0627\u0645 \u0648\u0642\u062a',
    marks: '\u06a9\u0644 \u0646\u0645\u0628\u0631',
    room: '\u06a9\u0645\u0631\u06c1',
    invigilator: '\u0646\u06af\u0631\u0627\u0646',
    notes: '\u0646\u0648\u0679',
    select: '\u0645\u0646\u062a\u062e\u0628 \u06a9\u0631\u06cc\u06ba',
    save: '\u0634\u06cc\u0688\u0648\u0644 \u0645\u062d\u0641\u0648\u0638 \u06a9\u0631\u06cc\u06ba',
    update: 'تبدیلی محفوظ کریں',
    updated: 'امتحانی شیڈول اپڈیٹ ہو گیا۔',
    cancelEdit: 'ترمیم منسوخ کریں',
    saving: '\u0645\u062d\u0641\u0648\u0638 \u06c1\u0648 \u0631\u06c1\u0627 \u06c1\u06d2...',
    print: 'پرنٹ',
    required: '\u0628\u0631\u0627\u06c1 \u06a9\u0631\u0645 \u0627\u0645\u062a\u062d\u0627\u0646\u060c \u0633\u06cc\u0634\u0646\u060c \u06a9\u0644\u0627\u0633\u060c \u0645\u0636\u0645\u0648\u0646\u060c \u062a\u0627\u0631\u06cc\u062e \u0627\u0648\u0631 \u0648\u0642\u062a \u0645\u06a9\u0645\u0644 \u06a9\u0631\u06cc\u06ba\u06d4',
    saved: '\u0627\u0645\u062a\u062d\u0627\u0646\u06cc \u0634\u06cc\u0688\u0648\u0644 \u0645\u062d\u0641\u0648\u0638 \u06c1\u0648 \u06af\u06cc\u0627\u06d4',
    deleted: '\u0634\u06cc\u0688\u0648\u0644 \u062d\u0630\u0641 \u06a9\u0631 \u062f\u06cc\u0627 \u06af\u06cc\u0627\u06d4',
    loadError: '\u0628\u0646\u06cc\u0627\u062f\u06cc \u0688\u06cc\u0679\u0627 \u0644\u0648\u0688 \u0646\u06c1\u06cc\u06ba \u06c1\u0648 \u0633\u06a9\u0627\u06d4',
    loading: '\u0634\u06cc\u0688\u0648\u0644 \u0644\u0648\u0688 \u06c1\u0648 \u0631\u06c1\u0627 \u06c1\u06d2...',
    total: '\u06a9\u0644 \u0634\u06cc\u0688\u0648\u0644',
    today: '\u0622\u062c \u06a9\u06d2 \u067e\u0631\u0686\u06d2',
    classes: '\u06a9\u0644\u0627\u0633\u06cc\u06ba',
    search: '\u062a\u0644\u0627\u0634',
    searchPlaceholder: '\u0627\u0645\u062a\u062d\u0627\u0646\u060c \u0645\u0636\u0645\u0648\u0646 \u06cc\u0627 \u06a9\u0644\u0627\u0633...',
    allClasses: '\u062a\u0645\u0627\u0645 \u06a9\u0644\u0627\u0633\u06cc\u06ba',
    allSessions: '\u062a\u0645\u0627\u0645 \u0633\u06cc\u0634\u0646',
    emptyTitle: '\u0627\u0628\u06be\u06cc \u06a9\u0648\u0626\u06cc \u0634\u06cc\u0688\u0648\u0644 \u0646\u06c1\u06cc\u06ba',
    emptyText: '\u0627\u0648\u067e\u0631 \u0641\u0627\u0631\u0645 \u0633\u06d2 \u067e\u06c1\u0644\u0627 \u0627\u0645\u062a\u062d\u0627\u0646\u06cc \u0634\u06cc\u0688\u0648\u0644 \u0628\u0646\u0627\u0626\u06cc\u06ba\u06d4',
};

const activeOnly = (items) => (items || []).filter((item) => !item.status || item.status === 'active');
const today = () => new Date().toISOString().split('T')[0];
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('ur-PK') : '---');
const toDateInputValue = (value) => (value ? new Date(value).toISOString().split('T')[0] : '');
const getFieldValue = (valueOrEvent) => valueOrEvent?.target?.value ?? valueOrEvent ?? '';
const compactDateFieldClass = '[&>label]:!mb-3 [&>label]:!flex [&>label]:h-[36px] [&>label]:items-center [&>label]:leading-[2] [&_button]:h-[64px] [&_button]:min-h-[64px] [&_button]:rounded-xl [&_button]:border-[var(--color-border)] [&_button]:py-0 [&_button]:px-4 [&_button]:gap-3 [&_button_span]:overflow-visible [&_button_span]:text-clip [&_button_span]:whitespace-nowrap [&_button_span]:leading-[1.5] [&_button_span]:text-center [&_button_svg]:shrink-0';
const timeControlClass = 'exam-native-time h-[64px] w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-left font-sans text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]';

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

export const ExamSchedule = () => {
    const [formData, setFormData] = useState(createEmptyForm);
    const [schedules, setSchedules] = useState([]);
    const [classOptions, setClassOptions] = useState([]);
    const [sessionOptions, setSessionOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [filters, setFilters] = useState({ search: '', classId: '', sessionId: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    useNotificationBridge({ error, success: message });

    const filteredSchedules = useMemo(() => {
        const query = filters.search.trim().toLowerCase();
        return schedules.filter((schedule) => {
            const searchOk = !query || [
                schedule.examName,
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

    const stats = useMemo(() => {
        const todayValue = today();
        return {
            total: schedules.length,
            today: schedules.filter((schedule) => schedule.examDate === todayValue).length,
            classes: new Set(schedules.map((schedule) => schedule.classId).filter(Boolean)).size,
        };
    }, [schedules]);

    useEffect(() => {
        const loadSetup = async () => {
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
                setIsLoadingSchedules(false);
            }
        };

        loadSetup();
    }, []);

    const updateForm = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        if (!formData.examName.trim() || !formData.sessionId || !formData.classId || !formData.subjectId || !formData.examDate || !formData.startTime || !formData.endTime) {
            setError(text.required);
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
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
            };
            const savedSchedule = editingId
                ? await updateExamSchedule(editingId, payload)
                : await createExamSchedule(payload);
            const mappedSchedule = mapScheduleFromApi(savedSchedule);

            setSchedules((current) => (
                editingId
                    ? current.map((schedule) => (schedule.id === editingId ? mappedSchedule : schedule))
                    : [mappedSchedule, ...current]
            ).sort((a, b) => `${a.examDate} ${a.startTime}`.localeCompare(`${b.examDate} ${b.startTime}`)));
            setFormData((prev) => ({
                ...createEmptyForm(),
                sessionId: prev.sessionId,
                classId: prev.classId,
            }));
            setMessage(editingId ? text.updated : text.saved);
            setEditingId(null);
        } catch (saveError) {
            setError(saveError.message || text.loadError);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (schedule) => {
        setEditingId(schedule.id);
        setFormData({
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
        setMessage('');
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(createEmptyForm());
        setMessage('');
        setError('');
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        setMessage('');
        setError('');
        try {
            await deleteExamSchedule(id);
            setSchedules((current) => current.filter((schedule) => schedule.id !== id));
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
        <div className="min-h-screen bg-[var(--color-bg)] p-3 md:p-6 text-[var(--color-text-main)] font-urdu" dir="rtl">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-row items-center justify-between mb-8 p-6 rounded-3xl border"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-[var(--color-primary)]">{text.title}</h1>
                        <p className="mt-5 text-base font-bold text-[var(--color-text-muted)]">{text.subtitle}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <StatCard icon={<CalendarDays size={22} />} label={text.total} value={stats.total} />
                    <StatCard icon={<Clock size={22} />} label={text.today} value={stats.today} />
                    <StatCard icon={<Users size={22} />} label={text.classes} value={stats.classes} />
                </div>

                <div className="space-y-6">
                    <form onSubmit={handleSubmit} className="w-full rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5 shadow-xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4">
                            <div className="rounded-xl bg-[var(--color-primary)] p-3 text-[#0b1120]">
                                <Plus size={20} />
                            </div>
                            <h2 className="text-2xl font-black">{editingId ? 'شیڈول ترمیم کریں' : text.formTitle}</h2>
                            {editingId ? (
                                <button type="button" onClick={cancelEdit} className="mr-auto rounded-lg bg-rose-500/10 p-2 text-rose-400" title={text.cancelEdit} aria-label={text.cancelEdit}>
                                    <X size={18} />
                                </button>
                            ) : null}
                        </div>

                        {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-bold text-rose-400">{error}</div> : null}
                        {message ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-400">{message}</div> : null}

                        <div>
                            <FieldLabel required>{text.examName}</FieldLabel>
                            <input
                                required
                                value={formData.examName}
                                onChange={(event) => updateForm('examName', event.target.value)}
                                placeholder={text.examNamePlaceholder}
                                className="h-[64px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>

                        <div className="grid grid-cols-1 items-start gap-x-4 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
                            <SelectField required label={text.session} value={formData.sessionId} onChange={(value) => updateForm('sessionId', value)} disabled={isLoading}>
                                <option value="">{text.select}</option>
                                {sessionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </SelectField>
                            <SelectField required label={text.class} value={formData.classId} onChange={(value) => updateForm('classId', value)} disabled={isLoading}>
                                <option value="">{text.select}</option>
                                {classOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </SelectField>
                            <SelectField required label={text.subject} value={formData.subjectId} onChange={(value) => updateForm('subjectId', value)} disabled={isLoading}>
                                <option value="">{text.select}</option>
                                {subjectOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </SelectField>
                            <DateField
                                label={text.date}
                                required
                                value={formData.examDate}
                                onChange={(nextValue) => updateForm('examDate', getFieldValue(nextValue))}
                                size="sm"
                                className={compactDateFieldClass}
                            />
                            <TimeInput required label={text.startTime} value={formData.startTime} onChange={(value) => updateForm('startTime', value)} />
                            <TimeInput required label={text.endTime} value={formData.endTime} onChange={(value) => updateForm('endTime', value)} />
                            <TextInput label={text.marks} value={formData.totalMarks} onChange={(value) => updateForm('totalMarks', value)} type="number" />
                            <TextInput label={text.room} value={formData.room} onChange={(value) => updateForm('room', value)} />
                            <TextInput label={text.invigilator} value={formData.invigilator} onChange={(value) => updateForm('invigilator', value)} />
                        </div>

                        <div>
                            <FieldLabel>{text.notes}</FieldLabel>
                            <textarea
                                rows={3}
                                value={formData.notes}
                                onChange={(event) => updateForm('notes', event.target.value)}
                                className="min-h-[96px] w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 py-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>

                        <button
                            disabled={isSaving || isLoading}
                            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-black text-[#0b1120] shadow-lg transition-all hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                        >
                            {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
                            {isSaving ? text.saving : editingId ? text.update : text.save}
                        </button>
                    </form>

                    <div className="w-full rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden">
                        <div className="border-b border-[var(--color-border)] p-4 md:p-5">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-emerald-500/10 p-3 text-[var(--color-primary)]">
                                        <Layers size={20} />
                                    </div>
                                    <h2 className="text-2xl font-black">{text.listTitle}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[var(--color-text-muted)]">{filteredSchedules.length} / {schedules.length}</span>
                                    <button
                                        type="button"
                                        onClick={() => handlePrint()}
                                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-xs font-black text-[#0b1120] transition-all hover:bg-[var(--color-primary-hover)]"
                                    >
                                        <Printer size={15} />
                                        پرنٹ
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 items-start gap-3 md:grid-cols-12">
                                <div className="relative h-14 self-start md:col-span-6">
                                    <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                    <input
                                        value={filters.search}
                                        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                                        placeholder={text.searchPlaceholder}
                                        className="block h-14 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] pr-10 pl-4 text-xs font-bold leading-none outline-none focus:border-[var(--color-primary)]"
                                    />
                                </div>
                                <select
                                    value={filters.sessionId}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, sessionId: event.target.value }))}
                                    className="block h-14 w-full self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-xs font-bold leading-none outline-none md:col-span-3"
                                >
                                    <option value="">{text.allSessions}</option>
                                    {sessionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                </select>
                                <select
                                    value={filters.classId}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, classId: event.target.value }))}
                                    className="block h-14 w-full self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-xs font-bold leading-none outline-none md:col-span-3"
                                >
                                    <option value="">{text.allClasses}</option>
                                    {classOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="max-h-[660px] overflow-auto">
                            {filteredSchedules.length ? (
                                <div className="divide-y divide-[var(--color-border)]">
                                    {filteredSchedules.map((schedule) => (
                                        <ScheduleRow key={schedule.id} schedule={schedule} deletingId={deletingId} onDelete={handleDelete} onEdit={handleEdit} onPrint={handlePrint} />
                                    ))}
                                </div>
                            ) : isLoadingSchedules ? (
                                <div className="p-8 text-center text-sm font-bold text-[var(--color-text-muted)]">{text.loading}</div>
                            ) : (
                                <EmptyState />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FieldLabel = ({ children, required = false }) => (
    <label className="mb-3 mr-2 flex h-[36px] items-center text-[11px] font-black leading-[2] text-[var(--color-text-muted)]">
        {children}{required ? <span className="text-red-500"> *</span> : null}
    </label>
);

const SelectField = ({ label, value, onChange, children, disabled, required = false }) => (
    <div className="w-full">
        <FieldLabel required={required}>{label}</FieldLabel>
        <select
            required={required}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className="h-[64px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)] disabled:opacity-60"
        >
            {children}
        </select>
    </div>
);

const TextInput = ({ label, value, onChange, type = 'text' }) => (
    <div className="w-full">
        <FieldLabel>{label}</FieldLabel>
        <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-[64px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
        />
    </div>
);

const TimeInput = ({ label, value, onChange, required = false }) => (
    <div className="w-full">
        <FieldLabel required={required}>{label}</FieldLabel>
        <input
            required={required}
            type="time"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            dir="ltr"
            className={timeControlClass}
        />
    </div>
);

const StatCard = ({ icon, label, value }) => (
    <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-xs font-black text-[var(--color-text-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-black">{value}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-[var(--color-primary)]">
                {icon}
            </div>
        </div>
    </div>
);

const ScheduleRow = ({ schedule, deletingId, onDelete, onEdit, onPrint }) => (
    <div className="p-4 transition-colors hover:bg-[var(--color-bg)]/50">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0 text-right">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-[var(--color-primary)]">{schedule.examName}</h3>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-500">{schedule.subjectName}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-[var(--color-text-muted)]">
                    <span>{schedule.sessionName || '---'}</span>
                    <span>{schedule.className || '---'}</span>
                    <span>{schedule.room || '---'}</span>
                    <span>{schedule.invigilator || '---'}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(3,minmax(116px,1fr))_auto] lg:min-w-[460px] lg:justify-end">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right">
                    <p className="text-[10px] font-black text-[var(--color-text-muted)]">{text.date}</p>
                    <p className="mt-1 text-sm font-black">{formatDate(schedule.examDate)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right">
                    <p className="text-[10px] font-black text-[var(--color-text-muted)]">{text.startTime} - {text.endTime}</p>
                    <p className="mt-1 text-sm font-black">{schedule.startTime} - {schedule.endTime}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right">
                    <p className="text-[10px] font-black text-[var(--color-text-muted)]">{text.marks}</p>
                    <p className="mt-1 text-sm font-black">{schedule.totalMarks || '---'}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => onPrint(schedule)}
                        className="flex min-h-[62px] items-center justify-center rounded-xl bg-emerald-500/10 p-3 text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)] hover:text-[#0b1120]"
                        aria-label={text.print}
                        title="اس کلاس کا مکمل شیڈول پرنٹ کریں"
                    >
                        <Printer size={17} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(schedule)}
                        className="flex min-h-[62px] items-center justify-center rounded-xl bg-blue-500/10 p-3 text-blue-400 transition-all hover:bg-blue-500 hover:text-white"
                        aria-label="ترمیم کریں"
                        title="ترمیم کریں"
                    >
                        <Edit3 size={17} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(schedule.id)}
                        disabled={deletingId === schedule.id}
                        className="flex min-h-[62px] items-center justify-center rounded-xl bg-rose-500/10 p-3 text-rose-400 transition-all hover:bg-rose-500 hover:text-white"
                        aria-label={text.deleted}
                    >
                        <Trash2 size={17} />
                    </button>
                </div>
            </div>
            {schedule.notes ? (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-right lg:col-span-2">
                    <span className="font-black text-[var(--color-primary)]">نوٹ: </span>
                    <span className="text-sm font-bold text-[var(--color-text-muted)]">{schedule.notes}</span>
                </div>
            ) : null}
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="rounded-2xl bg-[var(--color-bg)] p-4 text-[var(--color-primary)]">
            <FileText size={28} />
        </div>
        <h3 className="mt-4 text-lg font-black">{text.emptyTitle}</h3>
        <p className="mt-2 max-w-sm text-sm font-bold text-[var(--color-text-muted)]">{text.emptyText}</p>
    </div>
);
