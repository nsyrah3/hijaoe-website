# HIJAOE WhatsApp Web Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 24-hour local WhatsApp Business bot that uses DeepSeek, persists conversations, saves leads to Google Sheets, uploads photos to Google Drive, and pauses AI for 24 hours after an admin replies manually.

**Architecture:** Run `whatsapp-web.js` as a separate Node.js process linked to the HIJAOE WhatsApp Business account. Keep deterministic conversation rules in the existing engine, store operational state in Node 24's built-in SQLite, and isolate external services behind adapters so tests can use fakes. The website and existing Cloudflare webhook remain unchanged.

**Tech Stack:** Node.js 24 ESM, `whatsapp-web.js` 1.34.7, `googleapis` 173.0.0, `dotenv` 17.4.2, `qrcode-terminal` 0.12.0, built-in `node:sqlite`, Node test runner, Windows Task Scheduler.

---

## File Structure

### Create

- `assistant/bot/config.js`: validates environment configuration without exposing secrets.
- `assistant/bot/store.js`: owns SQLite schema and all persistence operations.
- `assistant/bot/message-policy.js`: pure rules for accepted chats, stale messages, duplicates, and manual takeover.
- `assistant/bot/google-client.js`: authenticated Sheets and Drive operations.
- `assistant/bot/sync-service.js`: lead/media synchronization and retry queue processing.
- `assistant/bot/reply-composer.js`: constrained DeepSeek rewrite with deterministic fallback.
- `assistant/bot/orchestrator.js`: coordinates incoming messages, conversation state, uploads, replies, and handoff.
- `assistant/bot/whatsapp-client.js`: wraps `whatsapp-web.js` events and outbound sends.
- `assistant/bot/runtime.js`: starts services, reconnects, schedules retries, and shuts down cleanly.
- `assistant/bot/main.js`: executable entry point.
- `assistant/bot/status.js`: prints sanitized local health information.
- `scripts/start-whatsapp-bot.ps1`: hidden Windows launcher with log redirection.
- `scripts/install-whatsapp-bot-startup.ps1`: installs the current-user startup task.
- `docs/whatsapp-web-bot-operations.md`: setup, QR login, status, recovery, and VPS migration guide.
- `tests/bot-config.test.js`
- `tests/bot-store.test.js`
- `tests/bot-message-policy.test.js`
- `tests/bot-google-client.test.js`
- `tests/bot-sync-service.test.js`
- `tests/bot-reply-composer.test.js`
- `tests/bot-orchestrator.test.js`
- `tests/bot-whatsapp-client.test.js`
- `tests/bot-runtime.test.js`

### Modify

- `package.json`: add runtime dependencies and bot scripts.
- `package-lock.json`: lock installed dependency versions.
- `.gitignore`: exclude credentials, WhatsApp session, SQLite, media, and logs.
- `assets/js/site-data.js`: change the public WhatsApp contact to the bot number.
- `assistant/simulator.js`: use the production bot number as the simulator default.
- `assistant/deepseek-adapter.js`: expose a safe low-level completion helper for the reply composer.
- `assistant/conversation-engine.js`: support restoring serialized sessions without changing existing flow behavior.
- `scripts/generate-seo-pages.js`: regenerate service pages from updated business data without changing the generator contract.
- `layanan/aluminium-kaca-makassar.html`
- `layanan/atap-kanopi-makassar.html`
- `layanan/besi-las-makassar.html`
- `layanan/interior-furnitur-makassar.html`
- `layanan/kanopi-makassar.html`
- `layanan/konstruksi-renovasi-makassar.html`
- `layanan/lemari-kitchen-set-aluminium-makassar.html`
- `layanan/meja-kursi-sekolah-makassar.html`
- `layanan/pagar-besi-makassar.html`
- `layanan/partisi-kaca-kalsiboard-makassar.html`
- `layanan/pintu-jendela-aluminium-makassar.html`
- `layanan/plafon-partisi-makassar.html`
- `layanan/plafon-pvc-gypsum-makassar.html`
- `layanan/renovasi-rumah-makassar.html`
- `tests/assistant-flow.test.js`: cover restored sessions and handoff compatibility.
- `tests/site-data.test.js`: require the new display and international number.
- `tests/seo.test.js`: require every generated service page to use the new WhatsApp number.

---

### Task 1: Runtime Configuration and Secret Boundaries

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `assistant/bot/config.js`
- Create: `tests/bot-config.test.js`

- [ ] **Step 1: Write failing configuration tests**

Create `tests/bot-config.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { loadBotConfig } from "../assistant/bot/config.js";

const validEnv = {
  DEEPSEEK_API_KEY: "test-deepseek",
  GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
    client_email: "bot@example.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n",
  }),
  GOOGLE_SHEETS_SPREADSHEET_ID: "sheet-id",
  GOOGLE_DRIVE_FOLDER_ID: "folder-id",
};

test("loads bot defaults without returning raw secrets", () => {
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
    () => loadBotConfig({ ...validEnv, GOOGLE_SERVICE_ACCOUNT_JSON: "{" }, "D:/hijaoe"),
    /GOOGLE_SERVICE_ACCOUNT_JSON/,
  );
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run: `node --test tests/bot-config.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `assistant/bot/config.js`.

- [ ] **Step 3: Install pinned dependencies and add scripts**

Run:

```powershell
npm.cmd install whatsapp-web.js@1.34.7 googleapis@173.0.0 dotenv@17.4.2 qrcode-terminal@0.12.0
```

Add these scripts to `package.json`:

```json
{
  "bot:start": "node assistant/bot/main.js",
  "bot:status": "node assistant/bot/status.js"
}
```

- [ ] **Step 4: Protect all local runtime data**

Append to `.gitignore`:

```gitignore
.env
.wwebjs_auth/
.wwebjs_cache/
data/whatsapp-bot/
logs/whatsapp-bot/
tmp/whatsapp-bot/
google-service-account*.json
```

- [ ] **Step 5: Implement strict configuration loading**

Create `assistant/bot/config.js` with `loadBotConfig(env = process.env, cwd = process.cwd())`. It must:

```js
import path from "node:path";

const REQUIRED = [
  "DEEPSEEK_API_KEY",
  "GOOGLE_SERVICE_ACCOUNT_JSON",
  "GOOGLE_SHEETS_SPREADSHEET_ID",
  "GOOGLE_DRIVE_FOLDER_ID",
];

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
    whatsappNumber: "6285121508159",
    timeZone: env.BOT_TIME_ZONE || "Asia/Makassar",
    takeoverHours: Number(env.BOT_TAKEOVER_HOURS || 24),
    maxMessageAgeSeconds: Number(env.BOT_MAX_MESSAGE_AGE_SECONDS || 600),
    retryIntervalSeconds: Number(env.BOT_RETRY_INTERVAL_SECONDS || 60),
    dataDir: path.resolve(cwd, env.BOT_DATA_DIR || "data/whatsapp-bot"),
  };

  return {
    ...publicConfig,
    public: publicConfig,
    secrets: {
      deepseekApiKey: env.DEEPSEEK_API_KEY,
      googleCredentials,
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
      driveFolderId: env.GOOGLE_DRIVE_FOLDER_ID,
    },
  };
}
```

Do not log the returned `secrets` object.

- [ ] **Step 6: Run configuration and existing tests**

Run: `node --test tests/bot-config.test.js tests/assistant-*.test.js`

Expected: all tests PASS.

- [ ] **Step 7: Commit the foundation**

```powershell
git add package.json package-lock.json .gitignore assistant/bot/config.js tests/bot-config.test.js
git commit -m "feat: add WhatsApp bot runtime configuration"
```

---

### Task 2: Persistent SQLite Store

**Files:**
- Create: `assistant/bot/store.js`
- Create: `tests/bot-store.test.js`

- [ ] **Step 1: Write failing persistence tests**

Create tests using a temporary SQLite file. Cover these exact behaviors:

```js
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createBotStore } from "../assistant/bot/store.js";

function makeStore() {
  const dir = mkdtempSync(path.join(tmpdir(), "hijaoe-bot-"));
  return createBotStore(path.join(dir, "bot.sqlite"));
}

test("persists and restores a conversation session", () => {
  const store = makeStore();
  store.saveSession("628111", { state: "location", data: { name: "Ari" } });
  assert.deepEqual(store.loadSession("628111"), {
    state: "location",
    data: { name: "Ari" },
  });
  store.close();
});

test("deduplicates inbound message IDs", () => {
  const store = makeStore();
  assert.equal(store.claimInboundMessage("wamid-1", "628111", 1000), true);
  assert.equal(store.claimInboundMessage("wamid-1", "628111", 1001), false);
  store.close();
});

test("manual reply pauses one contact for 24 hours", () => {
  const store = makeStore();
  store.pauseContact("628111", 1_000, 24);
  assert.equal(store.isPaused("628111", 1_000 + 23 * 3_600_000), true);
  assert.equal(store.isPaused("628111", 1_000 + 24 * 3_600_000), false);
  store.close();
});

test("bot outbound IDs are distinguishable from manual replies", () => {
  const store = makeStore();
  store.recordBotOutbound("bot-message-1", "628111", 1000);
  assert.equal(store.isBotOutbound("bot-message-1"), true);
  assert.equal(store.isBotOutbound("manual-message-1"), false);
  store.close();
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/bot-store.test.js`

Expected: FAIL because `assistant/bot/store.js` does not exist.

- [ ] **Step 3: Create the schema and repository API**

Implement `createBotStore(filename)` with `DatabaseSync` from `node:sqlite`. On startup execute:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessions (
  whatsapp_number TEXT PRIMARY KEY,
  session_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS processed_messages (
  message_id TEXT PRIMARY KEY,
  whatsapp_number TEXT NOT NULL,
  received_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS outbound_bot_messages (
  message_id TEXT PRIMARY KEY,
  whatsapp_number TEXT NOT NULL,
  sent_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS manual_takeovers (
  whatsapp_number TEXT PRIMARY KEY,
  paused_until INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS leads (
  whatsapp_number TEXT PRIMARY KEY,
  lead_json TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS media_uploads (
  message_id TEXT PRIMARY KEY,
  whatsapp_number TEXT NOT NULL,
  drive_file_id TEXT,
  drive_url TEXT,
  sync_status TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS retry_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  run_after INTEGER NOT NULL,
  last_error TEXT
);
```

Return focused methods with these signatures:

```js
{
  loadSession(number),
  saveSession(number, session, now = Date.now()),
  claimInboundMessage(messageId, number, receivedAt),
  recordBotOutbound(messageId, number, sentAt),
  isBotOutbound(messageId),
  pauseContact(number, now, hours),
  isPaused(number, now),
  saveLead(number, lead, now),
  saveMedia(messageId, number, mediaRecord, now),
  enqueueRetry(type, payload, runAfter),
  claimDueRetries(now, limit = 20),
  completeRetry(id),
  rescheduleRetry(id, attempts, runAfter, safeError),
  getHealthSnapshot(now = Date.now()),
  close(),
}
```

Use parameterized statements for every value. Parse JSON only inside `loadSession`, retry claiming, and health serialization boundaries.

- [ ] **Step 4: Run persistence tests**

Run: `node --test tests/bot-store.test.js`

Expected: all persistence tests PASS and no experimental warning is treated as a failure.

- [ ] **Step 5: Run the full suite**

Run: `npm.cmd test`

Expected: all existing and new tests PASS.

- [ ] **Step 6: Commit SQLite persistence**

```powershell
git add assistant/bot/store.js tests/bot-store.test.js
git commit -m "feat: persist WhatsApp bot state in SQLite"
```

---

### Task 3: Message Eligibility and Manual Takeover Rules

**Files:**
- Create: `assistant/bot/message-policy.js`
- Create: `tests/bot-message-policy.test.js`

- [ ] **Step 1: Write failing pure policy tests**

Create `tests/bot-message-policy.test.js` covering:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyIncomingMessage,
  classifyOwnMessage,
} from "../assistant/bot/message-policy.js";

test("accepts a fresh private customer message", () => {
  assert.deepEqual(
    classifyIncomingMessage({
      chatId: "628111@c.us",
      messageId: "m1",
      timestampSeconds: 950,
      nowMs: 1_000_000,
      maxAgeSeconds: 600,
      alreadyProcessed: false,
      paused: false,
    }),
    { action: "process", number: "628111" },
  );
});

for (const chatId of ["123@g.us", "status@broadcast", "news@newsletter"]) {
  test(`ignores unsupported chat ${chatId}`, () => {
    assert.equal(classifyIncomingMessage({ chatId }).action, "ignore");
  });
}

test("ignores stale, duplicate, and paused messages", () => {
  assert.equal(classifyIncomingMessage({ chatId: "1@c.us", timestampSeconds: 1, nowMs: 1_000_000, maxAgeSeconds: 10 }).reason, "stale");
  assert.equal(classifyIncomingMessage({ chatId: "1@c.us", alreadyProcessed: true }).reason, "duplicate");
  assert.equal(classifyIncomingMessage({ chatId: "1@c.us", paused: true }).reason, "manual_takeover");
});

test("known bot message does not trigger takeover", () => {
  assert.equal(classifyOwnMessage({ knownBotMessage: true }).action, "ignore");
});

test("unknown own message triggers a 24-hour takeover", () => {
  assert.deepEqual(classifyOwnMessage({ knownBotMessage: false, number: "628111" }), {
    action: "pause",
    number: "628111",
  });
});
```

- [ ] **Step 2: Verify the policy test fails**

Run: `node --test tests/bot-message-policy.test.js`

Expected: FAIL because the policy module is missing.

- [ ] **Step 3: Implement the pure policy**

`classifyIncomingMessage` must return exactly one of:

```js
{ action: "process", number }
{ action: "ignore", reason: "unsupported_chat" }
{ action: "ignore", reason: "missing_id" }
{ action: "ignore", reason: "stale" }
{ action: "ignore", reason: "duplicate" }
{ action: "ignore", reason: "manual_takeover" }
```

Normalize only IDs ending in `@c.us`. Compute age as `nowMs - timestampSeconds * 1000`. Treat absent timestamps as current only in unit-created synthetic events; production adapters must always supply a timestamp.

`classifyOwnMessage` must ignore known bot IDs and request pause for all other private own messages.

- [ ] **Step 4: Run policy and store tests**

Run: `node --test tests/bot-message-policy.test.js tests/bot-store.test.js`

Expected: all tests PASS.

- [ ] **Step 5: Commit message policy**

```powershell
git add assistant/bot/message-policy.js tests/bot-message-policy.test.js
git commit -m "feat: add WhatsApp message and takeover policy"
```

---

### Task 4: Google Sheets, Drive, Media, and Retry Sync

**Files:**
- Create: `assistant/bot/google-client.js`
- Create: `assistant/bot/sync-service.js`
- Create: `tests/bot-google-client.test.js`
- Create: `tests/bot-sync-service.test.js`

- [ ] **Step 1: Write failing Google adapter tests with fake APIs**

Test that `createGoogleClient({ sheetsApi, driveApi, spreadsheetId, rootFolderId })`:

```js
test("appends one normalized lead row", async () => {
  const calls = [];
  const client = createGoogleClient({
    sheetsApi: { spreadsheets: { values: { append: async (request) => calls.push(request) } } },
    driveApi: {},
    spreadsheetId: "sheet-1",
    rootFolderId: "folder-1",
  });

  await client.appendLead({
    created_at: "2026-06-23T00:00:00.000Z",
    status: "Baru",
    customer_name: "Ari",
    whatsapp_number: "628111",
    service_type: "Kanopi",
    location: "Gowa",
    dimensions: "3 x 4 m",
    material_or_style: "Baja ringan",
    target_time: "Bulan depan",
    email: "",
    conversation_summary: "Ringkasan",
    handoff_reason: "Selesai",
    drive_folder_url: "https://drive.google.com/drive/folders/f1",
    photo_urls: ["https://drive.google.com/file/d/p1/view"],
    source: "WhatsApp",
  });

  assert.equal(calls[0].range, "Leads!A:N");
  assert.equal(calls[0].requestBody.values[0][2], "Ari");
});
```

Also test that `uploadPhoto` creates a child folder once, uploads a stream with a generated safe filename, returns non-public Drive URLs, and never uses the untrusted incoming filename.

- [ ] **Step 2: Write failing retry service tests**

Use a fake store and fake Google client to verify:

- a Sheets failure enqueues `sync_lead`;
- a Drive failure enqueues `upload_media` with a local temporary path, not media bytes inside SQLite;
- retry attempt 1 waits 60 seconds, attempt 2 waits 5 minutes, attempt 3 waits 30 minutes, and later attempts wait 6 hours;
- a successful retry is deleted;
- errors saved to SQLite contain only error class and status code, not response bodies or credentials.

- [ ] **Step 3: Verify both new tests fail**

Run: `node --test tests/bot-google-client.test.js tests/bot-sync-service.test.js`

Expected: FAIL because both modules are missing.

- [ ] **Step 4: Implement authenticated Google clients**

In `assistant/bot/google-client.js`, construct production APIs with:

```js
import { Readable } from "node:stream";
import { google } from "googleapis";

export function createAuthenticatedGoogleApis(credentials) {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
  return {
    sheetsApi: google.sheets({ version: "v4", auth }),
    driveApi: google.drive({ version: "v3", auth }),
  };
}
```

`uploadPhoto` must accept `{ number, messageId, mimeType, bytes }`, permit only JPEG, PNG, and WebP up to 15 MB, generate the filename `${messageId}.${extension}`, and upload with `Readable.from(bytes)`. The service account folder must already be shared with the admin; do not create public permissions.

- [ ] **Step 5: Implement synchronization and bounded retries**

`createSyncService({ store, googleClient, tempDir, clock, logger })` must expose:

```js
{
  uploadCustomerPhoto(input),
  syncConfirmedLead(number, lead),
  processDueRetries(),
  removeExpiredTemporaryMedia(),
}
```

Write media to `tmp/whatsapp-bot` only while an upload is pending. Delete it after successful upload. Expire failed temporary media after seven days and retain the failure marker in SQLite.

- [ ] **Step 6: Run adapter, retry, and full tests**

Run:

```powershell
node --test tests/bot-google-client.test.js tests/bot-sync-service.test.js
npm.cmd test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit Google synchronization**

```powershell
git add assistant/bot/google-client.js assistant/bot/sync-service.js tests/bot-google-client.test.js tests/bot-sync-service.test.js
git commit -m "feat: sync WhatsApp leads and photos to Google"
```

---

### Task 5: Constrained DeepSeek Reply Composition

**Files:**
- Modify: `assistant/deepseek-adapter.js`
- Create: `assistant/bot/reply-composer.js`
- Create: `tests/bot-reply-composer.test.js`

- [ ] **Step 1: Write failing reply composer tests**

Test these cases with a fake DeepSeek completion function:

```js
test("uses a short safe rewrite", async () => {
  const result = await composeReply({
    deterministicMessages: ["Lokasi pengerjaannya di mana, Kak?"],
    customerMessage: "mau buat kanopi",
    session: { state: "location", data: { service: "kanopi" } },
    complete: async () => "Baik, Kak. Lokasi pemasangannya di daerah mana?",
  });
  assert.equal(result, "Baik, Kak. Lokasi pemasangannya di daerah mana?");
});

test("falls back when model adds a price", async () => {
  const fallback = "Admin kami akan cek kebutuhannya dulu, Kak.";
  const result = await composeReply({
    deterministicMessages: [fallback],
    complete: async () => "Harganya sekitar Rp2 juta, Kak.",
  });
  assert.equal(result, fallback);
});

test("falls back on timeout, empty output, or excessive length", async () => {
  const fallback = "Bisa dijelaskan ulang, Kak?";
  for (const complete of [
    async () => { throw new DOMException("timeout", "AbortError"); },
    async () => "",
    async () => "x".repeat(801),
  ]) {
    assert.equal(await composeReply({ deterministicMessages: [fallback], complete }), fallback);
  }
});
```

- [ ] **Step 2: Verify the composer test fails**

Run: `node --test tests/bot-reply-composer.test.js`

Expected: FAIL because `reply-composer.js` is missing.

- [ ] **Step 3: Add a safe completion primitive**

Export `requestDeepSeekCompletion({ apiKey, messages, fetchImpl, signal })` from `assistant/deepseek-adapter.js`. It must call the existing DeepSeek endpoint and return only the string content. It must never log request headers or response bodies.

- [ ] **Step 4: Implement constrained rewriting**

`composeReply` must:

- join deterministic messages as the fallback;
- skip DeepSeek when the deterministic result is a handoff or restricted reply;
- send only sanitized conversation context;
- instruct DeepSeek to preserve the same question and facts;
- reject output over 800 characters;
- reject output containing currency symbols, `Rp`, numeric price patterns, guarantees, or exact schedule promises;
- use a 10-second timeout;
- return the deterministic fallback on every failure.

The system instruction must include:

```text
Tulis ulang balasan Asisten HIJAOE agar ramah, singkat, dan natural.
Pertahankan fakta dan pertanyaan yang sama. Jangan menambah harga, jadwal,
jaminan, diskon, ketersediaan bahan, atau informasi baru. Gunakan sapaan Kak.
Balas hanya dengan teks yang akan dikirim ke pelanggan.
```

- [ ] **Step 5: Run DeepSeek, composer, and guardrail tests**

Run:

```powershell
node --test tests/assistant-deepseek.test.js tests/assistant-guardrails.test.js tests/bot-reply-composer.test.js
```

Expected: all tests PASS.

- [ ] **Step 6: Commit constrained replies**

```powershell
git add assistant/deepseek-adapter.js assistant/bot/reply-composer.js tests/bot-reply-composer.test.js
git commit -m "feat: compose guarded DeepSeek WhatsApp replies"
```

---

### Task 6: Bot Orchestrator and Existing Conversation Engine Integration

**Files:**
- Modify: `assistant/conversation-engine.js`
- Modify: `tests/assistant-flow.test.js`
- Create: `assistant/bot/orchestrator.js`
- Create: `tests/bot-orchestrator.test.js`

- [ ] **Step 1: Add a failing restored-session test**

Add to `tests/assistant-flow.test.js`:

```js
test("continues a restored session without replaying the welcome message", () => {
  const restored = {
    state: "location",
    whatsappNumber: "628111",
    data: { ...EMPTY_CUSTOMER_DATA, name: "Ari", service: "Kanopi" },
    failedUnderstanding: 0,
    handoffReason: "",
    completed: false,
  };
  const result = handleMessage(restored, "Gowa");
  assert.equal(result.session.data.location, "Gowa");
  assert.equal(result.session.state, "dimensions");
});
```

Export `EMPTY_CUSTOMER_DATA` for tests from `assistant/assistant-data.js` only if it is not already exported.

- [ ] **Step 2: Write failing orchestrator tests**

Use fake store, sync service, reply composer, and sender. Verify:

- first inbound text creates and saves a session;
- a paused contact receives no bot reply;
- duplicate IDs produce no side effects;
- a photo is uploaded and its Drive URL is fed into the photo field;
- confirmed lead sync happens once;
- handoff sends one final message and does not answer later messages;
- a manual own message pauses only its contact;
- after 24 hours a new customer message starts or resumes processing without an automatic timer message.

Expected orchestrator API:

```js
const orchestrator = createBotOrchestrator(dependencies);
await orchestrator.handleIncoming(normalizedMessage);
await orchestrator.handleOwnMessage(normalizedMessage);
```

- [ ] **Step 3: Verify the tests fail**

Run: `node --test tests/assistant-flow.test.js tests/bot-orchestrator.test.js`

Expected: restored-session test passes or exposes a compatibility defect; orchestrator test fails because the module is missing.

- [ ] **Step 4: Implement orchestration in explicit stages**

For `handleIncoming`:

```text
classify -> claim message ID -> load/create session -> upload photo if present
-> run conversation engine -> compose safe reply -> send -> record outbound ID
-> save session -> sync lead when present
```

Claim the inbound message before external calls. When a transient operation fails, save enough state for retry without marking the lead as synchronized.

For `handleOwnMessage`:

```text
ignore non-private -> check known bot ID or pending bot send
-> pause contact for 24 hours when the message is manual
```

The sender dependency must expose `sendText(number, text)` and return the WhatsApp message ID. Before calling it, register a short-lived pending send fingerprint `{ number, normalizedText, expiresAt }` so a `message_create` event that races ahead of database insertion is still recognized as automated.

- [ ] **Step 5: Run orchestration and existing assistant tests**

Run:

```powershell
node --test tests/bot-orchestrator.test.js tests/assistant-flow.test.js tests/assistant-guardrails.test.js
npm.cmd test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit orchestration**

```powershell
git add assistant/conversation-engine.js assistant/assistant-data.js assistant/bot/orchestrator.js tests/assistant-flow.test.js tests/bot-orchestrator.test.js
git commit -m "feat: orchestrate HIJAOE WhatsApp conversations"
```

---

### Task 7: WhatsApp Web Adapter

**Files:**
- Create: `assistant/bot/whatsapp-client.js`
- Create: `tests/bot-whatsapp-client.test.js`

- [ ] **Step 1: Write failing adapter tests with a fake client**

The fake client must support `.on()`, `.initialize()`, `.destroy()`, and `.sendMessage()`. Verify:

- `qr` is rendered through the injected QR renderer;
- `ready`, `authenticated`, `disconnected`, and `auth_failure` update health state;
- `message` produces a normalized incoming event;
- `message_create` with `fromMe` produces a normalized own event;
- `sendText("628111", "Halo")` calls `sendMessage("628111@c.us", "Halo")` and returns the serialized message ID;
- photo payloads are decoded only after MIME and size checks;
- raw message bodies and session data are not logged.

- [ ] **Step 2: Verify adapter tests fail**

Run: `node --test tests/bot-whatsapp-client.test.js`

Expected: FAIL because the adapter is missing.

- [ ] **Step 3: Implement the injectable adapter**

Production client construction must use:

```js
import qrcode from "qrcode-terminal";
import { Client, LocalAuth } from "whatsapp-web.js";

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "hijaoe",
    dataPath: authDir,
  }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});
```

Keep constructor injection available so unit tests never launch Chromium. Normalize messages to:

```js
{
  id,
  chatId,
  number,
  timestampSeconds,
  fromMe,
  type,
  text,
  media: null | { mimeType, bytes },
}
```

Do not store the untrusted media filename.

- [ ] **Step 4: Run adapter and policy tests**

Run: `node --test tests/bot-whatsapp-client.test.js tests/bot-message-policy.test.js`

Expected: all tests PASS without opening Chrome.

- [ ] **Step 5: Commit WhatsApp adapter**

```powershell
git add assistant/bot/whatsapp-client.js tests/bot-whatsapp-client.test.js
git commit -m "feat: connect bot through WhatsApp Web"
```

---

### Task 8: Runtime, Health Status, and Graceful Recovery

**Files:**
- Create: `assistant/bot/runtime.js`
- Create: `assistant/bot/main.js`
- Create: `assistant/bot/status.js`
- Create: `tests/bot-runtime.test.js`

- [ ] **Step 1: Write failing runtime tests**

With fake timers and fake services, verify:

- startup creates data, temp, auth, and log directories;
- WhatsApp initializes after storage and Google clients;
- retry processing runs at the configured interval without overlapping;
- `SIGINT` and `SIGTERM` stop intervals, destroy WhatsApp, and close SQLite once;
- an unhandled message error is logged in sanitized form and does not terminate the runtime;
- `getStatus()` returns connection state, last message time, and retry count without secrets.

- [ ] **Step 2: Verify runtime tests fail**

Run: `node --test tests/bot-runtime.test.js`

Expected: FAIL because runtime modules are missing.

- [ ] **Step 3: Implement dependency assembly**

`assistant/bot/main.js` must:

```js
import "dotenv/config";
import { startBotRuntime } from "./runtime.js";

startBotRuntime().catch((error) => {
  console.error(JSON.stringify({
    event: "bot_start_failed",
    name: error?.name || "Error",
    message: String(error?.message || "Bot failed to start").slice(0, 200),
  }));
  process.exitCode = 1;
});
```

`startBotRuntime` assembles config, directories, store, Google adapter, sync service, reply composer, orchestrator, and WhatsApp adapter. It registers signal handlers only in production construction, not inside test-created runtimes.

- [ ] **Step 4: Implement sanitized status output**

`npm.cmd run bot:status` must print JSON shaped as:

```json
{
  "database": "ok",
  "whatsapp": "ready",
  "lastMessageAt": "2026-06-23T10:00:00.000Z",
  "pausedContacts": 1,
  "pendingRetries": 0,
  "pendingLeads": 0
}
```

If the bot has never connected, use `"whatsapp": "unknown"`; do not claim it is ready based only on the database.

- [ ] **Step 5: Run runtime and full tests**

Run:

```powershell
node --test tests/bot-runtime.test.js
npm.cmd test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit runtime**

```powershell
git add assistant/bot/runtime.js assistant/bot/main.js assistant/bot/status.js tests/bot-runtime.test.js
git commit -m "feat: run and monitor the local WhatsApp bot"
```

---

### Task 9: Route Every Website CTA to the Bot Number

**Files:**
- Modify: `assets/js/site-data.js`
- Modify: `assistant/simulator.js`
- Modify: `tests/site-data.test.js`
- Modify: `tests/seo.test.js`
- Regenerate: all 14 `layanan/*.html` files listed in the file structure

- [ ] **Step 1: Change tests to require the new number**

Update `tests/site-data.test.js` assertions to:

```js
assert.equal(business.phoneDisplay, "0851-2150-8159");
assert.equal(business.phoneInternational, "6285121508159");
assert.equal(
  buildWhatsAppUrl("Halo HIJAOE, saya ingin konsultasi."),
  "https://wa.me/6285121508159?text=Halo%20HIJAOE%2C%20saya%20ingin%20konsultasi.",
);
```

Update the service-page conversion assertion in `tests/seo.test.js`:

```js
assert.match(html, /https:\/\/wa\.me\/6285121508159/);
assert.doesNotMatch(html, /628976010103/);
```

- [ ] **Step 2: Run tests and verify the old site data fails**

Run: `node --test tests/site-data.test.js tests/seo.test.js`

Expected: FAIL because the current website data and generated pages still contain `628976010103`.

- [ ] **Step 3: Update the source-of-truth phone data**

Set these exact values in `assets/js/site-data.js`:

```js
phoneDisplay: "0851-2150-8159",
phoneInternational: "6285121508159",
```

Change the default `whatsappNumber` in `assistant/simulator.js` to `6285121508159`. Do not alter historical design documents that describe the retired Cloud API setup.

- [ ] **Step 4: Regenerate every service page**

Run: `npm.cmd run seo:generate`

Expected: all 14 `layanan/*.html` pages are regenerated with `wa.me/6285121508159` and schema telephone `+6285121508159`.

- [ ] **Step 5: Verify deployable files contain no old WhatsApp number**

Run:

```powershell
rg -n "628976010103|0897-6010-103" assets index.html layanan assistant/simulator.js tests/site-data.test.js tests/seo.test.js
```

Expected: no matches.

- [ ] **Step 6: Run site and assistant tests**

Run:

```powershell
node --test tests/site-data.test.js tests/seo.test.js tests/assistant-simulator.test.js
npm.cmd test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit the public contact migration**

```powershell
git add assets/js/site-data.js assistant/simulator.js tests/site-data.test.js tests/seo.test.js layanan
git commit -m "fix: route website chats to the HIJAOE bot number"
```

---

### Task 10: Windows Auto-Start and Operations Guide

**Files:**
- Create: `scripts/start-whatsapp-bot.ps1`
- Create: `scripts/install-whatsapp-bot-startup.ps1`
- Create: `docs/whatsapp-web-bot-operations.md`

- [ ] **Step 1: Create the hidden launcher**

`scripts/start-whatsapp-bot.ps1` must resolve the repository root from `$PSScriptRoot`, create `logs\whatsapp-bot`, and run:

```powershell
$repo = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $repo 'logs\whatsapp-bot'
New-Item -ItemType Directory -Force -Path $logs | Out-Null
$stdout = Join-Path $logs 'stdout.log'
$stderr = Join-Path $logs 'stderr.log'

Start-Process -FilePath 'node.exe' `
  -ArgumentList 'assistant/bot/main.js' `
  -WorkingDirectory $repo `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr `
  -WindowStyle Hidden `
  -Wait
```

- [ ] **Step 2: Create a current-user scheduled task installer**

`scripts/install-whatsapp-bot-startup.ps1` must create a task named `HIJAOE WhatsApp Bot` triggered at user logon. Use a hidden PowerShell action pointing to the absolute launcher path. Set restart count to 3 and restart interval to 1 minute. Replace only a task with the exact same name.

The script must print the exact commands to inspect and remove it:

```powershell
Get-ScheduledTask -TaskName 'HIJAOE WhatsApp Bot'
Unregister-ScheduledTask -TaskName 'HIJAOE WhatsApp Bot' -Confirm:$false
```

- [ ] **Step 3: Write the operations guide**

Document these exact sections in `docs/whatsapp-web-bot-operations.md`:

1. prerequisites: Node 24, Chrome/Chromium, WhatsApp Business number `085121508159`;
2. removing the number from Meta Cloud API before registering it in WhatsApp Business;
3. `.env` variable names without example secret values;
4. service account sharing for the Sheet and Drive folder;
5. first run and QR scan;
6. internal-number smoke test;
7. installing and checking Windows auto-start;
8. checking `bot:status` and logs;
9. logout recovery and QR regeneration;
10. disabling AI by stopping the scheduled task;
11. backup of SQLite and WhatsApp auth directories while the process is stopped;
12. later VPS migration with Node 24, Chromium, 2 GB RAM, systemd, and copied encrypted backups;
13. unofficial WhatsApp Web risk and prohibition on outbound bulk messaging.

- [ ] **Step 4: Validate PowerShell syntax and documentation secrets**

Run:

```powershell
$null = [System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path 'scripts/start-whatsapp-bot.ps1'), [ref]$null, [ref]$null)
$null = [System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path 'scripts/install-whatsapp-bot-startup.ps1'), [ref]$null, [ref]$null)
rg -n "sk-[A-Za-z0-9]|private_key|Bearer [A-Za-z0-9]" docs/whatsapp-web-bot-operations.md scripts
```

Expected: parser commands produce no error; secret scan produces no matches.

- [ ] **Step 5: Commit operational setup**

```powershell
git add scripts/start-whatsapp-bot.ps1 scripts/install-whatsapp-bot-startup.ps1 docs/whatsapp-web-bot-operations.md
git commit -m "docs: add WhatsApp bot Windows operations"
```

---

### Task 11: Local End-to-End Readiness and Controlled Launch

**Files:**
- Modify: `docs/whatsapp-web-bot-operations.md`
- Test: all `tests/bot-*.test.js`

- [ ] **Step 1: Run static and automated verification**

Run:

```powershell
npm.cmd test
git diff --check
git status --short
```

Expected: all tests PASS, no whitespace errors, and only intentional runtime files are ignored. Existing untracked user directories remain untouched.

- [ ] **Step 2: Verify ignored runtime paths**

Run:

```powershell
git check-ignore -v .env data/whatsapp-bot/session.sqlite logs/whatsapp-bot/stdout.log tmp/whatsapp-bot/photo.jpg .wwebjs_auth/session-hijaoe
```

Expected: every path is reported as ignored by `.gitignore`.

- [ ] **Step 3: Start the bot manually and scan QR**

Run: `npm.cmd run bot:start`

Expected: a QR appears on first run, then sanitized events report `authenticated` and `ready`. No secret or complete customer message appears in output.

- [ ] **Step 4: Perform the internal-number smoke test**

From a separate internal WhatsApp number:

1. send `Halo` and confirm the bot identifies itself;
2. answer each required question;
3. send one JPEG photo under 15 MB;
4. confirm the summary;
5. verify exactly one Sheets row and one private Drive file;
6. send a manual admin reply from WhatsApp Business;
7. send another customer message and verify no AI reply during takeover;
8. temporarily set `BOT_TAKEOVER_HOURS=0.01`, restart, wait longer than 36 seconds, and send a new customer message;
9. verify AI resumes only after the new customer message;
10. restore `BOT_TAKEOVER_HOURS=24`.

- [ ] **Step 5: Verify restart persistence**

Stop the bot during an incomplete internal conversation, restart it, and send the next answer. Expected: the conversation continues from the saved field without repeating the welcome message.

- [ ] **Step 6: Verify retry behavior without losing data**

Temporarily replace the Google spreadsheet ID with an invalid test value, finish an internal lead, and verify a retry is visible in `npm.cmd run bot:status`. Restore the correct ID, restart or wait for retry, and verify the lead syncs once.

- [ ] **Step 7: Install auto-start only after the smoke test passes**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install-whatsapp-bot-startup.ps1
```

Log out and back in. Expected: the scheduled task is running, WhatsApp reconnects without a new QR, and `npm.cmd run bot:status` reports `whatsapp: ready` after startup.

- [ ] **Step 8: Record launch evidence and final operational state**

Append a dated checklist to `docs/whatsapp-web-bot-operations.md` containing only pass/fail results and non-sensitive IDs such as the spreadsheet tab name. Do not record tokens, service-account JSON, customer phone numbers, or chat contents.

- [ ] **Step 9: Commit launch documentation**

```powershell
git add docs/whatsapp-web-bot-operations.md
git commit -m "test: document WhatsApp bot launch verification"
```

---

## Final Acceptance Checklist

- [ ] The bot starts through the Windows scheduled task and reconnects after login.
- [ ] The number `085121508159` remains usable in the WhatsApp Business mobile app.
- [ ] Every public website WhatsApp CTA and service schema uses `6285121508159`.
- [ ] Bot and manual replies both appear in the same customer chat history.
- [ ] A manual reply pauses only that contact for 24 hours.
- [ ] The timer expiry sends nothing until the customer writes again.
- [ ] Confirmed leads are written exactly once to Google Sheets.
- [ ] JPEG, PNG, and WebP customer photos are privately stored in Google Drive.
- [ ] Sessions, deduplication, retries, and takeover state survive restart.
- [ ] DeepSeek failures fall back without losing conversation state.
- [ ] Groups, status, broadcasts, stale messages, and duplicate events are ignored.
- [ ] No bot secret, WhatsApp session, SQLite database, media, or customer content is tracked by Git.
- [ ] Existing website and Cloudflare Pages deployment continue to pass their tests.
