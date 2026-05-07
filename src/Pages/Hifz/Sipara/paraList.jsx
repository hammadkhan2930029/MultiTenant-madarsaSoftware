import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Check, Pencil, Printer, Search, X } from 'lucide-react';
import { getSiparaJaizaEntries, saveSiparaJaizaEntry, subscribeToSiparaJaizaEntries } from '../../../Constant/SiparaHifzStore';

const fallbackRows = [
    { paraNo: 30, paraName: 'عم', startDate: '', completionDate: '', totalDays: '', remarks: '' },
    { paraNo: 29, paraName: 'تبارک الذی', startDate: '', completionDate: '', totalDays: '', remarks: '' },
    { paraNo: 28, paraName: 'قد سمع اللہ', startDate: '', completionDate: '', totalDays: '', remarks: '' },
    { paraNo: 27, paraName: 'قال فما خطبکم', startDate: '', completionDate: '', totalDays: '', remarks: '' },
    { paraNo: 26, paraName: 'حم', startDate: '', completionDate: '', totalDays: '', remarks: '' },
    { paraNo: 25, paraName: 'الیہ یرد', startDate: '', completionDate: '', totalDays: '', remarks: '' },
];

export const ParaJaizaList = () => {
    const [entries, setEntries] = useState(() => getSiparaJaizaEntries());
    const [searchQuery, setSearchQuery] = useState('');
    const [editingRowId, setEditingRowId] = useState('');
    const [draftRow, setDraftRow] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToSiparaJaizaEntries((nextEntries) => {
            setEntries(nextEntries);
        });

        return unsubscribe;
    }, []);

    const selectedEntry = useMemo(() => {
        if (!searchQuery.trim()) {
            return entries[0] || null;
        }

        const query = searchQuery.trim().toLowerCase();
        return entries.find((entry) =>
            entry.studentName?.toLowerCase().includes(query) ||
            entry.fatherName?.toLowerCase().includes(query)
        ) || null;
    }, [entries, searchQuery]);

    const displayRows = selectedEntry?.rows?.length ? selectedEntry.rows : fallbackRows;

    const startEditing = (row) => {
        setEditingRowId(row.id || `fallback-${row.paraNo}`);
        setDraftRow({
            startDate: row.startDate || '',
            completionDate: row.completionDate || '',
            totalDays: row.totalDays || '',
            remarks: row.remarks || '',
        });
    };

    const cancelEditing = () => {
        setEditingRowId('');
        setDraftRow(null);
    };

    const updateDraft = (field, value) => {
        setDraftRow((prev) => ({ ...prev, [field]: value }));
    };

    const saveInlineRow = (row) => {
        if (!selectedEntry || !draftRow) {
            return;
        }

        const updatedRows = selectedEntry.rows.map((item) => (
            item.id === row.id
                ? { ...item, ...draftRow }
                : item
        ));

        saveSiparaJaizaEntry({
            ...selectedEntry,
            rows: updatedRows,
        });

        cancelEditing();
    };

    const renderEditableCell = (row, field, type = 'text') => {
        const rowKey = row.id || `fallback-${row.paraNo}`;

        if (editingRowId !== rowKey || !draftRow) {
            return row[field];
        }

        return (
            <input
                type={type}
                value={draftRow[field]}
                onChange={(e) => updateDraft(field, e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] h-11 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
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
                                <h1 className="text-2xl md:text-3xl font-black">سپارہ جائزہ رپورٹ</h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-5">طالب علم کے سپارہ وار ریکارڈ کی فہرست</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative min-w-[280px]">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="طالب علم تلاش کریں"
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
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            نام طالب علم: {selectedEntry?.studentName || '____________'}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            ولدیت: {selectedEntry?.fatherName || '____________'}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            استاد: {selectedEntry?.teacher || '____________'}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 flex items-center gap-2">
                            <CalendarDays size={16} className="text-[var(--color-primary)]" />
                            تاریخ داخلہ: {selectedEntry?.admissionDate || '____________'}
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1450px] border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-[var(--color-bg)]">
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[90px]">پارہ نمبر</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[180px]">نام پارہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">تاریخ آغاز</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">تاریخ اختتام</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">کل ایام</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[260px]">سبق کی ادائی / کیفیت</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">ایکشن</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayRows.map((row, index) => {
                                    const rowKey = row.id || `fallback-${row.paraNo}`;
                                    const isEditing = editingRowId === rowKey;

                                    return (
                                    <tr key={row.id || `${row.paraNo}-${index}`} className={index % 2 === 0 ? 'bg-transparent' : 'bg-[var(--color-bg)]/40'}>
                                        <td className="border border-[var(--color-border)] px-2 py-3 font-black">{row.paraNo}</td>
                                        <td className="border border-[var(--color-border)] px-2 py-3 font-bold">{row.paraName}</td>
                                        <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'startDate', 'date')}</td>
                                        <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'completionDate', 'date')}</td>
                                        <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'totalDays')}</td>
                                        <td className="border border-[var(--color-border)] px-2 py-3">{renderEditableCell(row, 'remarks')}</td>
                                        <td className="border border-[var(--color-border)] px-2 py-3">
                                            {selectedEntry ? (
                                                isEditing ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => saveInlineRow(row)}
                                                            className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center gap-1 hover:bg-emerald-500 hover:text-white transition-all"
                                                        >
                                                            <Check size={14} />
                                                            سیو
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={cancelEditing}
                                                            className="px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold flex items-center justify-center gap-1 hover:bg-rose-500 hover:text-white transition-all"
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
                                                )
                                            ) : (
                                                <span className="text-xs font-bold text-[var(--color-text-muted)]">ریکارڈ نہیں</span>
                                            )}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
