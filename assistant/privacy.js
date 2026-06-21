const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\(\+?62\)|\+?62|0)[\d\s().-]{8,25}\d/g;
const NAME_INTRO_PATTERN =
  /\b(?:nama saya|saya bernama)\s+[\p{L}][\p{L}.'-]*(?:\s+(?!(?:mau|ingin|butuh|perlu|buat|bikin|untuk|nomor|dan)\b)[\p{L}][\p{L}.'-]*){0,2}/giu;

function redactPhoneCandidate(match) {
  const digits = match.replace(/\D/g, "");
  if (
    (digits.startsWith("62") && digits.length >= 10 && digits.length <= 15) ||
    (digits.startsWith("0") && digits.length >= 10 && digits.length <= 14)
  ) {
    return "[nomor]";
  }

  return match;
}

export function sanitizeTextForModel(value) {
  return String(value ?? "")
    .replace(EMAIL_PATTERN, "[email]")
    .replace(PHONE_PATTERN, redactPhoneCandidate)
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
