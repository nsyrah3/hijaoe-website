import assert from "node:assert/strict";
import test from "node:test";
import { createWhatsAppClient } from "../assistant/bot/whatsapp-client.js";

function createFakeClient() {
  const handlers = new Map();
  const sends = [];

  return {
    handlers,
    sends,
    initialized: 0,
    destroyed: 0,
    on(event, handler) {
      handlers.set(event, handler);
    },
    async initialize() {
      this.initialized += 1;
    },
    async destroy() {
      this.destroyed += 1;
    },
    async sendMessage(chatId, text) {
      sends.push({ chatId, text });
      return { id: { _serialized: "sent-1" } };
    },
    async getContactLidAndPhone(ids) {
      return ids.map((id) => ({
        lid: id,
        pn: "628111@c.us",
      }));
    },
  };
}

test("renders QR and tracks connection health", async () => {
  const client = createFakeClient();
  const qr = [];
  const health = [];
  createWhatsAppClient({
    client,
    qrRenderer: (value) => qr.push(value),
    onHealth: (state) => health.push(state),
    setTimeoutImpl: () => 1,
    logger: { info() {}, warn() {}, error() {} },
  });

  await client.handlers.get("qr")("qr-value");
  await client.handlers.get("authenticated")();
  await client.handlers.get("ready")();
  await client.handlers.get("disconnected")("logout");

  assert.deepEqual(qr, ["qr-value"]);
  assert.deepEqual(health, [
    "qr_pending",
    "authenticated",
    "ready",
    "disconnected",
  ]);
});

test("schedules only one reconnect after a disconnect", async () => {
  const client = createFakeClient();
  const scheduled = [];
  const adapter = createWhatsAppClient({
    client,
    reconnectDelayMs: 15_000,
    setTimeoutImpl(handler, delay) {
      scheduled.push({ handler, delay });
      return scheduled.length;
    },
    clearTimeoutImpl() {},
    logger: { info() {}, warn() {}, error() {} },
  });

  await client.handlers.get("disconnected")("navigation");
  await client.handlers.get("disconnected")("navigation");

  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].delay, 15_000);

  await scheduled[0].handler();
  assert.equal(client.initialized, 1);
  await adapter.destroy();
});

test("normalizes incoming and own messages", async () => {
  const client = createFakeClient();
  const incoming = [];
  const own = [];
  createWhatsAppClient({
    client,
    onIncoming: async (message) => incoming.push(message),
    onOwn: async (message) => own.push(message),
    logger: { info() {}, warn() {}, error() {} },
  });

  const raw = {
    id: { _serialized: "m1" },
    from: "628111@c.us",
    to: "6285121508159@c.us",
    fromMe: false,
    timestamp: 123,
    type: "chat",
    body: "Halo",
    hasMedia: false,
  };
  await client.handlers.get("message")(raw);
  await client.handlers.get("message_create")({
    ...raw,
    id: { _serialized: "m2" },
    from: "6285121508159@c.us",
    to: "628111@c.us",
    fromMe: true,
    body: "Balasan admin",
  });

  assert.deepEqual(incoming[0], {
    id: "m1",
    chatId: "628111@c.us",
    number: "628111",
    timestampSeconds: 123,
    fromMe: false,
    type: "chat",
    text: "Halo",
    media: null,
  });
  assert.equal(own[0].id, "m2");
  assert.equal(own[0].number, "628111");
});

test("resolves LID chats to a phone number and keeps the LID reply target", async () => {
  const client = createFakeClient();
  const incoming = [];
  createWhatsAppClient({
    client,
    onIncoming: async (message) => incoming.push(message),
    logger: { info() {}, warn() {}, error() {} },
  });

  await client.handlers.get("message")({
    id: { _serialized: "lid-1" },
    from: "100000000000001@lid",
    to: "6285121508159@c.us",
    fromMe: false,
    timestamp: 123,
    type: "chat",
    body: "Halo",
    hasMedia: false,
  });

  assert.equal(incoming[0].number, "628111");
  assert.equal(incoming[0].chatId, "100000000000001@lid");
});

test("sendText targets a private WhatsApp chat", async () => {
  const client = createFakeClient();
  const adapter = createWhatsAppClient({
    client,
    logger: { info() {}, warn() {}, error() {} },
  });

  assert.equal(await adapter.sendText("628111", "Halo"), "sent-1");
  assert.deepEqual(client.sends, [
    { chatId: "628111@c.us", text: "Halo" },
  ]);

  await adapter.sendText("628111", "Halo LID", "100000000000001@lid");
  assert.deepEqual(client.sends[1], {
    chatId: "100000000000001@lid",
    text: "Halo LID",
  });
});

test("downloads only supported media under 15 MB", async () => {
  const client = createFakeClient();
  const incoming = [];
  createWhatsAppClient({
    client,
    onIncoming: async (message) => incoming.push(message),
    logger: { info() {}, warn() {}, error() {} },
  });

  await client.handlers.get("message")({
    id: { _serialized: "photo-1" },
    from: "628111@c.us",
    fromMe: false,
    timestamp: 123,
    type: "image",
    body: "",
    hasMedia: true,
    downloadMedia: async () => ({
      mimetype: "image/jpeg",
      data: Buffer.from("photo").toString("base64"),
      filename: "../../unsafe.jpg",
    }),
  });

  assert.equal(incoming[0].media.mimeType, "image/jpeg");
  assert.equal(incoming[0].media.bytes.toString(), "photo");
  assert.equal("filename" in incoming[0].media, false);
});

test("adapter lifecycle delegates to the client", async () => {
  const client = createFakeClient();
  const adapter = createWhatsAppClient({
    client,
    logger: { info() {}, warn() {}, error() {} },
  });

  await adapter.initialize();
  await adapter.destroy();

  assert.equal(client.initialized, 1);
  assert.equal(client.destroyed, 1);
});
