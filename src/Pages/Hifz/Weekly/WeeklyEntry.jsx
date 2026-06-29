import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Plus, Save, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemedDatePicker } from '../../../Components/DatePicker/ThemedDatePicker';
import { getClasses, getSections } from '../../../Constant/AcademicSetupApi';
import { createWeeklyHifzEntry } from '../../../Constant/HifzApi';
import { getStudents } from '../../../Constant/StudentsApi';
import { getTeachers } from '../../../Constant/TeachersApi';
import { getUniqueOptions, mapStudentsForHifz } from '../HifzUi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';
import { createClientId } from '../../../Utils/createClientId';

/* eslint-disable no-sparse-arrays */

const createWeeklyRow = () => ({
    id: createClientId(),
    studentId: '',
    studentName: '',
    siparaFrom: '',
    siparaTo: '',
    sawal1: '',
    sawal2: '',
    sawal3: '',
    tahajji: '',
    panja: '',
    khudKhwani: '',
    classWork: '',
    quality: '',
});

const qualityOptions = ['ممتاز','ممتاز مع شرف', 'بہتر', 'مناسب', , 'کمزور'];

const initialFormState = {
    weekStartDate: '',
    weekEndDate: '',
    className: '',
    section: '',
    teacher: '',
    rows: [createWeeklyRow()],
};

const formatDateForDisplay = (value) => {
    if (!value) return '';
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('ur-PK');
};

const rowHasContent = (row) => {
    return [
        row.studentName,
        row.siparaFrom,
        row.siparaTo,
        row.sawal1,
        row.sawal2,
        row.sawal3,
        row.tahajji,
        row.panja,
        row.khudKhwani,
        row.classWork,
        row.quality,
    ].some((value) => String(value).trim() !== '');
};

const getWeeklyTotalMarks = (row) => {
    const fields = ['sawal1', 'sawal2', 'sawal3', 'tahajji', 'panja', 'khudKhwani'];

    return fields.reduce((total, field) => {
        const value = Number(row[field]);
        return Number.isFinite(value) ? total + value : total;
    }, 0);
};

export const WeeklyJaizaForm = () => {
    const navigate = useNavigate();
    const notify = useNotifier();
    const [formData, setFormData] = useState(initialFormState);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

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
                notify.error(error?.message || 'معلومات لوڈ نہیں ہو سکیں۔');
            }
        };

        loadOptions();

        return () => {
            isMounted = false;
        };
    }, []);

    const studentOptions = useMemo(
        () => students.map((student) => ({
            ...student,
            label: `${student.fullName} - ${student.admissionNumber}`,
        })),
        [students],
    );

    const classOptions = useMemo(
        () => (classes.length
            ? [...new Set(classes.map((item) => item.name).filter(Boolean))]
            : getUniqueOptions(students, 'className')),
        [classes, students],
    );

    const sectionOptions = useMemo(
        () => {
            const setupSections = sections
                .filter((section) => !formData.className || section.class?.name === formData.className)
                .map((section) => section.name)
                .filter(Boolean);

            if (setupSections.length) return [...new Set(setupSections)];

            return getUniqueOptions(
                students.filter((student) => !formData.className || student.className === formData.className),
                'sectionName',
            );
        },
        [sections, students, formData.className],
    );

    const teacherOptions = useMemo(
        () => [...new Set(teachers
            .map((teacher) => teacher.fullName || teacher.name)
            .filter(Boolean))],
        [teachers],
    );

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
            ...(field === 'className' ? { section: '' } : {}),
        }));
    };

    const handleRowChange = (rowId, field, value) => {
        setFormData((prev) => ({
            ...prev,
            rows: prev.rows.map((row) => (
                row.id === rowId
                    ? {
                        ...row,
                        [field]: value,
                        ...(field === 'studentName'
                            ? { studentId: studentOptions.find((student) => student.label === value)?.id || '' }
                            : {}),
                    }
                    : row
            )),
        }));
    };

    const handleAddRow = () => {
        const lastRow = formData.rows[formData.rows.length - 1];

        if (!rowHasContent(lastRow)) {
            notify.error('پہلے موجودہ طالب علم کی کچھ تفصیل درج کریں، پھر نئی سطر شامل کریں۔');
            return;
        }

        setFormData((prev) => ({
            ...prev,
            rows: [...prev.rows, createWeeklyRow()],
        }));
    };

    const toOptionalNumber = (value) => {
        if (value === '' || value === undefined || value === null) return undefined;
        return Number(value);
    };

    const buildPayload = (row) => {
        const student = studentOptions.find((item) => item.id === row.studentId || item.label === row.studentName);
        const { weekStartDate, weekEndDate } = formData;

        return {
            studentId: Number(student?.id || row.studentId),
            weekLabel: `${formatDateForDisplay(weekStartDate)} تا ${formatDateForDisplay(weekEndDate)}`,
            className: formData.className || undefined,
            sectionName: formData.section || undefined,
            teacherName: formData.teacher || undefined,
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
            classWork: String(getWeeklyTotalMarks(row)),
            performanceStatus: row.quality || 'جید',
            remarks: row.quality || undefined,
            status: 'active',
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.weekStartDate || !formData.weekEndDate || !formData.className || !formData.section) {
            notify.error('براہ کرم شروع کی تاریخ، اختتامی تاریخ، کلاس اور سیکشن کی معلومات پہلے مکمل کریں۔');
            return;
        }

        if (formData.weekEndDate < formData.weekStartDate) {
            notify.error('اختتامی تاریخ شروع کی تاریخ سے پہلے نہیں ہو سکتی۔');
            return;
        }

        if (!formData.rows.some(rowHasContent)) {
            notify.error('براہ کرم کم از کم ایک طالب علم کا جائزہ درج کریں۔');
            return;
        }

        const rowsToSave = formData.rows.filter(rowHasContent);
        const rowWithoutStudent = rowsToSave.find((row) => {
            const student = studentOptions.find((item) => item.id === row.studentId || item.label === row.studentName);
            return !student;
        });

        if (rowWithoutStudent) {
            notify.error('براہ کرم ہر سطر میں فہرست سے درست طالب علم منتخب کریں۔');
            return;
        }

        try {
            setIsSaving(true);
            await Promise.all(rowsToSave.map((row) => createWeeklyHifzEntry(buildPayload(row))));
            notify.success('ہفتہ وار جائزہ ڈیٹابیس میں محفوظ ہو گیا۔');
            setFormData(initialFormState);
        } catch (error) {
            notify.error(error?.message || 'ہفتہ وار جائزہ محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }

    };

    return (
        <form
            onSubmit={handleSubmit}
            className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-main)] p-3 md:p-6"
            dir="rtl"
        >
            <div className="max-w-[1700px] mx-auto space-y-6">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                                <BookOpen size={28} />
                            </div>
                            <div className="space-y-1 text-right">
                                <h1 className="text-3xl font-black">ہفتہ وار جائزہ فارم</h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-5">
                                    طلبہ حفظ کے ہفتہ وار جائزے کے نمبر، کیفیت اور سپارہ رینج درج کریں
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/hifz/weekly/list')}
                            className="shrink-0 px-5 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-input)] transition-all"
                        >
                            <ArrowRight size={18} />
                            واپس فہرست
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <div className="min-w-0">
                            <ThemedDatePicker
                                required
                                label="کب سے"
                                value={formData.weekStartDate}
                                onChange={(value) => handleFormChange('weekStartDate', value)}
                                max={formData.weekEndDate || undefined}
                                placeholder="شروع کی تاریخ منتخب کریں"
                                size="sm"
                            />
                        </div>

                        <div className="min-w-0">
                            <ThemedDatePicker
                                required
                                label="کب تک"
                                value={formData.weekEndDate}
                                onChange={(value) => handleFormChange('weekEndDate', value)}
                                min={formData.weekStartDate || undefined}
                                placeholder="اختتامی تاریخ منتخب کریں"
                                size="sm"
                            />
                        </div>

                        <div className="min-w-0 space-y-2">
                            <label className="mr-2 block text-xs font-black text-[var(--color-text-muted)]">کلاس<span className="text-red-500"> *</span></label>
                            <select
                                required
                                value={formData.className}
                                onChange={(e) => handleFormChange('className', e.target.value)}
                                className="w-full h-14 appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm leading-7 font-bold outline-none focus:border-[var(--color-primary)]"
                            >
                                <option value="">مثلاً حفظ اول</option>
                                {classOptions.map((className) => (
                                    <option key={className} value={className}>{className}</option>
                                ))}
                            </select>
                        </div>

                        <div className="min-w-0 space-y-2">
                            <label className="mr-2 block text-xs font-black text-[var(--color-text-muted)]">سیکشن<span className="text-red-500"> *</span></label>
                            <select
                                required
                                value={formData.section}
                                onChange={(e) => handleFormChange('section', e.target.value)}
                                className="w-full h-14 appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm leading-7 font-bold outline-none focus:border-[var(--color-primary)]"
                            >
                                <option value="">A / B</option>
                                {sectionOptions.map((sectionName) => (
                                    <option key={sectionName} value={sectionName}>{sectionName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="min-w-0 space-y-2">
                            <label className="mr-2 block text-xs font-black text-[var(--color-text-muted)]">استاد</label>
                            <select
                                value={formData.teacher}
                                onChange={(e) => handleFormChange('teacher', e.target.value)}
                                className="w-full h-14 appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm leading-7 font-bold outline-none focus:border-[var(--color-primary)]"
                            >
                                <option value="">استاد کا نام</option>
                                {teacherOptions.map((teacherName) => (
                                    <option key={teacherName} value={teacherName}>{teacherName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5 shadow-sm space-y-4">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="h-[50px] min-w-[170px] px-5 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-primary)] hover:text-[#0b1120] transition-all"
                        >
                            <Plus size={18} />
                            نئی سطر
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1750px] border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-[var(--color-bg)]">
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[240px]">نام مع ولدیت</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">سپارہ شروع</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">سپارہ اختتام</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">سوال 1 نمبر<br />کل نمبر 20</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">سوال 2 نمبر<br />کل نمبر 20</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">سوال 3 نمبر<br />کل نمبر 20</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">تجوید<br />کل نمبر 20</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">لہجہ<br />کل نمبر 10</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">خود اعتمادی<br />کل نمبر 10</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">کل حاسل<br />کردہ نمبر</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[160px]">کیفیت</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.rows.map((row, index) => (
                                    <tr key={row.id} className={index % 2 === 0 ? 'bg-transparent' : 'bg-[var(--color-bg)]/40'}>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <div className="relative">
                                                <UserRound className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={16} />
                                                <select
                                                    value={row.studentName}
                                                    onChange={(e) => handleRowChange(row.id, 'studentName', e.target.value)}
                                                    className="w-full h-11 appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-9 pl-3 text-right text-sm leading-7 font-bold outline-none focus:border-[var(--color-primary)]"
                                                >
                                                    <option value="">طالب علم / ولدیت</option>
                                                    {studentOptions.map((student) => (
                                                        <option key={student.id} value={student.label}>{student.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input
                                                type="text"
                                                value={row.siparaFrom}
                                                onChange={(e) => handleRowChange(row.id, 'siparaFrom', e.target.value)}
                                                placeholder="مثلاً 5"
                                                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                            />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input
                                                type="text"
                                                value={row.siparaTo}
                                                onChange={(e) => handleRowChange(row.id, 'siparaTo', e.target.value)}
                                                placeholder="مثلاً 8"
                                                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                            />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input type="number" min="0" max="20" value={row.sawal1} onChange={(e) => handleRowChange(row.id, 'sawal1', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input type="number" min="0" max="20" value={row.sawal2} onChange={(e) => handleRowChange(row.id, 'sawal2', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input type="number" min="0" max="20" value={row.sawal3} onChange={(e) => handleRowChange(row.id, 'sawal3', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input type="number" min="0" max="20" value={row.tahajji} onChange={(e) => handleRowChange(row.id, 'tahajji', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input type="number" min="0" max="10" value={row.panja} onChange={(e) => handleRowChange(row.id, 'panja', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input type="number" min="0" max="10" value={row.khudKhwani} onChange={(e) => handleRowChange(row.id, 'khudKhwani', e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input type="text" value={getWeeklyTotalMarks(row) || ''} readOnly placeholder="کلاس ورک" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <select
                                                value={row.quality}
                                                onChange={(e) => handleRowChange(row.id, 'quality', e.target.value)}
                                                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                            >
                                                <option value="">کیفیت منتخب کریں</option>
                                                {qualityOptions.map((option) => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isSaving} className="w-full md:w-auto px-10 py-4 bg-[var(--color-primary)] text-[#0b1120] font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-60">
                        <Save size={20} />
                        ہفتہ وار جائزہ محفوظ کریں
                    </button>
                </div>
            </div>
        </form>
    );
};
