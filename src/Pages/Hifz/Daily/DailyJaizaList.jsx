import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ChevronDown, Pencil, Printer, Search, Trash2, X } from 'lucide-react';
import { deactivateDailyHifzEntry, getDailyHifzEntries, updateDailyHifzEntry } from '../../../Constant/HifzApi';
import { getStudents } from '../../../Constant/StudentsApi';
import { formatDateForInput, mapStudentsForHifz } from '../HifzUi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';
import {
    fetchMadrassaProfile,
    getAdminSession,
    MADRASSA_PROFILE_UPDATED_EVENT,
} from '../../../Constant/AdminAuth';

const registerMeta = {
    reportTitle: 'یومیہ رپورٹ',
};

const monthOptions = ['محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی', 'جمادی الاول', 'جمادی الثانی', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذوالقعدہ', 'ذوالحجہ'];
const yearOptions = ['1446ھ', '1447ھ', '1448ھ', '2025', '2026', '2027'];

// eslint-disable-next-line no-unused-vars
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
        sabqiPara: 'پارہ 1',
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
        sabqiPara: 'پارہ 1',
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

// eslint-disable-next-line no-unused-vars
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
    sabqiPara: '',
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

const inlineInputClassName = 'w-full min-w-[72px] h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-xs font-bold text-center outline-none focus:border-[var(--color-primary)]';
const inlineTextInputClassName = 'w-full min-w-[110px] h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs font-bold text-right outline-none focus:border-[var(--color-primary)]';

const normalizeRows = (entries) => entries;
const getDayName = (date) => (date ? new Date(date).toLocaleDateString('ur-PK', { weekday: 'long' }) : '');
const toInputValue = (value) => (value === null || value === undefined ? '' : String(value));

const mapDailyEntryToRow = (entry, selectedMonth, selectedYear) => ({
    id: String(entry.id),
    apiId: entry.id,
    studentId: entry.studentId,
    studentName: entry.student?.fullName || '',
    admissionNumber: entry.student?.admissionNumber || '',
    month: selectedMonth,
    year: selectedYear,
    date: formatDateForInput(entry.date),
    day: getDayName(entry.date),
    sabak: entry.sabq || '',
    sabakRuku: entry.sabqRuku || '',
    sabakAyatFrom: entry.sabqAyatFrom || '',
    sabakAyatTo: entry.sabqAyatTo || '',
    sabakTeacher: entry.sabqTeacherName || '',
    sabakMistake: toInputValue(entry.sabqMistake),
    sabakAtkann: toInputValue(entry.sabqAtkann),
    sabqiPara: entry.sabaqi || '',
    sabqiRuku: entry.sabaqiRuku || '',
    sabqiAyatFrom: entry.sabaqiAyatFrom || '',
    sabqiAyatTo: entry.sabaqiAyatTo || '',
    sabqiMistake: toInputValue(entry.sabaqiMistake),
    sabqiAtkann: toInputValue(entry.sabaqiAtkann),
    manzilBeforeMistake: toInputValue(entry.manzilBeforeMistake),
    manzilBeforeAtkann: toInputValue(entry.manzilBeforeAtkann),
    manzilBeforePara: entry.manzilBeforePara || entry.manzilBeforeDetail || '',
    manzilBeforeRuku: entry.manzilBeforeRuku || '',
    manzilBeforeAyatFrom: entry.manzilBeforeAyatFrom || '',
    manzilBeforeAyatTo: entry.manzilBeforeAyatTo || '',
    manzilAfterMistake: toInputValue(entry.manzilAfterMistake),
    manzilAfterAtkann: toInputValue(entry.manzilAfterAtkann),
    manzilAfterPara: entry.manzilAfterPara || entry.manzilAfterDetail || '',
    manzilAfterRuku: entry.manzilAfterRuku || '',
    manzilAfterAyatFrom: entry.manzilAfterAyatFrom || '',
    manzilAfterAyatTo: entry.manzilAfterAyatTo || '',
    lessonDetail: entry.lessonDetail || entry.remarks || '',
    count: toInputValue(entry.count),
    quality: entry.performanceStatus || '',
});

const toOptionalNumber = (value) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return Number(value);
};

const buildUpdatePayload = (row) => ({
    studentId: Number(row.studentId),
    date: row.date,
    sabq: row.sabak || undefined,
    sabqRuku: row.sabakRuku || undefined,
    sabqAyatFrom: row.sabakAyatFrom || undefined,
    sabqAyatTo: row.sabakAyatTo || undefined,
    sabqTeacherName: row.sabakTeacher || undefined,
    sabqMistake: toOptionalNumber(row.sabakMistake),
    sabqAtkann: toOptionalNumber(row.sabakAtkann),
    sabaqi: row.sabqiPara || undefined,
    sabaqiRuku: row.sabqiRuku || undefined,
    sabaqiAyatFrom: row.sabqiAyatFrom || undefined,
    sabaqiAyatTo: row.sabqiAyatTo || undefined,
    sabaqiMistake: toOptionalNumber(row.sabqiMistake),
    sabaqiAtkann: toOptionalNumber(row.sabqiAtkann),
    manzil: [row.manzilBeforePara, row.manzilAfterPara].filter(Boolean).join(' / ') || undefined,
    manzilBeforeDetail: [row.manzilBeforePara, row.manzilBeforeRuku, row.manzilBeforeAyatFrom && row.manzilBeforeAyatTo ? `${row.manzilBeforeAyatFrom}-${row.manzilBeforeAyatTo}` : ''].filter(Boolean).join(' | ') || undefined,
    manzilBeforePara: row.manzilBeforePara || undefined,
    manzilBeforeRuku: row.manzilBeforeRuku || undefined,
    manzilBeforeAyatFrom: row.manzilBeforeAyatFrom || undefined,
    manzilBeforeAyatTo: row.manzilBeforeAyatTo || undefined,
    manzilBeforeMistake: toOptionalNumber(row.manzilBeforeMistake),
    manzilBeforeAtkann: toOptionalNumber(row.manzilBeforeAtkann),
    manzilAfterDetail: [row.manzilAfterPara, row.manzilAfterRuku, row.manzilAfterAyatFrom && row.manzilAfterAyatTo ? `${row.manzilAfterAyatFrom}-${row.manzilAfterAyatTo}` : ''].filter(Boolean).join(' | ') || undefined,
    manzilAfterPara: row.manzilAfterPara || undefined,
    manzilAfterRuku: row.manzilAfterRuku || undefined,
    manzilAfterAyatFrom: row.manzilAfterAyatFrom || undefined,
    manzilAfterAyatTo: row.manzilAfterAyatTo || undefined,
    manzilAfterMistake: toOptionalNumber(row.manzilAfterMistake),
    manzilAfterAtkann: toOptionalNumber(row.manzilAfterAtkann),
    lessonDetail: row.lessonDetail || undefined,
    count: toOptionalNumber(row.count),
    performanceStatus: row.quality || 'جید',
    remarks: row.lessonDetail || undefined,
    status: 'active',
});

export const DailyJaizaList = () => {
    const notify = useNotifier();
    const [madrassaProfile, setMadrassaProfile] = useState(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [savedRows, setSavedRows] = useState([]);
    const [editingRowId, setEditingRowId] = useState('');
    const [draftRow, setDraftRow] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('شعبان');
    const [selectedYear, setSelectedYear] = useState('1447ھ');
    const [showStudentResults, setShowStudentResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const madrassaName = madrassaProfile?.name?.trim() || '';

    useEffect(() => {
        let isMounted = true;

        const syncMadrassaProfile = async () => {
            try {
                const profile = await fetchMadrassaProfile();
                if (isMounted && profile) {
                    setMadrassaProfile(profile);
                }
            } catch {
                if (isMounted) {
                    setMadrassaProfile(getAdminSession()?.madrassaProfile || null);
                }
            } finally {
                if (isMounted) {
                    setIsProfileLoading(false);
                }
            }
        };

        const handleProfileUpdated = (event) => {
            if (isMounted) {
                setMadrassaProfile(event.detail || getAdminSession()?.madrassaProfile || null);
                setIsProfileLoading(false);
            }
        };

        window.addEventListener(MADRASSA_PROFILE_UPDATED_EVENT, handleProfileUpdated);
        syncMadrassaProfile();

        return () => {
            isMounted = false;
            window.removeEventListener(MADRASSA_PROFILE_UPDATED_EVENT, handleProfileUpdated);
        };
    }, []);

    const loadDailyEntries = useCallback(async (studentId = selectedStudentId) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: '1',
                limit: '100',
                status: 'active',
            });

            if (studentId) {
                params.set('studentId', String(studentId));
            }

            const result = await getDailyHifzEntries(params.toString());
            setSavedRows((result.items || []).map((entry) => mapDailyEntryToRow(entry, selectedMonth, selectedYear)));
        } catch (error) {
            notify.error(error?.message || 'یومیہ جائزے کی فہرست لوڈ نہیں ہو سکی۔');
        } finally {
            setIsLoading(false);
        }
    }, [selectedMonth, selectedStudentId, selectedYear]);

    useEffect(() => {
        let isMounted = true;

        const loadSetup = async () => {
            try {
                const [studentsResult, dailyResult] = await Promise.all([
                    getStudents('page=1&limit=100&status=active'),
                    getDailyHifzEntries('page=1&limit=100&status=active'),
                ]);

                if (isMounted) {
                    setStudents(mapStudentsForHifz(studentsResult.items || []));
                    setSavedRows((dailyResult.items || []).map((entry) => mapDailyEntryToRow(entry, selectedMonth, selectedYear)));
                }
            } catch (error) {
                notify.error(error?.message || 'یومیہ جائزے کا ڈیٹا لوڈ نہیں ہو سکا۔');
            }
        };

        loadSetup();

        return () => {
            isMounted = false;
        };
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        loadDailyEntries(selectedStudentId);
    }, [loadDailyEntries, selectedStudentId]);

    const registerRows = useMemo(() => normalizeRows(savedRows), [savedRows]);

    const filteredStudents = useMemo(() => {
        const query = studentSearch.trim().toLowerCase();

        if (!query) {
            return students.slice(0, 8);
        }

        return students.filter((student) => {
            const fullName = student.fullName?.toLowerCase() || '';
            const fatherName = student.fatherName?.toLowerCase() || '';
            const idNo = student.admissionNumber?.toLowerCase() || '';

            return fullName.includes(query) || fatherName.includes(query) || idNo.includes(query);
        }).slice(0, 8);
    }, [studentSearch, students]);

    const selectedStudent = useMemo(() => (
        students.find((student) => String(student.id) === String(selectedStudentId) || student.admissionNumber === selectedStudentId) || null
    ), [selectedStudentId, students]);

    const visibleRows = useMemo(() => {
        return registerRows.filter((row) => {
            const matchesStudent = selectedStudentId ? String(row.studentId) === String(selectedStudentId) : true;
            return matchesStudent;
        });
    }, [registerRows, selectedStudentId]);

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
            const nextRow = {
                ...draftRow,
                studentId: selectedStudentId || draftRow.studentId,
                month: selectedMonth,
                year: selectedYear,
            };
            await updateDailyHifzEntry(nextRow.apiId || nextRow.id, buildUpdatePayload(nextRow));
            cancelEditing();
            await loadDailyEntries();
            notify.success('یومیہ جائزہ کامیابی سے اپڈیٹ ہو گیا۔');
        } catch (error) {
            notify.error(error?.message || 'یومیہ جائزہ اپڈیٹ نہیں ہو سکا۔');
        }
    };

    const confirmDeleteRow = async () => {
        if (!deleteRow) {
            return;
        }

        try {
            setIsDeleting(true);
            await deactivateDailyHifzEntry(deleteRow.apiId || deleteRow.id);
            setDeleteRow(null);
            await loadDailyEntries();
            notify.success('یومیہ جائزہ کامیابی سے حذف ہو گیا۔');
        } catch (error) {
            notify.error(error?.message || 'یومیہ جائزہ حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
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
        setStudentSearch(`${student.fullName} - ${student.admissionNumber}`);
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
                                <h1 className="min-h-[2.5rem] text-3xl font-black">
                                    {isProfileLoading ? '' : madrassaName}
                                </h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-4">{registerMeta.reportTitle}</p>
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
                                            <div className="font-black text-sm">{student.fullName}</div>
                                            <div className="text-xs text-[var(--color-text-muted)] font-bold">
                                                {student.fatherName} | {student.admissionNumber}
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
                            استاد: {visibleRows[0]?.sabakTeacher || '____________'}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            کلاس / شعبہ: {selectedStudent ? `${selectedStudent.className} (${selectedStudent.sectionName})` : '____________'}
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                            طالب علم نمبر: {selectedStudent?.admissionNumber || '____________'}
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[3400px] border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-[var(--color-bg)]">
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">طالب علم</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">تاریخ</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">دن</th>
                                    <th colSpan="7" className="border border-[var(--color-border)] px-2 py-3 font-black">سبق</th>
                                    <th colSpan="6" className="border border-[var(--color-border)] px-2 py-3 font-black">سبقی</th>
                                    <th colSpan="6" className="border border-[var(--color-border)] px-2 py-3 font-black">منزل قبل الظہر</th>
                                    <th colSpan="6" className="border border-[var(--color-border)] px-2 py-3 font-black">منزل بعد الظہر</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">پڑھی کی تفصیل</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">تعداد</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black">کیفیت</th>
                                    <th rowSpan="2" className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">ایکشن</th>
                                </tr>
                                <tr className="bg-[var(--color-bg)] text-xs">
                                    {['پارہ', 'رکوع', 'آیت سے', 'آیت تک', 'غلطی', 'اٹکن', 'استاد'].map((label) => (
                                        <th key={`sabaq-${label}`} className="border border-[var(--color-border)] px-2 py-2 font-black">{label}</th>
                                    ))}
                                    {['سبقی', 'منزل-قبل', 'منزل-بعد'].flatMap((section) => (
                                        ['پارہ', 'رکوع', 'آیت سے', 'آیت تک', 'غلطی', 'اٹکن'].map((label) => (
                                            <th key={`${section}-${label}`} className="border border-[var(--color-border)] px-2 py-2 font-black">{label}</th>
                                        ))
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (
                                    <tr>
                                        <td colSpan="32" className="border border-[var(--color-border)] px-4 py-10 text-sm font-bold text-[var(--color-text-muted)]">
                                            یومیہ جائزے لوڈ ہو رہے ہیں...
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && visibleRows.map((row, index) => {
                                    const isEditing = editingRowId === row.id;

                                    return (
                                        <tr key={row.id} className={index % 2 === 0 ? 'bg-transparent' : 'bg-[var(--color-bg)]/40'}>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[150px] text-right">
                                                <div className="font-black">{row.studentName || '---'}</div>
                                                <div className="text-[11px] font-bold text-[var(--color-text-muted)]">{row.admissionNumber || ''}</div>
                                            </td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[95px]">{renderCell(row, 'date')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[80px]">{renderCell(row, 'day')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[100px]">{renderCell(row, 'sabak')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabakRuku')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabakAyatFrom')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabakAyatTo')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabakMistake')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabakAtkann')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[120px]">{renderCell(row, 'sabakTeacher', true)}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[110px]">{renderCell(row, 'sabqiPara', true)}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabqiRuku')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabqiAyatFrom')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabqiAyatTo')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabqiMistake')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'sabqiAtkann')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[110px]">{renderCell(row, 'manzilBeforePara', true)}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilBeforeRuku')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilBeforeAyatFrom')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilBeforeAyatTo')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilBeforeMistake')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilBeforeAtkann')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3 min-w-[110px]">{renderCell(row, 'manzilAfterPara', true)}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilAfterRuku')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilAfterAyatFrom')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilAfterAyatTo')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilAfterMistake')}</td>
                                            <td className="border border-[var(--color-border)] px-2 py-3">{renderCell(row, 'manzilAfterAtkann')}</td>
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
                                })}
                                {!isLoading && visibleRows.length === 0 && (
                                    <tr>
                                        <td colSpan="32" className="border border-[var(--color-border)] px-4 py-10 text-sm font-bold text-[var(--color-text-muted)]">
                                            اس طالب علم / مہینہ / سال کے مطابق کوئی یومیہ ریکارڈ نہیں ملا۔
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
                                کیا آپ واقعی {deleteRow.studentName || 'اس طالب علم'} کا یومیہ جائزہ حذف کرنا چاہتے ہیں؟
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
