import React, { useState } from 'react';
import { Camera, Save, UserPlus } from 'lucide-react';
import { InputField } from '../../Components/HR/FormElements';
import { createTeacher } from '../../Constant/TeachersApi';

const INITIAL_VALUES = {
  fullName: '',
  email: '',
  phone: '',
  cnic: '',
  subject: '',
  qualification: '',
  address: '',
  basicSalary: '',
};

export const HRManagement = () => {
  const [formData, setFormData] = useState(INITIAL_VALUES);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await createTeacher({
        ...formData,
        basicSalary: Number(formData.basicSalary || 0),
        image: imageFile,
      });

      setSuccess('Teacher successfully create ho gaye.');
      setFormData(INITIAL_VALUES);
      setImagePreview(null);
      setImageFile(null);
    } catch (saveError) {
      setError(saveError.message || 'Teacher save nahi ho sake.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-main)] p-2 md:p-4 transition-colors duration-300" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-[var(--color-surface)] rounded-[2.5rem] p-8 shadow-sm border border-[var(--color-border)]">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black">نیا استاد شامل کریں</h1>
              <p className="text-sm font-bold text-[var(--color-text-muted)] mt-3">Teacher profile backend API ke sath directly save hogi.</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-8 py-4 rounded-2xl font-black disabled:opacity-70"
            >
              <Save size={18} /> {isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="bg-[var(--color-surface)] rounded-[2.5rem] p-8 shadow-sm border border-[var(--color-border)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="استاد کا نام" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} />
              <InputField label="ای میل" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
              <InputField label="فون نمبر" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              <InputField label="CNIC" value={formData.cnic} onChange={(e) => handleChange('cnic', e.target.value)} />
              <InputField label="مضمون" value={formData.subject} onChange={(e) => handleChange('subject', e.target.value)} />
              <InputField label="Qualification" value={formData.qualification} onChange={(e) => handleChange('qualification', e.target.value)} />
              <InputField label="بنیادی تنخواہ" type="number" value={formData.basicSalary} onChange={(e) => handleChange('basicSalary', e.target.value)} />
              <InputField label="پتہ" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>

            {error ? <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">{error}</div> : null}
            {success ? <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">{success}</div> : null}
          </div>

          <div className="bg-[var(--color-surface)] rounded-[2.5rem] p-8 shadow-sm border border-[var(--color-border)] flex flex-col items-center justify-center gap-5">
            <div className="w-48 h-48 rounded-[2rem] border-2 border-dashed border-[var(--color-border)] overflow-hidden flex items-center justify-center bg-[var(--color-bg)]">
              {imagePreview ? (
                <img src={imagePreview} alt="teacher" className="w-full h-full object-cover" />
              ) : (
                <UserPlus size={60} className="text-[var(--color-text-muted)]" />
              )}
            </div>
            <label className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-black">
              <Camera size={18} /> تصویر اپ لوڈ کریں
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
