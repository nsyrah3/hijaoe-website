export function classifyIncomingMessage({
  chatId,
  number,
  messageId,
  timestampSeconds,
  nowMs = Date.now(),
  maxAgeSeconds = 600,
  alreadyProcessed = false,
  paused = false,
} = {}) {
  const privateNumber = number || getPrivateNumber(chatId);
  if (!privateNumber) {
    return { action: "ignore", reason: "unsupported_chat" };
  }

  if (!messageId) {
    return { action: "ignore", reason: "missing_id" };
  }

  if (
    Number.isFinite(timestampSeconds) &&
    nowMs - timestampSeconds * 1000 > maxAgeSeconds * 1000
  ) {
    return { action: "ignore", reason: "stale" };
  }

  if (alreadyProcessed) {
    return { action: "ignore", reason: "duplicate" };
  }

  if (paused) {
    return { action: "ignore", reason: "manual_takeover" };
  }

  return { action: "process", number: privateNumber };
}

export function classifyOwnMessage({
  chatId,
  number,
  knownBotMessage = false,
} = {}) {
  if (knownBotMessage) {
    return { action: "ignore", reason: "bot_message" };
  }

  const privateNumber = number || getPrivateNumber(chatId);
  if (!privateNumber) {
    return { action: "ignore", reason: "unsupported_chat" };
  }

  return { action: "pause", number: privateNumber };
}

export function getPrivateNumber(chatId) {
  const value = String(chatId ?? "");
  if (value.endsWith("@c.us")) {
    return value.slice(0, -5);
  }
  if (value.endsWith("@lid")) {
    return value.slice(0, -4);
  }
  return "";
}
