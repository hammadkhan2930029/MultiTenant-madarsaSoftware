export const PERFORMANCE_OPTIONS = ['Excellent', 'Good', 'Average', 'Weak'];

const getActiveAssignment = (student) =>
  student.assignments?.find((assignment) => assignment.status === 'active') || student.assignments?.[0] || null;

export const mapStudentsForHifz = (items = []) =>
  items.map((student) => {
    const assignment = getActiveAssignment(student);

    return {
      id: student.id,
      fullName: student.fullName,
      fatherName: student.fatherName,
      admissionNumber: student.admissionNumber,
      className: assignment?.class?.name || '',
      sectionName: assignment?.section?.name || '',
      sessionName: assignment?.session?.name || '',
    };
  });

export const getUniqueOptions = (items = [], key) =>
  [...new Set(items.map((item) => item[key]).filter(Boolean))];

export const filterStudentsForHifz = (students, className, sectionName) =>
  students.filter((student) => {
    const matchesClass = className ? student.className === className : true;
    const matchesSection = sectionName ? student.sectionName === sectionName : true;
    return matchesClass && matchesSection;
  });

export const formatDateForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export const formatDateForDisplay = (value) => {
  const formatted = formatDateForInput(value);
  return formatted || '-';
};

export const getStudentDisplayName = (student) => {
  if (!student) return '---';
  return `${student.fullName}${student.admissionNumber ? ` (${student.admissionNumber})` : ''}`;
};
