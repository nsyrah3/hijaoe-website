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
  clock = Date.now,
  maxMessageAgeSeconds = 600,
  takeoverHours = 24,
  replyDelayMs = 1200,
  logger = console,
}) {
  const pendingBotSends = new Map();

  return {
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

      let pendingFingerprint = "";

      try {
        let previousSession =
          store.loadSession(classification.number) ||
          createSession(classification.number);
        if (pauseUntil !== null && pauseUntil <= now) {
          store.clearPause?.(classification.number);
          if (
            previousSession.state === "handoff" ||
            previousSession.state === "closed"
          ) {
            previousSession = createSession(classification.number);
          }
        }

        const prepared = await prepareCustomerInput({
          message,
          session: previousSession,
          syncService,
          number: classification.number,
        });
        const result = handleMessage(previousSession, prepared.text, {
          now: new Date(now),
        });

        if (!result.messages.length) {
          store.saveSession(classification.number, result.session, now);
          recordLastMessage(store, now);
          return { action: "silent", session: result.session };
        }

        const text = await composeReply({
          deterministicMessages: result.messages,
          customerMessage: prepared.text,
          session: result.session,
        });
        if (!text) {
          return { action: "error", reason: "EmptyReply" };
        }

        if (replyDelayMs > 0) {
          await delay(replyDelayMs);
        }

        pendingFingerprint = botFingerprint(classification.number, text);
        pendingBotSends.set(pendingFingerprint, clock() + 30_000);
        const outboundId = await sender.sendText(
          classification.number,
          text,
          message.chatId,
        );
        if (outboundId) {
          store.recordBotOutbound(outboundId, classification.number, clock());
        }
        store.saveSession(classification.number, result.session, clock());
        recordLastMessage(store, clock());

        if (result.lead) {
          const lead = {
            ...result.lead,
            drive_folder_url: prepared.driveFolderUrl || "",
            photo_urls: prepared.driveUrl
              ? [prepared.driveUrl]
              : extractUrls(result.lead.photo_references),
          };
          await syncService.syncConfirmedLead(classification.number, lead);
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
