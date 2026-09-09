const FIELD_ERROR_KEYS = ['errors', 'fieldErrors', 'validationErrors'];

const firstMessage = (value) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(firstMessage).find(Boolean) || '';
  return '';
};

const collectErrors = (source, target, prefix = '') => {
  if (!source || typeof source !== 'object') return;

  Object.entries(source).forEach(([key, value]) => {
    const path = ['body', 'params', 'query'].includes(key) ? prefix : (prefix ? `${prefix}.${key}` : key);
    const message = firstMessage(value);
    if (message && path) {
      target[path] = message;
      return;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) collectErrors(value, target, path);
  });
};

export const normalizeValidationErrors = (error) => {
  const response = error?.response || error || {};
  const candidates = [
    ...FIELD_ERROR_KEYS.map((key) => response?.[key]),
    ...FIELD_ERROR_KEYS.map((key) => response?.data?.[key]),
    response?.data?.fieldErrors,
  ];
  const normalized = {};
  candidates.forEach((candidate) => collectErrors(candidate, normalized));
  if (!Object.keys(normalized).length) {
    const rawMessage = String(response?.message || error?.message || '').trim();
    const message = String(error?.message || response?.message || '').trim();
    const lowerMessage = rawMessage.toLowerCase();
    const inferredField = [
      ['email', 'email'], ['ای میل', 'email'],
      ['username', 'username'], ['صارف نام', 'username'],
      ['phone', 'phone'], ['mobile', 'phone'], ['موبائل', 'phone'], ['فون', 'phone'],
      ['registration', 'registrationNo'], ['رجسٹریشن', 'registrationNo'],
      ['family number', 'familyNumber'], ['خاندان نمبر', 'familyNumber'],
      ['branch', 'branchId'], ['برانچ', 'branchId'],
      ['role', 'roleId'], ['کردار', 'roleId'],
    ].find(([needle]) => lowerMessage.includes(needle.toLowerCase()))?.[1];
    if (inferredField && message) normalized[inferredField] = message;
  }
  return normalized;
};

export const clearFieldError = (setErrors, fieldName) => {
  setErrors((current) => {
    if (!current?.[fieldName]) return current;
    const next = { ...current };
    delete next[fieldName];
    return next;
  });
};

export const focusFirstInvalidField = (errors, fieldIds = {}) => {
  const firstField = Object.keys(errors || {})[0];
  if (!firstField || typeof document === 'undefined') return;
  const id = fieldIds[firstField] || firstField;
  window.requestAnimationFrame(() => {
    const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id;
    const element = document.getElementById(id) || document.querySelector(`[name="${escaped}"]`);
    element?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    element?.focus?.({ preventScroll: true });
  });
};
