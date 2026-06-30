# HIJAOE WhatsApp DeepSeek-Led Conversation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace rigid template-led WhatsApp replies with a DeepSeek-led conversation loop that can understand multi-message customer chats while programmatic guardrails still block prices, exact schedule promises, and unsafe claims.

**Architecture:** Add a focused `assistant/bot/deepseek-conversation.js` module that asks DeepSeek for strict JSON containing reply text, lead field updates, state, and handoff intent. Keep WhatsApp orchestration, SQLite persistence, media upload, retry, Google sync, idempotency, and manual takeover in existing bot modules. Add message batching in `orchestrator.js` so customer messages sent within a 7-second window are handled as one context.

**Tech Stack:** Node.js 24 ESM, Node test runner, existing DeepSeek completion helper, SQLite store, whatsapp-web.js adapter.

---

## File Structure

- Create `assistant/bot/deepseek-conversation.js`: DeepSeek JSON prompt, output validation, guardrails, lead/session update, fallback.
- Create `tests/bot-deepseek-conversation.test.js`: unit tests for extraction, fallback, restricted output, and confirmation.
- Modify `assistant/bot/orchestrator.js`: add optional message batching and optional `runConversation` dependency.
- Modify `tests/bot-orchestrator.test.js`: cover batching of multiple customer messages into one conversation call.
- Modify `assistant/bot/runtime.js`: wire production runtime to DeepSeek-led conversation and pass 7-second batch window.
- Modify `assistant/bot/config.js`: add `BOT_BATCH_WINDOW_MS` defaulting to `7000`.
- Modify `.env.example`: document `BOT_BATCH_WINDOW_MS=7000`.
- Modify `tests/bot-config.test.js`: verify batch window default.

---

### Task 1: DeepSeek Conversation Module

**Files:**
- Create: `assistant/bot/deepseek-conversation.js`
- Create: `tests/bot-deepseek-conversation.test.js`

- [ ] **Step 1: Write failing DeepSeek conversation tests**

Create tests that call:

```js
const result = await runDeepSeekConversation({
  session: createSession("628111"),
  messages: ["saya mau meja sekolah", "untuk daerah gowa"],
  complete: async () => JSON.stringify({
    reply: "Siap Kak, meja sekolah untuk Gowa ya. Ada ukuran atau jumlah meja yang dibutuhkan?",
    dataPatch: { service: "Meja sekolah", location: "Gowa" },
    state: "active",
    readyToConfirm: false,
    handoff: false,
    handoffReason: "",
    historySummary: "Pelanggan butuh meja sekolah di Gowa.",
  }),
});

assert.equal(result.replyIsFinal, true);
assert.equal(result.session.data.service, "Meja sekolah");
assert.equal(result.session.data.location, "Gowa");
assert.match(result.messages[0], /ukuran|jumlah/i);
```

Add tests for:

```js
complete: async () => "{"
```

Expected fallback:

```text
Maaf Kak, boleh dikirim ulang singkat kebutuhannya? Nanti saya catat untuk admin.
```

Add tests where DeepSeek returns `reply: "Harganya Rp2 juta"` and `reply: "Saya bot HIJAOE"`; both must return fallback or handoff without sending the restricted text.

Add confirmation test: when session state is `confirming` and customer says `ya`, `runDeepSeekConversation` returns `lead` and moves session to `handoff`.

- [ ] **Step 2: Run tests and verify missing module failure**

Run:

```powershell
node --test tests/bot-deepseek-conversation.test.js
```

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement `runDeepSeekConversation`**

Implement exports:

```js
export async function runDeepSeekConversation({ session, messages, complete, now = new Date() })
export function buildConversationMessages({ session, messages })
export function normalizeDeepSeekConversationOutput(raw)
```

`runDeepSeekConversation` returns the existing orchestrator shape:

```js
{ session, messages: [reply], lead: null, replyIsFinal: true }
```

For confirmed sessions, return:

```js
{ session: nextSession, messages: [COMPLETION_MESSAGE, HANDOFF_MESSAGE], lead: buildLead(nextSession, now), replyIsFinal: true }
```

Use only allowed data patch keys: `name`, `service`, `location`, `dimensions`, `material`, `targetTime`, `photoReferences`, `email`, `emailMarketingConsent`.

- [ ] **Step 4: Run DeepSeek conversation tests**

Run:

```powershell
node --test tests/bot-deepseek-conversation.test.js
```

Expected: PASS.

---

### Task 2: Buffered Orchestration

**Files:**
- Modify: `assistant/bot/orchestrator.js`
- Modify: `tests/bot-orchestrator.test.js`

- [ ] **Step 1: Add failing batching test**

Add a test that creates `createBotOrchestrator({ batchWindowMs: 7000, runConversation })`, sends two messages for the same number, verifies both return `{ action: "queued" }`, calls `await orchestrator.flushPending("628111")`, and asserts:

```js
assert.equal(state.sent.length, 1);
assert.deepEqual(capturedMessages, [
  "saya mau meja sekolah",
  "untuk daerah gowa",
]);
```

- [ ] **Step 2: Run orchestrator tests and verify failure**

Run:

```powershell
node --test tests/bot-orchestrator.test.js
```

Expected: FAIL because batching and `flushPending` do not exist.

- [ ] **Step 3: Refactor incoming processing into a batch function**

Keep immediate behavior when `batchWindowMs` is `0`. Add dependencies:

```js
runConversation,
batchWindowMs = 0,
setTimeoutImpl = setTimeout,
clearTimeoutImpl = clearTimeout,
```

Default `runConversation` should call the old `handleMessage` so existing tests keep working.

- [ ] **Step 4: Add batch queue**

Store pending batches per number. Claim each inbound message immediately. For buffered mode, append normalized message to the pending batch, reset the timer, and return `{ action: "queued" }`.

Expose:

```js
async flushPending(number)
```

for tests and timer callbacks.

- [ ] **Step 5: Run orchestrator tests**

Run:

```powershell
node --test tests/bot-orchestrator.test.js
```

Expected: PASS.

---

### Task 3: Runtime Wiring and Config

**Files:**
- Modify: `assistant/bot/config.js`
- Modify: `assistant/bot/runtime.js`
- Modify: `.env.example`
- Modify: `tests/bot-config.test.js`

- [ ] **Step 1: Add failing config test**

Update `tests/bot-config.test.js`:

```js
assert.equal(config.batchWindowMs, 7000);
```

- [ ] **Step 2: Implement config default**

In `assistant/bot/config.js` add:

```js
batchWindowMs: nonNegativeNumber(env.BOT_BATCH_WINDOW_MS, 7000),
```

In `.env.example` add:

```env
BOT_BATCH_WINDOW_MS=7000
```

- [ ] **Step 3: Wire runtime**

In `assistant/bot/runtime.js`, import `runDeepSeekConversation` and pass:

```js
runConversation: ({ session, messages, now }) =>
  runDeepSeekConversation({
    session,
    messages,
    now,
    complete: ({ messages, signal }) =>
      requestDeepSeekCompletion({
        apiKey: config.secrets.deepseekApiKey,
        baseUrl: config.deepseekBaseUrl,
        model: config.deepseekModel,
        messages,
        signal,
      }),
  }),
batchWindowMs: config.batchWindowMs,
```

- [ ] **Step 4: Run config and runtime tests**

Run:

```powershell
node --test tests/bot-config.test.js tests/bot-runtime.test.js
```

Expected: PASS.

---

### Task 4: Full Verification

**Files:**
- Test only.

- [ ] **Step 1: Run focused tests**

Run:

```powershell
node --test tests/bot-deepseek-conversation.test.js tests/bot-orchestrator.test.js tests/bot-config.test.js tests/bot-runtime.test.js
```

Expected: PASS.

- [ ] **Step 2: Run full suite**

Run:

```powershell
npm.cmd test
```

Expected: all tests PASS.

- [ ] **Step 3: Verify scope**

Run:

```powershell
git diff -- assistant tests .env.example docs/superpowers/plans/2026-06-30-hijaoe-whatsapp-deepseek-led-conversation.md
```

Expected: diff only contains DeepSeek-led conversation, batching, config, tests, and this plan.
