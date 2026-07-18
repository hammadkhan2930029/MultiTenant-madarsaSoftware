import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Users, Target, Shield, Save, ChevronDown, X } from 'lucide-react';
import { InputField } from '../../../Components/HR/FormElements';
import { MultipleEntryRows } from '../../../Components/Common/MultipleEntryRows';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { createDepartments, deleteDepartment, getDepartments, updateDepartment } from '../../../Constant/DepartmentApi';
import { getTeachers } from '../../../Constant/TeachersApi';

const emptyForm = {
    name: '',
    code: '',
    head: '',
    headTeacherId: '',
    headSearch: '',
};

const createEmptyDepartmentRow = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '',
    code: '',
    head: '',
    headTeacherId: '',
    headSearch: '',
});

const formatHeadType = (staffType) => String(staffType || '').toLowerCase() === 'staff' ? 'عملہ' : 'استاد';

const buildHeadOptions = (items = []) => items
    .filter((item) => item?.status === 'active')
    .map((item) => ({
        id: String(item.id),
        label: item.fullName || item.name || '',
        meta: [
            `#${item.id}`,
            formatHeadType(item.staffType),
            item.jobTitle,
            item.branch?.name,
        ].filter(Boolean).join(' • '),
    }));

export const DepartmentManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [departmentRows, setDepartmentRows] = useState([createEmptyDepartmentRow()]);
    const [rowErrors, setRowErrors] = useState({});
    const [editMode, setEditMode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [headOptions, setHeadOptions] = useState([]);
    const [isHeadsLoading, setIsHeadsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const formRef = useRef(null);

    useNotificationBridge({ error, success });

    const scrollToForm = () => {
        window.setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    const loadDepartments = useCallback(async () => {
        try {
            setIsLoading(true);
            const result = await getDepartments('page=1&limit=100');
            setDepartments(result.items || []);
        } catch (loadError) {
            setError(loadError.message || 'شعبہ جات لوڈ نہیں ہو سکے۔');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);

    useEffect(() => {
        let isMounted = true;

        const loadHeadOptions = async () => {
            try {
                setIsHeadsLoading(true);
                const result = await getTeachers('page=1&limit=100&status=active');
                if (isMounted) setHeadOptions(buildHeadOptions(result.items || []));
            } catch (loadError) {
                if (isMounted) setError(loadError.message || 'شعبہ ہیڈ کی فہرست لوڈ نہیں ہو سکی۔');
            } finally {
                if (isMounted) setIsHeadsLoading(false);
            }
        };

        loadHeadOptions();

        return () => {
            isMounted = false;
        };
    }, []);

    const resetForm = () => {
        setFormData(emptyForm);
        setDepartmentRows([createEmptyDepartmentRow()]);
        setRowErrors({});
        setEditMode(null);
    };

    const updateDepartmentRow = (rowId, field, value) => {
        setDepartmentRows((currentRows) =>
            currentRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
        );
        setRowErrors((currentErrors) => {
            if (!currentErrors[rowId]) return currentErrors;
            const nextErrors = { ...currentErrors };
            delete nextErrors[rowId];
            return nextErrors;
        });
    };

    const addDepartmentRow = () => {
        setDepartmentRows((currentRows) => [...currentRows, createEmptyDepartmentRow()]);
    };

    const removeDepartmentRow = (rowId) => {
        setDepartmentRows((currentRows) => (currentRows.length > 1 ? currentRows.filter((row) => row.id !== rowId) : currentRows));
        setRowErrors((currentErrors) => {
            const nextErrors = { ...currentErrors };
            delete nextErrors[rowId];
            return nextErrors;
        });
    };

    const validateDepartmentRows = () => {
        const normalizedRows = departmentRows
            .map((row) => ({
                ...row,
                name: row.name.trim(),
                code: row.code.trim(),
                head: row.head.trim(),
            }))
            .filter((row) => row.name || row.code || row.head || row.headTeacherId);
        const nextErrors = {};
        const seenNames = new Map();
        const seenCodes = new Map();

        if (!normalizedRows.length) {
            nextErrors[departmentRows[0].id] = 'کم از کم ایک شعبہ کی معلومات درج کریں۔';
        }

        normalizedRows.forEach((row) => {
            if (!row.name) {
                nextErrors[row.id] = 'شعبہ کا نام ضروری ہے۔';
                return;
            }

            const nameKey = row.name.toLowerCase();
            if (seenNames.has(nameKey)) {
                nextErrors[row.id] = 'یہ شعبہ اسی فارم میں دوبارہ درج ہے۔';
            } else {
                seenNames.set(nameKey, row.id);
            }

            const codeKey = row.code.toLowerCase();
            if (row.code && seenCodes.has(codeKey)) {
                nextErrors[row.id] = 'یہ شعبہ کوڈ اسی فارم میں دوبارہ درج ہے۔';
            } else if (row.code) {
                seenCodes.set(codeKey, row.id);
            }
        });

        setRowErrors(nextErrors);
        return {
            isValid: Object.keys(nextErrors).length === 0,
            rows: normalizedRows,
        };
    };

    const handleSubmit = async () => {
        let validRows = [];

        if (editMode) {
            if (!formData.name.trim()) {
                setError('شعبہ کا نام ضروری ہے۔');
                return;
            }
        } else {
            const validation = validateDepartmentRows();
            if (!validation.isValid) {
                setError('درج کردہ شعبہ جات میں غلطی موجود ہے۔');
                return;
            }
            validRows = validation.rows;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            if (editMode) {
                const payload = {
                    name: formData.name.trim(),
                    code: formData.code.trim(),
                    head: formData.headTeacherId ? '' : formData.head.trim(),
                    headTeacherId: formData.headTeacherId ? Number(formData.headTeacherId) : null,
                };
                await updateDepartment(editMode, payload);
                setSuccess('شعبہ کامیابی سے تبدیل ہو گیا۔');
            } else {
                await createDepartments({
                    departments: validRows.map((row) => ({
                        name: row.name,
                        code: row.code,
                        head: row.headTeacherId ? '' : row.head,
                        headTeacherId: row.headTeacherId ? Number(row.headTeacherId) : null,
                    })),
                });
                setSuccess(validRows.length > 1 ? 'شعبہ جات کامیابی سے شامل ہو گئے۔' : 'نیا شعبہ کامیابی سے شامل ہو گیا۔');
            }

            resetForm();
            await loadDepartments();
        } catch (saveError) {
            setError(saveError.message || 'شعبہ محفوظ نہیں ہو سکا۔');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (department) => {
        setFormData({
            name: department.name || '',
            code: department.code || '',
            head: department.legacyHead || (!department.headTeacherId ? department.head || '' : ''),
            headTeacherId: department.headTeacherId ? String(department.headTeacherId) : '',
            headSearch: department.headTeacher?.fullName || department.head || '',
        });
        setEditMode(department.id);
        setError('');
        setSuccess('');
        scrollToForm();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setIsDeleting(true);
            setError('');
            setSuccess('');
            await deleteDepartment(deleteTarget.id);
            setSuccess('شعبہ کامیابی سے حذف ہو گیا۔');
            if (editMode === deleteTarget.id) resetForm();
            setDeleteTarget(null);
            await loadDepartments();
        } catch (deleteError) {
            setError(deleteError.message || 'شعبہ حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700  lg:pt-0 md:pt-0 pt-6" dir="rtl">

            <div className="flex flex-row justify-between items-center gap-6 bg-[var(--color-surface)] p-4 md:p-6 rounded-[3rem] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] border border-[var(--color-border)]">
                <div>
                    <h1 style={{ color: 'var(--color-text-main)' }} className="text-2xl font-black">شعبہ جات کا انتظام</h1>
                    <p style={{ color: 'var(--color-text-muted)' }} className="text-sm font-medium mt-7">نئے شعبے بنائیں اور ٹیم کی ساخت کو منظم کریں</p>
                </div>
                <div style={{ backgroundColor: 'var(--color-primary)' }} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#00d094]/20">
                    <Building2 size={24} />
                </div>
            </div>

            <div
                ref={formRef}
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                className="border rounded-[2.5rem] p-6 md:p-8 shadow-sm"
            >
                {editMode ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
                        <div className="min-w-0 space-y-2">
                            <InputField
                                type="text"
                                label={'شعبہ کا نام'}
                                required
                                placeholder="مثلاً: مارکیٹنگ"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                className="h-[74px] px-5 py-0 text-base font-bold"
                            />
                        </div>
                        <div className="min-w-0 space-y-2">
                            <InputField
                                type="text"
                                label={'شعبہ کوڈ'}
                                placeholder="مثلاً: MKT"
                                value={formData.code}
                                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                                className="h-[74px] px-5 py-0 text-base font-bold"
                            />
                        </div>
                        <div className="min-w-0 space-y-2">
                            <HeadSearchableSelect
                                label={'شعبہ ہیڈ'}
                                value={formData.headSearch}
                                options={headOptions}
                                isLoading={isHeadsLoading}
                                placeholder="ہیڈ منتخب کریں"
                                onChange={(value) => setFormData((prev) => ({
                                    ...prev,
                                    headSearch: value,
                                    headTeacherId: '',
                                    head: value,
                                }))}
                                onSelectOption={(option) => setFormData((prev) => ({
                                    ...prev,
                                    headSearch: option.label,
                                    headTeacherId: option.id,
                                    head: '',
                                }))}
                                onClear={() => setFormData((prev) => ({
                                    ...prev,
                                    headSearch: '',
                                    headTeacherId: '',
                                    head: '',
                                }))}
                            />
                        </div>
                        <div className="flex min-w-0 flex-col gap-3 md:col-span-2 md:flex-row xl:col-span-1">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="h-[74px] rounded-2xl border border-[var(--color-border)] px-6 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] md:min-w-[120px]"
                            >
                                منسوخ
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                style={{ backgroundColor: 'var(--color-primary)' }}
                                className="flex h-[74px] min-w-[180px] items-center justify-center gap-3 whitespace-nowrap rounded-2xl px-8 text-base font-black text-white shadow-lg shadow-[#00d094]/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                            >
                                <Save size={20} />
                                <span>{isSaving ? 'محفوظ ہو رہا ہے...' : 'تبدیل کریں'}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <MultipleEntryRows
                            rows={departmentRows}
                            onAdd={addDepartmentRow}
                            onRemove={removeDepartmentRow}
                            disabled={isSaving}
                            addLabel="نیا شعبہ شامل کریں"
                            removeLabel="شعبہ حذف کریں"
                            rowClassName="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_220px_1fr_auto] xl:items-start"
                            actionsClassName="flex items-center justify-end gap-2 pt-0 xl:pt-8"
                            addButtonClassName="grid h-[74px] w-[74px] place-items-center rounded-2xl bg-[#00d094] text-white shadow-lg shadow-[#00d094]/20 transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                            removeButtonClassName="grid h-[74px] w-[74px] place-items-center rounded-2xl bg-rose-500/10 text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            getRowError={(row) => rowErrors[row.id]}
                            renderFields={(row) => (
                                <>
                                    <InputField
                                        type="text"
                                        label={'شعبہ کا نام'}
                                        required
                                        placeholder="مثلاً: مارکیٹنگ"
                                        value={row.name}
                                        onChange={(e) => updateDepartmentRow(row.id, 'name', e.target.value)}
                                        className="h-[74px] px-5 py-0 text-base font-bold"
                                    />
                                    <InputField
                                        type="text"
                                        label={'شعبہ کوڈ'}
                                        placeholder="مثلاً: MKT"
                                        value={row.code}
                                        onChange={(e) => updateDepartmentRow(row.id, 'code', e.target.value)}
                                        className="h-[74px] px-5 py-0 text-base font-bold"
                                    />
                                    <HeadSearchableSelect
                                        label={'شعبہ ہیڈ'}
                                        value={row.headSearch}
                                        options={headOptions}
                                        isLoading={isHeadsLoading}
                                        placeholder="ہیڈ منتخب کریں"
                                        onChange={(value) => {
                                            updateDepartmentRow(row.id, 'headSearch', value);
                                            updateDepartmentRow(row.id, 'headTeacherId', '');
                                            updateDepartmentRow(row.id, 'head', value);
                                        }}
                                        onSelectOption={(option) => {
                                            updateDepartmentRow(row.id, 'headSearch', option.label);
                                            updateDepartmentRow(row.id, 'headTeacherId', option.id);
                                            updateDepartmentRow(row.id, 'head', '');
                                        }}
                                        onClear={() => {
                                            updateDepartmentRow(row.id, 'headSearch', '');
                                            updateDepartmentRow(row.id, 'headTeacherId', '');
                                            updateDepartmentRow(row.id, 'head', '');
                                        }}
                                    />
                                </>
                            )}
                        />
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                style={{ backgroundColor: 'var(--color-primary)' }}
                                className="flex h-[74px] min-w-[220px] items-center justify-center gap-3 whitespace-nowrap rounded-2xl px-8 text-base font-black text-white shadow-lg shadow-[#00d094]/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                            >
                                <Plus size={20} />
                                <span>{isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isLoading ? (
                    <div
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        className="border rounded-[2rem] p-5 text-center text-sm font-bold text-[var(--color-text-muted)]"
                    >
                        شعبہ جات لوڈ ہو رہے ہیں...
                    </div>
                ) : departments.length > 0 ? (
                    departments.map((dept) => (
                        <div
                            key={dept.id}
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                            className="group border rounded-[2rem] p-5 flex items-center justify-between hover:border-[var(--color-primary)] transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center gap-5">
                                <div style={{ backgroundColor: 'var(--color-input)' }} className="w-14 h-14 rounded-2xl flex items-center justify-center text-[var(--color-primary)] group-hover:scale-110 transition-transform">
                                    <Target size={26} />
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--color-text-main)' }} className="text-xl font-black">
                                        {dept.name} <span className="px-2 text-sm font-bold opacity-60">#{dept.code || '-'}</span>
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                        <span style={{ color: 'var(--color-text-muted)' }} className="flex items-center gap-1.5 text-sm font-bold md:text-base">
                                            <Shield size={15} /> ہیڈ: {dept.head || '-'}
                                        </span>
                                        <span style={{ color: 'var(--color-text-muted)' }} className="flex items-center gap-1.5 text-sm font-bold md:text-base">
                                            <Users size={15} /> {dept.members || 0} ممبرز
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(dept)}
                                    className="p-3 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(dept)}
                                    className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        className="border rounded-[2rem] p-5 text-center text-sm font-bold text-[var(--color-text-muted)]"
                    >
                        ابھی تک کوئی شعبہ شامل نہیں کیا گیا۔
                    </div>
                )}
            </div>

            {deleteTarget ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" dir="rtl">
                    <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-[var(--color-text-main)]">شعبہ حذف کرنے کی تصدیق</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                    کیا آپ واقعی <span className="text-rose-500">{deleteTarget.name}</span> کو حذف کرنا چاہتے ہیں؟
                                </p>
                            </div>
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
                                <Trash2 size={22} />
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="flex-1 rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                منسوخ
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isDeleting ? 'حذف ہو رہا ہے...' : 'تصدیق کریں'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

const HeadSearchableSelect = ({ label, value, options, isLoading, onChange, onSelectOption, onClear, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    const filteredOptions = useMemo(() => {
        const query = String(value || '').trim().toLowerCase();
        if (!query) return options;

        return options.filter((option) =>
            [option.label, option.meta]
                .filter(Boolean)
                .some((item) => String(item).toLowerCase().includes(query)),
        );
    }, [options, value]);

    return (
        <div className="relative space-y-2">
            <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(event) => {
                        onChange(event.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                    placeholder={placeholder}
                    className="h-[74px] w-full rounded-2xl border border-transparent bg-[var(--color-input)] px-5 py-0 pl-20 text-base font-bold text-[var(--color-text-main)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                />
                {value ? (
                    <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={onClear}
                        className="absolute left-11 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                    >
                        <X size={16} />
                    </button>
                ) : null}
                <ChevronDown size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />

                {isOpen ? (
                    <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
                        {isLoading ? (
                            <div className="px-4 py-3 text-right text-sm font-bold text-[var(--color-text-muted)]">فہرست لوڈ ہو رہی ہے...</div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.slice(0, 20).map((option) => (
                                <button
                                    key={`department-head-${option.id}`}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                        onSelectOption(option);
                                        setIsOpen(false);
                                    }}
                                    className="block w-full border-b border-[var(--color-border)] px-4 py-3 text-right transition-colors hover:bg-[var(--color-bg)] last:border-b-0"
                                >
                                    <div className="font-bold text-[var(--color-text-main)]">{option.label}</div>
                                    {option.meta ? <div className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">{option.meta}</div> : null}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-right text-sm font-bold text-[var(--color-text-muted)]">کوئی ریکارڈ نہیں ملا۔</div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};
