import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const TEMP_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_MEDIA_BYTES = 15 * 1024 * 1024;
const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp"]);

export function createSyncService({
  store,
  googleClient,
  tempDir,
  clock = Date.now,
  maxRetryAttempts = 8,
  logger = console,
}) {
  const retryLimit = Math.max(1, Number(maxRetryAttempts) || 8);

  return {
    async uploadCustomerPhoto(input) {
      validateMedia(input.mimeType, input.bytes);
      await mkdir(tempDir, { recursive: true });
      const tempPath = buildTempPath(tempDir, input.messageId, input.mimeType);
      await writeFile(tempPath, input.bytes);

      try {
        const uploaded = await googleClient.uploadPhoto(input);
        await rm(tempPath, { force: true });
        store.saveMedia(input.messageId, input.number, {
          ...uploaded,
          syncStatus: "synced",
        });
        return { ok: true, ...uploaded };
      } catch (error) {
        store.saveMedia(input.messageId, input.number, {
          syncStatus: "pending",
        });
        store.enqueueRetry(
          "upload_media",
          {
            number: input.number,
            messageId: input.messageId,
            mimeType: input.mimeType,
            tempPath,
          },
          clock() + retryDelayMs(1),
        );
        logSafe(logger, "media_sync_queued", error);
        return { ok: false, tempPath };
      }
    },

    async syncConfirmedLead(number, lead) {
      store.saveLead(number, lead, clock(), "pending");

      try {
        await googleClient.appendLead(lead);
        store.markLeadSynced(number, clock());
        return { ok: true };
      } catch (error) {
        store.enqueueRetry(
          "sync_lead",
          { number, lead },
          clock() + retryDelayMs(1),
        );
        logSafe(logger, "lead_sync_queued", error);
        return { ok: false };
      }
    },

    async processDueRetries() {
      const jobs = store.claimDueRetries(clock());

      for (const job of jobs) {
        try {
          if (job.job_type === "sync_lead") {
            await googleClient.appendLead(job.payload.lead);
            store.markLeadSynced(job.payload.number, clock());
          } else if (job.job_type === "upload_media") {
            const bytes = await readFile(job.payload.tempPath);
            const uploaded = await googleClient.uploadPhoto({
              number: job.payload.number,
              messageId: job.payload.messageId,
              mimeType: job.payload.mimeType,
              bytes,
            });
            store.saveMedia(
              job.payload.messageId,
              job.payload.number,
              { ...uploaded, syncStatus: "synced" },
              clock(),
            );
            await rm(job.payload.tempPath, { force: true });
          } else {
            throw new Error("Unsupported retry job");
          }

          store.completeRetry(job.id);
        } catch (error) {
          const attempts = Number(job.attempts || 0) + 1;
          if (attempts >= retryLimit) {
            store.completeRetry(job.id);
            logSafe(logger, "retry_exhausted", error);
            continue;
          }

          store.rescheduleRetry(
            job.id,
            attempts,
            clock() + retryDelayMs(attempts),
            sanitizeExternalError(error),
          );
          logSafe(logger, "retry_rescheduled", error);
        }
      }

      return jobs.length;
    },

    async removeExpiredTemporaryMedia() {
      await mkdir(tempDir, { recursive: true });
      const entries = await readdir(tempDir, { withFileTypes: true });
      let removed = 0;

      for (const entry of entries) {
        if (!entry.isFile()) {
          continue;
        }
        const filePath = path.join(tempDir, entry.name);
        const details = await stat(filePath);
        if (clock() - details.mtimeMs > TEMP_RETENTION_MS) {
          await rm(filePath, { force: true });
          removed += 1;
        }
      }

      return removed;
    },
  };
}

export function retryDelayMs(attempt) {
  if (attempt <= 1) return 60_000;
  if (attempt === 2) return 300_000;
  if (attempt === 3) return 1_800_000;
  return 21_600_000;
}

export function sanitizeExternalError(error) {
  const name = String(error?.name || "Error").replace(/[^a-zA-Z0-9_-]/g, "");
  const status = Number(error?.status || error?.response?.status);
  return Number.isFinite(status) ? `${name} (HTTP ${status})` : name;
}

function buildTempPath(tempDir, messageId, mimeType) {
  const extension =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const safeId =
    String(messageId || "media")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 120) || "media";
  return path.join(tempDir, `${safeId}.${extension}`);
}

function validateMedia(mimeType, bytes) {
  if (!ALLOWED_MEDIA.has(String(mimeType || ""))) {
    throw new Error("Unsupported media type");
  }

  const size = Buffer.isBuffer(bytes)
    ? bytes.byteLength
    : Buffer.byteLength(bytes || "");
  if (size > MAX_MEDIA_BYTES) {
    throw new Error("Media exceeds the 15 MB limit");
  }
}

function logSafe(logger, event, error) {
  logger?.warn?.(
    JSON.stringify({
      event,
      error: sanitizeExternalError(error),
    }),
  );
}
