import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { getBranches, getClasses, getSections, getSubjects } from '../../../Constant/AcademicSetupApi';
import { getTeachers } from '../../../Constant/TeachersApi';
import {
  createTeacherAssignments,
  deleteTeacherAssignment,
  getTeacherAssignments,
  updateTeacherAssignment,
} from '../../../Constant/TeacherAssignmentApi';
import { canUseTenantBranchContext } from '../../../Constant/AdminAuth';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { Can } from '../../../Components/Auth/Can';
import { ExportPdfButton } from '../../../Components/Export/ExportPdfButton';

const emptyForm = {
  teacherId: '',
  subjectIds: [],
  classId: '',
  sectionId: '',
  responsibilityText: '',
  note: '',
  status: 'active',
};

const activeOnly = (items) => (items || []).filter((item) => !item.status || item.status === 'active');
const formatDate = (value) => {
  if (!value) return '---';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split('T')[0];
};

const joinNames = (items) => items.filter(Boolean).join(' - ') || '---';

export const TeacherAssignments = ({ staffType = 'teacher' }) => {
  const isStaff = staffType === 'staff';
  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0 });
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editMode, setEditMode] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: 'active', branchId: '', classId: '', sectionId: '', subjectId: '', responsibilityId: '', teacherId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const showBranchControls = canUseTenantBranchContext();
  useNotificationBridge({ error, success });

  const loadSetup = async () => {
    try {
      const [teachersResult, subjectsResult, classesResult, sectionsResult, branchesResult] = await Promise.all([
        getTeachers(`page=1&limit=100&status=active&staffType=${staffType}`),
        getSubjects('page=1&limit=100&status=active'),
        getClasses('page=1&limit=100&status=active'),
        getSections('page=1&limit=100&status=active'),
        showBranchControls ? getBranches('page=1&limit=100&status=active') : Promise.resolve({ items: [] }),
      ]);

      setTeachers(activeOnly(teachersResult.items));
      setSubjects(activeOnly(subjectsResult.items));
      setClasses(activeOnly(classesResult.items));
      setSections(activeOnly(sectionsResult.items));
      setBranches(activeOnly(branchesResult.items));
    } catch (loadError) {
      setError(loadError.message || 'بنیادی معلومات لوڈ نہیں ہو سکیں۔');
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams({ page: '1', limit: '100', staffType });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  };

  const loadAssignments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getTeacherAssignments(buildQuery());
      setAssignments(result.items || []);
      setMeta(result.meta || { totalItems: result.items?.length || 0 });
    } catch (loadError) {
      setError(loadError.message || 'مضامین اور ذمہ داریوں کی فہرست لوڈ نہیں ہو سکی۔');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSetup();
  }, [staffType]);

  useEffect(() => {
    loadAssignments();
  }, [filters, staffType]);

  const availableSections = useMemo(
    () => sections.filter((section) => !formData.classId || String(section.classId) === String(formData.classId)),
    [formData.classId, sections],
  );

  const filterSections = useMemo(
    () => sections.filter((section) => !filters.classId || String(section.classId) === String(filters.classId)),
    [filters.classId, sections],
  );

  const resetForm = () => {
    setFormData(emptyForm);
    setEditMode(null);
    setIsFormOpen(false);
  };

  const toggleArrayValue = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  };

  const handleEdit = (assignment) => {
    setEditMode(assignment.id);
    setFormData({
      teacherId: String(assignment.teacherId || ''),
      subjectIds: assignment.subjectId ? [String(assignment.subjectId)] : [],
      classId: String(assignment.classId || ''),
      sectionId: String(assignment.sectionId || ''),
      responsibilityText: isStaff ? assignment.responsibility?.name || '' : '',
      note: assignment.note || '',
      status: assignment.status || 'active',
    });
    setIsFormOpen(true);
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.teacherId) return isStaff ? 'عملہ منتخب کریں۔' : 'استاد منتخب کریں۔';
    if (!isStaff && !formData.subjectIds.length) return 'کم از کم ایک مضمون منتخب کریں۔';
    if (!isStaff && !formData.classId) return 'جماعت منتخب کریں۔';
    if (!isStaff && !formData.sectionId) return 'سیکشن منتخب کریں۔';
    if (isStaff && !formData.responsibilityText.trim()) return 'ذمہ داری درج کریں۔';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editMode) {
        await updateTeacherAssignment(editMode, {
          teacherId: Number(formData.teacherId),
          subjectId: !isStaff ? Number(formData.subjectIds[0]) : undefined,
          classId: !isStaff ? Number(formData.classId) : undefined,
          sectionId: !isStaff ? Number(formData.sectionId) : undefined,
          responsibility: isStaff ? formData.responsibilityText.trim() : undefined,
          note: formData.note.trim(),
          status: formData.status,
        });
        setSuccess('تقسیم کامیابی سے تبدیل ہو گئی۔');
      } else {
        const result = await createTeacherAssignments({
          teacherId: Number(formData.teacherId),
          staffType,
          subjectIds: isStaff ? [] : formData.subjectIds.map(Number),
          classId: isStaff ? undefined : Number(formData.classId),
          sectionId: isStaff ? undefined : Number(formData.sectionId),
          responsibilityIds: [],
          responsibilities: isStaff ? [formData.responsibilityText.trim()] : [],
          note: formData.note.trim(),
          status: formData.status,
        });
        setSuccess(`${result?.createdCount || 0} تقسیم کامیابی سے محفوظ ہو گئیں۔`);
      }

      resetForm();
      await loadSetup();
      await loadAssignments();
    } catch (saveError) {
      setError(saveError.message || 'تقسیم محفوظ نہیں ہو سکی۔');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    setSuccess('');
    try {
      await deleteTeacherAssignment(deleteTarget.id);
      setSuccess('تقسیم کامیابی سے غیر فعال کر دی گئی۔');
      setDeleteTarget(null);
      await loadAssignments();
    } catch (deleteError) {
      setError(deleteError.message || 'تقسیم حذف نہیں ہو سکی۔');
    }
  };

  const exportableTotal = Number(meta.totalItems ?? assignments.length);
  const exportColumns = useMemo(() => isStaff ? [
    { header: 'Staff', accessor: (row) => row.teacher?.fullName || '---' },
    { header: 'Responsibility', accessor: (row) => row.responsibility?.name || '---' },
    { header: 'Note', accessor: (row) => row.note || '---' },
    { header: 'Status', accessor: 'status' },
  ] : [
    { header: 'Teacher', accessor: (row) => row.teacher?.fullName || '---' },
    { header: 'Subject', accessor: (row) => row.subject?.name || '---' },
    { header: 'Class', accessor: (row) => row.class?.name || '---' },
    { header: 'Section', accessor: (row) => row.section?.name || '---' },
    { header: 'Note', accessor: (row) => row.note || '---' },
    { header: 'Status', accessor: 'status' },
  ], [isStaff]);
  const tableColumnCount = isStaff ? (showBranchControls ? 8 : 7) : (showBranchControls ? 10 : 9);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
      <div className="flex flex-col items-center justify-between gap-4 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm backdrop-blur-sm md:flex-row">
        <div className="text-right">
          <h2 className="text-3xl font-black tracking-tight text-[var(--color-text)]">{isStaff ? 'ذمہ داریوں کی تقسیم' : 'مضامین کی تقسیم'}</h2>
          <p className="mt-4 text-right text-sm font-medium text-[var(--color-text-muted)]">کل فہرست: {exportableTotal}</p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="relative md:w-72">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder={isStaff ? 'عملہ یا ذمہ داری تلاش کریں' : 'استاد یا مضمون تلاش کریں'}
              className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none"
            />
          </div>

          <Can permission="teachers.assignments.create">
            <button
              type="button"
              onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
              className={`flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-sm font-black shadow-lg transition-all active:scale-95 ${
                isFormOpen ? 'border border-rose-500/20 bg-rose-500/10 text-rose-500' : 'bg-[#00d094] text-white shadow-emerald-500/20'
              }`}
            >
              {isFormOpen ? 'بند کریں' : 'نئی تقسیم'}
              {isFormOpen ? <X size={20} /> : <Plus size={20} />}
            </button>
          </Can>
          <ExportPdfButton rows={assignments} columns={exportColumns} fileName={isStaff ? 'staff-responsibilities' : 'teacher-subjects'} title={isStaff ? 'Staff Responsibilities' : 'Teacher Subjects'} className="h-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:grid-cols-3 xl:grid-cols-6">
        {showBranchControls ? (
          <select value={filters.branchId} onChange={(event) => setFilters((current) => ({ ...current, branchId: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none">
            <option value="">تمام برانچز</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        ) : null}
        <select value={filters.teacherId} onChange={(event) => setFilters((current) => ({ ...current, teacherId: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none">
          <option value="">{isStaff ? 'تمام عملہ' : 'تمام اساتذہ'}</option>
          {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
        </select>
        {!isStaff ? (
          <>
            <select value={filters.subjectId} onChange={(event) => setFilters((current) => ({ ...current, subjectId: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none">
              <option value="">تمام مضامین</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            <select value={filters.classId} onChange={(event) => setFilters((current) => ({ ...current, classId: event.target.value, sectionId: '' }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none">
              <option value="">تمام جماعتیں</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select value={filters.sectionId} onChange={(event) => setFilters((current) => ({ ...current, sectionId: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none">
              <option value="">تمام سیکشنز</option>
              {filterSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
            </select>
          </>
        ) : null}
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none">
          <option value="active">فعال</option>
          <option value="inactive">غیر فعال</option>
        </select>
      </div>

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black text-[var(--color-text-muted)]">{isStaff ? 'عملہ' : 'استاد'}<span className="text-red-500"> *</span></label>
              <select value={formData.teacherId} onChange={(event) => setFormData((current) => ({ ...current, teacherId: event.target.value }))} className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none">
                <option value="">{isStaff ? 'عملہ منتخب کریں' : 'استاد منتخب کریں'}</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
              </select>
            </div>
            {!isStaff ? <div>
              <label className="mb-2 block text-xs font-black text-[var(--color-text-muted)]">جماعت</label>
              <select value={formData.classId} onChange={(event) => setFormData((current) => ({ ...current, classId: event.target.value, sectionId: '' }))} className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none">
                <option value="">جماعت منتخب کریں</option>
                {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div> : null}
            {!isStaff ? <div>
              <label className="mb-2 block text-xs font-black text-[var(--color-text-muted)]">سیکشن</label>
              <select value={formData.sectionId} disabled={!formData.classId} onChange={(event) => setFormData((current) => ({ ...current, sectionId: event.target.value }))} className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none disabled:opacity-60">
                <option value="">سیکشن منتخب کریں</option>
                {availableSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
              </select>
            </div> : null}
            <div>
              <label className="mb-2 block text-xs font-black text-[var(--color-text-muted)]">حالت</label>
              <select value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))} className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none">
                <option value="active">فعال</option>
                <option value="inactive">غیر فعال</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {!isStaff ? (
              <div>
                <p className="mb-2 text-xs font-black text-[var(--color-text-muted)]">مضامین<span className="text-red-500"> *</span></p>
                <div className="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 md:grid-cols-2">
                  {subjects.map((subject) => (
                    <label key={subject.id} className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                      <input type="checkbox" checked={formData.subjectIds.includes(String(subject.id))} onChange={() => toggleArrayValue('subjectIds', String(subject.id))} />
                      {subject.name}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-xs font-black text-[var(--color-text-muted)]">ذمہ داریاں<span className="text-red-500"> *</span></label>
                <input value={formData.responsibilityText} onChange={(event) => setFormData((current) => ({ ...current, responsibilityText: event.target.value }))} placeholder="ذمہ داری لکھیں" className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-bold outline-none" />
              </div>
            )}
            <div>
              <label className="mb-2 block text-xs font-black text-[var(--color-text-muted)]">نوٹ (اختیاری)</label>
              <textarea value={formData.note} onChange={(event) => setFormData((current) => ({ ...current, note: event.target.value }))} maxLength={255} placeholder="نوٹ لکھیں" className="min-h-24 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm font-bold outline-none" />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="rounded-2xl border border-[var(--color-border)] px-6 py-3 text-sm font-black text-[var(--color-text-muted)]">منسوخ کریں</button>
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-2xl bg-[#00d094] px-7 py-3 text-sm font-black text-white shadow-lg disabled:opacity-70">
              <Save size={18} /> {isSaving ? 'محفوظ ہو رہا ہے...' : editMode ? 'تبدیل کریں' : 'محفوظ کریں'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto vip-scrollbar">
          <table className="w-full min-w-[980px] text-right">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-input)]/50 text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 text-xs font-black">{isStaff ? 'عملہ' : 'استاد'}</th>
                {showBranchControls ? <th className="px-5 py-4 text-xs font-black">برانچ</th> : null}
                {isStaff ? <th className="px-5 py-4 text-xs font-black">ذمہ داری</th> : (
                  <>
                    <th className="px-5 py-4 text-xs font-black">مضمون</th>
                    <th className="px-5 py-4 text-xs font-black">جماعت</th>
                    <th className="px-5 py-4 text-xs font-black">سیکشن</th>
                  </>
                )}
                <th className="px-5 py-4 text-xs font-black">نوٹ</th>
                <th className="px-5 py-4 text-xs font-black">حالت</th>
                <th className="px-5 py-4 text-xs font-black">تاریخ</th>
                <th className="px-5 py-4 text-center text-xs font-black">ایکشن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {isLoading ? (
                <tr><td colSpan={tableColumnCount} className="px-5 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">فہرست لوڈ ہو رہی ہے...</td></tr>
              ) : assignments.length ? assignments.map((assignment) => (
                <tr key={assignment.id} className="transition-colors hover:bg-[var(--color-bg)]/50">
                  <td className="px-5 py-4 text-sm font-black text-[var(--color-text)]">{assignment.teacher?.fullName || '---'}</td>
                  {showBranchControls ? <td className="px-5 py-4 text-sm font-bold text-[var(--color-text-muted)]">{joinNames([assignment.branch?.name, assignment.branch?.code])}</td> : null}
                  {isStaff ? <td className="px-5 py-4 text-sm font-bold text-[var(--color-primary)]">{assignment.responsibility?.name || '---'}</td> : (
                    <>
                      <td className="px-5 py-4 text-sm font-bold text-[var(--color-text)]">{assignment.subject?.name || '---'}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[var(--color-text)]">{assignment.class?.name || '---'}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[var(--color-text)]">{assignment.section?.name || '---'}</td>
                    </>
                  )}
                  <td className="px-5 py-4 text-sm font-bold text-[var(--color-text-muted)]">{assignment.note || '---'}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${assignment.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {assignment.status === 'active' ? 'فعال' : 'غیر فعال'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-[var(--color-text-muted)]">{formatDate(assignment.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Can permission="teachers.assignments.edit">
                        <button type="button" onClick={() => handleEdit(assignment)} className="rounded-xl bg-[#00d094]/10 p-2.5 text-[#00d094] transition-all hover:bg-[#00d094] hover:text-white" aria-label="تبدیل کریں"><Edit2 size={16} /></button>
                      </Can>
                      <Can permission="teachers.assignments.delete">
                        <button type="button" onClick={() => setDeleteTarget(assignment)} className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white" aria-label="حذف کریں"><Trash2 size={16} /></button>
                      </Can>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={tableColumnCount} className="px-5 py-10 text-center text-sm font-bold text-[var(--color-text-muted)]">کوئی ریکارڈ نہیں ملا۔</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[var(--color-surface)] p-8 shadow-2xl" dir="rtl">
            <h3 className="text-xl font-black text-[var(--color-text)]">تقسیم حذف کرنے کی تصدیق</h3>
            <p className="mt-3 text-sm font-bold leading-7 text-[var(--color-text-muted)]">کیا آپ واقعی اس تقسیم کو غیر فعال کرنا چاہتے ہیں؟</p>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)]">منسوخ کریں</button>
              <button type="button" onClick={handleDelete} className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-black text-white">تصدیق کریں</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
