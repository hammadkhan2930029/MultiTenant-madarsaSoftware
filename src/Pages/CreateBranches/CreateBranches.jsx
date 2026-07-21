import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Edit2,
    Eye,
    Hash,
    MapPin,
    Phone,
    Plus,
    Save,
    Search,
    ShieldCheck,
    ToggleLeft,
    ToggleRight,
    X,
} from 'lucide-react';
import { createBranch, getBranches, getLegacyBranchMigrationStatus, updateBranch } from '../../Constant/AcademicSetupApi';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';
import { DeleteConfirmationModal } from '../../Components/Common/DeleteConfirmationModal';

const emptyForm = {
    name: '',
    code: '',
    address: '',
    contact: '',
    status: 'active',
};

const emptyLimitMeta = {
    branchEnabled: true,
    branchLimit: null,
    branchesCreated: 0,
    remainingBranches: 0,
};

const statusLabels = {
    active: 'فعال',
    inactive: 'غیر فعال',
};

Object.assign(statusLabels, {
    active: 'فعال',
    inactive: 'غیر فعال',
    suspended: 'معطل',
    archived: 'محفوظ شدہ',
});

const formatDate = (value) => {
    if (!value) return '-';
    try {
        return new Intl.DateTimeFormat('ur-PK', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date(value));
    } catch {
        return '-';
    }
};

const getBranchUserLabel = (branch) => {
    if (branch?.creator?.name || branch?.creator?.username) {
        return branch.creator.name || branch.creator.username;
    }

    const assigned = branch?.assignedAdmins || [];
    if (assigned.length) {
        return assigned.map((admin) => admin.name || admin.username || admin.email).filter(Boolean).join('، ');
    }

    return '-';
};

const getBranchErrorMessage = (error, fallback) => {
    const message = error?.message || '';

    if (message.includes('Branch system is disabled')) return 'اس مدرسہ کے لئے برانچ سسٹم فعال نہیں ہے۔';
    if (message.includes('Branch limit has been reached')) return 'برانچ حد مکمل ہو چکی ہے۔';
    if (message.includes('same name or code')) return 'اسی نام یا کوڈ کی برانچ پہلے سے موجود ہے۔';
    if (message.includes('Branch name is required')) return 'برانچ کا نام ضروری ہے۔';
    if (message.includes('Branch code is required')) return 'برانچ کوڈ ضروری ہے۔';
    if (message.includes('cannot be deleted') || message.includes('linked')) {
        return 'اس برانچ سے ریکارڈ منسلک ہیں، اس لئے اسے غیر فعال نہیں کیا جا سکتا۔';
    }

    return message || fallback;
};

export const CreateBranch = () => {
    const navigate = useNavigate();
    const [branches, setBranches] = useState([]);
    const [branchLimit, setBranchLimit] = useState(emptyLimitMeta);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [editMode, setEditMode] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusTarget, setStatusTarget] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [detailsTarget, setDetailsTarget] = useState(null);
    const [accessTarget, setAccessTarget] = useState(null);
    const [migrationStatus, setMigrationStatus] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useNotificationBridge({ error, success });

    const totalAllowedBranches = Number.isInteger(branchLimit.branchLimit) ? branchLimit.branchLimit : 0;
    const createdBranches = Number.isInteger(branchLimit.branchesCreated) ? branchLimit.branchesCreated : branches.length;
    const remainingBranches = Number.isInteger(branchLimit.remainingBranches)
        ? branchLimit.remainingBranches
        : Math.max(totalAllowedBranches - createdBranches, 0);
    const canCreateBranch = branchLimit.branchEnabled && remainingBranches > 0;

    const filteredBranches = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return branches;

        return branches.filter((branch) => (
            [branch.name, branch.code, branch.address, branch.contact, branch.status]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        ));
    }, [branches, search]);

    const loadBranches = async () => {
        setIsLoading(true);
        setError('');

        try {
            const [result, legacyStatus] = await Promise.all([
                getBranches('page=1&limit=100'),
                getLegacyBranchMigrationStatus().catch(() => null),
            ]);
            const items = result.items || [];
            setBranches(items);
            setMigrationStatus(legacyStatus);
            setBranchLimit({
                ...emptyLimitMeta,
                ...(result.branchLimit || {}),
                branchesCreated: result.branchLimit?.branchesCreated ?? items.length,
            });
        } catch (loadError) {
            setBranches([]);
            setMigrationStatus(null);
            setError(getBranchErrorMessage(loadError, 'برانچز لوڈ نہیں ہو سکیں۔'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    const resetForm = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setEditMode(null);
        setIsFormOpen(false);
    };

    const openCreateForm = () => {
        if (!canCreateBranch) {
            setError('برانچ حد مکمل ہو چکی ہے۔');
            return;
        }

        setError('');
        setSuccess('');
        setFormErrors({});
        setFormData(emptyForm);
        setEditMode(null);
        setIsFormOpen(true);
    };

    const handleEdit = (branch) => {
        setFormData({
            name: branch.name || '',
            code: branch.code || '',
            address: branch.address || '',
            contact: branch.contact || '',
            status: branch.status || 'active',
        });
        setEditMode(branch.id);
        setError('');
        setSuccess('');
        setFormErrors({});
        setIsFormOpen(true);
    };

    const updateFormField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => {
            if (!prev[field]) return prev;
            const nextErrors = { ...prev };
            delete nextErrors[field];
            return nextErrors;
        });
    };

    const buildPayload = (source = formData) => ({
        name: source.name.trim(),
        code: source.code.trim(),
        address: source.address.trim(),
        contact: source.contact.trim(),
        status: source.status || 'active',
    });

    const handleSubmit = async () => {
        if (isSaving) return;

        const nextErrors = {};
        if (!formData.name.trim()) {
            nextErrors.name = 'برانچ کا نام ضروری ہے۔';
        }

        if (!formData.code.trim()) {
            nextErrors.code = 'برانچ کوڈ ضروری ہے۔';
        }

        if (Object.keys(nextErrors).length) {
            setFormErrors(nextErrors);
            setError(Object.values(nextErrors)[0]);
            return;
        }

        if (!editMode && !canCreateBranch) {
            setError('برانچ حد مکمل ہو چکی ہے۔');
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = buildPayload();

            if (editMode) {
                await updateBranch(editMode, payload);
                setSuccess('برانچ کامیابی سے تبدیل ہو گئی۔');
            } else {
                await createBranch(payload);
                setSuccess('نئی برانچ کامیابی سے محفوظ ہو گئی۔');
            }

            window.dispatchEvent(new Event('branches:updated'));
            resetForm();
            await loadBranches();
        } catch (saveError) {
            setError(getBranchErrorMessage(saveError, 'برانچ محفوظ نہیں ہو سکی۔'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = async () => {
        if (!statusTarget) return;

        const nextStatus = statusTarget.status === 'active' ? 'inactive' : 'active';
        setError('');
        setSuccess('');
        setIsUpdatingStatus(true);

        try {
            await updateBranch(statusTarget.id, buildPayload({
                name: statusTarget.name || '',
                code: statusTarget.code || '',
                address: statusTarget.address || '',
                contact: statusTarget.contact || '',
                status: nextStatus,
            }));
            setSuccess(nextStatus === 'active' ? 'برانچ فعال کر دی گئی۔' : 'برانچ غیر فعال کر دی گئی۔');
            setStatusTarget(null);
            window.dispatchEvent(new Event('branches:updated'));
            await loadBranches();
        } catch (statusError) {
            setError(getBranchErrorMessage(statusError, 'برانچ کی حالت تبدیل نہیں ہو سکی۔'));
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
            <div className="flex flex-col gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="text-right">
                    <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tight">برانچ مینجمنٹ</h2>
                    <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)]">
                        کل برانچز: {filteredBranches.length}
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                    <div className="relative w-full md:w-72">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            id="branch-search"
                            aria-label="برانچ تلاش کریں"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="برانچ تلاش کریں"
                            className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => (isFormOpen ? resetForm() : openCreateForm())}
                        disabled={!isFormOpen && !canCreateBranch}
                        aria-disabled={!isFormOpen && !canCreateBranch}
                        className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                            isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white'
                        }`}
                    >
                        {isFormOpen ? 'بند کریں' : 'نئی برانچ'}
                        {isFormOpen ? <X size={18} /> : <Plus size={18} />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SummaryCard label="کل اجازت شدہ برانچز" value={totalAllowedBranches} />
                <SummaryCard label="بن چکی برانچز" value={createdBranches} />
                <SummaryCard label="باقی برانچز" value={remainingBranches} />
            </div>

            {migrationStatus?.migrationRequired ? (
                <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-5 text-right shadow-sm">
                    <p className="text-sm font-black text-amber-500">پرانی معلومات کی Main Branch منتقلی باقی ہے</p>
                    <p className="mt-2 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                        {migrationStatus.legacyRecords?.totalUnassigned || 0} ریکارڈز ابھی کسی برانچ سے منسلک نہیں۔ برانچ صارفین یہ ریکارڈز controlled migration مکمل ہونے تک نہیں دیکھ سکیں گے۔
                    </p>
                </div>
            ) : null}

            {isFormOpen ? (
                <div className="rounded-[2.5rem] border border-[#00d094]/20 bg-[var(--color-surface)] p-8 shadow-xl" role="form" aria-labelledby="branch-form-title">
                    <div className="mb-6 flex items-center gap-2 font-black text-[#00d094]">
                        {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
                        <span id="branch-form-title">{editMode ? 'برانچ تبدیل کریں' : 'نئی برانچ شامل کریں'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field
                            id="branch-name"
                            label="برانچ نام"
                            required
                            error={formErrors.name}
                            value={formData.name}
                            onChange={(value) => updateFormField('name', value)}
                            placeholder="مثلاً مین کیمپس"
                            icon={<Building2 size={18} />}
                        />
                        <Field
                            id="branch-code"
                            label="برانچ کوڈ"
                            required
                            error={formErrors.code}
                            value={formData.code}
                            onChange={(value) => updateFormField('code', value)}
                            placeholder="MC-01"
                            icon={<Hash size={18} />}
                        />
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field
                            id="branch-contact"
                            label="رابطہ"
                            value={formData.contact}
                            onChange={(value) => updateFormField('contact', value)}
                            placeholder="رابطہ نمبر"
                            icon={<Phone size={18} />}
                        />
                        <SelectField
                            id="branch-status"
                            label="حالت"
                            value={formData.status}
                            onChange={(value) => updateFormField('status', value)}
                        />
                    </div>

                    <div className="mt-6">
                        <Field
                            id="branch-address"
                            label="پتہ"
                            value={formData.address}
                            onChange={(value) => updateFormField('address', value)}
                            placeholder="مکمل پتہ درج کریں"
                            icon={<MapPin size={18} />}
                        />
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        {editMode ? (
                            <button type="button" onClick={resetForm} disabled={isSaving} className="rounded-xl px-5 py-3 text-sm font-black text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-60">
                                منسوخ
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSaving}
                            aria-busy={isSaving}
                            className="flex items-center gap-3 rounded-xl bg-[#218838] px-8 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSaving ? 'محفوظ ہو رہا ہے...' : (editMode ? 'تبدیل کریں' : 'محفوظ کریں')}
                            {editMode ? <Save size={18} /> : <Plus size={18} />}
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-right">
                        <thead>
                            <tr className="text-[var(--color-text-muted)]">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">برانچ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">کوڈ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">رابطہ</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">حالت</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">برانچ ایڈمن / صارف</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        برانچز لوڈ ہو رہی ہیں...
                                    </td>
                                </tr>
                            ) : filteredBranches.length ? (
                                filteredBranches.map((branch) => (
                                    <tr key={branch.id} className="border-t border-[var(--color-border)]/60">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-[var(--color-text)]">{branch.name}</p>
                                            <p className="mt-1 text-xs font-bold text-[var(--color-text-muted)]">{branch.address || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{branch.code || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{branch.contact || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex rounded-xl px-3 py-1 text-xs font-black ${
                                                branch.status === 'active'
                                                    ? 'bg-[#00d094]/10 text-[#00d094]'
                                                    : 'bg-rose-500/10 text-rose-500'
                                            }`}>
                                                {statusLabels[branch.status] || branch.status || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-muted)]">{getBranchUserLabel(branch)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-start gap-2">
                                                <IconButton onClick={() => setDetailsTarget(branch)} title="تفصیل دیکھیں" tone="info">
                                                    <Eye size={16} />
                                                </IconButton>
                                                <IconButton onClick={() => handleEdit(branch)} title="برانچ ایڈٹ کریں" tone="success">
                                                    <Edit2 size={16} />
                                                </IconButton>
                                                <IconButton onClick={() => setAccessTarget(branch)} title="رسائی مقرر کریں" tone="success">
                                                    <ShieldCheck size={16} />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => setStatusTarget(branch)}
                                                    title={branch.status === 'active' ? 'برانچ غیر فعال کریں' : 'برانچ فعال کریں'}
                                                    tone={branch.status === 'active' ? 'danger' : 'success'}
                                                >
                                                    {branch.status === 'active' ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                                                </IconButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                        کوئی برانچ ریکارڈ نہیں ملا۔
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {statusTarget ? (
                <DeleteConfirmationModal
                    title={statusTarget.status === 'active' ? 'برانچ غیر فعال کرنے کی تصدیق' : 'برانچ فعال کرنے کی تصدیق'}
                    message={statusTarget.status === 'active' ? 'کیا آپ واقعی اس برانچ کو غیر فعال کرنا چاہتے ہیں؟' : 'کیا آپ واقعی اس برانچ کو فعال کرنا چاہتے ہیں؟'}
                    targetName={statusTarget.name}
                    isDeleting={isUpdatingStatus}
                    onClose={() => !isUpdatingStatus && setStatusTarget(null)}
                    onConfirm={handleStatusChange}
                    confirmText={statusTarget.status === 'active' ? 'غیر فعال کریں' : 'فعال کریں'}
                    loadingText="حالت تبدیل ہو رہی ہے..."
                />
            ) : null}

            {detailsTarget ? (
                <BranchInfoModal
                    title="برانچ تفصیل"
                    branch={detailsTarget}
                    onClose={() => setDetailsTarget(null)}
                    onEditUser={(userId) => {
                        setDetailsTarget(null);
                        navigate(`/role-management/users/${userId}/edit`);
                    }}
                />
            ) : null}

            {accessTarget ? (
                <BranchInfoModal
                    title="برانچ رسائی"
                    branch={accessTarget}
                    onClose={() => setAccessTarget(null)}
                    accessMode
                />
            ) : null}
        </div>
    );
};

const SummaryCard = ({ label, value }) => (
    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <p className="text-sm font-black text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-3 text-2xl font-black text-[var(--color-text)]">{value}</p>
    </div>
);

const IconButton = ({ children, onClick, title, tone = 'success' }) => {
    const toneClass = tone === 'danger'
        ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500'
        : tone === 'info'
            ? 'bg-sky-500/10 text-sky-500 hover:bg-sky-500'
            : 'bg-emerald-500/10 text-[#00d094] hover:bg-[#00d094]';

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={title}
            className={`rounded-xl p-2.5 transition-all hover:text-white ${toneClass}`}
            title={title}
        >
            {children}
        </button>
    );
};

const Field = ({ id, label, value, onChange, placeholder, icon, required = false, error = '' }) => (
    <div className="space-y-2">
        <label htmlFor={id} className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
            {label}{required ? <span className="text-red-500"> *</span> : null}
        </label>
        <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">{icon}</div>
            <input
                id={id}
                required={required}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={error && id ? `${id}-error` : undefined}
                className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
            />
        </div>
        {error ? <p id={id ? `${id}-error` : undefined} className="mr-2 text-xs font-bold text-rose-500">{error}</p> : null}
    </div>
);

const SelectField = ({ id, label, value, onChange }) => (
    <div className="space-y-2">
        <label htmlFor={id} className="mr-2 block text-right text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
            {label}
        </label>
        <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-right text-sm font-bold text-[var(--color-text)] outline-none"
        >
            <option value="active">فعال</option>
            <option value="inactive">غیر فعال</option>
            <option value="suspended">{statusLabels.suspended}</option>
            <option value="archived">{statusLabels.archived}</option>
        </select>
    </div>
);

const BranchInfoModal = ({ title, branch, onClose, accessMode = false, onEditUser = null }) => (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="branch-info-title">
            <div className="flex items-start justify-between gap-4">
                <div className="text-right">
                    <h3 id="branch-info-title" className="text-xl font-black text-[var(--color-text)]">{title}</h3>
                    <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">{branch.name}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    autoFocus
                    aria-label="بند کریں"
                    className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 text-sm font-bold text-[var(--color-text-muted)] sm:grid-cols-2">
                <InfoRow label="کوڈ" value={branch.code || '-'} />
                <InfoRow label="حالت" value={statusLabels[branch.status] || branch.status || '-'} />
                <InfoRow label="رابطہ" value={branch.contact || '-'} />
                <InfoRow label="تاریخ" value={formatDate(branch.createdAt)} />
                <InfoRow label="برانچ ایڈمن / صارف" value={getBranchUserLabel(branch)} />
                <InfoRow label="منسلک صارفین" value={branch?._count?.assignedAdmins ?? 0} />
                <div className="sm:col-span-2">
                    <InfoRow label="پتہ" value={branch.address || '-'} />
                </div>
                {accessMode ? (
                    <div className="sm:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-right">
                        <p className="text-[var(--color-text)]">رسائی موجودہ کردار اور اجازتوں کے مطابق لاگو ہے۔</p>
                        <p className="mt-2 text-xs leading-6 text-[var(--color-text-muted)]">
                            برانچ مخصوص رسائی اسائنمنٹ کے لئے بیک اینڈ ربط اگلے مرحلے میں درکار ہے۔
                        </p>
                    </div>
                ) : null}
                {!accessMode ? (
                    <div className="sm:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-right">
                        <p className="text-xs font-black text-[var(--color-text-muted)]">لاگ اِن تفصیل</p>
                        {branch?.assignedAdmins?.length ? (
                            <div className="mt-3 space-y-3">
                                {branch.assignedAdmins.map((admin) => (
                                    <div key={admin.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-[var(--color-text)]">{admin.name || '-'}</p>
                                                <p className="text-xs font-bold text-[var(--color-text-muted)]">صارف نام: {admin.username || '-'}</p>
                                                <p className="text-xs font-bold text-[var(--color-text-muted)]">ای میل: {admin.email || '-'}</p>
                                                <p className="text-xs font-bold text-[var(--color-text-muted)]">فون: {admin.phone || '-'}</p>
                                                <p className="text-xs font-bold text-[var(--color-text-muted)]">کردار: {admin.assignedRole?.roleName || admin.role || '-'}</p>
                                                <p className="text-xs font-bold text-[var(--color-text-muted)]">حالت: {statusLabels[admin.status] || admin.status || '-'}</p>
                                            </div>
                                            {onEditUser ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onEditUser(admin.id)}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2 text-xs font-black text-blue-500 transition-all hover:bg-blue-500 hover:text-white"
                                                >
                                                    <Edit2 size={14} />
                                                    ترمیم کریں
                                                </button>
                                            ) : null}
                                        </div>
                                        <p className="mt-3 text-[11px] font-bold leading-5 text-[var(--color-text-muted)]">
                                            پاس ورڈ محفوظ رکھا گیا ہے؛ تبدیل کرنے کے لئے ترمیم میں نیا پاس ورڈ درج کریں۔
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm font-bold text-[var(--color-text-muted)]">اس برانچ کے ساتھ ابھی کوئی لاگ اِن صارف منسلک نہیں۔</p>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <p className="text-xs font-black text-[var(--color-text-muted)]">{label}</p>
        <p className="mt-2 text-sm font-black text-[var(--color-text)]">{value}</p>
    </div>
);
