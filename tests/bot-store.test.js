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
  assert.equal(store.getPauseUntil("628111"), 1_000 + 24 * 3_600_000);
  store.clearPause("628111");
  assert.equal(store.getPauseUntil("628111"), null);
  store.close();
});

test("bot outbound IDs are distinguishable from manual replies", () => {
  const store = makeStore();
  store.recordBotOutbound("bot-message-1", "628111", 1000);
  assert.equal(store.isBotOutbound("bot-message-1"), true);
  assert.equal(store.isBotOutbound("manual-message-1"), false);
  store.close();
});

test("health snapshot reports pending work without exposing content", () => {
  const store = makeStore();
  store.pauseContact("628111", 1000, 24);
  store.saveLead("628111", { customer_name: "Ari" }, 1000);
  store.enqueueRetry("sync_lead", { number: "628111" }, 1000);

  assert.deepEqual(store.getHealthSnapshot(2000), {
    database: "ok",
    pausedContacts: 1,
    pendingRetries: 1,
    pendingLeads: 1,
    lastMessageAt: null,
    whatsapp: "unknown",
  });
  store.close();
});
