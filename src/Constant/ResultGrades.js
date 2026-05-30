export const defaultResultGrades = [
  { id: 'grade-1', title: 'ممتاز', code: 'A+', from: 80, to: 100 },
  { id: 'grade-2', title: 'بہتر', code: 'A', from: 60, to: 79 },
  { id: 'grade-3', title: 'مناسب', code: 'B', from: 40, to: 59 },
  { id: 'grade-4', title: 'کمزور', code: 'C', from: 0, to: 39 },
];

export const getResultGradeLabel = (percentage, grades = defaultResultGrades) => {
  const numericPercentage = Number(percentage || 0);
  const matchedGrade = grades.find((grade) => numericPercentage >= Number(grade.from) && numericPercentage <= Number(grade.to));
  if (!matchedGrade) return '---';
  return matchedGrade.code ? `${matchedGrade.title} (${matchedGrade.code})` : matchedGrade.title;
};
