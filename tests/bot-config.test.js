import assert from "node:assert/strict";
import test from "node:test";
import { loadBotConfig, normalizeIndonesianPhone } from "../assistant/bot/config.js";

const validEnv = {
  DEEPSEEK_API_KEY: "test-deepseek",
  GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
    client_email: "bot@example.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n",
  }),
  GOOGLE_SHEETS_SPREADSHEET_ID: "sheet-id",
  GOOGLE_DRIVE_FOLDER_ID: "folder-id",
};

test("normalizes Indonesian mobile numbers to E.164 digits", () => {
  assert.equal(normalizeIndonesianPhone("0851-2150-8159"), "6285121508159");
  assert.equal(normalizeIndonesianPhone("+62 851 2150 8159"), "6285121508159");
  assert.equal(normalizeIndonesianPhone("6285121508159"), "6285121508159");
});

test("loads bot defaults without exposing raw secrets in public config", () => {
  const config = loadBotConfig(validEnv, "D:/hijaoe");

  assert.equal(config.timeZone, "Asia/Makassar");
  assert.equal(config.takeoverHours, 24);
  assert.equal(config.maxMessageAgeSeconds, 600);
  assert.equal(config.whatsappNumber, "6285121508159");
  assert.equal("deepseekApiKey" in config.public, false);
  assert.equal(config.secrets.deepseekApiKey, "test-deepseek");
});

test("rejects missing required configuration", () => {
  assert.throws(() => loadBotConfig({}, "D:/hijaoe"), /DEEPSEEK_API_KEY/);
});

test("rejects malformed Google credentials", () => {
  assert.throws(
    () =>
      loadBotConfig(
        { ...validEnv, GOOGLE_SERVICE_ACCOUNT_JSON: "{" },
        "D:/hijaoe",
      ),
    /GOOGLE_SERVICE_ACCOUNT_JSON/,
  );
});
