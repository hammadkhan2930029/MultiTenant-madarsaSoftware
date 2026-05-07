import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ChevronDown, Pencil, Printer, Search, X } from 'lucide-react';
import { getDailyJaizaEntries, saveDailyJaizaEntry, subscribeToDailyJaizaEntries } from '../../../Constant/DailyHifzStore';
import { getStudentProfiles } from '../../../Constant/StudentProfiles';

const registerMeta = {
    campus: 'مدرسہ الہدیٰ',
    reportTitle: 'یومیہ رپورٹ',
};

const monthOptions = ['محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی', 'جمادی الاول', 'جمادی الثانی', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذوالقعدہ', 'ذوالحجہ'];
const yearOptions = ['1446ھ', '1447ھ', '1448ھ', '2025', '2026', '2027'];

const filledRows = [
    {
        id: 'daily-1',
        studentId: 'STU-001',
        month: 'شعبان',
        year: '1447ھ',
        date: '2026-05-01',
        day: 'جمعہ',
        sabak: 'پارہ 1',
        sabakMistake: '2',
        sabakAtkann: '1',
        sabqiMistake: '1',
        sabqiAtkann: '0',
        manzilBeforeMistake: '0',
        manzilBeforeAtkann: '1',
        manzilBeforeDetail: '1/2 پارہ',
        manzilAfterMistake: '1',
        manzilAfterAtkann: '0',
        manzilAfterDetail: '1 پارہ',
        lessonDetail: 'سبق + سبقی مکمل',
        count: '3',
        quality: 'جید',
    },
    {
        id: 'daily-2',
        studentId: 'STU-002',
        month: 'شعبان',
        year: '1447ھ',
        date: '2026-05-02',
        day: 'ہفتہ',
        sabak: 'پارہ 1',
        sabakMistake: '1',
        sabakAtkann: '1',
        sabqiMistake: '0',
        sabqiAtkann: '0',
        manzilBeforeMistake: '1',
        manzilBeforeAtkann: '0',
        manzilBeforeDetail: '3/4 پارہ',
        manzilAfterMistake: '0',
        manzilAfterAtkann: '1',
        manzilAfterDetail: '1 پارہ',
        lessonDetail: 'ناظرہ روانی بہتر',
        count: '2',
        quality: 'جید جداً',
    },
];

const emptyRows = Array.from({ length: 12 }, (_, index) => ({
    id: `empty-${index}`,
    studentId: 'STU-001',
    month: 'شعبان',
    year: '1447ھ',
    date: '',
    day: '',
    sabak: '',
    sabakMistake: '',
    sabakAtkann: '',
    sabqiMistake: '',
    sabqiAtkann: '',
    manzilBeforeMistake: '',
    manzilBeforeAtkann: '',
    manzilBeforeDetail: '',
    manzilAfterMistake: '',
    manzilAfterAtkann: '',
    manzilAfterDetail: '',
    lessonDetail: '',
    count: '',
    quality: '',
}));

const defaultRows = [...filledRows, ...emptyRows];
const inlineInputClassName = 'w-full min-w-[72px] h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-xs font-bold text-center outline-none focus:border-[var(--color-primary)]';
const inlineTextInputClassName = 'w-full min-w-[110px] h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs font-bold text-right outline-none focus:border-[var(--color-primary)]';

const normalizeRows = (entries) => (entries.length > 0 ? entries : defaultRows);

export const DailyJaizaList = () => {
    const students = useMemo(() => getStudentProfiles(), []);
    const [savedRows, setSavedRows] = useState(() => getDailyJaizaEntries());
    const [editingRowId, setEditingRowId] = useState('');
    const [draftRow, setDraftRow] = useState(null);
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('شعبان');
    const [selectedYear, setSelectedYear] = useState('1447ھ');
    const [showStudentResults, setShowStudentResults] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToDailyJaizaEntries((entries) => {
            setSavedRows(entries);
        });

        return unsubscribe;
    }, []);

    const registerRows = useMemo(() => normalizeRows(savedRows), [savedRows]);

    const filteredStudents = useMemo(() => {
        const query = studentSearch.trim().toLowerCase();

        if (!query) {
            return students.slice(0, 8);
        }

        return students.filter((student) => {
            const fullName = student.personal?.fullName?.toLowerCase() || '';
            const fatherName = student.personal?.fatherName?.toLowerCase() || '';
            const idNo = student.admission?.idNo?.toLowerCase() || '';

            return fullName.includes(query) || fatherName.includes(query) || idNo.includes(query);
        }).slice(0, 8);
    }, [studentSearch, students]);

    const selectedStudent = useMemo(() => (
        students.find((student) => student.id === selectedStudentId || student.admission?.idNo === selectedStudentId) || null
    ), [selectedStudentId, students]);

    const visibleRows = useMemo(() => {
        return registerRows.filter((row) => {
            const matchesStudent = selectedStudentId ? row.studentId === selectedStudentId : true;
            const matchesMonth = selectedMonth ? row.month === selectedMonth : true;
            const matchesYear = selectedYear ? row.year === selectedYear : true;

            return matchesStudent && matchesMonth && matchesYear;
        });
    }, [registerRows, selectedStudentId, selectedMonth, selectedYear]);

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

        saveDailyJaizaEntry({
            ...draftRow,
            studentId: selectedStudentId || draftRow.studentId,
            month: selectedMonth,
            year: selectedYear,
        });
        cancelEditing();
    };

    const renderCell = (row, field, isText = false) => {
        if (editingRowId !== row.id || !draftRow) {
            return row[field];
        }

        return (
            <input
                type="text"
                value={draftRow[field]}
                onChange={(e) => updateDraft(field, e.target.value)}
                className={isText ? inlineTextInputClassName : inlineInputClassName}
            />
        );
    };

    const handleStudentSelect = (student) => {
        setSelectedStudentId(student.id);
        setStudentSearch(`${student.personal?.fullName} - ${student.admission?.idNo}`);
        setShowStudentResults(false);
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
                                <h1 className="text-2xl md:text-3xl font-black">{registerMeta.campus}</h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)]">{registerMeta.reportTitle}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
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
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                            <input
                                type="text"
                                value={studentSearch}
                                onChange={(e) => {
                                    setStudentSearch(e.target.value);
                                    setSelectedStudentId('');
                                    setShowStudentResults(true);
                                }}
                                onFocus={() => setShowStudentResults(true)}
                                placeholder="طالب علم تلاش کریں"
                                className="w-full h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pr-12 pl-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            />
                            {showStudentResults && filteredStudents.length > 0 && (
                                <div className="absolute top-[calc(100%+8px)] right-0 z-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden">
                                    {filteredStudents.map((student) => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => handleStudentSelect(student)}
                                            className="w-full px-4 py-3 text-right hover:bg-[var(--color-bg)] transition-all"
                                        >
                                            <div className="font-black text-sm">{student.personal?.fullName}</div>
                                            <div className="text-xs text-[var(--color-text-muted)] font-bold">
                                                {student.personal?.fatherName} | {student.admission?.idNo}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)] pointer-events-none" size={18} />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full h-14 appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pr-4 pl-10 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            >
                                {monthOptions.map((month) => (
                                    <option key={month} value={month}>{`مہینہ: ${month}`}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)] pointer-events-none" size={18} />
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full h-14 appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pr-4 pl-10 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            >
                                {yearOptions.map((year) => (
                                    <option key={year} value={year}>{`سال: ${year}`}</option>
                                ))}
                            </select>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            استاد: {selectedStudent?.education?.teacherName || '____________'}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            کلاس / شعبہ: {selectedStudent ? `${selectedStudent.classInfo?.className} (${selectedStudent.classInfo?.section})` : '____________'}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            برانچ: {selectedStudent?.classInfo?.campus || registerMeta.campus}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            طالب علم نمبر: {selectedStudent?.admission?.idNo || '____________'}
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1650px] border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-[var(--color-bg)]">
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">تاریخ</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">دن</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">سبق</th>
                                    <th colSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">سبقی</th>
                                    <th colSpan="3" className="border border-[var(--color-border)] px-2 py-3 font-black">منزل قبل الظہر</th>
                                    <th colSpan="3" className="border border-[var(--color-border)] px-2 py-3 font-black">منزل بعد الظہر</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">پڑھی کی تفصیل</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">تعداد</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">کیفیت</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">ایکشن</th>
                                </tr>
                                <tr className="bg-[var(--color-bg)] text-xs">
                                    <th className="border border-[var(--color-border)] px-2 py-2 font-black">غلطی</th>
                                    <th className="border border-[var(--color-border)] px-2 py-2 font-black">اٹکن</th>
                                    <th className="border border-[var(--color-border)] px-2 py-2 font-black">غلطی</th>
                                    <th className="border border-[var(--color-border)] px-2 py-2 font-black">اٹکن</th>
                                    <th className="border border-[var(--color-border)] px-2 py-2 font-black">تفصیل</th>
                                    <th className="border border-[var(--color-border)] px-2 py-2 font-black">غلطی</th>
                                    <th className="border border-[var(--color-border)] px-2 py-2 font-black">اٹکن</th>
                                    <th className="border border-[var(--color-border)] px-2 py-2 font-black">تفصیل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRows.map((row, index) => {
                                    const isEditing = editingRowId === row.id;

                                    return (
                                        <tr key={row.id} className={index % 2 === 0 ? 'bg-transparent' : 'bg-[var(--color-bg)]/40'}>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[95px]">{renderCell(row, 'date')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[80px]">{renderCell(row, 'day')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[100px]">{renderCell(row, 'sabak')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabqiMistake')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabqiAtkann')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilBeforeMistake')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilBeforeAtkann')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[110px]">{renderCell(row, 'manzilBeforeDetail', true)}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilAfterMistake')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilAfterAtkann')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[110px]">{renderCell(row, 'manzilAfterDetail', true)}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[180px]">{renderCell(row, 'lessonDetail', true)}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'count')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[100px]">{renderCell(row, 'quality', true)}</td>
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
                                })}
                                {visibleRows.length === 0 && (
                                    <tr>
                                        <td colSpan="15" className="border border-[var(--color-border)] px-4 py-10 text-sm font-bold text-[var(--color-text-muted)]">
                                            اس طالب علم / مہینہ / سال کے مطابق کوئی یومیہ ریکارڈ نہیں ملا۔
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
