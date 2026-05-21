import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, Save, Search, UserRound } from 'lucide-react';
import { ThemedDatePicker } from '../../../Components/DatePicker/ThemedDatePicker';
import { getStudentProfiles } from '../../../Constant/StudentProfiles';
import { saveSiparaJaizaEntry } from '../../../Constant/SiparaHifzStore';

const siparaRowsTemplate = [
    { paraNo: 30, paraName: 'عم' },
    { paraNo: 29, paraName: 'تبارک الذی' },
    { paraNo: 28, paraName: 'قد سمع اللہ' },
    { paraNo: 27, paraName: 'قال فما خطبکم' },
    { paraNo: 26, paraName: 'حم' },
    { paraNo: 25, paraName: 'الیہ یرد' },
    { paraNo: 24, paraName: 'فمن اظلم' },
    { paraNo: 23, paraName: 'وما لی' },
    { paraNo: 22, paraName: 'ومن یقنت' },
    { paraNo: 21, paraName: 'اتل ما اوحی' },
    { paraNo: 20, paraName: 'امن خلق' },
    { paraNo: 19, paraName: 'وقال الذین' },
    { paraNo: 18, paraName: 'قد افلح' },
    { paraNo: 17, paraName: 'اقترب للناس' },
    { paraNo: 16, paraName: 'قال الم' },
    { paraNo: 15, paraName: 'سبحن الذی' },
    { paraNo: 14, paraName: 'ربما' },
    { paraNo: 13, paraName: 'وما ابری' },
    { paraNo: 12, paraName: 'وما من دابۃ' },
    { paraNo: 11, paraName: 'یعتذرون' },
    { paraNo: 10, paraName: 'واعلموا' },
    { paraNo: 9, paraName: 'قال الملا' },
    { paraNo: 8, paraName: 'ولو اننا' },
    { paraNo: 7, paraName: 'واذا سمعوا' },
    { paraNo: 6, paraName: 'لا یحب اللہ' },
    { paraNo: 5, paraName: 'والمحصنات' },
    { paraNo: 4, paraName: 'لن تنالوا' },
    { paraNo: 3, paraName: 'تلک الرسل' },
    { paraNo: 2, paraName: 'سیقول' },
    { paraNo: 1, paraName: 'الم' },
];

const createSiparaRow = (row) => ({
    id: crypto.randomUUID(),
    paraNo: row.paraNo,
    paraName: row.paraName,
    startDate: '',
    completionDate: '',
    totalDays: '',
    remarks: '',
});

const createInitialFormData = () => ({
    studentId: '',
    studentSearch: '',
    rows: siparaRowsTemplate.map(createSiparaRow),
});

export const ParaJaizaEntry = () => {
    const students = useMemo(() => getStudentProfiles(), []);
    const [formData, setFormData] = useState(createInitialFormData);
    const [showResults, setShowResults] = useState(false);

    const filteredStudents = useMemo(() => {
        const query = formData.studentSearch.trim().toLowerCase();

        if (!query) {
            return students.slice(0, 8);
        }

        return students.filter((student) => {
            const name = student.personal?.fullName?.toLowerCase() || '';
            const father = student.personal?.fatherName?.toLowerCase() || '';
            const idNo = student.admission?.idNo?.toLowerCase() || '';
            return name.includes(query) || father.includes(query) || idNo.includes(query);
        }).slice(0, 8);
    }, [formData.studentSearch, students]);

    const selectedStudent = useMemo(() => (
        students.find((student) => student.id === formData.studentId || student.admission?.idNo === formData.studentId) || null
    ), [formData.studentId, students]);

    const handleRowChange = (rowId, field, value) => {
        setFormData((prev) => ({
            ...prev,
            rows: prev.rows.map((row) => (
                row.id === rowId ? { ...row, [field]: value } : row
            )),
        }));
    };

    const handleStudentSelect = (student) => {
        setFormData((prev) => ({
            ...prev,
            studentId: student.id,
            studentSearch: `${student.personal?.fullName} - ${student.admission?.idNo}`,
        }));
        setShowResults(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedStudent) {
            alert('براہ کرم پہلے طالب علم منتخب کریں۔');
            return;
        }

        const hasData = formData.rows.some((row) =>
            [row.startDate, row.completionDate, row.totalDays, row.remarks].some((value) => String(value).trim() !== '')
        );

        if (!hasData) {
            alert('براہ کرم کم از کم ایک سپارہ کی تفصیل درج کریں۔');
            return;
        }

        const payload = {
            studentId: selectedStudent.id,
            studentName: selectedStudent.personal?.fullName || '',
            fatherName: selectedStudent.personal?.fatherName || '',
            className: selectedStudent.classInfo?.className || '',
            section: selectedStudent.classInfo?.section || '',
            teacher: selectedStudent.education?.teacherName || '',
            admissionDate: selectedStudent.admission?.admissionDate || '',
            rows: formData.rows,
        };

        saveSiparaJaizaEntry(payload);
        console.log('Sipara Jaiza saved:', payload);
        alert('سپارہ جائزہ کامیابی سے محفوظ ہو گیا۔');
    };

    return (
        <form onSubmit={handleSubmit} className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-main)] p-3 md:p-6" dir="rtl">
            <div className="max-w-[1700px] mx-auto space-y-6">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                                <BookOpen size={28} />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl md:text-3xl font-black">سپارہ جائزہ اندراج</h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-5">
                                    طالب علم منتخب کریں اور سپاروں کی آغاز، اختتام، کل ایام اور کیفیت درج کریں
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="px-5 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-input)] transition-all"
                        >
                            <ArrowRight size={18} />
                            واپس فہرست
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                            <input
                                type="text"
                                value={formData.studentSearch}
                                onChange={(e) => {
                                    setFormData((prev) => ({ ...prev, studentSearch: e.target.value, studentId: '' }));
                                    setShowResults(true);
                                }}
                                onFocus={() => setShowResults(true)}
                                placeholder="طالب علم تلاش کریں"
                                className="w-full h-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pr-12 pl-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
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
                                            <div className="font-black text-sm">{student.personal?.fullName}</div>
                                            <div className="text-xs text-[var(--color-text-muted)] font-bold">
                                                {student.personal?.fatherName} | {student.admission?.idNo}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 h-14 flex items-center justify-between text-sm font-bold">
                            <span>ولدیت:</span>
                            <span>{selectedStudent?.personal?.fatherName || '____________'}</span>
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 h-14 flex items-center justify-between text-sm font-bold">
                            <span>استاد:</span>
                            <span>{selectedStudent?.education?.teacherName || '____________'}</span>
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 h-14 flex items-center justify-between text-sm font-bold">
                            <span>تاریخ داخلہ:</span>
                            <span>{selectedStudent?.admission?.admissionDate || '____________'}</span>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 h-14 flex items-center justify-between text-sm font-bold">
                            <span>کلاس:</span>
                            <span>{selectedStudent?.classInfo?.className || '____________'}</span>
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 h-14 flex items-center justify-between text-sm font-bold">
                            <span>سیکشن:</span>
                            <span>{selectedStudent?.classInfo?.section || '____________'}</span>
                        </div>
                        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 h-14 flex items-center justify-between text-sm font-bold">
                            <span>رول نمبر:</span>
                            <span>{selectedStudent?.classInfo?.rollNo || '____________'}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1500px] border-collapse text-center text-sm">
                            <thead>
                                <tr className="bg-[var(--color-bg)]">
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[90px]">پارہ نمبر</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[180px]">نام پارہ</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">تاریخ آغاز</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[150px]">تاریخ اختتام</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">کل ایام</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[260px]">سبق کی ادائی / کیفیت</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.rows.map((row, index) => (
                                    <tr key={row.id} className={index % 2 === 0 ? 'bg-transparent' : 'bg-[var(--color-bg)]/40'}>
                                        <td className="border border-[var(--color-border)] px-2 py-3 font-black">{row.paraNo}</td>
                                        <td className="border border-[var(--color-border)] px-2 py-3 font-bold">{row.paraName}</td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <ThemedDatePicker
                                                value={row.startDate}
                                                onChange={(e) => handleRowChange(row.id, 'startDate', e.target.value)}
                                                placeholder="تاریخ آغاز"
                                                size="sm"
                                                className="w-full"
                                            />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <ThemedDatePicker
                                                value={row.completionDate}
                                                onChange={(e) => handleRowChange(row.id, 'completionDate', e.target.value)}
                                                placeholder="تاریخ اختتام"
                                                size="sm"
                                                className="w-full"
                                            />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input type="text" value={row.totalDays} onChange={(e) => handleRowChange(row.id, 'totalDays', e.target.value)} placeholder="کل ایام" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input type="text" value={row.remarks} onChange={(e) => handleRowChange(row.id, 'remarks', e.target.value)} placeholder="کوالٹی / تبصرہ" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button type="submit" className="w-full md:w-auto px-10 py-4 bg-[var(--color-primary)] text-[#0b1120] font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Save size={20} />
                        سپارہ جائزہ محفوظ کریں
                    </button>
                </div>
            </div>
        </form>
    );
};
