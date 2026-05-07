import React, { useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, Plus, Save, Trash2, UserRound } from 'lucide-react';

const createWeeklyRow = () => ({
    id: crypto.randomUUID(),
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

const initialFormState = {
    week: '',
    className: '',
    section: '',
    teacher: '',
    rows: [createWeeklyRow()],
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

export const WeeklyJaizaForm = () => {
    const [formData, setFormData] = useState(initialFormState);

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleRowChange = (rowId, field, value) => {
        setFormData((prev) => ({
            ...prev,
            rows: prev.rows.map((row) => (
                row.id === rowId ? { ...row, [field]: value } : row
            )),
        }));
    };

    const handleAddRow = () => {
        const lastRow = formData.rows[formData.rows.length - 1];

        if (!rowHasContent(lastRow)) {
            alert('پہلے موجودہ طالب علم کی کچھ تفصیل درج کریں، پھر نئی سطر شامل کریں۔');
            return;
        }

        setFormData((prev) => ({
            ...prev,
            rows: [...prev.rows, createWeeklyRow()],
        }));
    };

    const handleDeleteRow = (rowId) => {
        if (formData.rows.length === 1) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            rows: prev.rows.filter((row) => row.id !== rowId),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.week || !formData.className || !formData.section) {
            alert('براہ کرم ہفتہ، کلاس اور سیکشن کی معلومات پہلے مکمل کریں۔');
            return;
        }

        if (!formData.rows.some(rowHasContent)) {
            alert('براہ کرم کم از کم ایک طالب علم کا جائزہ درج کریں۔');
            return;
        }

        console.log('Weekly Jaiza saved:', formData);
        alert('ہفتہ وار جائزہ فارم کامیابی سے محفوظ ہو گیا۔');
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-main)] p-3 md:p-6"
            dir="rtl"
        >
            <div className="max-w-[1700px] mx-auto space-y-6">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                                <BookOpen size={28} />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl md:text-3xl font-black">ہفتہ وار جائزہ فارم</h1>
                                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-5">
                                    طلبہ حفظ کے ہفتہ وار جائزے کے نمبر، کیفیت اور سپارہ رینج درج کریں
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
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">ہفتہ / تاریخ</label>
                            <div className="relative">
                                <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                                <input
                                    type="text"
                                    value={formData.week}
                                    onChange={(e) => handleFormChange('week', e.target.value)}
                                    placeholder="مثلاً 1 تا 7 شعبان"
                                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pr-12 pl-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">کلاس</label>
                            <input
                                type="text"
                                value={formData.className}
                                onChange={(e) => handleFormChange('className', e.target.value)}
                                placeholder="مثلاً حفظ اول"
                                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">سیکشن</label>
                            <input
                                type="text"
                                value={formData.section}
                                onChange={(e) => handleFormChange('section', e.target.value)}
                                placeholder="A / B"
                                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-[var(--color-text-muted)]">استاد</label>
                            <input
                                type="text"
                                value={formData.teacher}
                                onChange={(e) => handleFormChange('teacher', e.target.value)}
                                placeholder="استاد کا نام"
                                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                            />
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
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">تہجی<br />کل نمبر 20</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[110px]">پنجہ<br />کل نمبر 10</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[120px]">خود خوانی<br />کل نمبر 10</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[130px]">کلاس میں<br />کردہ نمبر</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[160px]">کیفیت</th>
                                    <th className="border border-[var(--color-border)] px-2 py-3 font-black min-w-[80px]">حذف</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.rows.map((row, index) => (
                                    <tr key={row.id} className={index % 2 === 0 ? 'bg-transparent' : 'bg-[var(--color-bg)]/40'}>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <div className="relative">
                                                <UserRound className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={16} />
                                                <input
                                                    type="text"
                                                    value={row.studentName}
                                                    onChange={(e) => handleRowChange(row.id, 'studentName', e.target.value)}
                                                    placeholder="طالب علم / ولدیت"
                                                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pr-9 pl-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                                />
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
                                            <input type="text" value={row.classWork} onChange={(e) => handleRowChange(row.id, 'classWork', e.target.value)} placeholder="کلاس ورک" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <input type="text" value={row.quality} onChange={(e) => handleRowChange(row.id, 'quality', e.target.value)} placeholder="مثلاً جید" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]" />
                                        </td>
                                        <td className="border border-[var(--color-border)] p-2">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteRow(row.id)}
                                                disabled={formData.rows.length === 1}
                                                className={`mx-auto h-10 w-10 rounded-xl flex items-center justify-center transition-all ${formData.rows.length === 1 ? 'bg-red-500/5 text-red-300 cursor-not-allowed' : 'border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
                        ہفتہ وار جائزہ محفوظ کریں
                    </button>
                </div>
            </div>
        </form>
    );
};
