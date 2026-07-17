import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Eye, Search, Trash2, UserPlus, X } from 'lucide-react';
import { InputField } from '../../../Components/HR/FormElements';
import { useNavigate } from 'react-router-dom';
import { deleteTeacher, getTeachers } from '../../../Constant/TeachersApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { ExportExcelButton } from '../../../Components/Export/ExportExcelButton';
import { Can } from '../../../Components/Auth/Can';

const listConfig = {
    teacher: {
        title: 'اساتذہ کی فہرست',
        totalLabel: 'کل اساتذہ',
        searchPlaceholder: 'نام، مضمون یا فون تلاش کریں...',
        subjectLabel: 'مضمون',
        loadError: 'اساتذہ لوڈ نہیں ہو سکے۔',
        deleteSuccess: 'استاد کامیابی سے حذف کر دیا گیا۔',
        deleteError: 'استاد حذف نہیں ہو سکا۔',
        deleteTitle: 'استاد حذف کرنے کی تصدیق',
        addPath: '/HRManagement?staffType=teacher',
    },
    staff: {
        title: 'دیگر عملہ کی فہرست',
        totalLabel: 'کل عملہ',
        searchPlaceholder: 'نام، ذمہ داری یا فون تلاش کریں...',
        subjectLabel: 'ذمہ داری',
        loadError: 'دیگر عملہ لوڈ نہیں ہو سکا۔',
        deleteSuccess: 'عملہ کامیابی سے حذف کر دیا گیا۔',
        deleteError: 'عملہ حذف نہیں ہو سکا۔',
        deleteTitle: 'عملہ حذف کرنے کی تصدیق',
        addPath: '/HRManagement?staffType=staff',
    },
};

const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
};

const getTeacherShiftLabel = (teacher) =>
    teacher?.shift?.name || teacher?.shiftName || teacher?.shiftTitle || (teacher?.shiftId ? `شفٹ #${teacher.shiftId}` : '---');

const knownExportKeys = new Set([
    'id',
    'staffType',
    'fullName',
    'email',
    'phone',
    'cnic',
    'subject',
    'qualification',
    'educationInstitute',
    'educationYear',
    'specialization',
    'address',
    'shift',
    'shiftId',
    'shiftName',
    'shiftTitle',
    'shiftStartTime',
    'shiftEndTime',
    'basicSalary',
    'bankName',
    'accountTitle',
    'accountNumber',
    'iban',
    'jobTitle',
    'department',
    'employmentType',
    'appointmentDate',
    'joiningDate',
    'experienceSummary',
    'notes',
    'status',
    'imageUrl',
    'createdAt',
    'updatedAt',
]);

const getExtraData = (teacher) =>
    Object.fromEntries(Object.entries(teacher || {}).filter(([key]) => !knownExportKeys.has(key)));

const mapTeacherForExport = (teacher) => ({
    id: teacher.id,
    staffType: teacher.staffType,
    fullName: teacher.fullName,
    email: teacher.email,
    phone: teacher.phone,
    cnic: teacher.cnic,
    subject: teacher.subject,
    qualification: teacher.qualification,
    educationInstitute: teacher.educationInstitute,
    educationYear: teacher.educationYear,
    specialization: teacher.specialization,
    address: teacher.address,
    shift: getTeacherShiftLabel(teacher),
    shiftId: teacher.shiftId || teacher.shift?.id,
    shiftStartTime: teacher.shiftStartTime || teacher.shift?.startTime,
    shiftEndTime: teacher.shiftEndTime || teacher.shift?.endTime,
    basicSalary: teacher.basicSalary,
    bankName: teacher.bankName,
    accountTitle: teacher.accountTitle,
    accountNumber: teacher.accountNumber,
    iban: teacher.iban,
    jobTitle: teacher.jobTitle,
    department: teacher.department,
    employmentType: teacher.employmentType,
    appointmentDate: formatDate(teacher.appointmentDate),
    joiningDate: formatDate(teacher.joiningDate),
    experienceSummary: teacher.experienceSummary,
    notes: teacher.notes,
    status: teacher.status,
    imageUrl: teacher.imageUrl,
    createdAt: formatDate(teacher.createdAt),
    updatedAt: formatDate(teacher.updatedAt),
    extraData: JSON.stringify(getExtraData(teacher)),
});

export const TeachersList = ({ staffType = 'teacher' }) => {
    const navigate = useNavigate();
    const config = listConfig[staffType] || listConfig.teacher;
    const permissionPrefix = staffType === 'staff' ? 'staff' : 'teachers';
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [shiftFilter, setShiftFilter] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [teacherMeta, setTeacherMeta] = useState({ totalItems: 0 });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    const loadTeachers = useCallback(async () => {
        try {
            const result = await getTeachers(`page=1&limit=100&staffType=${staffType}`);
            setTeachers(result.items || []);
            setTeacherMeta(result.meta || { totalItems: result.items?.length || 0 });
        } catch (loadError) {
            setError(loadError.message || config.loadError);
        }
    }, [config.loadError, staffType]);

    useEffect(() => {
        loadTeachers();
    }, [loadTeachers]);

    const subjectOptions = useMemo(
        () => [...new Set(teachers.map((teacher) => teacher.subject).filter(Boolean))],
        [teachers],
    );
    const shiftOptions = useMemo(
        () => [...new Set(teachers.map(getTeacherShiftLabel).filter((shift) => shift && shift !== '---'))],
        [teachers],
    );

    const filteredTeachers = useMemo(
        () =>
            teachers.filter((teacher) => {
                const shiftLabel = getTeacherShiftLabel(teacher);
                const searchOk = [teacher.fullName, teacher.subject, teacher.phone, teacher.cnic, teacher.email, teacher.jobTitle, teacher.department, shiftLabel]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase()));
                const subjectOk = !subjectFilter || teacher.subject === subjectFilter;
                const shiftOk = !shiftFilter || shiftLabel === shiftFilter;
                return searchOk && subjectOk && shiftOk;
            }),
        [teachers, searchTerm, shiftFilter, subjectFilter],
    );

    const exportRows = useMemo(() => filteredTeachers.map(mapTeacherForExport), [filteredTeachers]);
    const visibleTotal = searchTerm.trim() || subjectFilter || shiftFilter ? filteredTeachers.length : Number(teacherMeta.totalItems ?? filteredTeachers.length);

    const exportColumns = useMemo(() => [
        { header: 'Teacher / Staff ID', accessor: 'id' },
        { header: 'Staff Type', accessor: 'staffType' },
        { header: 'Full Name', accessor: 'fullName' },
        { header: 'Email', accessor: 'email' },
        { header: 'Phone', accessor: 'phone' },
        { header: 'CNIC', accessor: 'cnic' },
        { header: config.subjectLabel, accessor: 'subject' },
        { header: 'Qualification', accessor: 'qualification' },
        { header: 'Education Institute', accessor: 'educationInstitute' },
        { header: 'Education Year', accessor: 'educationYear' },
        { header: 'Specialization', accessor: 'specialization' },
        { header: 'Address', accessor: 'address' },
        { header: 'Shift', accessor: 'shift' },
        { header: 'Shift ID', accessor: 'shiftId' },
        { header: 'Shift Start', accessor: 'shiftStartTime' },
        { header: 'Shift End', accessor: 'shiftEndTime' },
        { header: 'Basic Salary', accessor: 'basicSalary' },
        { header: 'Bank Name', accessor: 'bankName' },
        { header: 'Account Title', accessor: 'accountTitle' },
        { header: 'Account Number', accessor: 'accountNumber' },
        { header: 'IBAN', accessor: 'iban' },
        { header: 'Job Title', accessor: 'jobTitle' },
        { header: 'Department', accessor: 'department' },
        { header: 'Employment Type', accessor: 'employmentType' },
        { header: 'Appointment Date', accessor: 'appointmentDate' },
        { header: 'Joining Date', accessor: 'joiningDate' },
        { header: 'Experience Summary', accessor: 'experienceSummary' },
        { header: 'Notes', accessor: 'notes' },
        { header: 'Status', accessor: 'status' },
        { header: 'Image URL', accessor: 'imageUrl' },
        { header: 'Created At', accessor: 'createdAt' },
        { header: 'Updated At', accessor: 'updatedAt' },
        { header: 'Extra Data', accessor: 'extraData' },
    ], [config.subjectLabel]);

    const handleDeleteTeacher = async () => {
        if (!deleteTarget) return;

        setError('');
        setSuccess('');
        setIsDeleting(true);
        try {
            await deleteTeacher(deleteTarget.id);
            setSuccess(config.deleteSuccess);
            setDeleteTarget(null);
            await loadTeachers();
        } catch (deleteError) {
            setError(deleteError.message || config.deleteError);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            <div className="bg-[var(--color-surface)] rounded-[2.5rem] mt-6 md:mt-0 lg:mt-0 p-6 md:p-8 shadow-xl border border-white/5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black text-[var(--text-color)]">{config.title}</h2>
                        <div className="flex items-center gap-3 mt-5">
                            <span className="bg-[var(--color-bg)]/20 text-[var(--color-primary)] text-[10px] font-bold px-3 py-1 rounded-full border border-[#00d094]/30 uppercase tracking-wider">
                                {config.totalLabel}: {visibleTotal}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <Can permission={`${permissionPrefix}.export`}>
                            <ExportExcelButton rows={exportRows} columns={exportColumns} fileName={`${staffType}-complete-list`} className="w-full sm:w-auto" />
                        </Can>
                        <div className="relative w-full sm:w-80 group">
                            <Search size={18} className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                            <InputField
                                type="text"
                                placeholder={config.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                dir="rtl"
                                className="h-[72px] pr-5 pl-14 text-right leading-[1.8]"
                            />
                        </div>
                        <select
                            value={subjectFilter}
                            onChange={(event) => setSubjectFilter(event.target.value)}
                            className="h-[72px] w-full rounded-2xl border border-transparent bg-[var(--color-input)] px-5 text-right text-sm font-bold text-[var(--color-text-main)] outline-none transition-all focus:border-[var(--color-primary)] sm:w-48"
                        >
                            <option value="">{config.subjectLabel}</option>
                            {subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                        </select>
                        <select
                            value={shiftFilter}
                            onChange={(event) => setShiftFilter(event.target.value)}
                            className="h-[72px] w-full rounded-2xl border border-transparent bg-[var(--color-input)] px-5 text-right text-sm font-bold text-[var(--color-text-main)] outline-none transition-all focus:border-[var(--color-primary)] sm:w-44"
                        >
                            <option value="">شفٹ</option>
                            {shiftOptions.map((shift) => <option key={shift} value={shift}>{shift}</option>)}
                        </select>
                        <Can permission={`${permissionPrefix}.create`}>
                            <button
                                onClick={() => navigate(config.addPath)}
                                className="flex items-center justify-center gap-2 bg-[#00d094] text-[#002a33] px-6 py-3 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
                            >
                                <UserPlus size={18} />
                                <span>نیا اندراج</span>
                            </button>
                        </Can>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:hidden">
                {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher, index) => (
                        <div key={teacher.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-[2rem] shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d094] to-[#008a63] flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        {(teacher.fullName || '?').charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-black text-[var(--color-text-main)]">{teacher.fullName}</h3>
                                        <span className="text-[11px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-md">
                                            نمبر: {index + 1}
                                        </span>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${teacher.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                    {teacher.status === 'active' ? 'فعال' : 'غیر فعال'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[13px] border-t border-[var(--color-border)] pt-4">
                                <div>
                                    <p className="text-[var(--color-text-muted)] text-[11px] mb-1">{config.subjectLabel}</p>
                                    <p className="font-medium">{teacher.subject || '---'}</p>
                                </div>
                                <div>
                                    <p className="text-[var(--color-text-muted)] text-[11px] mb-1">رابطہ</p>
                                    <p className="font-medium" dir="ltr">{teacher.phone || '---'}</p>
                                </div>
                                <div>
                                    <p className="text-[var(--color-text-muted)] text-[11px] mb-1">شفٹ</p>
                                    <p className="font-medium">{getTeacherShiftLabel(teacher)}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => navigate(`/teachers/details/${teacher.id}`)} className="flex-1 flex justify-center items-center py-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all">
                                    <Eye size={16} className="ml-2" /> دیکھیں
                                </button>
                                <Can anyPermissions={[`${permissionPrefix}.update`, `${permissionPrefix}.edit`]}>
                                    <button onClick={() => navigate(`/HRManagement?teacherId=${teacher.id}`)} className="flex-1 flex justify-center items-center py-2.5 rounded-xl bg-[#00d094]/10 text-[#00d094] hover:bg-[#00d094] hover:text-white transition-all" aria-label="تبدیل کریں">
                                        <Edit2 size={16} className="ml-2" />
                                    </button>
                                </Can>
                                <Can permission={`${permissionPrefix}.delete`}>
                                    <button onClick={() => setDeleteTarget(teacher)} className="flex-1 flex justify-center items-center py-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all" aria-label="حذف کریں">
                                        <Trash2 size={16} className="ml-2" />
                                    </button>
                                </Can>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-[var(--color-surface)] p-10 rounded-[2rem] text-center text-[var(--color-text-muted)] col-span-full">
                        کوئی ریکارڈ نہیں ملا۔
                    </div>
                )}
            </div>

            <div className="hidden lg:block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto vip-scrollbar">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--color-border)] bg-[var(--color-input)]/50">
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)]">نمبر</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)]">نام</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)]">{config.subjectLabel}</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)]">شفٹ</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)]">رابطہ</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)] text-center">حالت</th>
                                <th className="p-5 text-[11px] font-black uppercase text-[var(--color-text-muted)] text-center">ایکشن</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {filteredTeachers.map((teacher, index) => (
                                <tr key={teacher.id} className="hover:bg-[var(--color-bg)]/50 transition-colors group">
                                    <td className="p-5"><span className="text-[12px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-lg">{index + 1}</span></td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d094] to-[#008a63] flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                {(teacher.fullName || '?').charAt(0)}
                                            </div>
                                            <span className="text-[14px] font-black text-[var(--color-text-main)]">{teacher.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-[13px] font-medium text-[var(--color-text-main)]">{teacher.subject || '---'}</td>
                                    <td className="p-5 text-[13px] font-medium text-[var(--color-text-main)]">{getTeacherShiftLabel(teacher)}</td>
                                    <td className="p-5 text-[13px] font-medium text-[var(--color-text-main)]" dir="ltr">{teacher.phone || '---'}</td>
                                    <td className="p-5 text-center">
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${teacher.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                            {teacher.status === 'active' ? 'فعال' : 'غیر فعال'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => navigate(`/teachers/details/${teacher.id}`)} className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm" aria-label="دیکھیں"><Eye size={16} /></button>
                                            <Can anyPermissions={[`${permissionPrefix}.update`, `${permissionPrefix}.edit`]}>
                                                <button onClick={() => navigate(`/HRManagement?teacherId=${teacher.id}`)} className="p-2.5 rounded-xl bg-[#00d094]/10 text-[#00d094] hover:bg-[#00d094] hover:text-white transition-all shadow-sm" aria-label="تبدیل کریں"><Edit2 size={16} /></button>
                                            </Can>
                                            <Can permission={`${permissionPrefix}.delete`}>
                                                <button onClick={() => setDeleteTarget(teacher)} className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm" aria-label="حذف کریں"><Trash2 size={16} /></button>
                                            </Can>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-right">
                                <h3 className="text-xl font-black text-[var(--color-text)]">{config.deleteTitle}</h3>
                                <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                    کیا آپ واقعی <span className="text-rose-500">{deleteTarget.fullName}</span> کو حذف کرنا چاہتے ہیں؟
                                    یہ عمل واپس نہیں ہو گا۔
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !isDeleting && setDeleteTarget(null)}
                                className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                                aria-label="بند کریں"
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
                                منسوخ کریں
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteTeacher}
                                disabled={isDeleting}
                                className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
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
