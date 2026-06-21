const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?62|0)[\s-]?(?:\d[\s-]?){8,13}\d/g;
const NAME_INTRO_PATTERN = /\b(?:nama saya|saya bernama)\s+[\p{L}][\p{L}\s.'-]{1,50}(?=,|\.|\s+nomor|\s+dan|$)/giu;

export function sanitizeTextForModel(value) {
  return String(value ?? "")
    .replace(EMAIL_PATTERN, "[email]")
    .replace(PHONE_PATTERN, "[nomor]")
    .replace(NAME_INTRO_PATTERN, (match) =>
      match.replace(/(?:nama saya|saya bernama).*/iu, "nama saya [nama]"),
    )
    .trim();
}

export function buildModelContext(session, currentMessage) {
  return {
    state: session.state,
    message: sanitizeTextForModel(currentMessage),
    service: sanitizeTextForModel(session.data.service),
    dimensions: sanitizeTextForModel(session.data.dimensions),
    material: sanitizeTextForModel(session.data.material),
    targetTime: sanitizeTextForModel(session.data.targetTime),
  };
}
