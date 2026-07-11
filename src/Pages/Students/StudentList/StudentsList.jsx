import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarRange, Edit2, Eye, GraduationCap, Phone, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteStudent, getStudents } from '../../../Constant/StudentsApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { ExportExcelButton } from '../../../Components/Export/ExportExcelButton';
import { Can } from '../../../Components/Auth/Can';

const emptyValue = '---';

const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
};

const getActiveAssignment = (student) =>
    student.assignments?.find((assignment) => assignment.status === 'active') || student.assignments?.[0] || null;

const getPrimaryParent = (student) =>
    student.parents?.find((parentItem) => parentItem.isPrimary)?.parent || student.parents?.[0]?.parent || null;

const formatParentSummary = (parentItem) => {
    const parent = parentItem.parent || {};
    return [
        parent.fullName,
        parentItem.relationship,
        parent.familyNumber,
        parent.phone,
        parent.cnic,
        parent.email,
        parent.occupation,
        parent.address,
    ]
        .filter(Boolean)
        .join(' | ');
};

const formatAssignmentSummary = (assignment) =>
    [
        assignment.session?.name,
        assignment.class?.name,
        assignment.section?.name,
        assignment.status,
        formatDate(assignment.createdAt),
    ]
        .filter(Boolean)
        .join(' | ');

const mapStudentsForList = (items) =>
    items.map((student) => {
        const activeAssignment = getActiveAssignment(student);
        const primaryParent = getPrimaryParent(student);

        return {
            id: student.id,
            idNo: student.admissionNumber,
            name: student.fullName,
            fatherName: student.fatherName,
            className: activeAssignment?.class?.name || emptyValue,
            section: activeAssignment?.section?.name || emptyValue,
            familyNo:
                primaryParent?.familyNumber ||
                primaryParent?.phone ||
                student.phone ||
                emptyValue,
        };
    });

const mapStudentForExport = (student) => {
    const activeAssignment = getActiveAssignment(student);
    const primaryParent = getPrimaryParent(student);

    return {
        id: student.id,
        admissionNumber: student.admissionNumber,
        admissionDate: formatDate(student.admissionDate),
        admissionFee: student.admissionFee,
        fullName: student.fullName,
        fatherName: student.fatherName,
        gender: student.gender,
        caste: student.caste,
        cnic: student.cnic,
        dob: formatDate(student.dob),
        bForm: student.bForm,
        phone: student.phone,
        whatsapp: student.whatsapp,
        email: student.email,
        address: student.address,
        currentAddress: student.currentAddress,
        permanentAddress: student.permanentAddress,
        district: student.district,
        prevMadrassa: student.prevMadrassa,
        prevSchool: student.prevSchool,
        secularEdu: student.secularEdu,
        religiousEdu: student.religiousEdu,
        requiredClass: student.requiredClass,
        requiredJamaat: student.requiredJamaat,
        teacherName: student.teacherName,
        medicalCondition: student.medicalCondition,
        monthlyFee: student.monthlyFee,
        reside: student.reside,
        status: student.status,
        className: activeAssignment?.class?.name,
        sectionName: activeAssignment?.section?.name,
        sessionName: activeAssignment?.session?.name,
        branchName: activeAssignment?.branch?.name,
        primaryParentName: primaryParent?.fullName,
        primaryParentFamilyNumber: primaryParent?.familyNumber,
        primaryParentPhone: primaryParent?.phone,
        primaryParentEmail: primaryParent?.email,
        primaryParentCnic: primaryParent?.cnic,
        primaryParentOccupation: primaryParent?.occupation,
        primaryParentAddress: primaryParent?.address,
        parents: (student.parents || []).map(formatParentSummary).join('\n'),
        assignments: (student.assignments || []).map(formatAssignmentSummary).join('\n'),
        imageUrl: student.imageUrl,
        createdAt: formatDate(student.createdAt),
        updatedAt: formatDate(student.updatedAt),
    };
};

export const StudentList = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [studentRecords, setStudentRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useNotificationBridge({ error, success });

    useEffect(() => {
        window.scrollTo(0, 0);

        const loadStudents = async () => {
            setIsLoading(true);
            setError('');

            try {
                const result = await getStudents('page=1&limit=100&status=active');
                const items = result.items || [];
                setStudentRecords(items);
                setStudents(mapStudentsForList(items));
            } catch (loadError) {
                setError(loadError.message || 'طلبہ کی فہرست لوڈ نہیں ہو سکی۔');
            } finally {
                setIsLoading(false);
            }
        };

        loadStudents();
    }, []);

    useEffect(() => {
        let isCurrentSearch = true;
        const searchQuery = searchTerm.trim();

        const loadSearchResults = async () => {
            setIsLoading(true);
            setError('');

            try {
                const result = await getStudents(`page=1&limit=100&status=active${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`);
                if (!isCurrentSearch) return;
                const items = result.items || [];
                setStudentRecords(items);
                setStudents(mapStudentsForList(items));
            } catch (loadError) {
                if (!isCurrentSearch) return;
                setError(loadError.message || 'Ø·Ù„Ø¨Û Ú©ÛŒ ÙÛØ±Ø³Øª Ù„ÙˆÚˆ Ù†ÛÛŒÚº ÛÙˆ Ø³Ú©ÛŒÛ”');
            } finally {
                if (!isCurrentSearch) return;
                setIsLoading(false);
            }
        };

        const timeoutId = window.setTimeout(loadSearchResults, searchQuery ? 250 : 0);

        return () => {
            isCurrentSearch = false;
            window.clearTimeout(timeoutId);
        };
    }, [searchTerm]);

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        setError('');
        setSuccess('');

        try {
            await deleteStudent(deleteTarget.id);
            setStudents((current) => current.filter((student) => student.id !== deleteTarget.id));
            setStudentRecords((current) => current.filter((student) => student.id !== deleteTarget.id));
            setSuccess('طالب علم کا ریکارڈ حذف کر دیا گیا۔');
            setDeleteTarget(null);
        } catch (deleteError) {
            setError(deleteError.message || 'طالب علم کا ریکارڈ حذف نہیں ہو سکا۔');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredStudents = useMemo(
        () =>
            students.filter((student) =>
                [student.name, student.idNo, student.fatherName, student.familyNo]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
            ),
        [searchTerm, students],
    );

    const exportRows = useMemo(() => {
        const query = searchTerm.toLowerCase();

        return studentRecords
            .filter((student) => {
                const activeAssignment = getActiveAssignment(student);
                const primaryParent = getPrimaryParent(student);

                return [
                    student.fullName,
                    student.admissionNumber,
                    student.fatherName,
                    student.phone,
                    primaryParent?.familyNumber,
                    primaryParent?.phone,
                    activeAssignment?.class?.name,
                    activeAssignment?.section?.name,
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(query));
            })
            .map(mapStudentForExport);
    }, [searchTerm, studentRecords]);

    const exportColumns = useMemo(() => [
        { header: 'Student ID', accessor: 'id' },
        { header: 'Admission No', accessor: 'admissionNumber' },
        { header: 'Admission Date', accessor: 'admissionDate' },
        { header: 'Admission Fee', accessor: 'admissionFee' },
        { header: 'Student Name', accessor: 'fullName' },
        { header: 'Father Name', accessor: 'fatherName' },
        { header: 'Gender', accessor: 'gender' },
        { header: 'Caste', accessor: 'caste' },
        { header: 'CNIC', accessor: 'cnic' },
        { header: 'Date of Birth', accessor: 'dob' },
        { header: 'B-Form', accessor: 'bForm' },
        { header: 'Phone', accessor: 'phone' },
        { header: 'WhatsApp', accessor: 'whatsapp' },
        { header: 'Email', accessor: 'email' },
        { header: 'Address', accessor: 'address' },
        { header: 'Current Address', accessor: 'currentAddress' },
        { header: 'Permanent Address', accessor: 'permanentAddress' },
        { header: 'District', accessor: 'district' },
        { header: 'Previous Madrassa', accessor: 'prevMadrassa' },
        { header: 'Previous School', accessor: 'prevSchool' },
        { header: 'Secular Education', accessor: 'secularEdu' },
        { header: 'Religious Education', accessor: 'religiousEdu' },
        { header: 'Required Class', accessor: 'requiredClass' },
        { header: 'Required Jamaat', accessor: 'requiredJamaat' },
        { header: 'Teacher Name', accessor: 'teacherName' },
        { header: 'Medical Condition', accessor: 'medicalCondition' },
        { header: 'Monthly Fee', accessor: 'monthlyFee' },
        { header: 'Residence', accessor: 'reside' },
        { header: 'Status', accessor: 'status' },
        { header: 'Class', accessor: 'className' },
        { header: 'Section', accessor: 'sectionName' },
        { header: 'Session', accessor: 'sessionName' },
        { header: 'Branch', accessor: 'branchName' },
        { header: 'Primary Parent', accessor: 'primaryParentName' },
        { header: 'Family Number', accessor: 'primaryParentFamilyNumber' },
        { header: 'Parent Phone', accessor: 'primaryParentPhone' },
        { header: 'Parent Email', accessor: 'primaryParentEmail' },
        { header: 'Parent CNIC', accessor: 'primaryParentCnic' },
        { header: 'Parent Occupation', accessor: 'primaryParentOccupation' },
        { header: 'Parent Address', accessor: 'primaryParentAddress' },
        { header: 'All Parents', accessor: 'parents' },
        { header: 'All Class Assignments', accessor: 'assignments' },
        { header: 'Image URL', accessor: 'imageUrl' },
        { header: 'Created At', accessor: 'createdAt' },
        { header: 'Updated At', accessor: 'updatedAt' },
    ], []);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-10" dir="rtl">
            <div className="flex flex-col gap-6 rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-10 shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)]">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-themeText flex items-center gap-3">
                            <div className="p-3 bg-[var(--color-primary)]/10 rounded-2xl text-[var(--color-primary)]">
                                <GraduationCap size={28} />
                            </div>
                            طلباء کی فہرست
                        </h2>
                        <p className="text-[var(--color-text-muted)] text-sm font-bold mt-2 mr-14">کل رجسٹرڈ طلباء: {filteredStudents.length}</p>
                    </div>
                    <Can permission="students.create">
                        <button
                            onClick={() => navigate('/students/admission')}
                            className="bg-[var(--color-primary)] text-white p-4 rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--color-primary)]/20 group"
                        >
                            <UserPlus size={24} className="group-hover:rotate-12 transition-transform" />
                        </button>
                    </Can>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Can permission="students.export">
                        <ExportExcelButton rows={exportRows} columns={exportColumns} fileName="students-complete-list" className="w-full md:w-auto" />
                    </Can>
                    <div className="relative group flex-1">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="نام، آئی ڈی یا فون سے تلاش کریں..."
                            className="w-full pr-14 pl-6 py-4 bg-[var(--color-input)] border shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] border-[var(--color-border)] focus:border-[var(--color-primary)]/50 rounded-2xl outline-none font-bold text-sm transition-all text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredStudents.map((student) => (
                    <div
                        key={student.id}
                        onClick={() => navigate(`/students/profile/${student.id}`)}
                        className="bg-[var(--color-surface)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-[2px_6px_26px_2px_rgba(0,_0,_0,_0.1)] space-y-5 cursor-pointer hover:border-[var(--color-primary)]/40 transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] font-black text-xs border border-[var(--color-primary)]/20">
                                    {student.idNo}
                                </div>
                                <div>
                                    <h4 className="font-black text-[var(--color-text)] text-lg">{student.name}</h4>
                                    <p className="text-[11px] text-[var(--color-text-muted)] font-bold mt-0.5">ولدیت: {student.fatherName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="py-4 border-y border-[var(--color-border)]">
                            <div className="flex items-center gap-2 justify-end">
                                <Users size={16} className="text-[var(--color-primary)]" />
                                <span className="text-[12px] font-bold text-[var(--color-text)]/80">{student.className} ({student.section})</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Phone size={15} className="text-[var(--color-text-muted)]" />
                                <span className="text-xs font-black text-[var(--color-text-muted)]">{student.familyNo}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ActionIcon label="دیکھیں" onClick={() => navigate(`/students/profile/${student.id}`)}>
                                    <Eye size={18} />
                                </ActionIcon>
                                <ActionIcon label="حاضری ریکارڈ" tone="blue" onClick={() => navigate(`/students/attendance-history/${student.id}`)}>
                                    <CalendarRange size={18} />
                                </ActionIcon>
                                <Can anyPermissions={['students.update', 'students.edit']}>
                                    <ActionIcon label="تبدیل کریں" tone="blue" onClick={() => navigate(`/students/admission?studentId=${student.id}`)}>
                                        <Edit2 size={18} />
                                    </ActionIcon>
                                </Can>
                                <Can permission="students.delete">
                                    <ActionIcon label="حذف کریں" tone="danger" onClick={() => setDeleteTarget(student)}>
                                        <Trash2 size={18} />
                                    </ActionIcon>
                                </Can>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="hidden md:block bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border)] shadow-2xl overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-[var(--color-input)]/50 border-b border-white/5">
                        <tr>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest">آئی ڈی</th>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest">طالب علم کی تفصیلات</th>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest">کلاس</th>
                            <th className="p-6 text-[var(--color-text-muted)] font-black text-[11px] uppercase tracking-widest text-center">ایکشن</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredStudents.map((student) => (
                            <tr
                                key={student.id}
                                onClick={() => navigate(`/students/profile/${student.id}`)}
                                className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                            >
                                <td className="p-6">
                                    <span className="bg-[var(--color-input)] text-[var(--color-text)]/70 px-4 py-2 rounded-2xl font-black text-[12px] border border-[var(--color-border)]">
                                        {student.idNo}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="font-black text-[var(--color-text)] text-base">{student.name}</div>
                                    <div className="text-[11px] text-[var(--color-text-muted)] font-bold mt-1">ولدیت: {student.fatherName} </div>
                                </td>
                                <td className="p-6">
                                    <span className="text-[var(--color-primary)] font-bold text-xs bg-[var(--color-primary)]/10 px-4 py-1.5 rounded-full border border-[var(--color-primary)]/20 inline-block">
                                        {student.className} ({student.section})
                                    </span>
                                </td>
                                <td className="p-6 text-center">
                                    <div className="flex justify-center gap-2">
                                        <ActionIcon label="دیکھیں" onClick={() => navigate(`/students/profile/${student.id}`)}>
                                            <Eye size={16} />
                                        </ActionIcon>
                                        <ActionIcon label="حاضری ریکارڈ" tone="blue" onClick={() => navigate(`/students/attendance-history/${student.id}`)}>
                                            <CalendarRange size={16} />
                                        </ActionIcon>
                                        <Can anyPermissions={['students.update', 'students.edit']}>
                                            <ActionIcon label="تبدیل کریں" tone="blue" onClick={() => navigate(`/students/admission?studentId=${student.id}`)}>
                                                <Edit2 size={16} />
                                            </ActionIcon>
                                        </Can>
                                        <Can permission="students.delete">
                                            <ActionIcon label="حذف کریں" tone="danger" onClick={() => setDeleteTarget(student)}>
                                                <Trash2 size={16} />
                                            </ActionIcon>
                                        </Can>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!isLoading && filteredStudents.length === 0 ? (
                <div className="p-24 text-center bg-[var(--color-surface)] rounded-[3rem] border border-[var(--color-border)]">
                    <div className="w-24 h-24 bg-[var(--color-input)] rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-[var(--color-text-muted)] opacity-20">
                        <Search size={48} />
                    </div>
                    <h3 className="text-[var(--color-text)] text-xl font-black">کوئی طالب علم نہیں ملا</h3>
                    <p className="text-[var(--color-text-muted)] font-bold mt-2">براہ کرم تلاش کے الفاظ چیک کریں</p>
                </div>
            ) : null}

            {deleteTarget ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteTarget(null)}>
                    <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-500">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-[var(--color-text)]">طالب علم حذف کریں؟</h3>
                                    <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">
                                        کیا آپ واقعی <span className="text-rose-500">{deleteTarget.name}</span> کا ریکارڈ حذف کرنا چاہتے ہیں؟
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={() => !isDeleting && setDeleteTarget(null)} className="rounded-xl bg-[var(--color-bg)] p-2 text-[var(--color-text-muted)] transition-all hover:text-rose-500">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-7 flex justify-end gap-3">
                            <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg)] disabled:opacity-60">
                                منسوخ کریں
                            </button>
                            <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white transition-all hover:bg-rose-600 disabled:opacity-70">
                                {isDeleting ? 'حذف ہو رہا ہے...' : 'حذف کریں'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

const ActionIcon = ({ children, label, tone = 'success', onClick }) => {
    const toneClass = tone === 'danger'
        ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'
        : tone === 'blue'
            ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white'
            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white';

    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className={`p-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/5 ${toneClass}`}
        >
            {children}
        </button>
    );
};
