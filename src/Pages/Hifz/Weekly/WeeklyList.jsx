import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Check, Pencil, Printer, Search, UserRound, X } from 'lucide-react';
import { getWeeklyJaizaEntries, saveWeeklyJaizaEntry, subscribeToWeeklyJaizaEntries } from '../../../Constant/WeeklyHifzStore';

const reportMeta = {
    campus: 'مدرسہ الہدیٰ',
    title: 'ہفتہ وار جائزہ فہرست',
    week: 'ہفتہ: 1 تا 7 شعبان 1447ھ',
    className: 'کلاس: حفظ اول',
    teacher: 'استاد: قاری محمد سلیم',
    location: 'مرکزی کیمپس',
};

const defaultWeeklyRows = [
    {
        id: 'weekly-1',
        studentNo: 'H-101',
        studentName: 'محمد احمد',
        siparaFrom: '1',
        siparaTo: '3',
        sawal1: '18',
        sawal2: '17',
        sawal3: '19',
        tahajji: '16',
        panja: '9',
        khudKhwani: '8',
        classWork: '9',
        quality: 'جید جداً',
    },
    {
        id: 'weekly-2',
        studentNo: 'H-102',
        studentName: 'عبداللہ خان',
        siparaFrom: '2',
        siparaTo: '4',
        sawal1: '16',
        sawal2: '15',
        sawal3: '17',
        tahajji: '14',
        panja: '8',
        khudKhwani: '7',
        classWork: '8',
        quality: 'جید',
    },
    {
        id: 'weekly-3',
        studentNo: 'H-103',
        studentName: 'حسان علی',
        siparaFrom: '3',
        siparaTo: '5',
        sawal1: '12',
        sawal2: '13',
        sawal3: '14',
        tahajji: '11',
        panja: '7',
        khudKhwani: '6',
        classWork: '7',
        quality: 'مقبول',
    },
];

const inlineInputClassName = 'w-full min-w-[88px] h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-bold text-center outline-none focus:border-[var(--color-primary)]';
const inlineTextInputClassName = 'w-full min-w-[120px] h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-bold text-right outline-none focus:border-[var(--color-primary)]';

const normalizeWeeklyRows = (entries) => (
    entries.length > 0 ? entries : defaultWeeklyRows
);

export const WeeklyJaizaList = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [savedRows, setSavedRows] = useState(() => getWeeklyJaizaEntries());
    const [editingRowId, setEditingRowId] = useState('');
    const [draftRow, setDraftRow] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToWeeklyJaizaEntries((entries) => {
            setSavedRows(entries);
        });

        return unsubscribe;
    }, []);

    const rows = useMemo(() => normalizeWeeklyRows(savedRows), [savedRows]);

    const filteredRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return rows;
        }

        return rows.filter((row) =>
            row.studentName.toLowerCase().includes(query) ||
            row.studentNo.toLowerCase().includes(query)
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

    const saveInlineRow = () => {
        if (!draftRow) {
            return;
        }

        saveWeeklyJaizaEntry(draftRow);
        cancelEditing();
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
                                <p className="text-sm font-bold text-[var(--color-text-muted)]">{reportMeta.campus}</p>
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
                            {reportMeta.week}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            {reportMeta.className}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            {reportMeta.teacher}
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
                                {filteredRows.length > 0 ? (
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
                                        <td colSpan="13" className="border border-[var(--color-border)] px-4 py-10 text-sm font-bold text-[var(--color-text-muted)]">
                                            اس تلاش کے مطابق کوئی طالب علم نہیں ملا۔
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
