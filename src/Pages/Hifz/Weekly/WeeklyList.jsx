import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Check, Pencil, Printer, Search, Trash2, UserRound, X } from 'lucide-react';
import { deactivateWeeklyHifzEntry, getWeeklyHifzEntries, updateWeeklyHifzEntry } from '../../../Constant/HifzApi';
import { formatDateForDisplay, formatDateForInput } from '../HifzUi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';

const reportMeta = {
    campus: 'مدرسہ الہدیٰ',
    title: 'ہفتہ وار جائزہ فہرست',
    week: 'ہفتہ: ____________',
    className: 'کلاس: ____________',
    teacher: 'استاد: ____________',
    location: 'مرکزی کیمپس',
};

const inlineInputClassName = 'w-full min-w-[88px] h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-bold text-center outline-none focus:border-[var(--color-primary)]';
const inlineTextInputClassName = 'w-full min-w-[120px] h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-bold text-right outline-none focus:border-[var(--color-primary)]';

const toInputValue = (value) => (value === null || value === undefined ? '' : String(value));

const addDays = (dateValue, days) => {
    const date = new Date(dateValue || new Date());
    if (Number.isNaN(date.getTime())) return formatDateForInput(new Date());
    date.setDate(date.getDate() + days);
    return formatDateForInput(date);
};

const mapWeeklyEntryToRow = (entry) => ({
    id: String(entry.id),
    apiId: entry.id,
    studentId: entry.studentId,
    studentNo: entry.student?.admissionNumber || '',
    studentName: entry.student?.fullName || '',
    weekLabel: entry.weekLabel || '',
    className: entry.className || '',
    sectionName: entry.sectionName || '',
    teacherName: entry.teacherName || '',
    weekStartDate: formatDateForInput(entry.weekStartDate),
    weekEndDate: formatDateForInput(entry.weekEndDate),
    siparaFrom: entry.siparaFrom || entry.lessonFrom || '',
    siparaTo: entry.siparaTo || entry.lessonTo || '',
    sawal1: toInputValue(entry.sawal1),
    sawal2: toInputValue(entry.sawal2),
    sawal3: toInputValue(entry.sawal3),
    tahajji: toInputValue(entry.tahajji),
    panja: toInputValue(entry.panja),
    khudKhwani: toInputValue(entry.khudKhwani),
    classWork: entry.classWork || '',
    quality: entry.performanceStatus || entry.remarks || '',
});

const toOptionalNumber = (value) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return Number(value);
};

const buildUpdatePayload = (row) => {
    const weekStartDate = row.weekStartDate || formatDateForInput(new Date());
    const weekEndDate = row.weekEndDate || addDays(weekStartDate, 6);

    return {
        studentId: Number(row.studentId),
        weekLabel: row.weekLabel || undefined,
        className: row.className || undefined,
        sectionName: row.sectionName || undefined,
        teacherName: row.teacherName || undefined,
        weekStartDate,
        weekEndDate,
        siparaFrom: row.siparaFrom || undefined,
        siparaTo: row.siparaTo || undefined,
        lessonFrom: row.siparaFrom || undefined,
        lessonTo: row.siparaTo || undefined,
        sawal1: toOptionalNumber(row.sawal1),
        sawal2: toOptionalNumber(row.sawal2),
        sawal3: toOptionalNumber(row.sawal3),
        tahajji: toOptionalNumber(row.tahajji),
        panja: toOptionalNumber(row.panja),
        khudKhwani: toOptionalNumber(row.khudKhwani),
        classWork: row.classWork || undefined,
        performanceStatus: row.quality || 'جید',
        remarks: row.quality || undefined,
        status: 'active',
    };
};

export const WeeklyJaizaList = () => {
    const notify = useNotifier();
    const [searchQuery, setSearchQuery] = useState('');
    const [savedRows, setSavedRows] = useState([]);
    const [editingRowId, setEditingRowId] = useState('');
    const [draftRow, setDraftRow] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadWeeklyEntries = async () => {
        try {
            setIsLoading(true);
            const result = await getWeeklyHifzEntries('page=1&limit=100&status=active');
            setSavedRows((result.items || []).map(mapWeeklyEntryToRow));
        } catch (error) {
            notify.error(error?.message || 'ہفتہ وار جائزے کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadWeeklyEntries();
    }, []);

    const rows = useMemo(() => savedRows, [savedRows]);
    const firstRow = rows[0] || null;

    const filteredRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return rows;
        }

        return rows.filter((row) =>
            (row.studentName || '').toLowerCase().includes(query) ||
            (row.studentNo || '').toLowerCase().includes(query) ||
            (row.className || '').toLowerCase().includes(query) ||
            (row.teacherName || '').toLowerCase().includes(query) ||
            (row.weekLabel || '').toLowerCase().includes(query)
        );
    }, [rows, searchQuery]);

    const startEditing = (row) => {
        setEditingRowId(row.id);
        setDraftRow({ ...row });
    };

    const cancelEditing = () => {
        setEditingRowId('');
        setDraftRow(null);
    };

    const updateDraft = (field, value) => {
        setDraftRow((prev) => ({ ...prev, [field]: value }));
    };

    const saveInlineRow = async () => {
        if (!draftRow) {
            return;
        }

        try {
            await updateWeeklyHifzEntry(draftRow.apiId || draftRow.id, buildUpdatePayload(draftRow));
            cancelEditing();
            await loadWeeklyEntries();
            notify.success('ہفتہ وار جائزہ کامیابی سے اپڈیٹ ہو گیا۔');
        } catch (error) {
            notify.error(error?.message || 'ہفتہ وار جائزہ اپڈیٹ نہیں ہو سکا۔');
        }
    };

    const confirmDeleteRow = async () => {
        if (!deleteRow) {
            return;
        }

        try {
            setIsDeleting(true);
            await deactivateWeeklyHifzEntry(deleteRow.apiId || deleteRow.id);
            setDeleteRow(null);
            await loadWeeklyEntries();
            notify.success('ہفتہ وار جائزہ کامیابی سے حذف ہو گیا۔');
        } catch (error) {
            notify.error(error?.message || 'ہفتہ وار جائزہ حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const renderNumericCell = (row, field) => {
        if (editingRowId !== row.id || !draftRow) {
            return row[field];
        }

        return (
            <input
                type="number"
                value={draftRow[field]}
                onChange={(e) => updateDraft(field, e.target.value)}
                className={inlineInputClassName}
            />
        );
    };

    const renderTextCell = (row, field) => {
        if (editingRowId !== row.id || !draftRow) {
            return row[field];
        }

        return (
            <input
                type="text"
                value={draftRow[field]}
                onChange={(e) => updateDraft(field, e.target.value)}
                className={inlineTextInputClassName}
            />
        );
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-main)] p-3 md:p-6" dir="rtl">
            <div className="max-w-[1700px] mx-auto space-y-6">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                                <BookOpen size={28} />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl md:text-3xl font-black">{reportMeta.title}</h1>
                                {/* <p className="text-sm font-bold text-[var(--color-text-muted)]">{reportMeta.campus}</p> */}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative min-w-[280px]">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="طالب علم کا نام یا نمبر تلاش کریں"
                                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pr-12 pl-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-5 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-input)] transition-all"
                            >
                                <Printer size={18} />
                                پرنٹ
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm font-bold">
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 flex items-center gap-2">
                            <CalendarDays size={16} className="text-[var(--color-primary)]" />
                            {firstRow?.weekLabel || (firstRow ? `ہفتہ: ${formatDateForDisplay(firstRow.weekStartDate)} تا ${formatDateForDisplay(firstRow.weekEndDate)}` : reportMeta.week)}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            {firstRow?.className ? `کلاس: ${firstRow.className}${firstRow.sectionName ? ` / ${firstRow.sectionName}` : ''}` : reportMeta.className}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            {firstRow?.teacherName ? `استاد: ${firstRow.teacherName}` : reportMeta.teacher}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            {reportMeta.location}
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1850px] border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-[var(--color-bg)]">
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">طالب علم نمبر</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[220px]">نام مع ولدیت</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">سپارہ شروع</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">سپارہ اختتام</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">سوال 1 نمبر<br />کل 20</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">سوال 2 نمبر<br />کل 20</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">سوال 3 نمبر<br />کل 20</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">تہجی<br />کل 20</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">پنجہ<br />کل 10</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">خود خوانی<br />کل 10</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">کلاس میں کردہ نمبر</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">کیفیت</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[160px]">ایکشن</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (
                                    <tr>
                                        <td colSpan="13" className="border border-[var(--color-border)] px-4 py-10 text-sm font-bold text-[var(--color-text-muted)]">
                                            ہفتہ وار جائزے لوڈ ہو رہے ہیں...
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && filteredRows.length > 0 ? (
                                    filteredRows.map((row, index) => {
                                        const isEditing = editingRowId === row.id;

                                        return (
                                            <tr key={row.id} className={index % 2 === 0 ? 'bg-transparent' : 'bg-[var(--color-bg)]/40'}>
                                                <td className="border border-[var(--color-border)] px-2 py-3 font-bold text-[var(--color-primary)]">{row.studentNo}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={draftRow?.studentName || ''}
                                                            onChange={(e) => updateDraft('studentName', e.target.value)}
                                                            className={inlineTextInputClassName}
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <UserRound size={15} className="text-[var(--color-primary)]" />
                                                            <span>{row.studentName}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderTextCell(row, 'siparaFrom')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderTextCell(row, 'siparaTo')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderNumericCell(row, 'sawal1')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderNumericCell(row, 'sawal2')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderNumericCell(row, 'sawal3')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderNumericCell(row, 'tahajji')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderNumericCell(row, 'panja')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderNumericCell(row, 'khudKhwani')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderTextCell(row, 'classWork')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderTextCell(row, 'quality')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-center gap-2 min-w-[160px]">
                                                            <button
                                                                type="button"
                                                                onClick={saveInlineRow}
                                                                className="px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center gap-1 hover:bg-emerald-500 hover:text-white transition-all"
                                                            >
                                                                <Check size={14} />
                                                                سیو
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEditing}
                                                                className="px-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold flex items-center justify-center gap-1 hover:bg-rose-500 hover:text-white transition-all"
                                                            >
                                                                <X size={14} />
                                                                بند
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 min-w-[160px]">
                                                            <button
                                                                type="button"
                                                                onClick={() => startEditing(row)}
                                                                className="px-4 py-2 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-primary)] hover:text-[#0b1120] transition-all"
                                                            >
                                                                <Pencil size={14} />
                                                                ایڈٹ
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteRow(row)}
                                                                className="h-10 w-10 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : !isLoading && (
                                    <tr>
                                        <td colSpan="13" className="border border-[var(--color-border)] px-4 py-10 text-sm font-bold text-[var(--color-text-muted)]">
                                            اس تلاش / فہرست کے مطابق کوئی ہفتہ وار ریکارڈ نہیں ملا۔
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {deleteRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
                        <div className="space-y-2 text-right">
                            <h2 className="text-xl font-black text-[var(--color-text-main)]">ریکارڈ حذف کریں؟</h2>
                            <p className="text-sm font-bold text-[var(--color-text-muted)]">
                                کیا آپ واقعی {deleteRow.studentName || 'اس طالب علم'} کا ہفتہ وار جائزہ حذف کرنا چاہتے ہیں؟
                            </p>
                        </div>
                        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setDeleteRow(null)}
                                disabled={isDeleting}
                                className="px-5 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] font-bold hover:bg-[var(--color-input)] transition-all disabled:opacity-60"
                            >
                                نہیں
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteRow}
                                disabled={isDeleting}
                                className="px-5 py-3 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-60"
                            >
                                {isDeleting ? 'حذف ہو رہا ہے...' : 'ہاں، حذف کریں'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
