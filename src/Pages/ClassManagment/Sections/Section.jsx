import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { createSection, deactivateSection, getBranches, getClasses, getSections, updateSection } from '../../../Constant/AcademicSetupApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

const emptyForm = {
    branchId: '',
    classId: '',
    name: '',
};

export const CreateSections = () => {
    const [branches, setBranches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [editMode, setEditMode] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    const activeBranches = useMemo(() => branches.filter((item) => item.status === 'active'), [branches]);
    const activeClasses = useMemo(() => classes.filter((item) => item.status === 'active'), [classes]);

    const formClasses = useMemo(() => {
        if (!formData.branchId) return [];
        return activeClasses.filter((item) => String(item.branchId) === formData.branchId);
    }, [activeClasses, formData.branchId]);

    const filterClasses = useMemo(() => {
        if (!selectedBranchFilter) return activeClasses;
        return activeClasses.filter((item) => String(item.branchId) === selectedBranchFilter);
    }, [activeClasses, selectedBranchFilter]);

    const loadDependencies = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [branchesResult, classesResult, sectionsResult] = await Promise.all([
                getBranches('page=1&limit=100'),
                getClasses('page=1&limit=100'),
                getSections('page=1&limit=100'),
            ]);

            setBranches(branchesResult.items || []);
            setClasses(classesResult.items || []);
            setSections(sectionsResult.items || []);
        } catch (loadError) {
            setError(loadError.message || 'سیکشنز کا ڈیٹا لوڈ نہیں ہو سکا۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDependencies();
    }, []);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditMode(null);
        setIsFormOpen(false);
    };

    const handleEdit = (section) => {
        const branchId = section.class?.branch?.id ? String(section.class.branch.id) : '';
        setEditMode(section.id);
        setFormData({
            branchId,
            classId: section.classId ? String(section.classId) : '',
            name: section.name || '',
        });
        setError('');
        setSuccess('');
        setIsFormOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.classId || !formData.name.trim()) {
            setError('جماعت اور سیکشن کا نام دونوں درج کرنا ضروری ہیں۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                classId: Number(formData.classId),
                name: formData.name.trim(),
            };

            if (editMode) {
                await updateSection(editMode, payload);
                setSuccess('سیکشن کامیابی سے اپڈیٹ ہو گیا۔');
            } else {
                await createSection(payload);
                setSuccess('سیکشن کامیابی سے شامل ہو گیا۔');
            }

            resetForm();
            await loadDependencies();
        } catch (saveError) {
            setError(saveError.message || 'سیکشن محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivate = async (sectionId) => {
        setError('');
        setSuccess('');

        try {
            await deactivateSection(sectionId);
            setSuccess('سیکشن غیر فعال کر دیا گیا۔');
            await loadDependencies();
        } catch (actionError) {
            setError(actionError.message || 'سیکشن غیر فعال نہیں ہو سکا۔');
        }
    };

    const filteredSections = sections.filter((section) => {
        const matchesBranch = selectedBranchFilter
            ? String(section.class?.branch?.id || '') === selectedBranchFilter
            : true;
        const matchesClass = selectedClassFilter ? String(section.classId) === selectedClassFilter : true;
        const query = search.trim().toLowerCase();
        const matchesSearch = !query
            ? true
            : [section.name, section.class?.name, section.class?.branch?.name]
                  .filter(Boolean)
                  .some((value) => String(value).toLowerCase().includes(query));

        return matchesBranch && matchesClass && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tight">جماعت سیکشنز</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل ریکارڈ: {filteredSections.length}</p>
                </div>

                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                    <select
                        value={selectedBranchFilter}
                        onChange={(e) => {
                            setSelectedBranchFilter(e.target.value);
                            setSelectedClassFilter('');
                        }}
                        className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold text-[var(--color-text)] outline-none md:min-w-44"
                    >
                        <option value="">تمام برانچز</option>
                        {activeBranches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedClassFilter}
                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                        className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold text-[var(--color-text)] outline-none md:min-w-44"
                    >
                        <option value="">تمام جماعتیں</option>
                        {filterClasses.map((academicClass) => (
                            <option key={academicClass.id} value={academicClass.id}>
                                {academicClass.name}
                            </option>
                        ))}
                    </select>

                    <div className="relative md:w-72">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="سیکشن تلاش کریں"
                            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none"
                        />
                    </div>

                    <button
                        onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
                        className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-all ${
                            isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white'
                        }`}
                    >
                        {isFormOpen ? 'بند کریں' : 'نیا سیکشن'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                        <span>{editMode ? 'سیکشن اپڈیٹ کریں' : 'نیا سیکشن اندراج'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">برانچ</label>
                            <select
                                value={formData.branchId}
                                onChange={(e) => setFormData({ branchId: e.target.value, classId: '', name: formData.name })}
                                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                            >
                                <option value="">برانچ منتخب کریں</option>
                                {activeBranches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">جماعت</label>
                            <select
                                value={formData.classId}
                                onChange={(e) => setFormData((prev) => ({ ...prev, classId: e.target.value }))}
                                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                            >
                                <option value="">جماعت منتخب کریں</option>
                                {formClasses.map((academicClass) => (
                                    <option key={academicClass.id} value={academicClass.id}>
                                        {academicClass.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">سیکشن نام</label>
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="مثلاً A"
                                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        {editMode ? (
                            <button onClick={resetForm} className="rounded-xl px-5 py-3 text-sm font-black text-[var(--color-text-muted)]">
                                منسوخ
                            </button>
                        ) : null}
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center gap-3 rounded-xl bg-[#218838] px-8 py-3 text-sm font-black text-white disabled:opacity-70"
                        >
                            {editMode ? 'اپڈیٹ' : 'اندراج'}
                            {editMode ? <Save size={18} /> : <Plus size={18} />}
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="text-[var(--color-text-muted)]">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">سیکشن</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">جماعت</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">برانچ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">اسٹیٹس</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        سیکشنز کی فہرست لوڈ ہو رہی ہے...
                                    </td>
                                </tr>
                            ) : filteredSections.length ? (
                                filteredSections.map((section) => (
                                    <tr key={section.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4">
                                            <span className="rounded-xl bg-emerald-500/10 px-3 py-1 text-xs font-black text-[#00d094]">
                                                سیکشن {section.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text)]">{section.class?.name || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{section.class?.branch?.name || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-xl px-3 py-1 text-xs font-black ${section.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {section.status === 'active' ? 'فعال' : 'غیر فعال'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-start gap-2">
                                                <button
                                                    onClick={() => handleEdit(section)}
                                                    className="rounded-xl bg-emerald-500/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivate(section.id)}
                                                    disabled={section.status === 'inactive'}
                                                    className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        کوئی سیکشن ریکارڈ نہیں ملا۔
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
