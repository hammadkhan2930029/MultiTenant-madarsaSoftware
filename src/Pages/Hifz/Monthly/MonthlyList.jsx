import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Check, Pencil, Printer, Search, UserRound, X } from 'lucide-react';
import { getStudentProfiles } from '../../../Constant/StudentProfiles';
import { getMonthlyJaizaEntries, getMonthlyJaizaEntryById, saveMonthlyJaizaEntry, subscribeToMonthlyJaizaEntries } from '../../../Constant/MonthlyHifzStore';

const samplePerformance = ['بہت اچھا', 'جید', 'اوسط', 'مزید محنت'];
const monthOptions = ['محرم الحرام', 'صفر المظفر', 'ربیع الاول', 'ربیع الثانی', 'جمادی الاول', 'جمادی الثانی', 'رجب المرجب', 'شعبان المعظم', 'رمضان المبارک', 'شوال المکرم', 'ذوالقعدہ', 'ذوالحجہ'];
const inlineInputClassName = 'w-full min-w-[120px] h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm leading-6 font-bold text-right outline-none focus:border-[var(--color-primary)]';

const buildMonthlyRows = () => (
    getStudentProfiles().map((student, index) => ({
        id: student.id,
        studentNo: student.admission?.idNo || '-',
        studentName: student.personal?.fullName || '-',
        fatherName: student.personal?.fatherName || '-',
        className: student.classInfo?.className || '-',
        section: student.classInfo?.section || '-',
        month: 'شعبان المعظم',
        sabaqStart: `${index + 1}واں پارہ`,
        sabaqEnd: `${index + 2}واں پارہ`,
        totalKhwandagi: `${index + 3} پارے`,
        absentDays: String(index),
        leaveDays: String(index + 1),
        quality: samplePerformance[index % samplePerformance.length],
        isSavedRecord: false,
    }))
);

const mapSavedEntriesToRows = (entries, students) => (
    entries.map((entry) => {
        const student = students.find((item) => item.id === entry.studentId || item.admission?.idNo === entry.studentId);
        const focusedRow = entry.monthlyRows?.find((row) => row.monthName === entry.selectedMonth && (
            row.sabaqStart || row.sabaqEnd || row.totalKhwandagi || row.absentDays || row.leaveDays || row.reason
        )) || entry.monthlyRows?.find((row) => (
            row.sabaqStart || row.sabaqEnd || row.totalKhwandagi || row.absentDays || row.leaveDays || row.reason
        ));

        return {
            id: entry.id,
            studentNo: student?.admission?.idNo || '-',
            studentName: student?.personal?.fullName || '-',
            fatherName: student?.personal?.fatherName || '-',
            className: entry.className || student?.classInfo?.className || '-',
            section: entry.section || student?.classInfo?.section || '-',
            month: entry.selectedMonth || focusedRow?.monthName || '-',
            sabaqStart: focusedRow?.sabaqStart || '',
            sabaqEnd: focusedRow?.sabaqEnd || '',
            totalKhwandagi: focusedRow?.totalKhwandagi || '',
            absentDays: focusedRow?.absentDays || '0',
            leaveDays: focusedRow?.leaveDays || '0',
            quality: entry.remarks || entry.teacher || 'محفوظ ریکارڈ',
            isSavedRecord: true,
        };
    })
);

const createDraftFromRow = (row) => ({
    className: row.className || '',
    section: row.section || '',
    month: row.month || '',
    sabaqStart: row.sabaqStart || '',
    sabaqEnd: row.sabaqEnd || '',
    totalKhwandagi: row.totalKhwandagi || '',
    absentDays: row.absentDays || '0',
    leaveDays: row.leaveDays || '0',
    quality: row.quality || '',
});

export const MonthlyJaizaList = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('شعبان المعظم');
    const [savedEntries, setSavedEntries] = useState(() => getMonthlyJaizaEntries());
    const [sampleRows, setSampleRows] = useState(() => buildMonthlyRows());
    const [editingRowId, setEditingRowId] = useState('');
    const [draftRow, setDraftRow] = useState(null);
    const students = useMemo(() => getStudentProfiles(), []);

    useEffect(() => {
        const unsubscribe = subscribeToMonthlyJaizaEntries((entries) => {
            setSavedEntries(entries);
        });

        return unsubscribe;
    }, []);

    const rows = useMemo(() => {
        if (savedEntries.length > 0) {
            return mapSavedEntriesToRows(savedEntries, students);
        }

        return sampleRows;
    }, [savedEntries, sampleRows, students]);

    const filteredRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return rows.filter((row) => !selectedMonth || row.month === selectedMonth);
        }

        return rows.filter((row) => (
            (!selectedMonth || row.month === selectedMonth) && (
                row.studentName.toLowerCase().includes(query) ||
                row.studentNo.toLowerCase().includes(query) ||
                row.fatherName.toLowerCase().includes(query)
            )
        ));
    }, [rows, searchQuery, selectedMonth]);

    const startEditing = (row) => {
        setEditingRowId(row.id);
        setDraftRow(createDraftFromRow(row));
    };

    const cancelEditing = () => {
        setEditingRowId('');
        setDraftRow(null);
    };

    const updateDraft = (field, value) => {
        setDraftRow((prev) => ({ ...prev, [field]: value }));
    };

    const saveInlineRow = (row) => {
        if (!draftRow) {
            return;
        }

        if (row.isSavedRecord) {
            const entry = getMonthlyJaizaEntryById(row.id);

            if (entry) {
                const oldMonth = row.month;
                const newMonth = draftRow.month;

                let monthlyRows = entry.monthlyRows.map((monthRow) => {
                    if (monthRow.monthName === oldMonth && oldMonth !== newMonth) {
                        return {
                            ...monthRow,
                            sabaqStart: '',
                            sabaqEnd: '',
                            totalKhwandagi: '',
                            absentDays: '',
                            leaveDays: '',
                        };
                    }

                    if (monthRow.monthName === newMonth) {
                        return {
                            ...monthRow,
                            sabaqStart: draftRow.sabaqStart,
                            sabaqEnd: draftRow.sabaqEnd,
                            totalKhwandagi: draftRow.totalKhwandagi,
                            absentDays: draftRow.absentDays,
                            leaveDays: draftRow.leaveDays,
                        };
                    }

                    return monthRow;
                });

                if (!monthlyRows.some((monthRow) => monthRow.monthName === newMonth)) {
                    monthlyRows = [
                        ...monthlyRows,
                        {
                            id: crypto.randomUUID(),
                            monthName: newMonth,
                            sabaqStart: draftRow.sabaqStart,
                            sabaqEnd: draftRow.sabaqEnd,
                            totalKhwandagi: draftRow.totalKhwandagi,
                            sabaqNama: '',
                            sabqiNama: '',
                            manzilNama: '',
                            absentDays: draftRow.absentDays,
                            leaveDays: draftRow.leaveDays,
                            transferStatus: '',
                            reason: '',
                        },
                    ];
                }

                saveMonthlyJaizaEntry({
                    ...entry,
                    className: draftRow.className,
                    section: draftRow.section,
                    selectedMonth: draftRow.month,
                    remarks: draftRow.quality,
                    monthlyRows,
                });
            }
        } else {
            setSampleRows((prev) => prev.map((item) => (
                item.id === row.id ? { ...item, ...draftRow } : item
            )));
        }

        cancelEditing();
    };

    const renderEditableCell = (row, field, type = 'text') => {
        if (editingRowId !== row.id || !draftRow) {
            return row[field];
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
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                                <BookOpen size={28} />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl md:text-3xl font-black">ماہانہ جائزہ فہرست</h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-5">طلبہ کے ماہانہ جائزے کا خلاصہ</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative min-w-[280px]">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="طالب علم یا شناخت نمبر تلاش کریں"
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
                            <CalendarDays size={16} className="text-[var(--color-primary)]" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full min-w-0 bg-transparent pr-2 pl-8 text-sm font-bold leading-6 outline-none appearance-none truncate"
                            >
                                {monthOptions.map((month) => (
                                    <option key={month} value={month} className="text-black">
                                        رپورٹ مہینہ: {month}
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
                        <table className="w-full min-w-[1650px] border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-[var(--color-bg)]">
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">طالب علم نمبر</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[220px]">نام مع ولدیت</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">کلاس / سیکشن</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[140px]">مہینہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">آغاز سبق</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">اختتام سبق</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">کل خواندگی</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[100px]">غیر حاضری</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[100px]">رخصت</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">کیفیت</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[180px]">ایکشن</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length > 0 ? (
                                    filteredRows.map((row, index) => {
                                        const isEditing = editingRowId === row.id;

                                        return (
                                            <tr key={row.id} className={index % 2 === 0 ? 'bg-transparent' : 'bg-[var(--color-bg)]/40'}>
                                                <td className="border border-[var(--color-border)] px-2 py-3 font-bold text-[var(--color-primary)]">{row.studentNo}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <UserRound size={15} className="text-[var(--color-primary)]" />
                                                        <span>{row.studentName} - {row.fatherName}</span>
                                                    </div>
                                                </td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">
                                                    {isEditing ? (
                                                        <div className="flex flex-col gap-2 min-w-[140px]">
                                                            <input type="text" value={draftRow?.className || ''} onChange={(e) => updateDraft('className', e.target.value)} className={inlineInputClassName} />
                                                            <input type="text" value={draftRow?.section || ''} onChange={(e) => updateDraft('section', e.target.value)} className={inlineInputClassName} />
                                                        </div>
                                                    ) : (
                                                        `${row.className} (${row.section})`
                                                    )}
                                                </td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'month')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'sabaqStart')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'sabaqEnd')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'totalKhwandagi')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'absentDays', 'number')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'leaveDays', 'number')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'quality')}</td>
                                                <td className="border border-[var(--color-border)] px-2 py-3">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-center gap-2 min-w-[160px]">
                                                            <button
                                                                type="button"
                                                                onClick={() => saveInlineRow(row)}
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
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditing(row)}
                                                            className="mx-auto px-4 py-2 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-primary)] hover:text-[#0b1120] transition-all"
                                                        >
                                                            <Pencil size={14} />
                                                            ایڈٹ
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="border border-[var(--color-border)] px-4 py-10 text-sm font-bold text-[var(--color-text-muted)]">
                                            اس تلاش کے مطابق کوئی ماہانہ ریکارڈ نہیں ملا۔
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
