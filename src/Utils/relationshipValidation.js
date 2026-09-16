export const URDU_RELATIONSHIP_MESSAGE = 'رشتہ صرف اردو میں درج کریں۔';

const URDU_RELATIONSHIP_PATTERN = /^[\p{Script=Arabic}\p{Mark}\s\u060C\u061B\u061F\u06D4]+$/u;
const URDU_LETTER_PATTERN = /(?=\p{Script=Arabic})\p{Letter}/u;

export const isValidUrduRelationship = (value) => {
  const relationship = String(value ?? '').trim();
  if (!relationship || /[A-Za-z]|\p{Number}/u.test(relationship)) return false;
  return URDU_LETTER_PATTERN.test(relationship) && URDU_RELATIONSHIP_PATTERN.test(relationship);
};
