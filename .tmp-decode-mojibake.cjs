const fs = require('fs');
const path = require('path');

const files = [
  'src/Utils/FundReceiptPrint.js',
  'src/Components/SideBar/sidebar.jsx',
  'src/Components/Notifications/NotificationProvider.jsx',
  'src/Pages/Finance/Incomes/FundCollection/FundCollection.jsx',
  'src/Pages/Exams/ExamResultIndex.jsx',
  'src/Pages/Exams/ExamScheduleIndex.jsx',
  'src/Pages/Exams/ExamSchedule.jsx',
  'src/Pages/Students/AdmissionForm/AdmissionForm.jsx',
  'src/Pages/Students/FeeGeneration/FeeGeneration.jsx',
  'src/Pages/Students/CreateIDCard/CreateIDCard.jsx',
];

const cp1252 = new Map(Object.entries({
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
  0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
  0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
  0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
  0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F,
}).map(([k, v]) => [Number(k), v]));

const hasMojibake = (s) => /[ØÙÛÚ]/.test(s);

function decodeMojibake(s) {
  const bytes = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp1252.has(cp)) bytes.push(cp1252.get(cp));
    else if (cp <= 0xff) bytes.push(cp);
    else bytes.push(...Buffer.from(ch, 'utf8'));
  }
  const decoded = Buffer.from(bytes).toString('utf8');
  return decoded.includes('\uFFFD') ? s : decoded;
}

function decodeQuoted(content) {
  return content.replace(/(['"`])((?:\\.|(?!\1)[\s\S])*?[ØÙÛÚ](?:\\.|(?!\1)[\s\S])*?)\1/g, (match, quote, inner) => {
    return quote + decodeMojibake(inner) + quote;
  });
}

function decodeJsxText(content) {
  return content.replace(/>([^<>{}\n]*[ØÙÛÚ][^<>{}\n]*)</g, (match, text) => {
    return '>' + decodeMojibake(text) + '<';
  });
}

for (const file of files) {
  const abs = path.resolve(file);
  let content = fs.readFileSync(abs, 'utf8');
  const before = content;
  content = decodeQuoted(content);
  content = decodeJsxText(content);
  if (content !== before) {
    fs.writeFileSync(abs, content, 'utf8');
    console.log('decoded', file);
  }
}
