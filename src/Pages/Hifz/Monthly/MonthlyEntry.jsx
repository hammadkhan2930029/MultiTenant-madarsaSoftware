import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, ChevronDown, Save, School, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getClasses, getSections } from '../../../Constant/AcademicSetupApi';
import { createMonthlyHifzEntry, getMonthlyHifzEntries } from '../../../Constant/HifzApi';
import { getStudents } from '../../../Constant/StudentsApi';
import { getTeachers } from '../../../Constant/TeachersApi';
import { filterStudentsForHifz, getUniqueOptions, mapStudentsForHifz } from '../HifzUi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';
import { createClientId } from '../../../Utils/createClientId';

const hijriMonths = [
    'محرم الحرام',
    'صفر المظفر',
    'ربیع الاول',
    'ربیع الثانی',
    'جمادی الاول',
    'جمادی الثانی',
    'رجب المرجب',
    'شعبان المعظم',
    'رمضان المبارک',
    'شوال المکرم',
    'ذوالقعدہ',
    'ذوالحجہ',
];

const createMonthRow = (monthName) => ({
    id: createClientId(),
    monthName,
    sabaqStart: '',
    sabaqEnd: '',
    totalKhwandagi: '',
    sabaqNama: '',
    sabqiNama: '',
    manzilNama: '',
    absentDays: '',
    leaveDays: '',
    transferStatus: '',
    reason: '',
});

const createInitialFormData = () => ({
    className: '',
    section: '',
    teacher: '',
    studentId: '',
    academicYear: String(new Date().getFullYear()),
    selectedMonth: '',
    remarks: '',
    monthlyRows: hijriMonths.map(createMonthRow),
});

const rowHasContent = (row) => (
    [
        row.sabaqStart,
        row.sabaqEnd,
        row.totalKhwandagi,
        row.sabaqNama,
        row.sabqiNama,
        row.manzilNama,
        row.absentDays,
        row.leaveDays,
        row.transferStatus,
        row.reason,
    ].some((value) => String(value).trim() !== '')
);

const baseFieldClassName = 'w-full h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-base font-bold outline-none focus:border-[var(--color-primary)]';
const selectFieldClassName = `${baseFieldClassName} appearance-none pl-12`;
const iconSelectFieldClassName = `${baseFieldClassName} appearance-none pr-12 pl-14`;
const readOnlyFieldClassName = 'w-full h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-base font-bold outline-none';
const tableInputClassName = 'w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm leading-7 font-bold text-right outline-none focus:border-[var(--color-primary)]';

const getYearValue = (value) => {
    const yearMatch = String(value).match(/\d{4}/);
    return yearMatch ? Number(yearMatch[0]) : new Date().getFullYear();
};

const getRemarkValue = (remarks = '', label) => {
    const part = remarks.split('|').map((item) => item.trim()).find((item) => item.startsWith(`${label}:`));
    return part ? part.slice(label.length + 1).trim() : '';
};

const mergeRowsWithSavedEntries = (entries = []) => (
    hijriMonths.map((monthName, index) => {
        const savedEntry = entries.find((entry) => Number(entry.month) === index + 1);

        if (!savedEntry) {
            return createMonthRow(monthName);
        }

        return {
            ...createMonthRow(monthName),
            sabaqStart: savedEntry.startSabq || '',
            sabaqEnd: savedEntry.endSabq || '',
            totalKhwandagi: savedEntry.totalRecitation || '',
            sabaqNama: getRemarkValue(savedEntry.remarks, 'سبق ناغہ'),
            sabqiNama: getRemarkValue(savedEntry.remarks, 'سبقی ناغہ'),
            manzilNama: getRemarkValue(savedEntry.remarks, 'منزل ناغہ'),
            absentDays: getRemarkValue(savedEntry.remarks, 'غیر حاضری'),
            leaveDays: getRemarkValue(savedEntry.remarks, 'رخصت'),
            transferStatus: savedEntry.performanceStatus || '',
            reason: getRemarkValue(savedEntry.remarks, 'وجہ'),
        };
    })
);

export const MonthlyJaizaEntry = () => {
    const navigate = useNavigate();
    const notify = useNotifier();
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [formData, setFormData] = useState(createInitialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [savingRowId, setSavingRowId] = useState('');
    const [isLoadingSavedMonths, setIsLoadingSavedMonths] = useState(false);
    const topScrollRef = useRef(null);
    const tableScrollRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const loadOptions = async () => {
            try {
                const [studentResult, classResult, sectionResult, teacherResult] = await Promise.all([
                    getStudents('page=1&limit=100&status=active'),
                    getClasses('page=1&limit=100&status=active'),
                    getSections('page=1&limit=100&status=active'),
                    getTeachers('page=1&limit=100&status=active&staffType=teacher'),
                ]);

                if (isMounted) {
                    setStudents(mapStudentsForHifz(studentResult.items || []));
                    setClasses(classResult.items || []);
                    setSections(sectionResult.items || []);
                    setTeachers(teacherResult.items || []);
                }
            } catch (error) {
                notify.error(error?.message || 'ماہانہ جائزہ کی معلومات لوڈ نہیں ہو سکیں۔');
            }
        };

        loadOptions();

        return () => {
            isMounted = false;
        };
    }, []);

    const classOptions = useMemo(() => (
        classes.length
            ? [...new Set(classes.map((item) => item.name).filter(Boolean))]
            : getUniqueOptions(students, 'className')
    ), [classes, students]);

    const sectionOptions = useMemo(() => {
        const setupSections = sections
            .filter((section) => !formData.className || section.class?.name === formData.className)
            .map((section) => section.name)
            .filter(Boolean);

        if (setupSections.length) return [...new Set(setupSections)];

        return getUniqueOptions(filterStudentsForHifz(students, formData.className, ''), 'sectionName');
    }, [formData.className, sections, students]);

    const filteredStudents = useMemo(
        () => {
            if (!formData.className && !formData.section) {
                return students;
            }

            return filterStudentsForHifz(students, formData.className, formData.section);
        },
        [formData.className, formData.section, students],
    );

    const selectedStudent = useMemo(
        () => students.find((student) => String(student.id) === String(formData.studentId)) || null,
        [formData.studentId, students],
    );

    const teacherOptions = useMemo(
        () => [...new Set(teachers.map((teacher) => teacher.fullName || teacher.name).filter(Boolean))],
        [teachers],
    );

    const teacherSelectOptions = useMemo(
        () => [...new Set([formData.teacher, ...teacherOptions].filter(Boolean))],
        [formData.teacher, teacherOptions],
    );

    const syncTableScroll = (source) => {
        const sourceRef = source === 'top' ? topScrollRef.current : tableScrollRef.current;
        const targetRef = source === 'top' ? tableScrollRef.current : topScrollRef.current;

        if (!sourceRef || !targetRef || targetRef.scrollLeft === sourceRef.scrollLeft) {
            return;
        }

        targetRef.scrollLeft = sourceRef.scrollLeft;
    };

    const loadSavedMonthlyRows = useCallback(async (studentId, year) => {
        if (!studentId) {
            return;
        }

        try {
            setIsLoadingSavedMonths(true);
            const params = new URLSearchParams({
                page: '1',
                limit: '100',
                status: 'active',
                studentId: String(studentId),
                year: String(year),
            });
            const result = await getMonthlyHifzEntries(params.toString());
            const savedEntries = result.items || [];

            setFormData((prev) => ({
                ...prev,
                monthlyRows: mergeRowsWithSavedEntries(savedEntries),
                remarks: savedEntries.find((entry) => entry.remarks)?.remarks || prev.remarks,
            }));
        } catch (error) {
            notify.error(error?.message || 'محفوظ شدہ ماہانہ جائزہ لوڈ نہیں ہو سکا۔');
        } finally {
            setIsLoadingSavedMonths(false);
        }
    }, []);

    useEffect(() => {
        if (!formData.studentId) {
            return;
        }

        loadSavedMonthlyRows(formData.studentId, getYearValue(formData.academicYear));
    }, [formData.studentId, formData.academicYear, loadSavedMonthlyRows]);

    const handleFieldChange = (field, value) => {
        setFormData((prev) => {
            const nextState = { ...prev, [field]: value };

            if (field === 'className') {
                nextState.section = '';
                nextState.studentId = '';
            }

            if (field === 'section') {
                nextState.studentId = '';
            }

            if (field === 'studentId') {
                const student = students.find((item) => String(item.id) === String(value));

                if (student) {
                    nextState.className = student.className || nextState.className;
                    nextState.section = student.sectionName || nextState.section;
                    nextState.teacher = student.teacherName || nextState.teacher;
                }

                if (!value) {
                    nextState.teacher = '';
                }
            }

            return nextState;
        });
    };

    const handleRowChange = (rowId, field, value) => {
        setFormData((prev) => ({
            ...prev,
            monthlyRows: prev.monthlyRows.map((row) => (
                row.id === rowId ? { ...row, [field]: value } : row
            )),
        }));
    };

    const buildRemarks = (row) => {
        const parts = [
            formData.teacher ? `استاد: ${formData.teacher}` : '',
            row.sabaqNama ? `سبق ناغہ: ${row.sabaqNama}` : '',
            row.sabqiNama ? `سبقی ناغہ: ${row.sabqiNama}` : '',
            row.manzilNama ? `منزل ناغہ: ${row.manzilNama}` : '',
            row.absentDays ? `غیر حاضری: ${row.absentDays}` : '',
            row.leaveDays ? `رخصت: ${row.leaveDays}` : '',
            row.transferStatus ? `امتحانی نمبرات: ${row.transferStatus}` : '',
            row.reason ? `وجہ: ${row.reason}` : '',
            formData.remarks ? `ریمارکس: ${formData.remarks}` : '',
        ].filter(Boolean);

        return parts.join(' | ') || undefined;
    };

    const buildPayload = (row) => ({
        studentId: Number(formData.studentId),
        month: hijriMonths.indexOf(row.monthName) + 1,
        year: getYearValue(formData.academicYear),
        startSabq: row.sabaqStart || undefined,
        endSabq: row.sabaqEnd || undefined,
        totalRecitation: row.totalKhwandagi || undefined,
        performanceStatus: row.transferStatus || 'جید',
        remarks: buildRemarks(row),
        status: 'active',
    });

    const saveRows = async (rowsToSave, successMessage) => {
        if (!formData.className || !formData.section || !formData.studentId) {
            notify.error('براہ کرم پہلے کلاس، سیکشن اور طالب علم منتخب کریں۔');
            return;
        }

        if (!rowsToSave.length) {
            notify.error('براہ کرم کم از کم ایک ماہ کی کارکردگی درج کریں۔');
            return;
        }

        try {
            setIsSaving(true);
            await Promise.all(rowsToSave.map((row) => createMonthlyHifzEntry(buildPayload(row))));
            notify.success(successMessage);
            await loadSavedMonthlyRows(formData.studentId, getYearValue(formData.academicYear));
        } catch (error) {
            notify.error(error?.message || 'ماہانہ جائزہ محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await saveRows(formData.monthlyRows.filter(rowHasContent), 'تمام ماہانہ جائزے محفوظ ہو گئے۔');
    };

    const handleRowSave = async (row) => {
        if (!rowHasContent(row)) {
            notify.error('اس ماہ کی کارکردگی درج کریں۔');
            return;
        }

        try {
            setSavingRowId(row.id);
            await saveRows([row], 'ایک ماہ کا جائزہ محفوظ ہو گیا۔');
        } finally {
            setSavingRowId('');
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-main)] p-3 md:p-6"
            dir="rtl"
        >
            <div className="max-w-[1650px] mx-auto space-y-6">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                                <BookOpen size={28} />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-black">ماہانہ جائزہ اندراج</h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-5">
                                    طالب علم منتخب کریں اور اس کی ماہ بہ ماہ کارکردگی درج کریں
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/hifz/monthly/list')}
                            className="px-5 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-input)] transition-all"
                        >
                            <ArrowRight size={18} />
                            واپس فہرست
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">کلاس<span className="text-red-500"> *</span></label>
                            <div className="relative">
                                <School className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <select required value={formData.className} onChange={(e) => handleFieldChange('className', e.target.value)} className={iconSelectFieldClassName}>
                                    <option value="">کلاس منتخب کریں</option>
                                    {classOptions.map((className) => (
                                        <option key={className} value={className}>{className}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">سیکشن<span className="text-red-500"> *</span></label>
                            <select required value={formData.section} onChange={(e) => handleFieldChange('section', e.target.value)} className={selectFieldClassName}>
                                <option value="">سیکشن منتخب کریں</option>
                                {sectionOptions.map((section) => (
                                    <option key={section} value={section}>{section}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">طالب علم<span className="text-red-500"> *</span></label>
                            <div className="relative">
                                <UserRound className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <select required value={formData.studentId} onChange={(e) => handleFieldChange('studentId', e.target.value)} className={iconSelectFieldClassName}>
                                    <option value="">طالب علم منتخب کریں</option>
                                    {filteredStudents.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.fullName} - {student.admissionNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">تعلیمی سال<span className="text-red-500"> *</span></label>
                            <input required type="text" value={formData.academicYear} onChange={(e) => handleFieldChange('academicYear', e.target.value)} placeholder="2026" className={baseFieldClassName} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">استاد</label>
                            <div className="relative">
                                <UserRound className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <TeacherSearchDropdown
                                    value={formData.teacher}
                                    options={teacherSelectOptions}
                                    placeholder="استاد کا نام"
                                    onChange={(value) => handleFieldChange('teacher', value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">مرکزی مہینہ</label>
                            <div className="relative">
                                <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <select value={formData.selectedMonth} onChange={(e) => handleFieldChange('selectedMonth', e.target.value)} className={iconSelectFieldClassName}>
                                    <option value="">مہینہ منتخب کریں</option>
                                    {hijriMonths.map((month) => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">داخلہ نمبر</label>
                            <input type="text" value={selectedStudent?.admissionNumber || ''} readOnly placeholder="خودکار" className={readOnlyFieldClassName} />
                        </div>
                    </div>
                </div>

                {selectedStudent && (
                    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm font-bold">
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">نام طالب علم: {selectedStudent.fullName}</div>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">ولدیت: {selectedStudent.fatherName}</div>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">کلاس: {selectedStudent.className} ({selectedStudent.sectionName})</div>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">داخلہ نمبر: {selectedStudent.admissionNumber}</div>
                        </div>
                    </div>
                )}

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-5 shadow-sm overflow-hidden">
                    {isLoadingSavedMonths && (
                        <div className="mb-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm font-bold text-[var(--color-text-muted)]">
                            محفوظ شدہ ماہانہ ریکارڈ لوڈ ہو رہا ہے...
                        </div>
                    )}
                    <div ref={topScrollRef} onScroll={() => syncTableScroll('top')} className="mb-2 overflow-x-auto">
                        <div className="h-1 min-w-[1820px]" />
                    </div>
                    <div ref={tableScrollRef} onScroll={() => syncTableScroll('table')} className="overflow-x-auto">
                        <table className="w-full min-w-[1820px] border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-[var(--color-bg)]">
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[170px]">مہینہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">آغاز سبق</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">اختتام سبق</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">کل خواندگی</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">سبق ناغہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">سبقی ناغہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">منزل ناغہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">غیر حاضری</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">رخصت / بیماری</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">امتحانی نمبرات</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[220px]">وجوہات</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">عمل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.monthlyRows.map((row, index) => {
                                    const isFocusedMonth = formData.selectedMonth && formData.selectedMonth === row.monthName;
                                    const rowClassName = isFocusedMonth
                                        ? 'bg-[var(--color-primary)]/10'
                                        : index % 2 === 0
                                            ? 'bg-transparent'
                                            : 'bg-[var(--color-bg)]/40';

                                    return (
                                        <tr key={row.id} className={rowClassName}>
                                            <td className="border border-[var(--color-border)] px-3 py-3 font-black">{row.monthName}</td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="text" value={row.sabaqStart} onChange={(e) => handleRowChange(row.id, 'sabaqStart', e.target.value)} placeholder="مثلاً 5واں پارہ" className={tableInputClassName} /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="text" value={row.sabaqEnd} onChange={(e) => handleRowChange(row.id, 'sabaqEnd', e.target.value)} placeholder="مثلاً 7واں پارہ" className={tableInputClassName} /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="text" value={row.totalKhwandagi} onChange={(e) => handleRowChange(row.id, 'totalKhwandagi', e.target.value)} placeholder="کل مقدار" className={tableInputClassName} /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="number" min="0" value={row.sabaqNama} onChange={(e) => handleRowChange(row.id, 'sabaqNama', e.target.value)} placeholder="0" className={tableInputClassName} /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="number" min="0" value={row.sabqiNama} onChange={(e) => handleRowChange(row.id, 'sabqiNama', e.target.value)} placeholder="0" className={tableInputClassName} /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="number" min="0" value={row.manzilNama} onChange={(e) => handleRowChange(row.id, 'manzilNama', e.target.value)} placeholder="0" className={tableInputClassName} /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="number" min="0" value={row.absentDays} onChange={(e) => handleRowChange(row.id, 'absentDays', e.target.value)} placeholder="0" className={tableInputClassName} /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="number" min="0" value={row.leaveDays} onChange={(e) => handleRowChange(row.id, 'leaveDays', e.target.value)} placeholder="0" className={tableInputClassName} /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="text" value={row.transferStatus} onChange={(e) => handleRowChange(row.id, 'transferStatus', e.target.value)} placeholder="مثلاً جید" className={tableInputClassName} /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="text" value={row.reason} onChange={(e) => handleRowChange(row.id, 'reason', e.target.value)} placeholder="مختصر وجہ" className={tableInputClassName} /></td>
                                            <td className="border border-[var(--color-border)] p-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRowSave(row)}
                                                    disabled={isSaving || savingRowId === row.id}
                                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-xs font-black text-[#0b1120] shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <Save size={15} />
                                                    {savingRowId === row.id ? '...' : 'محفوظ'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 space-y-2">
                        <label className="text-xs font-black text-[var(--color-text-muted)]">عمومی ریمارکس</label>
                        <textarea value={formData.remarks} onChange={(e) => handleFieldChange('remarks', e.target.value)} placeholder="اس طالب علم کی ماہانہ مجموعی کیفیت یہاں لکھیں" className="w-full rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg)] py-3 px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)] min-h-[110px]" />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isSaving} className="w-full md:w-auto px-10 py-4 bg-[var(--color-primary)] text-[#0b1120] font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-60">
                        <Save size={20} />
                        {isSaving ? 'محفوظ ہو رہا ہے...' : 'تمام اندراجات محفوظ کریں'}
                    </button>
                </div>
            </div>
        </form>
    );
};

const TeacherSearchDropdown = ({ value, options, placeholder, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const filteredOptions = useMemo(() => {
        const query = String(value || '').trim().toLowerCase();
        const safeOptions = options.filter(Boolean);

        if (!query) {
            return safeOptions.slice(0, 8);
        }

        return safeOptions.filter((option) => String(option).toLowerCase().includes(query)).slice(0, 8);
    }, [options, value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative">
            <input
                type="text"
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className={iconSelectFieldClassName}
            />
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                aria-label="استاد منتخب کریں"
            >
                <ChevronDown size={18} />
            </button>
            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-30 max-h-64 w-full overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl">
                    {filteredOptions.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                            className="w-full rounded-xl px-4 py-3 text-right text-sm font-bold text-[var(--color-text-main)] transition-all hover:bg-[var(--color-bg)]"
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
