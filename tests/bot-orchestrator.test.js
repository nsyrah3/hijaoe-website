import assert from "node:assert/strict";
import test from "node:test";
import { createSession } from "../assistant/conversation-engine.js";
import { createBotOrchestrator } from "../assistant/bot/orchestrator.js";

function createHarness(overrides = {}) {
  const state = {
    sessions: new Map(),
    processed: new Set(),
    botOutbound: new Set(),
    pausedUntil: new Map(),
    sent: [],
    leads: [],
    uploads: [],
  };
  const store = {
    loadSession: (number) => state.sessions.get(number) || null,
    saveSession: (number, session) => state.sessions.set(number, session),
    hasInboundMessage: (id) => state.processed.has(id),
    claimInboundMessage: (id) => {
      if (state.processed.has(id)) return false;
      state.processed.add(id);
      return true;
    },
    isPaused: (number, now) => (state.pausedUntil.get(number) || 0) > now,
    getPauseUntil: (number) => state.pausedUntil.get(number) || null,
    clearPause: (number) => state.pausedUntil.delete(number),
    recordBotOutbound: (id) => state.botOutbound.add(id),
    isBotOutbound: (id) => state.botOutbound.has(id),
    pauseContact: (number, now, hours) => {
      const until = now + hours * 3_600_000;
      state.pausedUntil.set(number, until);
      return until;
    },
    setRuntimeHealth() {},
  };
  const sender = overrides.sender || {
    async sendText(number, text) {
      const id = `bot-${state.sent.length + 1}`;
      state.sent.push({ number, text, id });
      return id;
    },
  };
  const syncService = {
    async uploadCustomerPhoto(input) {
      state.uploads.push(input);
      return {
        ok: true,
        driveUrl: "https://drive.google.com/file/d/photo/view",
        driveFolderUrl: "https://drive.google.com/drive/folders/folder",
      };
    },
    async syncConfirmedLead(number, lead) {
      state.leads.push({ number, lead });
      return { ok: true };
    },
  };
  const clock = overrides.clock || (() => 1_000_000);
  const orchestrator = createBotOrchestrator({
    store,
    sender,
    syncService,
    composeReply:
      overrides.composeReply ||
      (async ({ deterministicMessages }) => deterministicMessages.join("\n\n")),
    clock,
    maxMessageAgeSeconds: 600,
    takeoverHours: 24,
    replyDelayMs: 0,
    logger: { warn() {}, error() {}, info() {} },
  });

  return { orchestrator, state, store, sender, syncService };
}

function incoming(overrides = {}) {
  return {
    id: "m1",
    chatId: "628111@c.us",
    number: "628111",
    timestampSeconds: 1000,
    fromMe: false,
    type: "chat",
    text: "Halo",
    media: null,
    ...overrides,
  };
}

test("first inbound message creates and saves a session", async () => {
  const { orchestrator, state } = createHarness();

  const result = await orchestrator.handleIncoming(incoming());

  assert.equal(result.action, "replied");
  assert.equal(state.sessions.get("628111").state, "service");
  assert.equal(state.sent.length, 1);
  assert.doesNotMatch(state.sent[0].text, /Asisten|AI|bot/i);
  assert.match(state.sent[0].text, /bikin|kerjakan|buat/i);
});

test("paused and duplicate messages produce no side effects", async () => {
  const { orchestrator, state } = createHarness();
  state.pausedUntil.set("628111", 2_000_000);

  assert.equal(
    (await orchestrator.handleIncoming(incoming())).reason,
    "manual_takeover",
  );
  assert.equal(state.sent.length, 0);

  state.pausedUntil.clear();
  state.processed.add("m2");
  assert.equal(
    (await orchestrator.handleIncoming(incoming({ id: "m2" }))).reason,
    "duplicate",
  );
  assert.equal(state.sent.length, 0);
});

test("photo upload URL is stored in the photo field", async () => {
  const { orchestrator, state } = createHarness();
  state.sessions.set("628111", {
    ...createSession("628111"),
    state: "photo",
    data: {
      ...createSession("628111").data,
      name: "Ari",
      service: "Kanopi",
      location: "Gowa",
    },
  });

  await orchestrator.handleIncoming(
    incoming({
      id: "photo-1",
      type: "image",
      text: "",
      media: { mimeType: "image/jpeg", bytes: Buffer.from("photo") },
    }),
  );

  assert.equal(state.uploads.length, 1);
  assert.match(
    state.sessions.get("628111").data.photoReferences,
    /drive\.google\.com/,
  );
});

test("confirmed lead is synchronized exactly once", async () => {
  const { orchestrator, state } = createHarness();
  state.sessions.set("628111", {
    ...createSession("628111"),
    state: "confirmation",
    data: {
      ...createSession("628111").data,
      name: "Ari",
      service: "Kanopi",
      location: "Gowa",
    },
  });

  await orchestrator.handleIncoming(incoming({ id: "confirm-1", text: "ya" }));
  await orchestrator.handleIncoming(incoming({ id: "confirm-1", text: "ya" }));

  assert.equal(state.leads.length, 1);
  assert.equal(state.sessions.get("628111").state, "handoff");
});

test("confirmed lead retains previously uploaded photo URLs", async () => {
  const { orchestrator, state } = createHarness();
  state.sessions.set("628111", {
    ...createSession("628111"),
    state: "confirmation",
    data: {
      ...createSession("628111").data,
      name: "Ari",
      service: "Kanopi",
      location: "Gowa",
      photoReferences: "https://drive.google.com/file/d/photo/view",
    },
  });

  await orchestrator.handleIncoming(incoming({ id: "confirm-photo", text: "ya" }));

  assert.deepEqual(state.leads[0].lead.photo_urls, [
    "https://drive.google.com/file/d/photo/view",
  ]);
});

test("does not advance the saved session when sending the reply fails", async () => {
  const { orchestrator, state } = createHarness({
    sender: {
      async sendText() {
        throw new Error("WhatsApp unavailable");
      },
    },
  });

  const result = await orchestrator.handleIncoming(incoming());

  assert.equal(result.action, "error");
  assert.equal(state.sessions.has("628111"), false);
});

test("starts a fresh conversation after an expired manual takeover handoff", async () => {
  const { orchestrator, state } = createHarness();
  state.pausedUntil.set("628111", 900_000);
  state.sessions.set("628111", {
    ...createSession("628111"),
    state: "handoff",
    handoffReason: "Pelanggan meminta admin manusia",
  });

  const result = await orchestrator.handleIncoming(
    incoming({ id: "after-takeover", text: "Halo lagi" }),
  );

  assert.equal(result.action, "replied");
  assert.equal(state.sessions.get("628111").state, "service");
  assert.equal(state.pausedUntil.has("628111"), false);
  assert.doesNotMatch(state.sent[0].text, /Asisten|AI|bot/i);
  assert.match(state.sent[0].text, /bikin|kerjakan|buat/i);
});

test("manual own message pauses only that contact for 24 hours", async () => {
  const { orchestrator, state } = createHarness();

  const result = await orchestrator.handleOwnMessage({
    id: "manual-1",
    chatId: "628111@c.us",
    number: "628111",
    fromMe: true,
    text: "Saya ambil alih",
  });

  assert.equal(result.action, "paused");
  assert.equal(state.pausedUntil.get("628111"), 1_000_000 + 86_400_000);
  assert.equal(state.pausedUntil.has("628222"), false);
});

test("recorded bot own message does not trigger takeover", async () => {
  const { orchestrator, state } = createHarness();
  state.botOutbound.add("bot-1");

  const result = await orchestrator.handleOwnMessage({
    id: "bot-1",
    chatId: "628111@c.us",
    number: "628111",
    fromMe: true,
    text: "Balasan bot",
  });

  assert.equal(result.action, "ignored");
  assert.equal(state.pausedUntil.has("628111"), false);
});
