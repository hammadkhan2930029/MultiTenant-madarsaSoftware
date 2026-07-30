import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Edit2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { createSectionsBulk, deleteSection, getClasses, getSections, updateSection } from '../../../Constant/AcademicSetupApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { ExportExcelButton } from '../../../Components/Export/ExportExcelButton';
import { useNotifier } from '../../../Components/Notifications/useNotifier';
import { MultipleEntryRows } from '../../../Components/Common/MultipleEntryRows';

const emptyForm = {
    classId: '',
    name: '',
    status: 'active',
};

const createEmptySectionRow = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '',
    error: '',
});

export const CreateSections = () => {
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [formData, setFormData] = useState(emptyForm);
    const [sectionRows, setSectionRows] = useState([createEmptySectionRow()]);
    const [editMode, setEditMode] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const formRef = useRef(null);
    const notify = useNotifier();
    useNotificationBridge({ error, success });

    const scrollToForm = () => {
        window.setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    const activeClasses = useMemo(() => classes.filter((item) => item.status === 'active'), [classes]);

    const formClasses = activeClasses;
    const filterClasses = activeClasses;

    const loadDependencies = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [classesResult, sectionsResult] = await Promise.all([
                getClasses('page=1&limit=100&status=active'),
                getSections(`page=1&limit=100&status=${statusFilter || 'active'}`),
            ]);

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
    }, [statusFilter]);

    const resetForm = () => {
        setFormData(emptyForm);
        setSectionRows([createEmptySectionRow()]);
        setEditMode(null);
        setIsFormOpen(false);
    };

    const handleEdit = (section) => {
        setEditMode(section.id);
        setFormData({
            classId: section.classId ? String(section.classId) : '',
            name: section.name || '',
            status: section.status || 'active',
        });
        setSectionRows([{ ...createEmptySectionRow(), name: section.name || '' }]);
        setError('');
        setSuccess('');
        setIsFormOpen(true);
        scrollToForm();
    };

    const updateSectionRow = (rowId, value) => {
        setSectionRows((rows) =>
            rows.map((row) => (row.id === rowId ? { ...row, name: value, error: '' } : row)),
        );
    };

    const addSectionRow = () => {
        setSectionRows((rows) => [...rows, createEmptySectionRow()]);
    };

    const removeSectionRow = (rowId) => {
        setSectionRows((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows));
    };

    const validateSectionRows = (classId) => {
        const existingNames = new Set(
            sections
                .filter((item) => String(item.classId || '') === String(classId || ''))
                .map((item) => String(item.name || '').trim().toLowerCase())
                .filter(Boolean),
        );
        const seenNames = new Set();
        let hasError = false;
        const trimmedRows = sectionRows.map((row) => ({ ...row, name: row.name.trim(), error: '' }));
        const nonEmptyRows = trimmedRows.filter((row) => row.name);

        if (!nonEmptyRows.length) {
            hasError = true;
            return {
                hasError,
                rows: trimmedRows.map((row, index) => ({
                    ...row,
                    error: index === 0 ? 'سیکشن نام درج کرنا ضروری ہے۔' : '',
                })),
                validRows: [],
            };
        }

        const rows = trimmedRows.map((row) => {
            if (!row.name) return row;

            const key = row.name.toLowerCase();
            if (seenNames.has(key)) {
                hasError = true;
                return { ...row, error: 'یہ سیکشن اسی فارم میں دوبارہ درج ہے۔' };
            }

            seenNames.add(key);

            if (existingNames.has(key)) {
                hasError = true;
                return { ...row, error: 'یہ سیکشن اس جماعت میں پہلے سے موجود ہے۔' };
            }

            return row;
        });

        return {
            hasError,
            rows,
            validRows: rows.filter((row) => row.name && !row.error),
        };
    };

    const handleSubmit = async () => {
        if (editMode && formData.classId && !formData.name.trim()) {
            const message = 'سیکشن نام درج کرنا ضروری ہے۔ جماعت کے ساتھ سیکشن نام بھی لکھیں۔';
            setError('');
            notify.error(message, 'نامکمل معلومات');
            return;
        }

        if (editMode && (!formData.classId || !formData.name.trim())) {
            const message = 'جماعت اور سیکشن کا نام دونوں درج کرنا ضروری ہیں۔';
            setError('');
            notify.error(message, 'نامکمل معلومات');
            return;
        }

        if (!editMode) {
            if (!formData.classId) {
                const message = 'جماعت منتخب کرنا ضروری ہے۔';
                setError('');
                notify.error(message, 'نامکمل معلومات');
                return;
            }

            const validation = validateSectionRows(formData.classId);
            setSectionRows(validation.rows);

            if (validation.hasError) {
                setError('');
                notify.error('درج کردہ سیکشن کی معلومات درست کریں۔', 'نامکمل معلومات');
                return;
            }
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                classId: Number(formData.classId),
                name: formData.name.trim(),
                ...(editMode ? { status: formData.status || 'active' } : {}),
            };

            if (editMode) {
                await updateSection(editMode, payload);
                setSuccess('سیکشن کامیابی سے تبدیل ہو گیا ہے۔');
            } else {
                const validation = validateSectionRows(formData.classId);
                const result = await createSectionsBulk({
                    classId: Number(formData.classId),
                    sections: validation.validRows.map((row) => ({ name: row.name })),
                });
                setSuccess(`${result?.createdCount || validation.validRows.length} سیکشنز کامیابی سے شامل ہو گئے۔`);
            }

            resetForm();
            await loadDependencies();
        } catch (saveError) {
            const rowErrors = saveError?.response?.data?.rows || saveError?.data?.rows || saveError?.details?.rows || [];
            if (rowErrors.length) {
                setSectionRows((rows) => rows.map((row, index) => {
                    const rowError = rowErrors.find((item) => Number(item.index) === index);
                    return rowError ? { ...row, error: rowError.message || 'یہ سیکشن محفوظ نہیں ہو سکا۔' } : row;
                }));
            }
            setError(saveError.message || 'سیکشن محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setError('');
        setSuccess('');
        setIsDeleting(true);

        try {
            await deleteSection(deleteTarget.id);
            setSuccess('سیکشن کامیابی سے حذف کر دیا گیا۔');
            if (editMode === deleteTarget.id) {
                resetForm();
            }
            setDeleteTarget(null);
            await loadDependencies();
        } catch (actionError) {
            setError(actionError.message || 'سیکشن حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredSections = sections.filter((section) => {
        const matchesClass = selectedClassFilter ? String(section.classId) === selectedClassFilter : true;
        const query = search.trim().toLowerCase();
        const matchesSearch = !query
            ? true
            : [section.name, section.class?.name]
                  .filter(Boolean)
                  .some((value) => String(value).toLowerCase().includes(query));

        return matchesClass && matchesSearch;
    });

    const exportColumns = [
        { header: 'Section', accessor: 'name' },
        { header: 'Class', accessor: (section) => section.class?.name || '---' },
        { header: 'Status', accessor: (section) => section.status || '---' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-row items-center justify-between gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
                <div className="text-right">
                    <h2 className="text-3xl font-black text-[var(--color-text)] tracking-tight">جماعت سیکشن مینجمنٹ</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل فہرست: {filteredSections.length}</p>
                </div>

                <div className="flex w-auto flex-row flex-wrap items-center gap-3">
                    <ExportExcelButton rows={filteredSections} columns={exportColumns} fileName="sections-list" className="w-full md:w-auto" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold text-[var(--color-text)] outline-none md:min-w-40"
                    >
                        <option value="active">فعال</option>
                        <option value="inactive">غیر فعال</option>
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
                <div ref={formRef} className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                        <span className='text-3xl'>{editMode ? 'تبدیل کریں' : 'نئے سیکشن کا اندراج'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">جماعت<span className="text-red-500"> *</span></label>
                            <select
                                required
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
                    <div className="space-y-4">
                        {editMode ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                        سیکشن نام<span className="text-red-500"> *</span>
                                    </label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="مثلاً A"
                                        className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                        حالت<span className="text-red-500"> *</span>
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                                        className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                                    >
                                        <option value="active">فعال</option>
                                        <option value="inactive">غیر فعال</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <MultipleEntryRows
                                rows={sectionRows}
                                onAdd={addSectionRow}
                                onRemove={removeSectionRow}
                                disabled={isSaving}
                                addLabel="نیا سیکشن شامل کریں"
                                removeLabel="سیکشن قطار حذف کریں"
                                rowClassName="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-start"
                                actionsClassName="flex items-center justify-end gap-2 pt-0 md:pt-8"
                                addButtonClassName="grid h-14 w-14 place-items-center rounded-2xl bg-[#00d094] text-white transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                                renderFields={(row, index) => (
                                    <div className="space-y-2">
                                        <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                            سیکشن نام<span className="text-red-500"> *</span>
                                        </label>
                                        <input
                                            required={index === 0}
                                            value={row.name}
                                            onChange={(e) => updateSectionRow(row.id, e.target.value)}
                                            placeholder="مثلاً A"
                                            className={`h-14 w-full rounded-2xl border bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none ${
                                                row.error ? 'border-rose-500' : 'border-[var(--color-border)]'
                                            }`}
                                        />
                                    </div>
                                )}
                            />
                        )}
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
                            {editMode ? 'تبدیل کریں' : 'محفوظ کریں'}
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
                                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">جماعت</th>
                                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">حالت</th>
                                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        سیکشنز کی فہرست لوڈ ہو رہی ہے...
                                    </td>
                                </tr>
                            ) : filteredSections.length ? (
                                filteredSections.map((section) => (
                                    <tr key={section.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4">
                                            <span className="rounded-xl bg-emerald-500/10 px-3 py-1 text-xs font-black text-[#00d094]">
                                                {section.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-bold text-[var(--color-text)]">{section.class?.name || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`rounded-xl px-3 py-1 text-xs font-black ${section.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {section.status === 'active' ? 'فعال' : 'غیر فعال'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(section)}
                                                    className="p-3 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(section)}
                                                    className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        کوئی سیکشن ریکارڈ نہیں ملا۔
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text)]">سیکشن حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                    کیا آپ واقعی <span className="text-rose-500">{deleteTarget.name}</span> کو حذف کرنا چاہتے ہیں؟
                                    یہ عمل واپس نہیں ہو گا۔
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !isDeleting && setDeleteTarget(null)}
                                className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                منسوخ
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isDeleting ? 'حذف ہو رہی ہے...' : 'تصدیق کریں'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
