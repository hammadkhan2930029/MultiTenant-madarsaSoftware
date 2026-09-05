const FATHER_RELATIONSHIPS = new Set(['والد', 'father']);

export const isFatherRelationship = (relationship) =>
  FATHER_RELATIONSHIPS.has(String(relationship || '').trim().toLowerCase());

export const getCurrentParentLink = (student) => {
  const links = Array.isArray(student?.parents) ? student.parents : [];
  return links.find((item) => isFatherRelationship(item.relationship))
    || links.find((item) => item.isPrimary)
    || links[0]
    || null;
};

export const getCurrentParent = (student) => getCurrentParentLink(student)?.parent || null;

export const getGuardianParentLink = (student) => {
  const currentLink = getCurrentParentLink(student);
  return (student?.parents || []).find((item) => item.id !== currentLink?.id) || null;
};
