/** Max lengths for skill exchange text fields */
export const LIMITS = {
  skillName: 120,
  subject: 120,
  moduleCode: 32,
  description: 2000,
  problemDescription: 2000,
  titleWhatIWantToLearn: 200,
  volunteerMessage: 1000,
  feedback: 1000,
  searchQuery: 80,
  notificationBody: 500,
};

export function clamp(str, max) {
  if (str == null) return "";
  const s = String(str).trim();
  if (s.length <= max) return s;
  return s.slice(0, max);
}

export function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sanitizeOfferBody(body) {
  return {
    skillName: clamp(body.skillName, LIMITS.skillName),
    subject: clamp(body.subject, LIMITS.subject),
    moduleCode: clamp(body.moduleCode, LIMITS.moduleCode),
    description: clamp(body.description, LIMITS.description),
    skillLevel: body.skillLevel,
    mode: body.mode,
    isPublic: Boolean(body.isPublic),
    availability: body.availability,
  };
}

export function sanitizeLearningRequestBody(body) {
  return {
    subject: clamp(body.subject, LIMITS.subject),
    moduleCode: clamp(body.moduleCode, LIMITS.moduleCode),
    titleWhatIWantToLearn: clamp(body.titleWhatIWantToLearn, LIMITS.titleWhatIWantToLearn),
    description:
      clamp(body.description, LIMITS.description) || "No additional details provided.",
    preferredTime: body.preferredTime,
    skillLevel: body.skillLevel,
    mode: body.mode,
  };
}
