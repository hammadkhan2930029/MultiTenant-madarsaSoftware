import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar,
    Clock,
    BookOpen,
    Users,
    Plus,
    Trash2,
    X,
    Layers,
    Search,
    LayoutDashboard,
    LayoutPanelTop,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { getClasses, getSections, getSessions, getSubjects } from '../../../Constant/AcademicSetupApi';
import { createSchedule, deleteSchedule, getSchedules } from '../../../Constant/ScheduleApi';

const activeOnly = (items) => (items || []).filter((item) => !item.status || item.status === 'active');

const mapScheduleFromApi = (schedule) => ({
    id: schedule.id,
    sessionId: String(schedule.session?.id || ''),
    session: schedule.session?.name || '',
    classId: String(schedule.class?.id || ''),
    className: schedule.class?.name || '',
    sectionId: String(schedule.section?.id || ''),
    section: schedule.section?.name || '',
    subjects: Array.isArray(schedule.subjects) ? schedule.subjects : [],
    days: Array.isArray(schedule.days) ? schedule.days : [],
    startTime: schedule.startTime || '',
    endTime: schedule.endTime || '',
});

export const StudentScheduleManager = () => {
      useEffect(() => {
            window.scrollTo(0, 0)
        }, [])

    const [selectLayout, setSelectLayout] = useState(2)
    const [schedules, setSchedules] = useState([]);
    const [classOptions, setClassOptions] = useState([]);
    const [sectionOptions, setSectionOptions] = useState([]);
    const [sessionOptions, setSessionOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [removingScheduleId, setRemovingScheduleId] = useState(null);
    const [setupError, setSetupError] = useState('');
    const [scheduleMessage, setScheduleMessage] = useState('');
    const [formData, setFormData] = useState({
        sessionId: '',
        session: '',
        classId: '',
        className: '',
        sectionId: '',
        section: '',
        subjects: [],
        days: [],
        startTime: '',
        endTime: ''
    });

    const [subjSearch, setSubjSearch] = useState("");

    const daysList = ["پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ", "اتوار"];
    const subjectsList = subjectOptions.map((subject) => subject.name).filter(Boolean);

    const availableSections = useMemo(
        () => sectionOptions.filter((section) => !formData.classId || String(section.classId) === String(formData.classId)),
        [formData.classId, sectionOptions],
    );

    const filteredSubjects = subjectsList.filter(s => s.toLowerCase().includes(subjSearch.toLowerCase()));

    useEffect(() => {
        const loadSetupOptions = async () => {
            setIsLoadingOptions(true);
            setSetupError('');

            try {
                const [classesResult, sectionsResult, sessionsResult, subjectsResult] = await Promise.all([
                    getClasses('page=1&limit=100'),
                    getSections('page=1&limit=100'),
                    getSessions('page=1&limit=100'),
                    getSubjects('page=1&limit=100'),
                ]);

                setClassOptions(activeOnly(classesResult.items));
                setSectionOptions(activeOnly(sectionsResult.items));
                setSessionOptions(activeOnly(sessionsResult.items));
                setSubjectOptions(activeOnly(subjectsResult.items));
            } catch (error) {
                setSetupError(error.message || 'شیڈول کے لیے بنیادی ڈیٹا لوڈ نہیں ہو سکا۔');
            } finally {
                setIsLoadingOptions(false);
            }
        };

        loadSetupOptions();
    }, []);

    useEffect(() => {
        const loadSchedules = async () => {
            try {
                const result = await getSchedules('page=1&limit=100');
                setSchedules((result.items || []).map(mapScheduleFromApi));
            } catch (error) {
                setSetupError(error.message || 'شیڈول لوڈ نہیں ہو سکا۔');
            }
        };

        loadSchedules();
    }, []);

    const toggleSelection = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(i => i !== value)
                : [...prev[field], value]
        }));
    };

    const handleAddSchedule = async (e) => {
        e.preventDefault();
        setSetupError('');
        setScheduleMessage('');

        if (!formData.sessionId || !formData.classId || !formData.sectionId || formData.subjects.length === 0 || formData.days.length === 0 || !formData.startTime || !formData.endTime) {
            setSetupError('براہ کرم سیشن، کلاس، سیکشن، مضمون، دن اور وقت مکمل منتخب کریں۔');
            return;
        }

        setIsSavingSchedule(true);

        try {
            const savedSchedule = await createSchedule({
                sessionId: Number(formData.sessionId),
                classId: Number(formData.classId),
                sectionId: Number(formData.sectionId),
                subjects: formData.subjects,
                days: formData.days,
                startTime: formData.startTime,
                endTime: formData.endTime,
            });

            setSchedules((current) => [mapScheduleFromApi(savedSchedule), ...current]);
            setFormData({ ...formData, subjects: [], days: [], startTime: '', endTime: '' });
            setScheduleMessage('شیڈول کامیابی سے محفوظ ہو گیا۔');
        } catch (error) {
            setSetupError(error.message || 'شیڈول محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSavingSchedule(false);
        }
    };

    const handleDeleteSchedule = async (id) => {
        setRemovingScheduleId(id);
        setSetupError('');
        setScheduleMessage('');

        try {
            await deleteSchedule(id);
            setSchedules((current) => current.filter((schedule) => schedule.id !== id));
            setScheduleMessage('شیڈول ختم کر دیا گیا۔');
        } catch (error) {
            setSetupError(error.message || 'شیڈول ختم نہیں ہو سکا۔');
        } finally {
            setRemovingScheduleId(null);
        }
    };

    const groupedSchedules = schedules.reduce((acc, curr) => {
        if (!acc[curr.className]) acc[curr.className] = [];
        acc[curr.className].push(curr);
        return acc;
    }, {});
    // ----------------------------------------------------
    const [expandedClass, setExpandedClass] = useState(null);

    
    const toggleClass = (className) => {
        setExpandedClass(expandedClass === className ? null : className);
    };
    return (
        <div className="p-4 md:p-6 space-y-8 bg-[var(--color-bg)] min-h-screen pb-24 text-[var(--color-text)] font-urdu" dir="rtl">

            {/* Header */}
            <div className="bg-[var(--color-surface)] flex justify-between items-center border border-[var(--color-border)] pr-4 py-4 rounded-[2.5rem] shadow-xl">
                <div>
                    <h1 className="text-3xl font-black text-[var(--color-text)]">شیڈول مینیجر</h1>
                    <p className="text-md opacity-60 mt-5">طلباء کا تعلیمی ٹائم ٹیبل ترتیب دیں</p>
                </div>
                <div className="hidden md:block bg-[var(--color-surface)] p-3 rounded-2xl border border-[var(--color-border)]/10">
                    <Calendar className="text-[var(--color-primary)]" size={24} />
                </div>
            </div>

            {/* --- Form Section --- */}
            <div className="bg-[var(--color-surface)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl">
                {setupError ? (
                    <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-500">
                        {setupError}
                    </div>
                ) : null}
                {scheduleMessage ? (
                    <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-500">
                        {scheduleMessage}
                    </div>
                ) : null}
                <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Step 1: Basic Selection */}
                    <div className="space-y-5">
                        <h4 className="text-[16px] font-black text-[var(--color-primary)] uppercase tracking-widest border-b border-[var(--color-border)]/10 pb-2">بنیادی معلومات</h4>

                        <div>
                            <label className="text-[11px] font-bold opacity-60 block mb-2">تعلیمی سیشن</label>
                            <select
                                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)]/10 rounded-xl p-3 text-sm outline-none appearance-none cursor-pointer"
                                value={formData.sessionId}
                                disabled={isLoadingOptions}
                                onChange={e => {
                                    const selectedSession = sessionOptions.find((session) => String(session.id) === e.target.value);
                                    setFormData({ ...formData, sessionId: e.target.value, session: selectedSession?.name || '' });
                                }}
                            >
                                <option value="">{isLoadingOptions ? 'لوڈ ہو رہا ہے...' : 'سیشن منتخب کریں'}</option>
                                {sessionOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold opacity-60 block mb-2">کلاس منتخب کریں</label>
                                <select
                                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)]/10 rounded-xl p-3 text-sm outline-none cursor-pointer"
                                    value={formData.classId}
                                    disabled={isLoadingOptions}
                                    onChange={e => {
                                        const selectedClass = classOptions.find((item) => String(item.id) === e.target.value);
                                        setFormData({
                                            ...formData,
                                            classId: e.target.value,
                                            className: selectedClass?.name || '',
                                            sectionId: '',
                                            section: '',
                                        });
                                    }}
                                >
                                    <option value="">{isLoadingOptions ? 'لوڈ ہو رہا ہے...' : 'کلاس منتخب کریں'}</option>
                                    {classOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold opacity-60 block mb-2">سیکشن</label>
                                <select
                                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)]/10 rounded-xl p-3 text-sm outline-none cursor-pointer"
                                    value={formData.sectionId}
                                    disabled={isLoadingOptions || !formData.classId}
                                    onChange={e => {
                                        const selectedSection = availableSections.find((item) => String(item.id) === e.target.value);
                                        setFormData({ ...formData, sectionId: e.target.value, section: selectedSection?.name || '' });
                                    }}
                                >
                                    <option value="">{formData.classId ? 'سیکشن منتخب کریں' : 'پہلے کلاس منتخب کریں'}</option>
                                    {availableSections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Subjects Multi-Select */}
                    <div className="flex flex-col space-y-4">
                        <h4 className="text-[16px] font-black text-[var(--color-primary)] uppercase tracking-widest border-b border-[var(--color-border)]/10 pb-2">مضامین کی فہرست</h4>

                        <div className="bg-[var(--color-bg)] border border-[var(--color-border)]/10 rounded-2xl p-4 flex-1 flex flex-col min-h-[200px]">
                            <div className="relative mb-3">
                                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30" />
                                <input className="w-full bg-[var(--color-surface)] border border-[var(--color-border)]/5 rounded-lg py-2 pr-9 pl-3 text-[11px] outline-none" placeholder="مضمون تلاش کریں..." value={subjSearch} onChange={(e) => setSubjSearch(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-40 pr-1 custom-scroll">
                                {filteredSubjects.map(sub => (
                                    <button key={sub} type="button" onClick={() => toggleSelection('subjects', sub)}
                                        className={`text-right text-[10px] p-2.5 rounded-lg border transition-all ${formData.subjects.includes(sub) ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]/5 opacity-70 hover:opacity-100'}`}>
                                        {sub}
                                    </button>
                                ))}
                                {!filteredSubjects.length ? (
                                    <div className="col-span-2 rounded-xl border border-[var(--color-border)]/10 bg-[var(--color-surface)] p-4 text-center text-[11px] font-bold opacity-60">
                                        کوئی مضمون نہیں ملا۔
                                    </div>
                                ) : null}
                            </div>

                            {formData.subjects.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-[var(--color-border)]/5 flex flex-wrap gap-1">
                                    {formData.subjects.map(s => (
                                        <span key={s} className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                            {s} <X size={10} className="cursor-pointer" onClick={() => toggleSelection('subjects', s)} />
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 3: Timing & Days */}
                    <div className="space-y-5">
                        <h4 className="text-[16px] font-black text-[var(--color-primary)] uppercase tracking-widest border-b border-[var(--color-border)]/10 pb-2">وقت اور دن</h4>

                        <div className="flex flex-wrap gap-1.5">
                            {daysList.map(day => (
                                <button key={day} type="button" onClick={() => toggleSelection('days', day)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${formData.days.includes(day) ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] border-[var(--color-border)]/10 opacity-50'}`}>
                                    {day}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                                <label className="text-[10px] opacity-50 block mb-1">کلاس شروع</label>
                                <input type="time" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)]/10 rounded-xl p-3 text-xs outline-none" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] opacity-50 block mb-1">کلاس ختم</label>
                                <input type="time" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)]/10 rounded-xl p-3 text-xs outline-none" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingSchedule}
                            className="w-full bg-[var(--color-primary)] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-[var(--color-primary)]/20 hover:brightness-110 active:scale-[0.98] transition-all mt-4 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus size={20} /> {isSavingSchedule ? 'محفوظ ہو رہا ہے...' : 'شیڈول محفوظ کریں'}
                        </button>
                    </div>
                </form>
            </div>
            {/* ----------------------------------------------------Select Data Layout----------------------------------------------- */}
            {schedules.length > 0 && (
                <div className='flex flex-row justify-start items-center'>
                    <button onClick={() => setSelectLayout(1)} className={`w-[50%] md:w-[50%] lg:w-[20%] text-[10px] md:text-md lg:text-lg ${selectLayout === 1 ? 'bg-[var(--color-primary)] brightness-110 scale-105' : 'bg-[var(--color-primary)]/50'}  text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-[var(--color-primary)]/20 hover:brightness-110 active:scale-[0.98] transition-all m-2`}>
                        <LayoutDashboard size={20} /> دنوں کے حساب سے
                    </button>
                    <button onClick={() => setSelectLayout(2)} className={`w-[50%] md:w-[50%] lg:w-[20%] text-[10px] md:text-md lg:text-lg ${selectLayout === 2 ? 'bg-[var(--color-primary)] brightness-110' : 'bg-[var(--color-primary)]/50'}  text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-[var(--color-primary)]/20 hover:brightness-110 active:scale-[0.98] transition-all m-2`}>
                        <LayoutPanelTop size={20} /> مضمون کے حساب سے
                    </button>
                </div>
            )}

            {/* ---------------------------------------------------data layout-------------------------------------------------------- */}

            {/* --- Cards Display --- */}
            {selectLayout === 2 && (
                <div className="grid grid-cols-1 gap-6">
                    {Object.keys(groupedSchedules).map(className => {
                        const isExpanded = expandedClass === className;
                        return (
                            <div key={className} className="bg-[var(--color-surface)] rounded-[2rem] md:rounded-[2.5rem] border border-[var(--color-border)]/10 shadow-xl overflow-hidden flex flex-col">


                                <div
                                    onClick={() => toggleClass(className)}
                                    className={`p-4 md:p-5 flex justify-between items-center cursor-pointer transition-colors ${isExpanded ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text)]'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isExpanded ? 'bg-white/20' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg md:text-xl font-black">کلاس: {className}</h3>
                                            <p className={`text-[12px] font-bold ${isExpanded ? 'opacity-80' : 'opacity-50'}`}>
                                                سیشن: {groupedSchedules[className][0].session}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                        <ChevronDown size={24} className={isExpanded ? 'text-white' : 'text-[var(--color-primary)]'} />
                                    </div>
                                </div>

                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    {groupedSchedules[className].map((item) => (
                                        <div key={item.id} className="bg-[var(--color-bg)]/50 p-4 rounded-[2.5rem] md:rounded-[2.8rem] border border-[var(--color-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group relative shadow-md hover:shadow-xl transition-all duration-300 scale-100 hover:scale-101 m-2 px-5">

                                            <div className="flex gap-4 md:gap-5 items-center w-full sm:w-auto">
                                                <div className="text-center min-w-[50px] md:min-w-[60px] border-l-2 border-[var(--color-primary)]/20 pl-4">
                                                    <p className="text-sm md:text-md font-black text-[var(--color-primary)]">{item.section || 'عام'}</p>
                                                    <p className="text-[10px] md:text-sm opacity-40 font-bold uppercase tracking-tighter">سیکشن</p>
                                                </div>

                                                <div className="space-y-1.5 flex-1">
                                                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                                                        {item.subjects.map(s => (
                                                            <span key={s} className="text-[11px] md:text-[14px] font-bold bg-[var(--color-bg)] px-2 py-0.5 rounded-md border border-[var(--color-border)]/5">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.days.map(d => (
                                                            <span key={d} className="text-[11px] md:text-[14px] font-bold text-[var(--color-primary)] opacity-70">
                                                                {d}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-[var(--color-border)]/5 pt-3 sm:pt-0 gap-2">
                                                <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                                    <Clock size={12} className="md:w-3.5 md:h-3.5" />
                                                    <span className="text-[13px] md:text-[16px] font-black tracking-tighter" dir="ltr">
                                                        {item.startTime} - {item.endTime}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteSchedule(item.id)}
                                                    disabled={removingScheduleId === item.id}
                                                    className="text-red-500/40 hover:text-red-500 p-1.5 transition-all hover:bg-red-50 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Trash2 size={20} className="md:w-6 md:h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            {/* -------------------------------grid view---------------------------------------- */}
            {selectLayout === 1 && (
                <div className="grid grid-cols-1 gap-8">
                    {Object.keys(groupedSchedules).map(className => {
                        const isExpanded = expandedClass === className;

                        return (

                            <div key={className} className="bg-[var(--color-surface)] rounded-[2rem] md:rounded-[2.5rem] border border-[var(--color-border)]/10 shadow-2xl overflow-hidden flex flex-col">

                                <div
                                    onClick={() => toggleClass(className)}
                                    className={`p-4 md:p-5 flex justify-between items-center cursor-pointer  transition-colors ${isExpanded ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text)]'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isExpanded ? 'bg-white/20' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg md:text-xl font-black">کلاس: {className}</h3>
                                            <p className={`text-[12px] font-bold ${isExpanded ? 'opacity-80' : 'opacity-50'}`}>
                                                سیشن: {groupedSchedules[className][0].session}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                        <ChevronDown size={24} className={isExpanded ? 'text-white' : 'text-[var(--color-primary)]'} />
                                    </div>
                                </div>

                                <div className={`transition-all duration-300 ease-in-out overflow-hidden   ${isExpanded ? 'max-h-full opacity-100' : 'max-h-0 opacity-0'}`}   >
                                    {daysList.map(dayName => {
                                        const periodsForDay = groupedSchedules[className].filter(item =>
                                            item.days.includes(dayName)
                                        );

                                        if (periodsForDay.length === 0) return null;

                                        return (
                                            <div key={dayName} className="relative pl-2 md:pl-6 border-r-4 border-[var(--color-primary)]/20 pr-4 py-2 ">
                                                <h4 className="text-xl font-black text-[var(--color-primary)] mb-5 flex items-center gap-2">
                                                    <Calendar size={24} />
                                                    {dayName}
                                                </h4>

                                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                                                    {periodsForDay.map((period) => (
                                                        <div key={period.id} className="bg-[var(--color-bg)] border border-[var(--color-border)]/5 p-4 rounded-2xl flex flex-col justify-between hover:border-[var(--color-primary)]/30 transition-all group shadow-sm">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="space-y-1">
                                                                    {period.subjects.map(subj => (
                                                                        <span key={subj} className="block text-md font-bold text-[var(--color-text)]">
                                                                            {subj}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteSchedule(period.id)}
                                                                    disabled={removingScheduleId === period.id}
                                                                    className="opacity-0 group-hover:opacity-100 text-red-500 transition-all p-1 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl w-fit border border-amber-100">
                                                                <Clock size={14} />
                                                                <span className="text-xs font-black" dir="ltr">
                                                                    {period.startTime} - {period.endTime}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* --------------Empty State ------------------------------*/}
            {schedules.length === 0 && (
                <div className="bg-[var(--color-surface)] rounded-[2.5rem] border-2 border-dashed border-[var(--color-border)]/10 py-20 text-center opacity-40">
                    <BookOpen size={60} className="mx-auto mb-4 text-[var(--color-primary)]" />
                    <p className="text-lg font-black">ابھی تک کوئی کلاس ایڈ نہیں کی گئی</p>
                    <p className="text-sm mt-5">اوپر دیئے گئے فارم سے نیا شیڈول بنانا شروع کریں</p>
                </div>
            )}
        </div>
    );
};
