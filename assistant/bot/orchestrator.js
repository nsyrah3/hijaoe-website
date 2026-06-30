import {
  createSession,
  handleMessage,
} from "../conversation-engine.js";
import {
  classifyIncomingMessage,
  classifyOwnMessage,
} from "./message-policy.js";

export function createBotOrchestrator({
  store,
  sender,
  syncService,
  composeReply,
  runConversation,
  clock = Date.now,
  maxMessageAgeSeconds = 600,
  takeoverHours = 24,
  replyDelayMs = 1200,
  batchWindowMs = 0,
  setTimeoutImpl = setTimeout,
  clearTimeoutImpl = clearTimeout,
  logger = console,
}) {
  const pendingBotSends = new Map();
  const pendingBatches = new Map();
  const conversationRunner =
    runConversation ||
    (({ session, messages, now }) =>
      handleMessage(session, messages.join("\n"), { now }));

  async function processIncomingBatch({ number, chatId, messages, now }) {
    let pendingFingerprint = "";

    try {
      let previousSession =
        store.loadSession(number) ||
        createSession(number);
      const pauseUntil = store.getPauseUntil?.(number) ?? null;
      if (pauseUntil !== null && pauseUntil <= now) {
        store.clearPause?.(number);
        if (
          previousSession.state === "handoff" ||
          previousSession.state === "closed"
        ) {
          previousSession = createSession(number);
        }
      }

      const prepared = await prepareCustomerBatch({
        messages,
        session: previousSession,
        syncService,
        number,
      });
      const result = await conversationRunner({
        session: previousSession,
        messages: prepared.texts,
        now: new Date(now),
      });

      if (!result.messages.length) {
        store.saveSession(number, result.session, now);
        recordLastMessage(store, now);
        return { action: "silent", session: result.session };
      }

      const text = result.replyIsFinal
        ? result.messages.filter(Boolean).join("\n\n").trim()
        : await composeReply({
            deterministicMessages: result.messages,
            customerMessage: prepared.texts.join("\n"),
            session: result.session,
          });
      if (!text) {
        return { action: "error", reason: "EmptyReply" };
      }

      if (replyDelayMs > 0) {
        await delay(replyDelayMs);
      }

      pendingFingerprint = botFingerprint(number, text);
      pendingBotSends.set(pendingFingerprint, clock() + 30_000);
      const outboundId = await sender.sendText(number, text, chatId);
      if (outboundId) {
        store.recordBotOutbound(outboundId, number, clock());
      }
      store.saveSession(number, result.session, clock());
      recordLastMessage(store, clock());

      if (result.lead) {
        const lead = {
          ...result.lead,
          drive_folder_url: prepared.driveFolderUrl || "",
          photo_urls: prepared.driveUrl
            ? [prepared.driveUrl]
            : extractUrls(result.lead.photo_references),
        };
        await syncService.syncConfirmedLead(number, lead);
      }

      return {
        action: "replied",
        outboundId,
        session: result.session,
      };
    } catch (error) {
      if (pendingFingerprint) {
        pendingBotSends.delete(pendingFingerprint);
      }
      logger?.error?.(
        JSON.stringify({
          event: "incoming_message_failed",
          error: safeErrorName(error),
        }),
      );
      return { action: "error", reason: safeErrorName(error) };
    }
  }

  function queueIncoming({ number, message }) {
    const existing = pendingBatches.get(number);
    if (existing?.timer) {
      clearTimeoutImpl(existing.timer);
    }

    const batch = existing || {
      number,
      chatId: message.chatId,
      messages: [],
      timer: null,
    };
    batch.chatId = message.chatId || batch.chatId;
    batch.messages.push(message);
    batch.timer = setTimeoutImpl(
      () => void api.flushPending(number),
      batchWindowMs,
    );
    batch.timer?.unref?.();
    pendingBatches.set(number, batch);
  }

  const api = {
    async handleIncoming(message) {
      const now = clock();
      const number = message.number || privateNumber(message.chatId);
      const pauseUntil = number ? store.getPauseUntil?.(number) ?? null : null;
      const classification = classifyIncomingMessage({
        chatId: message.chatId,
        number,
        messageId: message.id,
        timestampSeconds: message.timestampSeconds,
        nowMs: now,
        maxAgeSeconds: maxMessageAgeSeconds,
        alreadyProcessed: store.hasInboundMessage?.(message.id) || false,
        paused:
          pauseUntil !== null
            ? pauseUntil > now
            : number
              ? store.isPaused(number, now)
              : false,
      });

      if (classification.action !== "process") {
        return {
          action: "ignored",
          reason: classification.reason,
        };
      }

      const claimed = store.claimInboundMessage(
        message.id,
        classification.number,
        message.timestampSeconds
          ? message.timestampSeconds * 1000
          : now,
      );
      if (!claimed) {
        return { action: "ignored", reason: "duplicate" };
      }

      if (batchWindowMs > 0) {
        queueIncoming({ number: classification.number, message });
        return { action: "queued" };
      }

      return processIncomingBatch({
        number: classification.number,
        chatId: message.chatId,
        messages: [message],
        now,
      });
    },

    async handleOwnMessage(message) {
      const number = message.number || privateNumber(message.chatId);
      const fingerprint = botFingerprint(number, message.text);
      const pendingUntil = pendingBotSends.get(fingerprint) || 0;
      const pendingBotMessage = pendingUntil > clock();
      if (pendingBotMessage) {
        pendingBotSends.delete(fingerprint);
      }

      const classification = classifyOwnMessage({
        chatId: message.chatId,
        number,
        knownBotMessage:
          pendingBotMessage || store.isBotOutbound(message.id),
      });

      if (classification.action !== "pause") {
        return { action: "ignored", reason: classification.reason };
      }

      const pausedUntil = store.pauseContact(
        classification.number,
        clock(),
        takeoverHours,
      );
      logger?.info?.(
        JSON.stringify({
          event: "manual_takeover_started",
          pausedUntil: new Date(pausedUntil).toISOString(),
        }),
      );

      return {
        action: "paused",
        number: classification.number,
        pausedUntil,
      };
    },

    async flushPending(number) {
      const batch = pendingBatches.get(number);
      if (!batch) {
        return { action: "ignored", reason: "no_pending_batch" };
      }
      if (batch.timer) {
        clearTimeoutImpl(batch.timer);
      }
      pendingBatches.delete(number);
      return processIncomingBatch({
        number: batch.number,
        chatId: batch.chatId,
        messages: batch.messages,
        now: clock(),
      });
    },
  };

  return api;
}

async function prepareCustomerBatch({ messages, session, syncService, number }) {
  const prepared = [];
  let driveUrl = "";
  let driveFolderUrl = "";

  for (const message of messages) {
    const item = await prepareCustomerInput({
      message,
      session,
      syncService,
      number,
    });
    if (item.text) {
      prepared.push(item.text);
    }
    driveUrl = item.driveUrl || driveUrl;
    driveFolderUrl = item.driveFolderUrl || driveFolderUrl;
  }

  return {
    texts: prepared,
    driveUrl,
    driveFolderUrl,
  };
}

async function prepareCustomerInput({
  message,
  session,
  syncService,
  number,
}) {
  const text = String(message.text || "").trim();
  if (!message.media) {
    return { text };
  }

  const uploaded = await syncService.uploadCustomerPhoto({
    number,
    messageId: message.id,
    mimeType: message.media.mimeType,
    bytes: message.media.bytes,
  });

  if (session.state === "photo" && uploaded.ok) {
    return {
      text: uploaded.driveUrl,
      driveUrl: uploaded.driveUrl,
      driveFolderUrl: uploaded.driveFolderUrl,
    };
  }

  return {
    text: text || (uploaded.ok ? "Foto sudah dikirim" : "Foto dikirim"),
    driveUrl: uploaded.driveUrl || "",
    driveFolderUrl: uploaded.driveFolderUrl || "",
  };
}

function privateNumber(chatId) {
  const value = String(chatId || "");
  return value.endsWith("@c.us") ? value.slice(0, -5) : "";
}

function botFingerprint(number, text) {
  return `${number}:${String(text || "").replace(/\s+/g, " ").trim()}`;
}

function safeErrorName(error) {
  return String(error?.name || "Error").replace(/[^a-zA-Z0-9_-]/g, "");
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function recordLastMessage(store, now) {
  store.setRuntimeHealth?.(
    "lastMessageAt",
    new Date(now).toISOString(),
    now,
  );
}

function extractUrls(value) {
  return String(value || "").match(/https?:\/\/[^\s]+/g) || [];
}
