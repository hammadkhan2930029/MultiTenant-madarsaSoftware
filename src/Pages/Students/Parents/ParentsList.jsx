import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InputField } from '../../../Components/HR/FormElements';
import { createParent, deleteParent, getParents, updateParent } from '../../../Constant/StudentsApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { ExportExcelButton } from '../../../Components/Export/ExportExcelButton';
import { CNIC_INPUT_MAX_LENGTH, formatCnicInput, isCompleteCnic } from '../../../Utils/cnicFormat';

const INITIAL_FORM = {
    fullName: '',
    phone: '',
    occupation: '',
    address: '',
    email: '',
    cnic: '',
};

const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
};

const getActiveAssignment = (student) =>
    student?.assignments?.find((assignment) => assignment.status === 'active') || student?.assignments?.[0] || null;

const formatChildSummary = (item) => {
    const student = item.student || {};
    const activeAssignment = getActiveAssignment(student);

    return [
        student.admissionNumber,
        student.fullName,
        student.fatherName,
        item.relationship,
        item.isPrimary ? 'Primary' : 'Linked',
        activeAssignment?.class?.name,
        activeAssignment?.section?.name,
        student.phone,
    ]
        .filter(Boolean)
        .join(' | ');
};

const mapParentForExport = (parent) => ({
    id: parent.id,
    fullName: parent.fullName,
    familyNumber: parent.familyNumber,
    phone: parent.phone,
    email: parent.email,
    cnic: parent.cnic,
    occupation: parent.occupation,
    address: parent.address,
    status: parent.status,
    studentsCount: parent.students?.length || 0,
    students: (parent.students || []).map(formatChildSummary).join('\n'),
    studentAdmissionNumbers: (parent.students || []).map((item) => item.student?.admissionNumber).filter(Boolean).join(', '),
    studentNames: (parent.students || []).map((item) => item.student?.fullName).filter(Boolean).join(', '),
    studentClasses: (parent.students || [])
        .map((item) => {
            const activeAssignment = getActiveAssignment(item.student);
            return [activeAssignment?.class?.name, activeAssignment?.section?.name].filter(Boolean).join(' ');
        })
        .filter(Boolean)
        .join(', '),
    createdAt: formatDate(parent.createdAt),
    updatedAt: formatDate(parent.updatedAt),
});

export const ParentsList = () => {
    const navigate = useNavigate();
    const [parents, setParents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [formValues, setFormValues] = useState(INITIAL_FORM);
    const [editingParentId, setEditingParentId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    const loadParents = useCallback(async () => {
        try {
            const result = await getParents('page=1&limit=100');
            setParents(result.items || []);
        } catch (loadError) {
            const loadMessage = loadError?.message || '';
            const isEmptyParentsList =
                loadError?.statusCode === 404 ||
                loadMessage.includes('مطلوبہ ریکارڈ نہیں ملا') ||
                /parent.*not found/i.test(loadMessage);

            if (isEmptyParentsList) {
                setParents([]);
                return;
            }

            setError(loadMessage || 'سرپرست کی فہرست لوڈ نہیں ہو سکی۔');
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        window.scrollTo(0, 0);
        Promise.resolve().then(() => {
            if (isMounted) {
                loadParents();
            }
        });

        return () => {
            isMounted = false;
        };
    }, [loadParents]);

    const handleChange = (fieldName, fieldValue) => {
        setFormValues((currentValues) => ({
            ...currentValues,
            [fieldName]: fieldValue,
        }));
    };

    const resetForm = () => {
        setFormValues(INITIAL_FORM);
        setEditingParentId(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!formValues.fullName.trim()) {
            setError('سرپرست کا نام درج کرنا ضروری ہے۔');
            return;
        }

        if (!formValues.phone.trim()) {
            setError('فون نمبر درج کرنا ضروری ہے۔');
            return;
        }

        if (!formValues.address.trim()) {
            setError('پتہ درج کرنا ضروری ہے۔');
            return;
        }

        if (formValues.cnic.trim() && !isCompleteCnic(formValues.cnic)) {
            setError('شناختی کارڈ نمبر 00000-0000000-0 کے فارمیٹ میں درج کریں۔');
            return;
        }

        try {
            if (editingParentId) {
                await updateParent(editingParentId, formValues);
                setSuccess('سرپرست کی معلومات تبدیل ہو گئیں۔');
            } else {
                await createParent(formValues);
                setSuccess('سرپرست کی معلومات شامل ہو گئیں۔');
            }

            resetForm();
            await loadParents();
        } catch (saveError) {
            setError(saveError.message || 'سرپرست کی معلومات محفوظ نہیں ہو سکیں۔');
        }
    };

    const handleEdit = (parent) => {
        setEditingParentId(parent.id);
        setFormValues({
            fullName: parent.fullName || '',
            phone: parent.phone || '',
            occupation: parent.occupation || '',
            address: parent.address || '',
            email: parent.email || '',
            cnic: parent.cnic || '',
        });
        window.scrollTo(0, 0);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setIsDeleting(true);
            await deleteParent(deleteTarget.id);
            if (editingParentId === deleteTarget.id) {
                resetForm();
            }
            setDeleteTarget(null);
            setSuccess('سرپرست کا ریکارڈ حذف کر دیا گیا۔');
            await loadParents();
        } catch (deleteError) {
            setError(deleteError.message || 'سرپرست کا ریکارڈ حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredParents = useMemo(
        () =>
            parents.filter((parent) =>
                [parent.fullName, parent.familyNumber, parent.phone, parent.occupation, parent.address, parent.email]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
            ),
        [parents, searchTerm],
    );

    const exportRows = useMemo(() => filteredParents.map(mapParentForExport), [filteredParents]);

    const exportColumns = useMemo(() => [
        { header: 'Parent ID', accessor: 'id' },
        { header: 'Parent Name', accessor: 'fullName' },
        { header: 'Family Number', accessor: 'familyNumber' },
        { header: 'Phone', accessor: 'phone' },
        { header: 'Email', accessor: 'email' },
        { header: 'ID', accessor: 'cnic' },
        { header: 'Occupation', accessor: 'occupation' },
        { header: 'Address', accessor: 'address' },
        { header: 'Status', accessor: 'status' },
        { header: 'Linked Students Count', accessor: 'studentsCount' },
        { header: 'Student Admission Numbers', accessor: 'studentAdmissionNumbers' },
        { header: 'Student Names', accessor: 'studentNames' },
        { header: 'Student Classes', accessor: 'studentClasses' },
        { header: 'All Linked Students', accessor: 'students' },
        { header: 'Created At', accessor: 'createdAt' },
        { header: 'Updated At', accessor: 'updatedAt' },
    ], []);

    return (
        <div className="max-w-7xl mx-auto p-2 md:p-0 space-y-8 pb-10" dir="rtl">
            <div className="bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border)] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] p-6 md:p-8 space-y-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="flex items-center gap-3 text-3xl font-black text-[var(--color-text-main)]">
                            <div className="rounded-2xl bg-[var(--color-primary)]/10 p-3 text-[var(--color-primary)]">
                                <Users size={26} />
                            </div>
                            سرپرست
                        </h2>
                        <p className="mr-14 mt-2 text-sm font-bold text-[var(--color-text-muted)]">کل اندراجات: {filteredParents.length}</p>
                    </div>
                </div>

                <form noValidate onSubmit={handleSubmit} className="space-y-5 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 md:p-6">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-black text-[var(--color-text-main)] md:text-xl">
                            {editingParentId ? 'سرپرست کی تفصیل تبدیل کریں' : 'سرپرست شامل کریں'}
                        </h3>
                        <div className="flex items-center gap-3">
                            {editingParentId ? (
                                <button type="button" onClick={resetForm} className="rounded-2xl border border-[var(--color-border)] px-4 py-3 font-bold text-[var(--color-text-main)]">
                                    منسوخ کریں
                                </button>
                            ) : null}
                            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 font-black text-[#06211a] shadow-lg shadow-[var(--color-primary)]/20">
                                <Plus size={18} /> {editingParentId ? 'تبدیل کریں' : 'شامل کریں'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <InputField label="سرپرست کا نام" required value={formValues.fullName} onChange={(event) => handleChange('fullName', event.target.value)} placeholder="نام درج کریں" />
                        <InputField label="فون نمبر" required value={formValues.phone} onChange={(event) => handleChange('phone', event.target.value)} placeholder="0300-0000000" />
                        <InputField
                            label="پیشہ"
                            value={formValues.occupation}
                            onChange={(event) => handleChange('occupation', event.target.value)}
                            placeholder="پیشہ درج کریں"
                            className="min-h-[68px] py-3 leading-[2.5]"
                        />
                        <InputField
                            label="پتہ"
                            required
                            value={formValues.address}
                            onChange={(event) => handleChange('address', event.target.value)}
                            placeholder="گھر کا پتہ درج کریں"
                            className="min-h-[68px] py-3 leading-[2.5]"
                        />
                        <InputField label="ای میل" value={formValues.email} onChange={(event) => handleChange('email', event.target.value)} placeholder="example@email.com" />
                        <InputField
                            label="آئی ڈی"
                            value={formValues.cnic}
                            onChange={(event) => handleChange('cnic', formatCnicInput(event.target.value))}
                            placeholder="42101-1234567-1"
                            maxLength={CNIC_INPUT_MAX_LENGTH}
                            inputMode="numeric"
                            dir="ltr"
                            className="text-right"
                        />
                    </div>
                </form>
            </div>

            <div className="overflow-hidden rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.08)]">
                <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-5 md:flex-row md:items-center md:px-8">
                    <h3 className="text-lg font-black text-[var(--color-text-main)] md:text-xl">سرپرست</h3>
                    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                        <ExportExcelButton rows={exportRows} columns={exportColumns} fileName="parents-complete-list" className="w-full md:w-auto" />
                        <div className="group relative w-full md:w-96">
                            <Search size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors group-focus-within:text-[var(--color-primary)]" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="سرپرست کا نام، فیملی نمبر یا فون نمبر سے تلاش کریں..."
                                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-input)] py-4 pr-14 pl-6 text-sm font-bold text-[var(--color-text-main)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]/50"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px] text-right">
                        <thead className="border-b border-[var(--color-border)] bg-[var(--color-input)]/50">
                            <tr>
                                <th className="p-5 text-[14px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">سرپرست</th>
                                <th className="p-5 text-[14px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">فیملی نمبر</th>
                                <th className="p-5 text-[14px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">فون نمبر</th>
                                <th className="p-5 text-[14px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">پیشہ</th>
                                <th className="p-5 text-[14px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">پتہ</th>
                                <th className="p-5 text-[14px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">منسلک طلباء</th>
                                <th className="p-5 text-center text-[14px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredParents.map((parent) => (
                                <tr key={parent.id} className="transition-colors hover:bg-white/[0.02]">
                                    <td className="p-5">
                                        <div className="font-black text-[var(--color-text-main)]">{parent.fullName || '---'}</div>
                                        <div className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">{parent.email || '---'}</div>
                                    </td>
                                    <td className="p-5 text-sm font-black text-[var(--color-primary)]">{parent.familyNumber || '---'}</td>
                                    <td className="p-5 text-sm font-bold text-[var(--color-text-main)]">{parent.phone || '---'}</td>
                                    <td className="p-5 text-sm font-bold text-[var(--color-text-muted)]">{parent.occupation || '---'}</td>
                                    <td className="max-w-[200px] truncate p-5 text-sm font-bold text-[var(--color-text-muted)]" title={parent.address}>
                                        {parent.address || '---'}
                                    </td>
                                    <td className="p-5 text-sm font-bold text-[var(--color-text-main)]">{parent.students?.length || 0}</td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button type="button" onClick={() => navigate(`/students/parents/profile/${parent.id}`)} className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white">
                                                <Eye size={16} />
                                            </button>
                                            <button type="button" onClick={() => handleEdit(parent)} className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 transition-all hover:bg-blue-500 hover:text-white">
                                                <Pencil size={16} />
                                            </button>
                                            <button type="button" onClick={() => setDeleteTarget(parent)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400 transition-all hover:bg-rose-500 hover:text-white">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteTarget ? (
                <DeleteModal
                    title="سرپرست حذف کرنے کی تصدیق"
                    message="کیا آپ واقعی"
                    targetName={deleteTarget.fullName}
                    isDeleting={isDeleting}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            ) : null}
        </div>
    );
};

const DeleteModal = ({ title, message, targetName, isDeleting, onClose, onConfirm }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" dir="rtl">
        <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-black text-[var(--color-text-main)]">{title}</h3>
                    <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                        {message} <span className="text-rose-500">{targetName || 'یہ ریکارڈ'}</span> کو حذف کرنا چاہتے ہیں؟
                    </p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
                    <Trash2 size={22} />
                </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" onClick={onClose} disabled={isDeleting} className="flex-1 rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70">
                    منسوخ
                </button>
                <button type="button" onClick={onConfirm} disabled={isDeleting} className="flex-1 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70">
                    {isDeleting ? 'حذف ہو رہا ہے...' : 'تصدیق کریں'}
                </button>
            </div>
        </div>
    </div>
);
