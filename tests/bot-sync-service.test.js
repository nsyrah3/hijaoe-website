import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createSyncService,
  retryDelayMs,
  sanitizeExternalError,
} from "../assistant/bot/sync-service.js";

function createFakeStore() {
  return {
    leads: [],
    media: [],
    retries: [],
    completed: [],
    rescheduled: [],
    saveLead(number, lead, now, status) {
      this.leads.push({ number, lead, now, status });
    },
    markLeadSynced(number) {
      this.leads.push({ number, status: "synced" });
    },
    saveMedia(messageId, number, record) {
      this.media.push({ messageId, number, record });
    },
    enqueueRetry(type, payload, runAfter) {
      this.retries.push({ type, payload, runAfter });
    },
    claimDueRetries() {
      return this.dueRetries || [];
    },
    completeRetry(id) {
      this.completed.push(id);
    },
    rescheduleRetry(id, attempts, runAfter, safeError) {
      this.rescheduled.push({ id, attempts, runAfter, safeError });
    },
  };
}

test("Sheets failure queues a lead retry", async () => {
  const store = createFakeStore();
  const service = createSyncService({
    store,
    googleClient: {
      appendLead: async () => {
        throw Object.assign(new Error("private response body"), {
          name: "GaxiosError",
          status: 503,
        });
      },
    },
    tempDir: mkdtempSync(path.join(tmpdir(), "hijaoe-sync-")),
    clock: () => 1000,
    logger: { warn() {} },
  });

  const result = await service.syncConfirmedLead("628111", {
    customer_name: "Ari",
  });

  assert.equal(result.ok, false);
  assert.equal(store.retries[0].type, "sync_lead");
  assert.equal(store.retries[0].payload.number, "628111");
  assert.equal(store.retries[0].payload.error, undefined);
});

test("Drive failure queues only a temporary path, not media bytes", async () => {
  const store = createFakeStore();
  const tempDir = mkdtempSync(path.join(tmpdir(), "hijaoe-sync-"));
  const service = createSyncService({
    store,
    googleClient: {
      uploadPhoto: async () => {
        throw new Error("drive unavailable");
      },
    },
    tempDir,
    clock: () => 2000,
    logger: { warn() {} },
  });

  const result = await service.uploadCustomerPhoto({
    number: "628111",
    messageId: "m1",
    mimeType: "image/jpeg",
    bytes: Buffer.from("photo"),
  });

  assert.equal(result.ok, false);
  assert.equal(store.retries[0].type, "upload_media");
  assert.equal(typeof store.retries[0].payload.tempPath, "string");
  assert.equal("bytes" in store.retries[0].payload, false);
  assert.equal(readFileSync(store.retries[0].payload.tempPath, "utf8"), "photo");
});

test("rejects unsupported media before writing or queuing it", async () => {
  const store = createFakeStore();
  const tempDir = mkdtempSync(path.join(tmpdir(), "hijaoe-sync-"));
  const service = createSyncService({
    store,
    googleClient: {
      uploadPhoto: async () => {
        throw new Error("should not be called");
      },
    },
    tempDir,
    logger: { warn() {} },
  });

  await assert.rejects(
    service.uploadCustomerPhoto({
      number: "628111",
      messageId: "m2",
      mimeType: "application/pdf",
      bytes: Buffer.from("document"),
    }),
    /Unsupported media type/,
  );
  assert.equal(store.retries.length, 0);
});

test("retry schedule uses bounded backoff", () => {
  assert.equal(retryDelayMs(1), 60_000);
  assert.equal(retryDelayMs(2), 300_000);
  assert.equal(retryDelayMs(3), 1_800_000);
  assert.equal(retryDelayMs(4), 21_600_000);
  assert.equal(retryDelayMs(20), 21_600_000);
});

test("external errors are sanitized before persistence", () => {
  const error = Object.assign(new Error("Bearer secret response body"), {
    name: "GaxiosError",
    status: 403,
  });
  assert.equal(sanitizeExternalError(error), "GaxiosError (HTTP 403)");
});

test("stops retrying after the configured attempt limit", async () => {
  const store = createFakeStore();
  store.dueRetries = [
    {
      id: 7,
      job_type: "sync_lead",
      payload: {
        number: "628111",
        lead: { customer_name: "Ari" },
      },
      attempts: 7,
    },
  ];
  const warnings = [];
  const service = createSyncService({
    store,
    googleClient: {
      appendLead: async () => {
        throw Object.assign(new Error("private response body"), {
          name: "GaxiosError",
          status: 503,
        });
      },
    },
    tempDir: mkdtempSync(path.join(tmpdir(), "hijaoe-sync-")),
    clock: () => 10_000,
    maxRetryAttempts: 8,
    logger: {
      warn(message) {
        warnings.push(message);
      },
    },
  });

  await service.processDueRetries();

  assert.deepEqual(store.completed, [7]);
  assert.equal(store.rescheduled.length, 0);
  assert.match(warnings.at(-1), /retry_exhausted/);
  assert.doesNotMatch(warnings.at(-1), /private response body/);
});
