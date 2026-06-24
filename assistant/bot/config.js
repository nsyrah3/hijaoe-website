import path from "node:path";

const REQUIRED = [
  "DEEPSEEK_API_KEY",
  "GOOGLE_SERVICE_ACCOUNT_JSON",
  "GOOGLE_SHEETS_SPREADSHEET_ID",
  "GOOGLE_DRIVE_FOLDER_ID",
];

export function normalizeIndonesianPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.startsWith("62")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  return digits;
}

export function loadBotConfig(env = process.env, cwd = process.cwd()) {
  for (const name of REQUIRED) {
    if (!String(env[name] ?? "").trim()) {
      throw new Error(`${name} is required`);
    }
  }

  let googleCredentials;
  try {
    googleCredentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must be valid JSON");
  }

  if (!googleCredentials.client_email || !googleCredentials.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing required fields");
  }

  const publicConfig = {
    whatsappNumber: normalizeIndonesianPhone(
      env.HIJAOE_BUSINESS_NUMBER || "6285121508159",
    ),
    timeZone: env.BOT_TIME_ZONE || "Asia/Makassar",
    takeoverHours: positiveNumber(env.BOT_TAKEOVER_HOURS, 24),
    maxMessageAgeSeconds: positiveNumber(
      env.BOT_MAX_MESSAGE_AGE_SECONDS,
      600,
    ),
    retryIntervalSeconds: positiveNumber(
      env.BOT_RETRY_INTERVAL_SECONDS,
      60,
    ),
    replyDelayMs: nonNegativeNumber(env.BOT_REPLY_DELAY_MS, 1200),
    dataDir: path.resolve(cwd, env.BOT_DATA_DIR || "data/whatsapp-bot"),
    authDir: path.resolve(cwd, env.BOT_AUTH_DIR || ".wwebjs_auth"),
    tempDir: path.resolve(cwd, env.BOT_TEMP_DIR || "tmp/whatsapp-bot"),
    logDir: path.resolve(cwd, env.BOT_LOG_DIR || "logs/whatsapp-bot"),
    spreadsheetTab: env.GOOGLE_SHEETS_TAB_NAME || "Leads",
    deepseekBaseUrl: env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    deepseekModel: env.DEEPSEEK_MODEL || "deepseek-chat",
  };

  return {
    ...publicConfig,
    public: { ...publicConfig },
    secrets: {
      deepseekApiKey: env.DEEPSEEK_API_KEY,
      googleCredentials,
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
      driveFolderId: env.GOOGLE_DRIVE_FOLDER_ID,
    },
  };
}

function positiveNumber(value, fallback) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function nonNegativeNumber(value, fallback) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}
