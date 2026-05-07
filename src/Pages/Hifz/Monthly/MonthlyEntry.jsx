import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, Save, School, UserRound } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getStudentProfiles, subscribeToStudentProfiles } from '../../../Constant/StudentProfiles';
import { getMonthlyJaizaEntryById, saveMonthlyJaizaEntry } from '../../../Constant/MonthlyHifzStore';

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
    id: crypto.randomUUID(),
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
    campus: '',
    className: '',
    section: '',
    teacher: '',
    studentId: '',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
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

export const MonthlyJaizaEntry = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [students, setStudents] = useState(() => getStudentProfiles());
    const [formData, setFormData] = useState(createInitialFormData);
    const [editingId, setEditingId] = useState('');

    const editId = searchParams.get('edit');

    useEffect(() => {
        const unsubscribe = subscribeToStudentProfiles((profiles) => {
            setStudents(profiles);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!editId) {
            setEditingId('');
            setFormData(createInitialFormData());
            return;
        }

        const savedEntry = getMonthlyJaizaEntryById(editId);

        if (!savedEntry) {
            return;
        }

        setEditingId(savedEntry.id);
        setFormData({
            ...createInitialFormData(),
            ...savedEntry,
            monthlyRows: hijriMonths.map((monthName) => {
                const existingRow = savedEntry.monthlyRows?.find((row) => row.monthName === monthName);
                return existingRow
                    ? { ...createMonthRow(monthName), ...existingRow }
                    : createMonthRow(monthName);
            }),
        });
    }, [editId]);

    const classOptions = useMemo(() => (
        [...new Set(students.map((student) => student.classInfo?.className).filter(Boolean))]
    ), [students]);

    const sectionOptions = useMemo(() => {
        const scopedStudents = formData.className
            ? students.filter((student) => student.classInfo?.className === formData.className)
            : students;

        return [...new Set(scopedStudents.map((student) => student.classInfo?.section).filter(Boolean))];
    }, [formData.className, students]);

    const filteredStudents = useMemo(() => (
        students.filter((student) => {
            const matchesClass = formData.className ? student.classInfo?.className === formData.className : true;
            const matchesSection = formData.section ? student.classInfo?.section === formData.section : true;
            return matchesClass && matchesSection;
        })
    ), [formData.className, formData.section, students]);

    const selectedStudent = useMemo(() => (
        students.find((student) => student.id === formData.studentId || student.admission?.idNo === formData.studentId) || null
    ), [formData.studentId, students]);

    useEffect(() => {
        if (!selectedStudent) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            campus: selectedStudent.classInfo?.campus || '',
            className: selectedStudent.classInfo?.className || prev.className,
            section: selectedStudent.classInfo?.section || prev.section,
            teacher: selectedStudent.education?.teacherName || prev.teacher,
        }));
    }, [selectedStudent]);

    const handleFieldChange = (field, value) => {
        setFormData((prev) => {
            const nextState = { ...prev, [field]: value };

            if (field === 'className') {
                nextState.section = '';
                nextState.studentId = '';
                nextState.teacher = '';
                nextState.campus = '';
            }

            if (field === 'section') {
                nextState.studentId = '';
                nextState.teacher = '';
                nextState.campus = '';
            }

            if (field === 'studentId' && !value) {
                nextState.teacher = '';
                nextState.campus = '';
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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.className || !formData.section || !formData.studentId) {
            alert('براہ کرم پہلے کلاس، سیکشن اور طالب علم منتخب کریں۔');
            return;
        }

        if (!formData.monthlyRows.some(rowHasContent)) {
            alert('براہ کرم کم از کم ایک ماہ کی کارکردگی درج کریں۔');
            return;
        }

        const savedEntry = saveMonthlyJaizaEntry({
            ...formData,
            id: editingId || undefined,
        });

        setEditingId(savedEntry.id);
        setSearchParams({ edit: savedEntry.id });
        console.log('Monthly Jaiza saved:', savedEntry);
        alert(editingId ? 'ماہانہ جائزہ کامیابی سے اپڈیٹ ہو گیا۔' : 'ماہانہ جائزہ کامیابی سے محفوظ ہو گیا۔');
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
                                <h1 className="text-2xl md:text-3xl font-black">{editingId ? 'ماہانہ جائزہ میں ترمیم' : 'ماہانہ جائزہ اندراج'}</h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-5">
                                    {editingId ? 'محفوظ شدہ ریکارڈ میں تبدیلی کریں اور دوبارہ محفوظ کریں' : 'طالب علم منتخب کریں اور اس کی ماہ بہ ماہ کارکردگی درج کریں'}
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
                            <label className="text-xs font-black text-[var(--color-text-muted)]">کلاس</label>
                            <div className="relative">
                                <School className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <select value={formData.className} onChange={(e) => handleFieldChange('className', e.target.value)} className={iconSelectFieldClassName}>
                                    <option value="">کلاس منتخب کریں</option>
                                    {classOptions.map((className) => (
                                        <option key={className} value={className}>{className}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">سیکشن</label>
                            <select value={formData.section} onChange={(e) => handleFieldChange('section', e.target.value)} className={selectFieldClassName}>
                                <option value="">سیکشن منتخب کریں</option>
                                {sectionOptions.map((section) => (
                                    <option key={section} value={section}>{section}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">طالب علم</label>
                            <div className="relative">
                                <UserRound className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <select value={formData.studentId} onChange={(e) => handleFieldChange('studentId', e.target.value)} className={iconSelectFieldClassName}>
                                    <option value="">طالب علم منتخب کریں</option>
                                    {filteredStudents.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.personal?.fullName} - {student.personal?.fatherName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">تعلیمی سال</label>
                            <input type="text" value={formData.academicYear} onChange={(e) => handleFieldChange('academicYear', e.target.value)} placeholder="1447ھ / 2026" className={baseFieldClassName} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">کیمپس</label>
                            <input type="text" value={formData.campus} readOnly placeholder="طالب علم منتخب کریں" className={readOnlyFieldClassName} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">استاد</label>
                            <input type="text" value={formData.teacher} onChange={(e) => handleFieldChange('teacher', e.target.value)} placeholder="استاد کا نام" className={baseFieldClassName} />
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
                            <label className="text-xs font-black text-[var(--color-text-muted)]">رول نمبر</label>
                            <input type="text" value={selectedStudent?.classInfo?.rollNo || ''} readOnly placeholder="خودکار" className={readOnlyFieldClassName} />
                        </div>
                    </div>
                </div>

                {selectedStudent && (
                    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 text-sm font-bold">
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">نام طالب علم: {selectedStudent.personal?.fullName}</div>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">ولدیت: {selectedStudent.personal?.fatherName}</div>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">تاریخ داخلہ: {selectedStudent.admission?.admissionDate || '-'}</div>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">کلاس: {selectedStudent.classInfo?.className} ({selectedStudent.classInfo?.section})</div>
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">شناخت: {selectedStudent.admission?.idNo}</div>
                        </div>
                    </div>
                )}

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1700px] border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-[var(--color-bg)]">
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[170px]">مہینہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">آغاز سبق</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">اختتام سبق</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">کل خواندگی</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">سبق نامہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">سبقی نامہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">منزل نامہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">غیر حاضری</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">رخصت / بیماری</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">انتقال / فراغت</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[220px]">وجوہات</th>
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
                                            <td className="border border-[var(--color-border)] p-2"><input type="text" value={row.sabaqStart} onChange={(e) => handleRowChange(row.id, 'sabaqStart', e.target.value)} placeholder="مثلاً 5واں پارہ" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="text" value={row.sabaqEnd} onChange={(e) => handleRowChange(row.id, 'sabaqEnd', e.target.value)} placeholder="مثلاً 7واں پارہ" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="text" value={row.totalKhwandagi} onChange={(e) => handleRowChange(row.id, 'totalKhwandagi', e.target.value)} placeholder="کل مقدار" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="number" min="0" value={row.sabaqNama} onChange={(e) => handleRowChange(row.id, 'sabaqNama', e.target.value)} placeholder="0" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="number" min="0" value={row.sabqiNama} onChange={(e) => handleRowChange(row.id, 'sabqiNama', e.target.value)} placeholder="0" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="number" min="0" value={row.manzilNama} onChange={(e) => handleRowChange(row.id, 'manzilNama', e.target.value)} placeholder="0" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="number" min="0" value={row.absentDays} onChange={(e) => handleRowChange(row.id, 'absentDays', e.target.value)} placeholder="0" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="number" min="0" value={row.leaveDays} onChange={(e) => handleRowChange(row.id, 'leaveDays', e.target.value)} placeholder="0" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="text" value={row.transferStatus} onChange={(e) => handleRowChange(row.id, 'transferStatus', e.target.value)} placeholder="اگر کوئی ہو" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" /></td>
                                            <td className="border border-[var(--color-border)] p-2"><input type="text" value={row.reason} onChange={(e) => handleRowChange(row.id, 'reason', e.target.value)} placeholder="مختصر وجہ" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" /></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 space-y-2">
                        <label className="text-xs font-black text-[var(--color-text-muted)]">عمومی ریمارکس</label>
                        <textarea value={formData.remarks} onChange={(e) => handleFieldChange('remarks', e.target.value)} placeholder="اس طالب علم کی سالانہ یا ماہانہ مجموعی کیفیت یہاں لکھیں" className="w-full rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg)] py-3 px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)] min-h-[110px]" />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button type="submit" className="w-full md:w-auto px-10 py-4 bg-[var(--color-primary)] text-[#0b1120] font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Save size={20} />
                        {editingId ? 'ماہانہ جائزہ اپڈیٹ کریں' : 'ماہانہ جائزہ محفوظ کریں'}
                    </button>
                </div>
            </div>
        </form>
    );
};
