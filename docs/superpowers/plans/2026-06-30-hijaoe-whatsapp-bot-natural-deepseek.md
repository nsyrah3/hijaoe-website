# HIJAOE WhatsApp Bot Natural DeepSeek Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the WhatsApp bot ask for project needs first, move the customer name near the end, and use DeepSeek to write normal replies in a natural admin style while the deterministic engine keeps control of the flow and guardrails.

**Architecture:** Keep `conversation-engine.js` as the source of truth for state, field order, validation, lead creation, and handoff. Update `assistant-data.js` to define the new field order and fallback prompts. Strengthen `reply-composer.js` so DeepSeek acts as an admin-style writer and its output is rejected when it mentions AI/bot/asisten, price, exact schedule promises, or unsupported business claims.

**Tech Stack:** Node.js 24 ESM, Node test runner, DeepSeek adapter through the existing `composeReply` dependency.

---

## File Structure

- Modify `assistant/assistant-data.js`: change opening, handoff/completion wording, field order, and fallback prompts.
- Modify `assistant/conversation-engine.js`: start on the first field dynamically and keep summary/lead structure compatible.
- Modify `assistant/bot/reply-composer.js`: update DeepSeek system instruction and output guardrails.
- Modify `tests/assistant-flow.test.js`: assert new field order and lead behavior.
- Modify `tests/bot-orchestrator.test.js`: assert the first outbound text no longer mentions `Asisten HIJAOE` and asks about work first.
- Modify `tests/bot-reply-composer.test.js`: assert DeepSeek admin wording is accepted and AI/bot wording is rejected.

---

### Task 1: New Conversation Order and Fallback Copy

**Files:**
- Modify: `assistant/assistant-data.js`
- Modify: `assistant/conversation-engine.js`
- Modify: `tests/assistant-flow.test.js`
- Modify: `tests/bot-orchestrator.test.js`

- [ ] **Step 1: Update failing tests for the new first message**

In `tests/assistant-flow.test.js`, change the opening test to expect:

```js
assert.equal(result.session.state, "service");
assert.deepEqual(result.messages, [
  "Halo Kak, bisa. Mau bikin atau kerjakan apa?",
]);
```

In `tests/bot-orchestrator.test.js`, change the first inbound assertion to:

```js
assert.doesNotMatch(state.sent[0].text, /Asisten|AI|bot/i);
assert.match(state.sent[0].text, /bikin|kerjakan|buat/i);
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```powershell
node --test tests/assistant-flow.test.js tests/bot-orchestrator.test.js
```

Expected: FAIL because the engine still starts at `name` and the opening still mentions `Asisten HIJAOE`.

- [ ] **Step 3: Reorder the field definitions**

In `assistant/assistant-data.js`, set:

```js
export const OPENING_MESSAGE =
  "Halo Kak, bisa. Mau bikin atau kerjakan apa?";

export const HANDOFF_MESSAGE =
  "Siap Kak, saya teruskan ke admin HIJAOE biar dicek lanjut.";

export const COMPLETION_MESSAGE =
  "Siap Kak, sudah saya catat. Admin nanti cek detailnya dulu ya.";
```

Make `FIELD_DEFINITIONS` start with `service`, then `location`, `dimensions`, `material`, `target_time`, `photo`, `name`, `email`, and `marketing_consent`. Use the prompt:

```js
{
  state: "name",
  key: "name",
  label: "Nama",
  prompt: "Boleh tahu nama Kakak untuk catatan admin?",
  required: true,
}
```

- [ ] **Step 4: Start conversations on the first field**

In `assistant/conversation-engine.js`, change `startConversation` so it uses the first field instead of hardcoding `name`:

```js
const firstField = FIELD_DEFINITIONS[0];
return {
  session: {
    ...session,
    state: firstField.state,
  },
  messages: [OPENING_MESSAGE],
  lead: null,
};
```

- [ ] **Step 5: Run focused flow tests**

Run:

```powershell
node --test tests/assistant-flow.test.js tests/bot-orchestrator.test.js
```

Expected: PASS after updating all assertions that depended on the old field order.

---

### Task 2: DeepSeek Admin-Style Reply Composer

**Files:**
- Modify: `assistant/bot/reply-composer.js`
- Modify: `tests/bot-reply-composer.test.js`

- [ ] **Step 1: Add failing guardrail tests**

In `tests/bot-reply-composer.test.js`, add coverage that:

```js
assert.equal(
  await composeReply({
    deterministicMessages: ["Halo Kak, bisa. Mau bikin atau kerjakan apa?"],
    session: { state: "service", data: {} },
    complete: async () => "Halo Kak, boleh. Mau bikin apa?",
  }),
  "Halo Kak, boleh. Mau bikin apa?",
);
```

Also add a loop where outputs containing `saya asisten`, `bot HIJAOE`, `AI`, `Rp2 juta`, and `pasti selesai hari Senin` all return the deterministic fallback.

- [ ] **Step 2: Run composer tests and verify they fail**

Run:

```powershell
node --test tests/bot-reply-composer.test.js
```

Expected: FAIL until the new AI/bot/asisten guardrail is added.

- [ ] **Step 3: Update composer instruction and guardrail**

In `assistant/bot/reply-composer.js`, add restricted patterns for:

```js
/\b(?:ai|bot|asisten|assistant)\b/i
```

Update the system instruction to say:

```text
Tulis sebagai admin HIJAOE yang membalas WhatsApp pelanggan.
Bahasa Indonesia sehari-hari, singkat, sopan, dan natural.
Jaga maksud dan satu pertanyaan yang sama.
Jangan menyebut AI, bot, asisten, sistem, template, atau otomasi.
Jangan menambah harga, jadwal, jaminan, diskon, ketersediaan bahan, atau informasi baru.
Balas hanya dengan teks yang akan dikirim ke pelanggan.
```

- [ ] **Step 4: Run composer tests**

Run:

```powershell
node --test tests/bot-reply-composer.test.js
```

Expected: PASS.

---

### Task 3: Full Verification

**Files:**
- Test only.

- [ ] **Step 1: Run bot and assistant tests**

Run:

```powershell
node --test tests/assistant-flow.test.js tests/assistant-guardrails.test.js tests/bot-orchestrator.test.js tests/bot-reply-composer.test.js
```

Expected: PASS.

- [ ] **Step 2: Run the full suite**

Run:

```powershell
npm.cmd test
```

Expected: all tests PASS.

- [ ] **Step 3: Check diff scope**

Run:

```powershell
git diff -- assistant tests docs/superpowers/plans/2026-06-30-hijaoe-whatsapp-bot-natural-deepseek.md
```

Expected: diff only covers the natural bot flow, DeepSeek composer guardrails, tests, and this plan.
