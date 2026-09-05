export const DEFAULT_EMPLOYMENT_TYPE = 'مستقل';

export const EMPLOYMENT_TYPE_OPTIONS = Object.freeze([
  { value: 'مستقل', label: 'مستقل' },
  { value: 'عارضی', label: 'عارضی' },
  { value: 'کنٹریکٹ', label: 'کنٹریکٹ' },
  { value: 'پارٹ ٹائم', label: 'پارٹ ٹائم' },
]);

export const getEmploymentTypeOptions = (currentValue = '') => {
  const normalizedValue = String(currentValue || '').trim();
  if (!normalizedValue || EMPLOYMENT_TYPE_OPTIONS.some((option) => option.value === normalizedValue)) {
    return EMPLOYMENT_TYPE_OPTIONS;
  }

  // Preserve legacy/custom values already saved in the database during edit.
  return [{ value: normalizedValue, label: normalizedValue }, ...EMPLOYMENT_TYPE_OPTIONS];
};

export const getEmploymentTypeLabel = (value) => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '---';
  return EMPLOYMENT_TYPE_OPTIONS.find((option) => option.value === normalizedValue)?.label || normalizedValue;
};
