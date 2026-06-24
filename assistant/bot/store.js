import { DatabaseSync } from "node:sqlite";

const SCHEMA = `
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
CREATE TABLE IF NOT EXISTS runtime_health (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

export function createBotStore(filename) {
  const database = new DatabaseSync(filename);
  database.exec(SCHEMA);

  const statements = prepareStatements(database);

  return {
    loadSession(number) {
      const row = statements.loadSession.get(number);
      return row ? JSON.parse(row.session_json) : null;
    },

    saveSession(number, session, now = Date.now()) {
      statements.saveSession.run(number, JSON.stringify(session), now);
    },

    hasInboundMessage(messageId) {
      return Boolean(statements.hasInboundMessage.get(messageId));
    },

    claimInboundMessage(messageId, number, receivedAt) {
      return statements.claimInboundMessage.run(
        messageId,
        number,
        receivedAt,
      ).changes === 1;
    },

    recordBotOutbound(messageId, number, sentAt = Date.now()) {
      statements.recordBotOutbound.run(messageId, number, sentAt);
    },

    isBotOutbound(messageId) {
      return Boolean(statements.isBotOutbound.get(messageId));
    },

    pauseContact(number, now = Date.now(), hours = 24) {
      const pausedUntil = now + hours * 3_600_000;
      statements.pauseContact.run(number, pausedUntil, now);
      return pausedUntil;
    },

    isPaused(number, now = Date.now()) {
      const row = statements.loadPause.get(number);
      return Boolean(row && row.paused_until > now);
    },

    getPauseUntil(number) {
      return statements.loadPause.get(number)?.paused_until ?? null;
    },

    clearPause(number) {
      statements.clearPause.run(number);
    },

    saveLead(number, lead, now = Date.now(), syncStatus = "pending") {
      statements.saveLead.run(
        number,
        JSON.stringify(lead),
        syncStatus,
        now,
      );
    },

    loadLead(number) {
      const row = statements.loadLead.get(number);
      return row
        ? {
            lead: JSON.parse(row.lead_json),
            syncStatus: row.sync_status,
            updatedAt: row.updated_at,
          }
        : null;
    },

    markLeadSynced(number, now = Date.now()) {
      statements.markLeadSynced.run(now, number);
    },

    saveMedia(messageId, number, mediaRecord, now = Date.now()) {
      statements.saveMedia.run(
        messageId,
        number,
        mediaRecord.driveFileId || null,
        mediaRecord.driveUrl || null,
        mediaRecord.syncStatus || "pending",
        now,
      );
    },

    enqueueRetry(type, payload, runAfter) {
      return Number(
        statements.enqueueRetry.run(
          type,
          JSON.stringify(payload),
          runAfter,
        ).lastInsertRowid,
      );
    },

    claimDueRetries(now = Date.now(), limit = 20) {
      return statements.claimDueRetries
        .all(now, Math.max(1, Math.min(100, Number(limit) || 20)))
        .map((row) => ({
          ...row,
          payload: JSON.parse(row.payload_json),
        }));
    },

    completeRetry(id) {
      statements.completeRetry.run(id);
    },

    rescheduleRetry(id, attempts, runAfter, safeError) {
      statements.rescheduleRetry.run(
        attempts,
        runAfter,
        String(safeError || "retry failed").slice(0, 200),
        id,
      );
    },

    setRuntimeHealth(key, value, now = Date.now()) {
      statements.setRuntimeHealth.run(key, String(value), now);
    },

    getRuntimeHealth(key) {
      return statements.getRuntimeHealth.get(key)?.value ?? null;
    },

    getHealthSnapshot(now = Date.now()) {
      const lastMessageAt = statements.getRuntimeHealth.get("lastMessageAt");
      const whatsapp = statements.getRuntimeHealth.get("whatsapp");

      return {
        database: "ok",
        pausedContacts: Number(statements.countPaused.get(now).count),
        pendingRetries: Number(statements.countRetries.get().count),
        pendingLeads: Number(statements.countLeads.get().count),
        lastMessageAt: lastMessageAt?.value || null,
        whatsapp: whatsapp?.value || "unknown",
      };
    },

    close() {
      database.close();
    },
  };
}

function prepareStatements(database) {
  return {
    loadSession: database.prepare(
      "SELECT session_json FROM sessions WHERE whatsapp_number = ?",
    ),
    saveSession: database.prepare(`
      INSERT INTO sessions (whatsapp_number, session_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(whatsapp_number) DO UPDATE SET
        session_json = excluded.session_json,
        updated_at = excluded.updated_at
    `),
    hasInboundMessage: database.prepare(
      "SELECT 1 FROM processed_messages WHERE message_id = ?",
    ),
    claimInboundMessage: database.prepare(`
      INSERT OR IGNORE INTO processed_messages
        (message_id, whatsapp_number, received_at)
      VALUES (?, ?, ?)
    `),
    recordBotOutbound: database.prepare(`
      INSERT OR REPLACE INTO outbound_bot_messages
        (message_id, whatsapp_number, sent_at)
      VALUES (?, ?, ?)
    `),
    isBotOutbound: database.prepare(
      "SELECT 1 FROM outbound_bot_messages WHERE message_id = ?",
    ),
    pauseContact: database.prepare(`
      INSERT INTO manual_takeovers (whatsapp_number, paused_until, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(whatsapp_number) DO UPDATE SET
        paused_until = excluded.paused_until,
        updated_at = excluded.updated_at
    `),
    loadPause: database.prepare(
      "SELECT paused_until FROM manual_takeovers WHERE whatsapp_number = ?",
    ),
    clearPause: database.prepare(
      "DELETE FROM manual_takeovers WHERE whatsapp_number = ?",
    ),
    saveLead: database.prepare(`
      INSERT INTO leads
        (whatsapp_number, lead_json, sync_status, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(whatsapp_number) DO UPDATE SET
        lead_json = excluded.lead_json,
        sync_status = excluded.sync_status,
        updated_at = excluded.updated_at
    `),
    loadLead: database.prepare(
      "SELECT lead_json, sync_status, updated_at FROM leads WHERE whatsapp_number = ?",
    ),
    markLeadSynced: database.prepare(
      "UPDATE leads SET sync_status = 'synced', updated_at = ? WHERE whatsapp_number = ?",
    ),
    saveMedia: database.prepare(`
      INSERT INTO media_uploads
        (message_id, whatsapp_number, drive_file_id, drive_url, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(message_id) DO UPDATE SET
        drive_file_id = excluded.drive_file_id,
        drive_url = excluded.drive_url,
        sync_status = excluded.sync_status,
        updated_at = excluded.updated_at
    `),
    enqueueRetry: database.prepare(`
      INSERT INTO retry_jobs (job_type, payload_json, run_after)
      VALUES (?, ?, ?)
    `),
    claimDueRetries: database.prepare(`
      SELECT id, job_type, payload_json, attempts, run_after
      FROM retry_jobs
      WHERE run_after <= ?
      ORDER BY run_after, id
      LIMIT ?
    `),
    completeRetry: database.prepare("DELETE FROM retry_jobs WHERE id = ?"),
    rescheduleRetry: database.prepare(`
      UPDATE retry_jobs
      SET attempts = ?, run_after = ?, last_error = ?
      WHERE id = ?
    `),
    setRuntimeHealth: database.prepare(`
      INSERT INTO runtime_health (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `),
    getRuntimeHealth: database.prepare(
      "SELECT value, updated_at FROM runtime_health WHERE key = ?",
    ),
    countPaused: database.prepare(
      "SELECT COUNT(*) AS count FROM manual_takeovers WHERE paused_until > ?",
    ),
    countRetries: database.prepare(
      "SELECT COUNT(*) AS count FROM retry_jobs",
    ),
    countLeads: database.prepare(
      "SELECT COUNT(*) AS count FROM leads WHERE sync_status != 'synced'",
    ),
  };
}
