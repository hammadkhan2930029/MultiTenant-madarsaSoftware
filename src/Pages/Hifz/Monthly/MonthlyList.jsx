import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Pencil, Printer, Search, Trash2, UserRound, X } from 'lucide-react';
import { deactivateMonthlyHifzEntry, getMonthlyHifzEntries, updateMonthlyHifzEntry } from '../../../Constant/HifzApi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';

const monthOptions = [
    { value: '', label: 'تمام مہینے' },
    { value: '1', label: 'محرم الحرام' },
    { value: '2', label: 'صفر المظفر' },
    { value: '3', label: 'ربیع الاول' },
    { value: '4', label: 'ربیع الثانی' },
    { value: '5', label: 'جمادی الاول' },
    { value: '6', label: 'جمادی الثانی' },
    { value: '7', label: 'رجب المرجب' },
    { value: '8', label: 'شعبان المعظم' },
    { value: '9', label: 'رمضان المبارک' },
    { value: '10', label: 'شوال المکرم' },
    { value: '11', label: 'ذوالقعدہ' },
    { value: '12', label: 'ذوالحجہ' },
];

const inlineInputClassName = 'w-full min-w-[110px] h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm leading-7 font-bold text-right outline-none focus:border-[var(--color-primary)]';

const toInputValue = (value) => (value === null || value === undefined ? '' : String(value));
const getMonthName = (month) => monthOptions.find((item) => item.value === String(month))?.label || '-';

const getRemarkValue = (remarks = '', label) => {
    const part = remarks.split('|').map((item) => item.trim()).find((item) => item.startsWith(`${label}:`));
    return part ? part.slice(label.length + 1).trim() : '';
};

const buildRemarks = (row) => {
    const parts = [
        row.sabaqNama ? `سبق ناغہ: ${row.sabaqNama}` : '',
        row.sabqiNama ? `سبقی ناغہ: ${row.sabqiNama}` : '',
        row.manzilNama ? `منزل ناغہ: ${row.manzilNama}` : '',
        row.absentDays ? `غیر حاضری: ${row.absentDays}` : '',
        row.leaveDays ? `رخصت: ${row.leaveDays}` : '',
        row.reason ? `وجہ: ${row.reason}` : '',
    ].filter(Boolean);

    return parts.join(' | ') || undefined;
};

const mapEntryToRow = (entry) => ({
    id: String(entry.id),
    apiId: entry.id,
    studentId: entry.studentId,
    studentNo: entry.student?.admissionNumber || '-',
    studentName: entry.student?.fullName || '-',
    month: String(entry.month || ''),
    year: toInputValue(entry.year),
    sabaqStart: entry.startSabq || '',
    sabaqEnd: entry.endSabq || '',
    totalKhwandagi: entry.totalRecitation || '',
    sabaqNama: getRemarkValue(entry.remarks, 'سبق ناغہ'),
    sabqiNama: getRemarkValue(entry.remarks, 'سبقی ناغہ'),
    manzilNama: getRemarkValue(entry.remarks, 'منزل ناغہ'),
    absentDays: getRemarkValue(entry.remarks, 'غیر حاضری'),
    leaveDays: getRemarkValue(entry.remarks, 'رخصت'),
    quality: entry.performanceStatus || '',
    reason: getRemarkValue(entry.remarks, 'وجہ'),
});

const buildUpdatePayload = (row) => ({
    studentId: Number(row.studentId),
    month: Number(row.month),
    year: Number(row.year),
    startSabq: row.sabaqStart || undefined,
    endSabq: row.sabaqEnd || undefined,
    totalRecitation: row.totalKhwandagi || undefined,
    performanceStatus: row.quality || 'جید',
    remarks: buildRemarks(row),
    status: 'active',
});

export const MonthlyJaizaList = () => {
    const notify = useNotifier();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [savedRows, setSavedRows] = useState([]);
    const [editingRowId, setEditingRowId] = useState('');
    const [draftRow, setDraftRow] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadMonthlyEntries = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: '1',
                limit: '100',
                status: 'active',
            });

            if (selectedMonth) {
                params.set('month', selectedMonth);
            }

            const result = await getMonthlyHifzEntries(params.toString());
            setSavedRows((result.items || []).map(mapEntryToRow));
        } catch (error) {
            notify.error(error?.message || 'ماہانہ جائزہ فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        loadMonthlyEntries();
    }, [loadMonthlyEntries]);

    const filteredRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) return savedRows;

        return savedRows.filter((row) => {
            const searchableText = [
                row.studentNo,
                row.studentName,
                getMonthName(row.month),
                row.year,
                row.sabaqStart,
                row.sabaqEnd,
                row.totalKhwandagi,
                row.sabaqNama,
                row.sabqiNama,
                row.manzilNama,
                row.absentDays,
                row.leaveDays,
                row.quality,
                row.reason,
            ].join(' ').toLowerCase();

            return searchableText.includes(query);
        });
    }, [savedRows, searchQuery]);

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
        if (!draftRow) return;

        try {
            await updateMonthlyHifzEntry(draftRow.apiId || draftRow.id, buildUpdatePayload(draftRow));
            cancelEditing();
            await loadMonthlyEntries();
            notify.success('ماہانہ جائزہ کامیابی سے اپڈیٹ ہو گیا۔');
        } catch (error) {
            notify.error(error?.message || 'ماہانہ جائزہ اپڈیٹ نہیں ہو سکا۔');
        }
    };

    const confirmDeleteRow = async () => {
        if (!deleteRow) return;

        try {
            setIsDeleting(true);
            await deactivateMonthlyHifzEntry(deleteRow.apiId || deleteRow.id);
            setDeleteRow(null);
            await loadMonthlyEntries();
            notify.success('ماہانہ جائزہ کامیابی سے حذف ہو گیا۔');
        } catch (error) {
            notify.error(error?.message || 'ماہانہ جائزہ حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const renderEditableCell = (row, field, type = 'text') => {
        if (editingRowId !== row.id || !draftRow) {
            return field === 'month' ? getMonthName(row[field]) : row[field];
        }

        if (field === 'month') {
            return (
                <select value={draftRow.month} onChange={(e) => updateDraft('month', e.target.value)} className={inlineInputClassName}>
                    {monthOptions.filter((item) => item.value).map((month) => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                </select>
            );
        }

        return (
            <input
                type={type}
                value={draftRow[field]}
                onChange={(e) => updateDraft(field, e.target.value)}
                className={inlineInputClassName}
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
                                <h1 className="text-3xl font-black">ماہانہ جائزہ فہرست</h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-5">طلبہ کے ماہانہ جائزے کی مکمل تفصیل</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative min-w-[280px]">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="طالب علم، داخلہ نمبر یا سال تلاش کریں"
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

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm font-bold">
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 flex items-center gap-2 min-w-0">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full min-w-0 bg-transparent pr-2 pl-8 text-sm font-bold leading-6 outline-none appearance-none truncate"
                            >
                                {monthOptions.map((month) => (
                                    <option key={month.value || 'all'} value={month.value} className="text-black">
                                        رپورٹ مہینہ: {month.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            کل ریکارڈ: {filteredRows.length}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            نظام: ماہانہ جائزہ
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[2050px] border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-[var(--color-bg)]">
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">طالب علم نمبر</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[220px]">نام مع ولدیت</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">مہینہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[90px]">سال</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">آغاز سبق</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">اختتام سبق</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">کل خواندگی</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">سبق ناغہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">سبقی ناغہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">منزل ناغہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">غیر حاضری</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">رخصت / بیماری</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">امتحانی نمبرات</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[220px]">وجوہات</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[160px]">ایکشن</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (
                                    <tr>
                                        <td colSpan="15" className="border border-[var(--color-border)] px-4 py-10 text-sm font-bold text-[var(--color-text-muted)]">
                                            ماہانہ ریکارڈ لوڈ ہو رہے ہیں...
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
                                                    <div className="flex items-center justify-center gap-2">
                                                        <UserRound size={15} className="text-[var(--color-primary)]" />
                                                        <span>{row.studentName}</span>
                                                    </div>
                                                </td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'month')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'year', 'number')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'sabaqStart')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'sabaqEnd')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'totalKhwandagi')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'sabaqNama', 'number')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'sabqiNama', 'number')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'manzilNama', 'number')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'absentDays', 'number')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'leaveDays', 'number')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'quality')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'reason')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-center gap-2 min-w-[150px]">
                                                            <button type="button" onClick={saveInlineRow} className="px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center gap-1 hover:bg-emerald-500 hover:text-white transition-all">
                                                                <Check size={14} />
                                                                سیو
                                                            </button>
                                                            <button type="button" onClick={cancelEditing} className="px-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold flex items-center justify-center gap-1 hover:bg-rose-500 hover:text-white transition-all">
                                                                <X size={14} />
                                                                بند
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 min-w-[160px]">
                                                            <button type="button" onClick={() => startEditing(row)} className="px-4 py-2 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-primary)] hover:text-[#0b1120] transition-all">
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
                                        <td colSpan="15" className="border border-[var(--color-border)] px-4 py-10 text-sm font-bold text-[var(--color-text-muted)]">
                                            اس تلاش / فلٹر کے مطابق کوئی ماہانہ ریکارڈ نہیں ملا۔
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
                                کیا آپ واقعی {deleteRow.studentName || 'اس طالب علم'} کا ماہانہ جائزہ حذف کرنا چاہتے ہیں؟
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
