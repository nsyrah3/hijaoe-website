import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createBotRuntime } from "../assistant/bot/runtime.js";

test("startup creates directories and initializes WhatsApp", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "hijaoe-runtime-"));
  const initialized = [];
  const runtime = createBotRuntime({
    directories: [
      path.join(root, "data"),
      path.join(root, "tmp"),
      path.join(root, "auth"),
      path.join(root, "logs"),
    ],
    whatsapp: {
      async initialize() {
        initialized.push("whatsapp");
      },
      async destroy() {},
    },
    syncService: {
      async processDueRetries() {},
      async removeExpiredTemporaryMedia() {},
    },
    store: {
      getHealthSnapshot: () => ({ database: "ok", whatsapp: "unknown" }),
      close() {},
    },
    setIntervalImpl: () => 1,
    clearIntervalImpl() {},
    logger: { info() {}, warn() {}, error() {} },
  });

  await runtime.start();

  assert.deepEqual(initialized, ["whatsapp"]);
  await access(path.join(root, "data"));
  await access(path.join(root, "tmp"));
  await runtime.stop();
});

test("retry ticks never overlap", async () => {
  let intervalHandler;
  let release;
  const running = new Promise((resolve) => {
    release = resolve;
  });
  let calls = 0;
  const runtime = createBotRuntime({
    directories: [],
    whatsapp: { async initialize() {}, async destroy() {} },
    syncService: {
      async processDueRetries() {
        calls += 1;
        await running;
      },
      async removeExpiredTemporaryMedia() {},
    },
    store: {
      getHealthSnapshot: () => ({ database: "ok" }),
      close() {},
    },
    setIntervalImpl(handler) {
      intervalHandler = handler;
      return 1;
    },
    clearIntervalImpl() {},
    logger: { info() {}, warn() {}, error() {} },
  });

  await runtime.start();
  const first = intervalHandler();
  const second = intervalHandler();
  assert.equal(calls, 1);
  release();
  await Promise.all([first, second]);
  await runtime.stop();
});

test("stop destroys WhatsApp and closes the store only once", async () => {
  let destroyed = 0;
  let closed = 0;
  const runtime = createBotRuntime({
    directories: [],
    whatsapp: {
      async initialize() {},
      async destroy() {
        destroyed += 1;
      },
    },
    syncService: {
      async processDueRetries() {},
      async removeExpiredTemporaryMedia() {},
    },
    store: {
      getHealthSnapshot: () => ({ database: "ok" }),
      close() {
        closed += 1;
      },
    },
    setIntervalImpl: () => 1,
    clearIntervalImpl() {},
    logger: { info() {}, warn() {}, error() {} },
  });

  await runtime.start();
  await runtime.stop();
  await runtime.stop();

  assert.equal(destroyed, 1);
  assert.equal(closed, 1);
});

test("status delegates to the sanitized store snapshot", () => {
  const expected = {
    database: "ok",
    whatsapp: "ready",
    lastMessageAt: "2026-06-23T10:00:00.000Z",
    pausedContacts: 1,
    pendingRetries: 0,
    pendingLeads: 0,
  };
  const runtime = createBotRuntime({
    directories: [],
    whatsapp: { async initialize() {}, async destroy() {} },
    syncService: {
      async processDueRetries() {},
      async removeExpiredTemporaryMedia() {},
    },
    store: {
      getHealthSnapshot: () => expected,
      close() {},
    },
    logger: { info() {}, warn() {}, error() {} },
  });

  assert.deepEqual(runtime.getStatus(), expected);
});
