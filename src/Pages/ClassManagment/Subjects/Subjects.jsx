import React, { useEffect, useMemo, useState } from 'react';
import { Book, Edit2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { createSubject, deactivateSubject, getSubjects, updateSubject } from '../../../Constant/AcademicSetupApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';

const emptyForm = {
  name: '',
  detail: '',
};

export const CreateSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useNotificationBridge({ error, success });

  const loadSubjects = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getSubjects('page=1&limit=100');
      setSubjects(result.items || []);
    } catch (loadError) {
      setError(loadError.message || 'مضامین کی فہرست لوڈ نہیں ہو سکی۔');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const resetForm = () => {
    setIsFormOpen(false);
    setEditMode(null);
    setFormData(emptyForm);
  };

  const handleEdit = (subject) => {
    setEditMode(subject.id);
    setFormData({
      name: subject.name || '',
      detail: subject.detail || '',
    });
    setError('');
    setSuccess('');
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('مضمون کا نام درج کرنا ضروری ہے۔');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name.trim(),
        detail: formData.detail.trim(),
      };

      if (editMode) {
        await updateSubject(editMode, payload);
        setSuccess('مضمون کامیابی سے اپڈیٹ ہو گیا۔');
      } else {
        await createSubject(payload);
        setSuccess('مضمون کامیابی سے شامل ہو گیا۔');
      }

      resetForm();
      await loadSubjects();
    } catch (saveError) {
      setError(saveError.message || 'مضمون محفوظ نہیں ہو سکا۔');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (subjectId) => {
    setError('');
    setSuccess('');

    try {
      await deactivateSubject(subjectId);
      setSuccess('مضمون غیر فعال کر دیا گیا۔');
      if (editMode === subjectId) {
        resetForm();
      }
      await loadSubjects();
    } catch (actionError) {
      setError(actionError.message || 'مضمون غیر فعال نہیں ہو سکا۔');
    }
  };

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subjects;

    return subjects.filter((subject) =>
      [subject.name, subject.detail]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [subjects, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 p-2" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--color-surface)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm backdrop-blur-sm">
        <div className="text-right">
          <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tight">مضامین کی فہرست</h2>
          <p className="text-sm text-[var(--color-text-muted)] font-medium text-right mt-4">کل ریکارڈ: {filteredSubjects.length}</p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <div className="relative md:w-72">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="مضمون تلاش کریں"
              className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pr-12 pl-4 text-sm font-bold text-[var(--color-text)] outline-none"
            />
          </div>

          <button
            onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${
              isFormOpen ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-[#00d094] text-white shadow-emerald-500/20'
            }`}
          >
            {isFormOpen ? 'بند کریں' : 'نیا مضمون شامل کریں'}
            {isFormOpen ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <div className="bg-[var(--color-surface)] border border-[#00d094]/20 rounded-[2.5rem] p-8 animate-in slide-in-from-top duration-500 shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-[#00d094] font-black">
            {editMode ? <Edit2 size={20} /> : <Plus size={20} />}
            <span>{editMode ? 'مضمون تبدیل کریں' : 'نیا مضمون'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-2 text-right">
              <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 block uppercase tracking-widest text-right">مضمون کا نام : *</label>
              <input
                type="text"
                value={formData.name}
                placeholder="نام درج کریں"
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[#00d094] focus:ring-4 focus:ring-[#00d094]/5 outline-none h-[64px] pb-2 pt-1 px-4 rounded-2xl text-lg font-bold text-right text-[var(--color-text)] transition-all leading-[2.5]"
              />
            </div>

            <div className="space-y-2 text-right">
              <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 block uppercase tracking-widest text-right">تفصیل / کوڈ</label>
              <input
                type="text"
                value={formData.detail}
                placeholder="مزید تفصیل"
                onChange={(e) => setFormData((prev) => ({ ...prev, detail: e.target.value }))}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[#00d094] focus:ring-4 focus:ring-[#00d094]/5 outline-none h-[64px] pb-2 pt-1 px-4 rounded-2xl text-lg font-bold text-right text-[var(--color-text)] transition-all leading-[2.5]"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            {editMode ? (
              <button onClick={resetForm} className="px-6 py-4 rounded-xl font-black text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] transition-all">
                کینسل
              </button>
            ) : null}
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#218838] hover:bg-[#1a6d2c] text-white px-10 py-4 rounded-xl font-black text-sm shadow-xl shadow-green-900/20 transition-all flex items-center gap-3 disabled:opacity-70"
            >
              {editMode ? 'تبدیل کریں' : 'اندراج کریں'}
              {editMode ? <Save size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </div>
      ) : null}

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] overflow-hidden shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="px-6 py-4 text-[11px] font-black text-right uppercase tracking-widest">مضمون</th>
                <th className="px-6 py-4 text-[11px] font-black text-right uppercase tracking-widest">تفصیل</th>
                <th className="px-6 py-4 text-[11px] font-black text-right uppercase tracking-widest">اسٹیٹس</th>
                <th className="px-6 py-4 text-[11px] font-black text-right uppercase tracking-widest text-start pr-12">ایکشن</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                    مضامین کی فہرست لوڈ ہو رہی ہے...
                  </td>
                </tr>
              ) : filteredSubjects.length ? (
                filteredSubjects.map((sub) => (
                  <tr key={sub.id} className={`border-t border-[var(--color-border)]/60 ${editMode === sub.id ? 'ring-2 ring-[#00d094]' : ''}`}>
                    <td className="px-6 py-4 font-black text-[var(--color-text)] text-right">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--color-surface)] text-[var(--color-text-muted)] rounded-lg border border-[var(--color-border)]">
                          <Book size={16} />
                        </div>
                        <span>{sub.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[var(--color-text-muted)] text-right">{sub.detail || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-xl px-3 py-1 text-xs font-black ${sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {sub.status === 'active' ? 'فعال' : 'غیر فعال'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => handleDeactivate(sub.id)}
                          disabled={sub.status === 'inactive'}
                          className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(sub)}
                          className="p-2.5 bg-emerald-500/10 text-[#00d094] rounded-xl hover:bg-[#00d094] hover:text-white transition-all shadow-sm"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm font-bold text-[var(--color-text-muted)]">
                    کوئی مضمون ریکارڈ نہیں ملا۔
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
