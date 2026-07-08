const exactTranslations = new Map([
  ['You do not have permission to perform this action.', 'آپ کو اس عمل کی اجازت نہیں ہے۔'],
  ['You do not have permission to access this resource.', 'آپ کو اس عمل کی اجازت نہیں ہے۔'],
  ['Permission denied.', 'آپ کو اس عمل کی اجازت نہیں ہے۔'],
  ['Forbidden', 'آپ کو اس عمل کی اجازت نہیں ہے۔'],
  ['Access denied', 'آپ کو اس عمل کی اجازت نہیں ہے۔'],
  ['Request failed', 'درخواست مکمل نہیں ہو سکی۔'],
  ['Request failed.', 'درخواست مکمل نہیں ہو سکی۔'],
  ['Authorization token is required.', 'براہ کرم دوبارہ لاگ اِن کریں۔'],
  ['Invalid or expired token.', 'آپ کا سیشن ختم ہو گیا ہے۔ براہ کرم دوبارہ لاگ اِن کریں۔'],
  ['Admin account not found.', 'ایڈمن اکاؤنٹ نہیں ملا۔'],
  ['Your account is inactive. Please contact support.', 'آپ کا اکاؤنٹ غیر فعال ہے۔ براہ کرم انتظامیہ سے رابطہ کریں۔'],
  ['Internal server error', 'سرور میں مسئلہ پیش آیا۔ براہ کرم دوبارہ کوشش کریں۔'],
  ['City with the same name already exists.', 'یہ شہر پہلے سے موجود ہے۔'],
  ['Family number already exists.', 'یہ فیملی نمبر پہلے سے موجود ہے۔'],
  ['Parent with similar details already exists.', 'انہی معلومات کے ساتھ والدین کا ریکارڈ پہلے سے موجود ہے۔'],
  ['Another parent with similar details already exists.', 'انہی معلومات کے ساتھ دوسرا والدین کا ریکارڈ پہلے سے موجود ہے۔'],
  ['Schedule saved successfully.', 'نظام الاوقات کامیابی سے محفوظ ہو گیا۔'],
  ['Schedule updated successfully.', 'نظام الاوقات کامیابی سے اپڈیٹ ہو گیا۔'],
  ['Schedule removed successfully.', 'نظام الاوقات کامیابی سے حذف ہو گیا۔'],
  ['Schedule not found.', 'نظام الاوقات کا ریکارڈ نہیں ملا۔'],
  ['Student not found.', 'طالب علم کا ریکارڈ نہیں ملا۔'],
  ['Parent not found.', 'والدین کا ریکارڈ نہیں ملا۔'],
  ['City not found.', 'شہر کا ریکارڈ نہیں ملا۔'],
  ['Teacher not found.', 'استاد کا ریکارڈ نہیں ملا۔'],
  ['Only image files are allowed.', 'صرف تصویر والی فائل منتخب کریں۔'],
]);

const rules = [
  [/network|failed to fetch|fetch failed|connection/i, 'سرور سے رابطہ نہیں ہو سکا۔ براہ کرم انٹرنیٹ یا سرور کنکشن چیک کریں۔'],
  [/permission|forbidden|access denied|not allowed/i, 'آپ کو اس عمل کی اجازت نہیں ہے۔'],
  [/unauthorized|token|session|jwt/i, 'آپ کا سیشن ختم ہو گیا ہے۔ براہ کرم دوبارہ لاگ اِن کریں۔'],
  [/already|duplicate|unique|same name/i, 'یہ ریکارڈ پہلے سے موجود ہے۔'],
  [/not found|does not exist/i, 'مطلوبہ ریکارڈ نہیں ملا۔'],
  [/required|missing|must be|invalid|valid|too long|too short/i, 'براہ کرم مطلوبہ معلومات درست اور مکمل درج کریں۔'],
  [/password/i, 'پاس ورڈ سے متعلق کارروائی مکمل نہیں ہو سکی۔'],
  [/login|sign in/i, 'لاگ اِن نہیں ہو سکا۔ براہ کرم معلومات دوبارہ چیک کریں۔'],
  [/delete|remove|deactivate|inactive/i, 'ریکارڈ حذف یا غیر فعال نہیں ہو سکا۔'],
  [/save|create|update|edit|change/i, 'ریکارڈ محفوظ یا اپڈیٹ نہیں ہو سکا۔'],
  [/load|get|fetch|list/i, 'ڈیٹا لوڈ نہیں ہو سکا۔'],
  [/upload|file|image/i, 'فائل اپ لوڈ نہیں ہو سکی۔'],
  [/attendance/i, 'حاضری کی کارروائی مکمل نہیں ہو سکی۔'],
  [/schedule/i, 'نظام الاوقات کی کارروائی مکمل نہیں ہو سکی۔'],
  [/student/i, 'طالب علم سے متعلق کارروائی مکمل نہیں ہو سکی۔'],
  [/parent/i, 'والدین سے متعلق کارروائی مکمل نہیں ہو سکی۔'],
  [/teacher|staff/i, 'استاد یا عملے سے متعلق کارروائی مکمل نہیں ہو سکی۔'],
  [/city/i, 'شہر سے متعلق کارروائی مکمل نہیں ہو سکی۔'],
  [/class|section|session|subject/i, 'تعلیمی ترتیب سے متعلق کارروائی مکمل نہیں ہو سکی۔'],
  [/finance|fee|salary|fund|payment|transaction/i, 'مالیاتی کارروائی مکمل نہیں ہو سکی۔'],
  [/exam|result|grade/i, 'امتحان یا نتیجے سے متعلق کارروائی مکمل نہیں ہو سکی۔'],
];

const hasUrdu = (value) => /[\u0600-\u06ff]/.test(value);
const hasEnglishLetters = (value) => /[a-z]/i.test(value);
const isPositiveEnglishMessage = (value) =>
  /success|saved|updated|created|added|selected|completed|deleted|removed|changed/i.test(value)
  && !/failed|not|unable|error|invalid/i.test(value);

const normalizePunctuation = (value) =>
  value
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '۔')
    .trim();

export const toUrduNotificationText = (value, fallback = '') => {
  const input = String(value || fallback || '').trim();
  if (!input) return '';

  const exact = exactTranslations.get(input);
  if (exact) return exact;

  if (hasUrdu(input) && !hasEnglishLetters(input)) {
    return normalizePunctuation(input);
  }

  if (isPositiveEnglishMessage(input) && hasUrdu(fallback)) {
    return normalizePunctuation(fallback);
  }

  const matchedRule = rules.find(([pattern]) => pattern.test(input));
  if (matchedRule) return matchedRule[1];

  if (hasUrdu(fallback)) return normalizePunctuation(fallback);

  return 'کارروائی مکمل نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔';
};
