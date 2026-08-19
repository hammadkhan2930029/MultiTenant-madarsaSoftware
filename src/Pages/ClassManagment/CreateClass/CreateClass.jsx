import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Edit2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { createClassesBulk, deleteClass, getClasses, updateClass } from '../../../Constant/AcademicSetupApi';
import { getTeachers } from '../../../Constant/TeachersApi';
import { BRANCH_CONTEXT_UPDATED_EVENT, getAdminSession, getSelectedBranchContext, getSessionBranchId, isBranchScopedSession } from '../../../Constant/AdminAuth';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { ExportExcelButton } from '../../../Components/Export/ExportExcelButton';
import { MultipleEntryRows } from '../../../Components/Common/MultipleEntryRows';
import StatusBadge from '../../../Components/Common/StatusBadge';

const emptyForm = {
    name: '',
    branchId: '',
    inchargeTeacherId: '',
    status: 'active',
};

const createEmptyClassRow = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '',
    inchargeTeacherId: '',
    error: '',
});

const activeDuplicateMessage = 'درج کردہ معلومات پہلے سے موجود ہے۔ براہ کرام معلومات درست کیجیے۔';
const inactiveDuplicateMessage = 'درج کردہ معلومات پہلے سے موجود اور غیر فعال ہے۔ براہ کرام معلومات درست کیجیے۔';

export const CreateClasses = () => {
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [formData, setFormData] = useState(emptyForm);
    const [classRows, setClassRows] = useState([createEmptyClassRow()]);
    const [editMode, setEditMode] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const formRef = useRef(null);
    useNotificationBridge({ error, success });

    const getActiveBranchId = () => {
        const session = getAdminSession();
        if (isBranchScopedSession(session)) {
            return getSessionBranchId(session) || null;
        }
        return getSelectedBranchContext(session).branchId || null;
    };

    const buildClassesQuery = (status) => {
        const selectedBranchId = getActiveBranchId();
        const params = new URLSearchParams({ page: '1', limit: '100', status });
        if (selectedBranchId) params.set('branchId', String(selectedBranchId));
        return params.toString();
    };

    const onlyActiveBranchClasses = (items = []) => {
        const activeBranchId = getActiveBranchId();
        if (!activeBranchId) return items;

        return items.filter((item) => {
            const itemBranchId = item.branchId === null || item.branchId === undefined || item.branchId === ''
                ? null
                : Number(item.branchId);

            return activeBranchId ? itemBranchId === Number(activeBranchId) : itemBranchId === null;
        });
    };

    const scrollToForm = () => {
        window.setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    const loadDependencies = async () => {
        setIsLoading(true);
        setError('');

        try {
            const teacherParams = new URLSearchParams({ page: '1', limit: '100', status: 'active', staffType: 'teacher' });
            const activeBranchId = getActiveBranchId();
            if (activeBranchId) teacherParams.set('branchId', String(activeBranchId));

            const [activeResult, inactiveResult, teachersResult] = await Promise.all([
                getClasses(buildClassesQuery('active')),
                getClasses(buildClassesQuery('inactive')),
                getTeachers(teacherParams.toString()),
            ]);

            setClasses(onlyActiveBranchClasses([
                ...(activeResult.items || []),
                ...(inactiveResult.items || []),
            ]));
            setTeachers(teachersResult.items || []);
        } catch (loadError) {
            setError(loadError.message || 'جماعتوں کا ڈیٹا لوڈ نہیں ہو سکا۔');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDependencies();

        const handleBranchContextUpdated = () => {
            resetForm();
            loadDependencies();
        };

        window.addEventListener(BRANCH_CONTEXT_UPDATED_EVENT, handleBranchContextUpdated);

        return () => {
            window.removeEventListener(BRANCH_CONTEXT_UPDATED_EVENT, handleBranchContextUpdated);
        };
    }, [statusFilter]);

    const resetForm = () => {
        setEditMode(null);
        setFormData(emptyForm);
        setClassRows([createEmptyClassRow()]);
        setIsFormOpen(false);
    };

    const handleEdit = (academicClass) => {
        setEditMode(academicClass.id);
        setFormData({
            name: academicClass.name || '',
            branchId: academicClass.branchId ? String(academicClass.branchId) : '',
            inchargeTeacherId: academicClass.inchargeTeacherId ? String(academicClass.inchargeTeacherId) : '',
            status: academicClass.status || 'active',
        });
        setClassRows([{ ...createEmptyClassRow(), name: academicClass.name || '', inchargeTeacherId: academicClass.inchargeTeacherId ? String(academicClass.inchargeTeacherId) : '' }]);
        setError('');
        setSuccess('');
        setIsFormOpen(true);
        scrollToForm();
    };

    const updateClassRow = (rowId, field, value) => {
        setClassRows((rows) =>
            rows.map((row) => (row.id === rowId ? { ...row, [field]: value, error: '' } : row)),
        );
    };

    const addClassRow = () => {
        setClassRows((rows) => [...rows, createEmptyClassRow()]);
    };

    const removeClassRow = (rowId) => {
        setClassRows((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows));
    };

    const validateClassRows = (branchId) => {
        const existingNames = new Map(
            classes
                .filter((item) => !branchId || String(item.branchId || '') === String(branchId))
                .map((item) => [String(item.name || '').trim().toLowerCase(), item.status || 'active'])
                .filter(([name]) => name),
        );
        const seenNames = new Set();
        let hasError = false;
        const trimmedRows = classRows.map((row) => ({ ...row, name: row.name.trim(), error: '' }));
        const nonEmptyRows = trimmedRows.filter((row) => row.name);

        if (!nonEmptyRows.length) {
            hasError = true;
            return {
                hasError,
                rows: trimmedRows.map((row, index) => ({
                    ...row,
                    error: index === 0 ? 'جماعت کا نام درج کریں۔' : '',
                })),
                validRows: [],
            };
        }

        const rows = trimmedRows.map((row) => {
            if (!row.name) return row;

            const key = row.name.toLowerCase();
            if (seenNames.has(key)) {
                hasError = true;
                return { ...row, error: 'یہ جماعت اسی فارم میں دوبارہ درج ہے۔' };
            }

            seenNames.add(key);

            if (existingNames.has(key)) {
                hasError = true;
                return {
                    ...row,
                    error: existingNames.get(key) === 'inactive' ? inactiveDuplicateMessage : activeDuplicateMessage,
                };
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
        const selectedBranchId = getActiveBranchId();
        const branchId = selectedBranchId || formData.branchId || null;

        if (editMode && !formData.name.trim()) {
            setError('جماعت کا نام درج کریں۔');
            return;
        }

        if (editMode && !formData.inchargeTeacherId) {
            setError('کلاس انچارج منتخب کریں۔');
            return;
        }

        if (!editMode) {
            const validation = validateClassRows(branchId);
            setClassRows(validation.rows);

            if (validation.hasError) {
                setError(validation.rows.find((row) => row.error)?.error || 'درج کردہ جماعتوں کی معلومات درست کریں۔');
                return;
            }
            if (validation.validRows.some((row) => !row.inchargeTeacherId)) {
                setError('ہر جماعت کے لیے کلاس انچارج منتخب کریں۔');
                return;
            }
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                name: formData.name.trim(),
                ...(editMode ? { inchargeTeacherId: Number(formData.inchargeTeacherId) } : {}),
                ...(editMode ? { status: formData.status || 'active' } : {}),
                ...(branchId ? { branchId: Number(branchId) } : {}),
            };

            if (editMode) {
                await updateClass(editMode, payload);
                setSuccess('جماعت کامیابی سے تبدیل ہو گئی ہے۔');
            } else {
                const validation = validateClassRows(branchId);
                const result = await createClassesBulk({
                    ...(branchId ? { branchId: Number(branchId) } : {}),
                    classes: validation.validRows.map((row) => ({
                        name: row.name,
                        inchargeTeacherId: Number(row.inchargeTeacherId),
                    })),
                });
                setSuccess(`${result?.createdCount || validation.validRows.length} جماعتیں کامیابی سے شامل ہو گئیں۔`);
            }

            resetForm();
            await loadDependencies();
        } catch (saveError) {
            const rowErrors = saveError?.response?.data?.rows || saveError?.data?.rows || saveError?.details?.rows || [];
            if (rowErrors.length) {
                setClassRows((rows) => rows.map((row, index) => {
                    const rowError = rowErrors.find((item) => Number(item.index) === index);
                    return rowError ? { ...row, error: rowError.message || 'یہ جماعت محفوظ نہیں ہو سکی۔' } : row;
                }));
            }
            setError(saveError.message || 'جماعت محفوظ نہیں ہو سکی۔');
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
            await deleteClass(deleteTarget.id, getActiveBranchId());
            setSuccess('جماعت کامیابی سے حذف کر دی گئی۔');
            if (editMode === deleteTarget.id) {
                resetForm();
            }
            setDeleteTarget(null);
            await loadDependencies();
        } catch (actionError) {
            setError(actionError.message || 'جماعت حذف نہیں ہو سکی۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredClasses = classes.filter((academicClass) => {
        if (academicClass.status !== statusFilter) return false;
        const query = search.trim().toLowerCase();
        const matchesSearch = !query
            ? true
            : [academicClass.name, academicClass.inchargeTeacher?.fullName]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));

        return matchesSearch;
    });

    const exportColumns = [
        { header: 'Class', accessor: 'name' },
        { header: 'Class Incharge', accessor: (academicClass) => academicClass.inchargeTeacher?.fullName || '---' },
        { header: 'Sections', accessor: (academicClass) => academicClass._count?.sections ?? 0 },
        { header: 'Status', accessor: (academicClass) => academicClass.status || '---' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <h2 className="text-3xl font-black text-[var(--color-text)] tracking-tight">جماعت مینجمنٹ</h2>
                    <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">کل فہرست: {filteredClasses.length}</p>
                </div>

                <div className="flex w-full flex-row flex-wrap items-center gap-3 md:w-auto">
                    <ExportExcelButton rows={filteredClasses} columns={exportColumns} fileName="classes-list" className="w-full md:w-auto" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold text-[var(--color-text)] outline-none md:min-w-40"
                    >
                        <option value="active">فعال</option>
                        <option value="inactive">غیر فعال</option>
                    </select>
                    <div className="relative md:w-72">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جماعت تلاش کریں"
                            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none"
                        />
                    </div>

                    <button
                        onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
                        className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-all ${isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white'
                            }`}
                    >
                        {isFormOpen ? 'بند کریں' : 'نئی جماعت'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            {isFormOpen ? (
                <div ref={formRef} className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                        <span className='text-3xl'>{editMode ? 'تبدیل کریں' : 'نئی جماعت کا اندراج'}</span>
                    </div>

                    <div className="space-y-4">
                        {editMode ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                        جماعت نام<span className="text-red-500"> *</span>
                                    </label>
                                    <div className="relative">
                                        <BookOpen size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                            placeholder="مثلاً حفظ اول"
                                            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                        کلاس انچارج<span className="text-red-500"> *</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.inchargeTeacherId}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, inchargeTeacherId: e.target.value }))}
                                        className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                                    >
                                        <option value="">{teachers.length ? 'استاد منتخب کریں' : 'کوئی فعال استاد موجود نہیں'}</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>{teacher.fullName}{teacher.subject ? ` — ${teacher.subject}` : ''}</option>
                                        ))}
                                    </select>
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
                                rows={classRows}
                                onAdd={addClassRow}
                                onRemove={removeClassRow}
                                disabled={isSaving}
                                addLabel="نئی جماعت کی قطار شامل کریں"
                                removeLabel="جماعت کی قطار حذف کریں"
                                rowClassName="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-start"
                                actionsClassName="flex items-center justify-end gap-2 pt-0 md:pt-8"
                                addButtonClassName="grid h-14 w-14 place-items-center rounded-2xl bg-[#00d094] text-white transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                                renderFields={(row, index) => (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                                جماعت نام<span className="text-red-500"> *</span>
                                            </label>
                                            <div className="relative">
                                                <BookOpen size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                                <input
                                                    required={index === 0}
                                                    value={row.name}
                                                    onChange={(e) => updateClassRow(row.id, 'name', e.target.value)}
                                                    placeholder="مثلاً حفظ اول"
                                                    className={`h-14 w-full rounded-2xl border bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text)] outline-none ${row.error ? 'border-rose-500' : 'border-[var(--color-border)]'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                                                کلاس انچارج<span className="text-red-500"> *</span>
                                            </label>
                                            <select
                                                required
                                                value={row.inchargeTeacherId}
                                                onChange={(e) => updateClassRow(row.id, 'inchargeTeacherId', e.target.value)}
                                                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
                                            >
                                                <option value="">{teachers.length ? 'استاد منتخب کریں' : 'کوئی فعال استاد موجود نہیں'}</option>
                                                {teachers.map((teacher) => (
                                                    <option key={teacher.id} value={teacher.id}>{teacher.fullName}{teacher.subject ? ` — ${teacher.subject}` : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            />
                        )}
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
                    <table className="class-management-table w-full text-right">
                        <thead>
                            <tr className="text-[var(--color-text-muted)]">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">جماعت</th>
                                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">کلاس انچارج</th>
                                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">سیکشن</th>
                                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">حالت</th>
                                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        جماعتوں کی فہرست لوڈ ہو رہی ہے...
                                    </td>
                                </tr>
                            ) : filteredClasses.length ? (
                                filteredClasses.map((academicClass) => (
                                    <tr key={academicClass.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4 font-black text-[var(--color-text)]">{academicClass.name}</td>
                                        <td className="px-6 py-4 text-center text-sm font-bold text-[var(--color-text-muted)]">{academicClass.inchargeTeacher?.fullName || '---'}</td>
                                        <td className="px-6 py-4  text-center text-sm font-bold text-[var(--color-text-muted)]">{academicClass._count?.sections ?? 0}</td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={academicClass.status} />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(academicClass)}
                                                    className="p-3 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(academicClass)}
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
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        کوئی جماعت ریکارڈ نہیں ملی۔
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
                                <h3 className="text-xl font-black text-[var(--color-text)]">جماعت حذف کرنے کی تصدیق</h3>
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
