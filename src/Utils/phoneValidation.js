export const PHONE_VALIDATION_MESSAGE = 'موبائل نمبر 11 ہندسوں میں 03XXXXXXXXX یا کنٹری کوڈ کے ساتھ +923XXXXXXXXX درج کریں۔';

export const normalizePhoneNumber = (value) => {
  const compact = String(value ?? '').trim().replace(/[\s\-()]/g, '');
  return compact.startsWith('0092') ? `+92${compact.slice(4)}` : compact;
};

export const isValidPhoneNumber = (value) => {
  const phone = normalizePhoneNumber(value);
  if (!phone) return true;
  return /^03\d{9}$/.test(phone) || /^\+923\d{9}$/.test(phone);
};

export const sanitizePhoneInput = (value) => {
  let phone = String(value ?? '').replace(/[^\d+]/g, '');
  phone = phone.startsWith('+') ? `+${phone.slice(1).replace(/\+/g, '')}` : phone.replace(/\+/g, '');
  if (phone.startsWith('0092')) phone = `+92${phone.slice(4)}`;
  return phone.slice(0, 13);
};

export const PHONE_INPUT_PROPS = { type: 'tel', inputMode: 'tel', maxLength: 13 };
