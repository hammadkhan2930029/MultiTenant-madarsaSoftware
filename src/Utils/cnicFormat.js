export const CNIC_INPUT_MAX_LENGTH = 15;

export const getCnicDigits = (value = '') =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 13);

export const formatCnicInput = (value = '') => {
  const digits = getCnicDigits(value);

  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;

  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

export const isCompleteCnic = (value = '') => getCnicDigits(value).length === 13;
