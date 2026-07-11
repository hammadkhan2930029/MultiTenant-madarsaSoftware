import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, User, School, BookOpen, Save, ArrowRight, ClipboardCheck, Plus, Trash2, Grid2x2Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemedDatePicker } from '../../../Components/DatePicker/ThemedDatePicker';
import { getStudents } from '../../../Constant/StudentsApi';
import { createDailyHifzEntry } from '../../../Constant/HifzApi';
import { getClasses, getSections } from '../../../Constant/AcademicSetupApi';
import { filterStudentsForHifz, getUniqueOptions, mapStudentsForHifz } from '../HifzUi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';
import { createClientId } from '../../../Utils/createClientId';

const qualityOptions = ['ممتاز', 'بہتر', 'جید', 'مقبول', 'مناسب'];

const createEntry = () => ({
    id: createClientId(),
    date: new Date().toISOString().split('T')[0],
    sabaq: { para: '', ruku: '', ayatFrom: '', ayatTo: '', mistake: '', atkann: '', teacher: '' },
    sabqi: { para: '', ruku: '', ayatFrom: '', ayatTo: '', mistake: '', atkann: '' },
    manzil_1: { para: '', ruku: '', ayatFrom: '', ayatTo: '', mistake: '', atkann: '' },
    manzil_2: { para: '', ruku: '', ayatFrom: '', ayatTo: '', mistake: '', atkann: '' },
    quality: '',
    remarks: '',
});

const initialFormData = {
    class: '',
    section: '',
    student: '',
    entries: [createEntry()],
};

const hasEntryContent = (entry) => {
    const values = [
        ...Object.values(entry.sabaq),
        ...Object.values(entry.sabqi),
        ...Object.values(entry.manzil_1),
        ...Object.values(entry.manzil_2),
        entry.quality,
        entry.remarks,
    ];

    return values.some((value) => String(value).trim() !== '');
};

export const DailyJaizaEntry = () => {
    const navigate = useNavigate();
    const notify = useNotifier();
    const [formData, setFormData] = useState(initialFormData);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadStudents = async () => {
            try {
                const [studentResult, classResult, sectionResult] = await Promise.all([
                    getStudents('page=1&limit=100&status=active'),
                    getClasses('page=1&limit=100&status=active'),
                    getSections('page=1&limit=100&status=active'),
                ]);
                if (isMounted) {
                    setStudents(mapStudentsForHifz(studentResult.items || []));
                    setClasses(classResult.items || []);
                    setSections(sectionResult.items || []);
                }
            } catch (error) {
                notify.error(error?.message || 'طلبہ لوڈ نہیں ہو سکے۔');
            }
        };

        loadStudents();

        return () => {
            isMounted = false;
        };
    }, []);

    const classOptions = useMemo(
        () => (classes.length ? classes.map((item) => item.name).filter(Boolean) : getUniqueOptions(students, 'className')),
        [classes, students],
    );
    const sectionOptions = useMemo(
        () => {
            const setupSections = sections
                .filter((section) => !formData.class || section.class?.name === formData.class)
                .map((section) => section.name)
                .filter(Boolean);

            return setupSections.length
                ? [...new Set(setupSections)]
                : getUniqueOptions(filterStudentsForHifz(students, formData.class, ''), 'sectionName');
        },
        [formData.class, sections, students],
    );
    const studentOptions = useMemo(
        () => filterStudentsForHifz(students, formData.class, formData.section),
        [formData.class, formData.section, students],
    );

    const handleChange = (field, value) => {
        setFormData((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'class') {
                next.section = '';
                next.student = '';
            }
            if (field === 'section') {
                next.student = '';
            }
            return next;
        });
    };

    const handleEntryChange = (entryId, section, field, value) => {
        setFormData((prev) => ({
            ...prev,
            entries: prev.entries.map((entry) => (
                entry.id === entryId
                    ? { ...entry, [section]: { ...entry[section], [field]: value } }
                    : entry
            ))
        }));
    };

    const handleEntryFieldChange = (entryId, field, value) => {
        setFormData((prev) => ({
            ...prev,
            entries: prev.entries.map((entry) => (
                entry.id === entryId ? { ...entry, [field]: value } : entry
            ))
        }));
    };

    const handleAddEntry = () => {
        const lastEntry = formData.entries[formData.entries.length - 1];

        if (!hasEntryContent(lastEntry)) {
            notify.error('پہلے موجودہ انٹری کی کچھ تفصیل درج کریں، پھر نئی انٹری شامل کریں۔');
            return;
        }

        setFormData((prev) => ({
            ...prev,
            entries: [...prev.entries, createEntry()]
        }));
    };

    const handleDeleteEntry = () => {
        if (!deleteTarget) return;

        if (formData.entries.length === 1) {
            setDeleteTarget(null);
            return;
        }

        setFormData((prev) => ({
            ...prev,
            entries: prev.entries.filter((entry) => entry.id !== deleteTarget.id)
        }));
        setDeleteTarget(null);
    };

    const toOptionalNumber = (value) => {
        if (value === '' || value === undefined || value === null) return undefined;
        return Number(value);
    };

    const buildPayload = (entry) => ({
        studentId: Number(formData.student),
        date: entry.date,
        sabq: entry.sabaq.para || undefined,
        sabqRuku: entry.sabaq.ruku || undefined,
        sabqAyatFrom: entry.sabaq.ayatFrom || undefined,
        sabqAyatTo: entry.sabaq.ayatTo || undefined,
        sabqTeacherName: entry.sabaq.teacher || undefined,
        sabqMistake: toOptionalNumber(entry.sabaq.mistake),
        sabqAtkann: toOptionalNumber(entry.sabaq.atkann),
        sabaqi: entry.sabqi.para || undefined,
        sabaqiRuku: entry.sabqi.ruku || undefined,
        sabaqiAyatFrom: entry.sabqi.ayatFrom || undefined,
        sabaqiAyatTo: entry.sabqi.ayatTo || undefined,
        sabaqiMistake: toOptionalNumber(entry.sabqi.mistake),
        sabaqiAtkann: toOptionalNumber(entry.sabqi.atkann),
        manzil: [entry.manzil_1.para, entry.manzil_2.para].filter(Boolean).join(' / ') || undefined,
        manzilBeforeDetail: [entry.manzil_1.para, entry.manzil_1.ruku, entry.manzil_1.ayatFrom && entry.manzil_1.ayatTo ? `${entry.manzil_1.ayatFrom}-${entry.manzil_1.ayatTo}` : ''].filter(Boolean).join(' | ') || undefined,
        manzilBeforePara: entry.manzil_1.para || undefined,
        manzilBeforeRuku: entry.manzil_1.ruku || undefined,
        manzilBeforeAyatFrom: entry.manzil_1.ayatFrom || undefined,
        manzilBeforeAyatTo: entry.manzil_1.ayatTo || undefined,
        manzilBeforeMistake: toOptionalNumber(entry.manzil_1.mistake),
        manzilBeforeAtkann: toOptionalNumber(entry.manzil_1.atkann),
        manzilAfterDetail: [entry.manzil_2.para, entry.manzil_2.ruku, entry.manzil_2.ayatFrom && entry.manzil_2.ayatTo ? `${entry.manzil_2.ayatFrom}-${entry.manzil_2.ayatTo}` : ''].filter(Boolean).join(' | ') || undefined,
        manzilAfterPara: entry.manzil_2.para || undefined,
        manzilAfterRuku: entry.manzil_2.ruku || undefined,
        manzilAfterAyatFrom: entry.manzil_2.ayatFrom || undefined,
        manzilAfterAyatTo: entry.manzil_2.ayatTo || undefined,
        manzilAfterMistake: toOptionalNumber(entry.manzil_2.mistake),
        manzilAfterAtkann: toOptionalNumber(entry.manzil_2.atkann),
        lessonDetail: entry.remarks || undefined,
        performanceStatus: entry.quality || 'جید',
        remarks: entry.remarks || undefined,
        status: 'active',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.class || !formData.section || !formData.student) {
            notify.error('براہ کرم پہلے کلاس، سیکشن اور طالب علم منتخب کریں۔');
            return;
        }

        if (!formData.entries.some(hasEntryContent)) {
            notify.error('براہ کرم کم از کم ایک جائزہ انٹری درج کریں۔');
            return;
        }

        const entriesToSave = formData.entries.filter(hasEntryContent);
        const duplicateDate = entriesToSave.find((entry, index) => (
            entriesToSave.findIndex((item) => item.date === entry.date) !== index
        ));

        if (duplicateDate) {
            notify.error('ایک طالب علم کے لیے ایک تاریخ پر صرف ایک یومیہ جائزہ محفوظ ہو سکتا ہے۔ ہر انٹری کی تاریخ الگ رکھیں۔');
            return;
        }

        try {
            setIsSaving(true);
            await Promise.all(entriesToSave.map((entry) => createDailyHifzEntry(buildPayload(entry))));
            notify.success('یومیہ جائزہ ڈیٹابیس میں محفوظ ہو گیا۔');
            setFormData(initialFormData);
        } catch (error) {
            notify.error(error?.message || 'یومیہ جائزہ محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }

        return;
    };

    return (
        <>
        <form
            onSubmit={handleSubmit}
            className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 bg-[var(--color-bg)] min-h-screen text-right"
            dir="rtl"
        >
            <div className="bg-[var(--color-surface)] rounded-[2rem] border border-[var(--color-border)] p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                            <ClipboardCheck size={30} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-[var(--color-text-main)]">یومیہ جائزہ اندراج</h1>
                            <p className="text-sm font-bold text-[var(--color-text-muted)] mt-5">طالب علم کی روزانہ کی کارکردگی درج کریں</p>
                        </div>
                    </div>
                    <button type="button" onClick={() => navigate('/hifz/daily/list')} className="px-6 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-main)] font-bold flex items-center gap-2 hover:bg-[var(--color-input)] transition-all">
                        <ArrowRight size={18} /> واپس فہرست
                    </button>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-[2rem] border border-[var(--color-border)] p-6 space-y-4">
                <div className="flex items-center grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-[var(--color-text-muted)] mr-2">کلاس منتخب کریں<span className="text-red-500"> *</span></label>
                        <div className="relative">
                            <School className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                            <select
                                required
                                className="w-full appearance-none bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl py-3 pr-12 pl-4 text-[var(--color-text-main)] font-bold focus:border-[var(--color-primary)] outline-none"
                                value={formData.class}
                                onChange={(e) => handleChange('class', e.target.value)}
                            >
                                <option value="">کلاس منتخب کریں</option>
                                {classOptions.map((className) => (
                                    <option key={className} value={className}>{className}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-[var(--color-text-muted)] mr-2">سیکشن<span className="text-red-500"> *</span></label>

                        <select
                            required
                            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl py-3 px-4 text-[var(--color-text-main)] font-bold focus:border-[var(--color-primary)] outline-none"
                            value={formData.section}
                            onChange={(e) => handleChange('section', e.target.value)}
                        >
                            <option value="">سیکشن منتخب کریں</option>
                            {sectionOptions.map((sectionName) => (
                                <option key={sectionName} value={sectionName}>{sectionName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-[var(--color-text-muted)] mr-2">طالب علم<span className="text-red-500"> *</span></label>
                        <div className="relative">
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
                            <select
                                required
                                className="w-full appearance-none bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl py-3 pr-12 pl-4 text-[var(--color-text-main)] font-bold focus:border-[var(--color-primary)] outline-none"
                                value={formData.student}
                                onChange={(e) => handleChange('student', e.target.value)}
                            >
                                <option value="">طالب علم منتخب کریں</option>
                                {studentOptions.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.fullName} - {student.admissionNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

            </div>

            {formData.entries.map((entry, index) => (
                <div key={entry.id} className="space-y-6">
                    <div className="bg-[var(--color-surface)] rounded-[2rem] border border-[var(--color-border)] p-5">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-black text-[var(--color-text-main)]">
                                    انٹری {index + 1}
                                </h2>
                                {formData.entries.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget({ id: entry.id, label: `انٹری ${index + 1}` })}
                                        className="h-10 w-10 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                        aria-label={`انٹری ${index + 1} حذف کریں`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2 w-full md:max-w-xs">
                                <label className="text-xs font-black text-[var(--color-text-muted)] mr-2">تاریخ<span className="text-red-500"> *</span></label>
                                <ThemedDatePicker
                                    value={entry.date}
                                    onChange={(value) => handleEntryFieldChange(entry.id, 'date', value)}
                                    placeholder="تاریخ منتخب کریں"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] p-6 space-y-4">
                            <h3 className="text-lg font-black text-[var(--color-primary)] flex items-center gap-2 mb-4">
                                <BookOpen size={20} /> سبق (Sabaq)
                            </h3>
                            <ReviewDetailFields section="sabaq" values={entry.sabaq} onChange={(field, value) => handleEntryChange(entry.id, 'sabaq', field, value)} showTeacher />
                        </div>

                        <div className="bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] p-6 space-y-4">
                            <h3 className="text-lg font-black text-blue-400 flex items-center gap-2 mb-4">
                                <ClipboardCheck size={20} /> سبقی (Sabqi)
                            </h3>
                            <ReviewDetailFields section="sabqi" values={entry.sabqi} onChange={(field, value) => handleEntryChange(entry.id, 'sabqi', field, value)} />
                        </div>

                        <div className="bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] p-6 space-y-4">
                            <h3 className="text-lg font-black text-emerald-400 flex items-center gap-2 mb-4">
                                منزل (قبل الظہر)
                            </h3>
                            <ReviewDetailFields section="manzil_1" values={entry.manzil_1} onChange={(field, value) => handleEntryChange(entry.id, 'manzil_1', field, value)} />
                        </div>

                        <div className="bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] p-6 space-y-4">
                            <h3 className="text-lg font-black text-orange-400 flex items-center gap-2 mb-4">
                                منزل (بعد الظہر)
                            </h3>
                            <ReviewDetailFields section="manzil_2" values={entry.manzil_2} onChange={(field, value) => handleEntryChange(entry.id, 'manzil_2', field, value)} />
                        </div>
                    </div>

                    <div className="bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-[var(--color-text-muted)]">کیفیت (Quality)<span className="text-red-500"> *</span></label>
                                <div className="flex flex-wrap gap-3">
                                    {qualityOptions.map((q) => (
                                        <button
                                            key={`${entry.id}-${q}`}
                                            type="button"
                                            onClick={() => handleEntryFieldChange(entry.id, 'quality', q)}
                                            className={`px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold transition-colors ${entry.quality === q ? 'bg-[var(--color-primary)] text-[#0b1120]' : 'hover:bg-[var(--color-primary)] hover:text-[#0b1120]'}`}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-[var(--color-text-muted)]">ریمارکس / ڈائری</label>
                                <textarea
                                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl py-3 px-4 text-sm font-bold outline-none focus:border-[var(--color-primary)] h-20"
                                    placeholder="کوئی خاص بات..."
                                    value={entry.remarks}
                                    onChange={(e) => handleEntryFieldChange(entry.id, 'remarks', e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={handleAddEntry}
                    className="w-full md:w-auto min-w-[170px] px-6 py-4 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-primary)] hover:text-[#0b1120] transition-all"
                >
                    <Plus size={18} /> نئی انٹری
                </button>
                <button type="submit" disabled={isSaving} className="w-full md:w-auto px-10 py-4 bg-[var(--color-primary)] text-[#0b1120] font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-60">
                    <Save size={20} /> {isSaving ? 'محفوظ ہو رہا ہے...' : 'ریکارڈ محفوظ کریں'}
                </button>
            </div>
        </form>

        {deleteTarget ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" dir="rtl">
                <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-black text-[var(--color-text-main)]">انٹری حذف کرنے کی تصدیق</h3>
                            <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                کیا آپ واقعی <span className="text-rose-500">{deleteTarget.label}</span> کو حذف کرنا چاہتے ہیں؟
                            </p>
                        </div>
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
                            <Trash2 size={22} />
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                        <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)]">
                            منسوخ
                        </button>
                        <button type="button" onClick={handleDeleteEntry} className="flex-1 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white transition-all hover:bg-rose-600">
                            تصدیق کریں
                        </button>
                    </div>
                </div>
            </div>
        ) : null}
        </>
    );
};

const ReviewDetailFields = ({ section, values, onChange, showTeacher = false }) => {
    const fields = [
        { key: 'para', label: 'پارہ', placeholder: 'مثلاً پارہ 1' },
        { key: 'ruku', label: 'رکوع', placeholder: 'مثلاً رکوع 3' },
        { key: 'ayatFrom', label: 'آیت کہاں سے', placeholder: 'شروع آیت' },
        { key: 'ayatTo', label: 'آیت کہاں تک', placeholder: 'اختتامی آیت' },
        { key: 'mistake', label: 'غلطی', placeholder: '0', type: 'number' },
        { key: 'atkann', label: 'اٹکن', placeholder: '0', type: 'number' },
        ...(showTeacher ? [{ key: 'teacher', label: 'استاد کا نام', placeholder: 'استاد کا نام' }] : []),
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
                <div key={`${section}-${field.key}`} className="space-y-2">
                    <label className="mr-1 text-[11px] font-black text-[var(--color-text-muted)]">{field.label}</label>
                    <input
                        type={field.type || 'text'}
                        min={field.type === 'number' ? '0' : undefined}
                        placeholder={field.placeholder}
                        value={values[field.key]}
                        onChange={(event) => onChange(field.key, event.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-right text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                    />
                </div>
            ))}
        </div>
    );
};
