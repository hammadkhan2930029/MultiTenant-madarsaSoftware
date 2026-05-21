const exactTranslations = new Map([
  ['Request failed.', 'درخواست مکمل نہیں ہو سکی۔'],
  ['Admin session not found.', 'ایڈمن سیشن نہیں ملا۔ براہ کرم دوبارہ لاگ اِن کریں۔'],
  ['Login failed.', 'لاگ اِن نہیں ہو سکا۔'],
  ['Password update failed.', 'پاس ورڈ اپڈیٹ نہیں ہو سکا۔'],
  ['Load failed', 'لوڈنگ میں مسئلہ پیش آیا'],
  ['Save failed', 'محفوظ کرنے میں مسئلہ پیش آیا'],
  ['Delete failed', 'حذف کرنے میں مسئلہ پیش آیا'],
  ['Invalid file', 'غلط فائل'],
  ['Image selected', 'تصویر منتخب ہو گئی'],
  ['Profile updated', 'پروفائل اپڈیٹ ہو گئی'],
  ['Load issue', 'لوڈنگ میں مسئلہ پیش آیا'],
  ['City added', 'شہر شامل ہو گیا'],
  ['City removed', 'شہر غیر فعال کر دیا گیا'],
  ['Classes data load nahi ho saka.', 'جماعتوں کا ڈیٹا لوڈ نہیں ہو سکا۔'],
  ['Sections data load nahi ho saki.', 'سیکشنز کا ڈیٹا لوڈ نہیں ہو سکا۔'],
  ['Sessions load nahi ho sakin.', 'سیشنز کی فہرست لوڈ نہیں ہو سکی۔'],
  ['Subjects load nahi ho sake.', 'مضامین کی فہرست لوڈ نہیں ہو سکی۔'],
  ['Class name aur branch dono zaroori hain.', 'جماعت کا نام درج کرنا ضروری ہے۔'],
  ['Class update ho gayi.', 'جماعت کامیابی سے اپڈیٹ ہو گئی۔'],
  ['Class create ho gayi.', 'جماعت کامیابی سے شامل ہو گئی۔'],
  ['Class save nahi ho saki.', 'جماعت محفوظ نہیں ہو سکی۔'],
  ['Class inactive kar di gayi.', 'جماعت غیر فعال کر دی گئی۔'],
  ['Class inactive nahi ho saki.', 'جماعت غیر فعال نہیں ہو سکی۔'],
  ['Class aur section name dono zaroori hain.', 'جماعت اور سیکشن کا نام دونوں درج کرنا ضروری ہیں۔'],
  ['Section update ho gaya.', 'سیکشن کامیابی سے اپڈیٹ ہو گیا۔'],
  ['Section update ho گیا.', 'سیکشن کامیابی سے اپڈیٹ ہو گیا۔'],
  ['Section create ho gaya.', 'سیکشن کامیابی سے شامل ہو گیا۔'],
  ['Section create ho گیا.', 'سیکشن کامیابی سے شامل ہو گیا۔'],
  ['Section save nahi ho saki.', 'سیکشن محفوظ نہیں ہو سکا۔'],
  ['Section inactive kar di gayi.', 'سیکشن غیر فعال کر دیا گیا۔'],
  ['Section inactive nahi ho saki.', 'سیکشن غیر فعال نہیں ہو سکا۔'],
  ['Session name, start date, aur end date zaroori hain.', 'سیشن کا نام، شروع کی تاریخ اور اختتامی تاریخ درج کرنا ضروری ہیں۔'],
  ['Session update ho gaya.', 'سیشن کامیابی سے اپڈیٹ ہو گیا۔'],
  ['Session create ho gaya.', 'سیشن کامیابی سے شامل ہو گیا۔'],
  ['Session save nahi ho saka.', 'سیشن محفوظ نہیں ہو سکا۔'],
  ['Session inactive kar diya gaya.', 'سیشن غیر فعال کر دیا گیا۔'],
  ['Session inactive nahi ho saka.', 'سیشن غیر فعال نہیں ہو سکا۔'],
  ['Subject name zaroori hai.', 'مضمون کا نام درج کرنا ضروری ہے۔'],
  ['Subject update ho gaya.', 'مضمون کامیابی سے اپڈیٹ ہو گیا۔'],
  ['Subject create ho gaya.', 'مضمون کامیابی سے شامل ہو گیا۔'],
  ['Subject save nahi ho saka.', 'مضمون محفوظ نہیں ہو سکا۔'],
  ['Subject inactive kar diya gaya.', 'مضمون غیر فعال کر دیا گیا۔'],
  ['Subject inactive nahi ho saka.', 'مضمون غیر فعال نہیں ہو سکا۔'],
]);

const phraseTranslations = [
  ['load nahi ho saki.', 'لوڈ نہیں ہو سکی۔'],
  ['load nahi ho saka.', 'لوڈ نہیں ہو سکا۔'],
  ['load nahi ho sake.', 'لوڈ نہیں ہو سکے۔'],
  ['load nahi ho sakin.', 'لوڈ نہیں ہو سکیں۔'],
  ['save nahi ho saki.', 'محفوظ نہیں ہو سکی۔'],
  ['save nahi ho saka.', 'محفوظ نہیں ہو سکا۔'],
  ['save nahi ho sake.', 'محفوظ نہیں ہو سکے۔'],
  ['remove nahi ho saki.', 'حذف نہیں ہو سکی۔'],
  ['inactive kar diya gaya.', 'غیر فعال کر دیا گیا۔'],
  ['list mein save ho gaya.', 'فہرست میں محفوظ ہو گیا۔'],
  ['Sirf image file select karein.', 'صرف تصویر والی فائل منتخب کریں۔'],
  ['Cities load nahi ho sakin.', 'شہروں کی فہرست لوڈ نہیں ہو سکی۔'],
  ['City save nahi ho saki.', 'شہر محفوظ نہیں ہو سکا۔'],
  ['City remove nahi ho saki.', 'شہر حذف نہیں ہو سکا۔'],
  ['Profile save nahi ho saki.', 'پروفائل محفوظ نہیں ہو سکی۔'],
  ['Profile load nahi ho saki.', 'پروفائل لوڈ نہیں ہو سکی۔'],
  ['Tamam tabdeeliyan database mein save ho gayi hain.', 'تمام تبدیلیاں محفوظ ہو گئی ہیں۔'],
];

export const toUrduNotificationText = (value, fallback = '') => {
  const input = String(value || fallback || '').trim();
  if (!input) return '';

  const exact = exactTranslations.get(input);
  if (exact) return exact;

  let translated = input;

  phraseTranslations.forEach(([source, target]) => {
    translated = translated.replaceAll(source, target);
  });

  return translated;
};
