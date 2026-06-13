import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Check, Pencil, Printer, Search, Trash2, X } from 'lucide-react';
import { deactivateSiparaHifzEntry, getSiparaHifzEntries, updateSiparaHifzEntry } from '../../../Constant/HifzApi';
import { getStudents } from '../../../Constant/StudentsApi';
import { mapStudentsForHifz } from '../HifzUi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';

const fallbackRows = [
    { paraNo: 30, paraName: 'عم', startDate: '', completionDate: '', totalDays: '', remarks: '' },
    { paraNo: 29, paraName: 'تبارک الذی', startDate: '', completionDate: '', totalDays: '', remarks: '' },
    { paraNo: 28, paraName: 'قد سمع اللہ', startDate: '', completionDate: '', totalDays: '', remarks: '' },
    { paraNo: 27, paraName: 'قال فما خطبکم', startDate: '', completionDate: '', totalDays: '', remarks: '' },
    { paraNo: 26, paraName: 'حم', startDate: '', completionDate: '', totalDays: '', remarks: '' },
    { paraNo: 25, paraName: 'الیہ یرد', startDate: '', completionDate: '', totalDays: '', remarks: '' },
];

const paraNameByNumber = fallbackRows.reduce((acc, row) => {
    acc[row.paraNo] = row.paraName;
    return acc;
}, {});

const formatDateForInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
};

const toOptionalNumber = (value) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return Number(value);
};

const mapEntryToRow = (entry) => ({
    id: String(entry.id),
    apiId: entry.id,
    studentId: entry.studentId,
    paraNo: entry.siparaNumber,
    paraName: paraNameByNumber[entry.siparaNumber] || String(entry.siparaNumber),
    startDate: formatDateForInput(entry.startDate),
    completionDate: formatDateForInput(entry.endDate),
    totalDays: entry.totalDays === null || entry.totalDays === undefined ? '' : String(entry.totalDays),
    remarks: entry.quality || entry.performanceStatus || entry.remarks || '',
});

const buildUpdatePayload = (selectedEntry, row, draftRow) => ({
    studentId: Number(selectedEntry.studentId),
    siparaNumber: Number(row.paraNo),
    startDate: draftRow.startDate || undefined,
    endDate: draftRow.completionDate || undefined,
    totalDays: toOptionalNumber(draftRow.totalDays),
    quality: draftRow.remarks || undefined,
    performanceStatus: draftRow.remarks || 'جید',
    remarks: draftRow.remarks || undefined,
    status: 'active',
});

const groupEntriesByStudent = (items, students) => {
    const studentMap = new Map(students.map((student) => [String(student.id), student]));
    const grouped = new Map();

    items.forEach((entry) => {
        const key = String(entry.studentId);
        const student = studentMap.get(key);
        const existing = grouped.get(key) || {
            id: key,
            studentId: entry.studentId,
            studentName: entry.student?.fullName || student?.fullName || '',
            fatherName: student?.fatherName || '',
            teacher: student?.teacherName || '',
            admissionDate: formatDateForInput(student?.admissionDate),
            rows: [],
        };

        existing.rows.push(mapEntryToRow(entry));
        grouped.set(key, existing);
    });

    return [...grouped.values()].map((entry) => ({
        ...entry,
        rows: [...entry.rows].sort((a, b) => Number(b.paraNo) - Number(a.paraNo)),
    }));
};

export const ParaJaizaList = () => {
    const notify = useNotifier();
    const [entries, setEntries] = useState([]);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [editingRowId, setEditingRowId] = useState('');
    const [draftRow, setDraftRow] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadSiparaEntries = useCallback(async () => {
        try {
            const [studentResult, siparaResult] = await Promise.all([
                getStudents('page=1&limit=100&status=active'),
                getSiparaHifzEntries('page=1&limit=100&status=active'),
            ]);
            const nextStudents = mapStudentsForHifz(studentResult.items || []);
            setStudents(nextStudents);
            setEntries(groupEntriesByStudent(siparaResult.items || [], nextStudents));
        } catch (error) {
            notify.error(error?.message || 'سپارہ جائزہ ریکارڈ لوڈ نہیں ہو سکا۔');
        }
    }, []);

    useEffect(() => {
        Promise.resolve().then(loadSiparaEntries);
    }, [loadSiparaEntries]);

    const filteredStudents = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return students.slice(0, 8);
        }

        return students.filter((student) => {
            const name = student.fullName?.toLowerCase() || '';
            const father = student.fatherName?.toLowerCase() || '';
            const admissionNumber = student.admissionNumber?.toLowerCase() || '';

            return name.includes(query) || father.includes(query) || admissionNumber.includes(query);
        }).slice(0, 8);
    }, [searchQuery, students]);

    const selectedStudent = useMemo(() => (
        students.find((student) => String(student.id) === String(selectedStudentId)) || null
    ), [selectedStudentId, students]);

    const selectedEntry = useMemo(() => {
        if (!selectedStudentId) {
            return null;
        }

        const existingEntry = entries.find((entry) => String(entry.studentId) === String(selectedStudentId));

        if (existingEntry) {
            return existingEntry;
        }

        return {
            id: String(selectedStudentId),
            studentId: selectedStudentId,
            studentName: selectedStudent?.fullName || '',
            fatherName: selectedStudent?.fatherName || '',
            teacher: selectedStudent?.teacherName || '',
            admissionDate: formatDateForInput(selectedStudent?.admissionDate),
            rows: [],
        };
    }, [entries, selectedStudent, selectedStudentId]);

    const displayRows = selectedEntry?.rows || [];

    const handleStudentSelect = (student) => {
        setSelectedStudentId(student.id);
        setSearchQuery(`${student.fullName} - ${student.admissionNumber}`);
        setShowResults(false);
        cancelEditing();
    };

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

    const saveInlineRow = async (row) => {
        if (!selectedEntry || !draftRow) {
            return;
        }

        try {
            await updateSiparaHifzEntry(row.apiId || row.id, buildUpdatePayload(selectedEntry, row, draftRow));
            cancelEditing();
            await loadSiparaEntries();
            notify.success('سپارہ جائزہ کامیابی سے اپڈیٹ ہو گیا۔');
        } catch (error) {
            notify.error(error?.message || 'سپارہ جائزہ اپڈیٹ نہیں ہو سکا۔');
        }
    };

    const confirmDeleteRow = async () => {
        if (!deleteRow) {
            return;
        }

        try {
            setIsDeleting(true);
            await deactivateSiparaHifzEntry(deleteRow.apiId || deleteRow.id);
            setDeleteRow(null);
            await loadSiparaEntries();
            notify.success('سپارہ جائزہ کامیابی سے حذف ہو گیا۔');
        } catch (error) {
            notify.error(error?.message || 'سپارہ جائزہ حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
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
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setSelectedStudentId('');
                                        setShowResults(true);
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    placeholder="طالب علم تلاش کریں"
                                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pr-12 pl-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                />
                                {showResults && filteredStudents.length > 0 && (
                                    <div className="absolute top-[calc(100%+8px)] right-0 z-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden">
                                        {filteredStudents.map((student) => (
                                            <button
                                                key={student.id}
                                                type="button"
                                                onClick={() => handleStudentSelect(student)}
                                                className="w-full px-4 py-3 text-right hover:bg-[var(--color-bg)] transition-all"
                                            >
                                                <div className="font-black text-sm">{student.fullName}</div>
                                                <div className="text-xs text-[var(--color-text-muted)] font-bold">
                                                    {student.fatherName} | {student.admissionNumber}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                                {displayRows.length > 0 ? displayRows.map((row, index) => {
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
                                            {row.apiId ? (
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
                                                )
                                            ) : (
                                                <span className="text-xs font-bold text-[var(--color-text-muted)]">ریکارڈ نہیں</span>
                                            )}
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan="7" className="border border-[var(--color-border)] px-4 py-10 text-sm font-bold text-[var(--color-text-muted)]">
                                            {selectedStudentId ? 'اس طالب علم کی کوئی سپارہ انٹری نہیں ملی۔' : 'براہ کرم طالب علم منتخب کریں۔'}
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
                                کیا آپ واقعی {selectedEntry?.studentName || 'اس طالب علم'} کا سپارہ نمبر {deleteRow.paraNo} حذف کرنا چاہتے ہیں؟
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
