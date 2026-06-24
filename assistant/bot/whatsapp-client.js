import qrcode from "qrcode-terminal";
import whatsappWeb from "whatsapp-web.js";

const { Client, LocalAuth } = whatsappWeb;
const MAX_MEDIA_BYTES = 15 * 1024 * 1024;
const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp"]);

export function createWhatsAppClient({
  client,
  authDir = ".wwebjs_auth",
  qrRenderer = defaultQrRenderer,
  onIncoming = async () => {},
  onOwn = async () => {},
  onHealth = () => {},
  reconnectDelayMs = 15_000,
  setTimeoutImpl = setTimeout,
  clearTimeoutImpl = clearTimeout,
  logger = console,
} = {}) {
  const internalClient =
    client ||
    new Client({
      authStrategy: new LocalAuth({
        clientId: "hijaoe",
        dataPath: authDir,
      }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });
  let reconnectTimer = null;
  let reconnecting = false;
  let destroyed = false;

  function cancelReconnect() {
    if (reconnectTimer !== null) {
      clearTimeoutImpl(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function scheduleReconnect() {
    if (destroyed || reconnecting || reconnectTimer !== null) {
      return;
    }

    reconnectTimer = setTimeoutImpl(async () => {
      reconnectTimer = null;
      if (destroyed) {
        return;
      }

      reconnecting = true;
      onHealth("reconnecting");
      let failed = false;
      try {
        await internalClient.initialize();
      } catch (error) {
        failed = true;
        logger?.warn?.(
          JSON.stringify({
            event: "whatsapp_reconnect_failed",
            error: safeErrorName(error),
          }),
        );
      } finally {
        reconnecting = false;
      }

      if (failed) {
        scheduleReconnect();
      }
    }, reconnectDelayMs);
    reconnectTimer?.unref?.();
  }

  internalClient.on("qr", async (value) => {
    onHealth("qr_pending");
    qrRenderer(value);
  });
  internalClient.on("authenticated", async () => {
    onHealth("authenticated");
    logger?.info?.(JSON.stringify({ event: "whatsapp_authenticated" }));
  });
  internalClient.on("ready", async () => {
    cancelReconnect();
    onHealth("ready");
    logger?.info?.(JSON.stringify({ event: "whatsapp_ready" }));
  });
  internalClient.on("disconnected", async () => {
    onHealth("disconnected");
    logger?.warn?.(JSON.stringify({ event: "whatsapp_disconnected" }));
    scheduleReconnect();
  });
  internalClient.on("auth_failure", async () => {
    onHealth("auth_failure");
    logger?.error?.(JSON.stringify({ event: "whatsapp_auth_failure" }));
    scheduleReconnect();
  });
  internalClient.on("message", async (rawMessage) => {
    if (rawMessage.fromMe) {
      return;
    }
    await dispatchNormalized(rawMessage, onIncoming, internalClient, logger);
  });
  internalClient.on("message_create", async (rawMessage) => {
    if (!rawMessage.fromMe) {
      return;
    }
    await dispatchNormalized(rawMessage, onOwn, internalClient, logger);
  });

  return {
    async initialize() {
      destroyed = false;
      await internalClient.initialize();
    },

    async destroy() {
      destroyed = true;
      cancelReconnect();
      await internalClient.destroy();
    },

    async sendText(number, text, chatId) {
      const target = isPrivateChatId(chatId) ? chatId : `${number}@c.us`;
      const result = await internalClient.sendMessage(target, text);
      return serializeMessageId(result?.id);
    },

    rawClient: internalClient,
  };
}

async function dispatchNormalized(rawMessage, handler, client, logger) {
  try {
    const normalized = await normalizeMessage(rawMessage, client);
    await handler(normalized);
  } catch (error) {
    logger?.warn?.(
      JSON.stringify({
        event: "whatsapp_message_ignored",
        error: String(error?.name || "Error").replace(/[^a-zA-Z0-9_-]/g, ""),
      }),
    );
  }
}

export async function normalizeMessage(rawMessage, client) {
  const chatId = rawMessage.fromMe ? rawMessage.to : rawMessage.from;
  const media = rawMessage.hasMedia
    ? await downloadValidatedMedia(rawMessage)
    : null;

  return {
    id: serializeMessageId(rawMessage.id),
    chatId: String(chatId || ""),
    number: await resolvePrivateNumber(chatId, client),
    timestampSeconds: Number(rawMessage.timestamp) || undefined,
    fromMe: Boolean(rawMessage.fromMe),
    type: String(rawMessage.type || "chat"),
    text: String(rawMessage.body || ""),
    media,
  };
}

async function downloadValidatedMedia(rawMessage) {
  const downloaded = await rawMessage.downloadMedia();
  const mimeType = String(downloaded?.mimetype || "");
  if (!ALLOWED_MEDIA.has(mimeType)) {
    throw new Error("Unsupported media type");
  }

  const bytes = Buffer.from(String(downloaded?.data || ""), "base64");
  if (bytes.byteLength > MAX_MEDIA_BYTES) {
    throw new Error("Media exceeds 15 MB");
  }

  return { mimeType, bytes };
}

function serializeMessageId(id) {
  return String(id?._serialized || id?.id || id || "");
}

function privateNumber(chatId) {
  const value = String(chatId || "");
  return value.endsWith("@c.us") ? value.slice(0, -5) : "";
}

async function resolvePrivateNumber(chatId, client) {
  const phoneNumber = privateNumber(chatId);
  if (phoneNumber) {
    return phoneNumber;
  }

  const value = String(chatId || "");
  if (!value.endsWith("@lid")) {
    return "";
  }

  try {
    const mapping = await client?.getContactLidAndPhone?.([value]);
    const pn = mapping?.[0]?.pn;
    if (String(pn || "").endsWith("@c.us")) {
      return String(pn).slice(0, -5);
    }
  } catch {
    // Keep the stable LID as a fallback when WhatsApp cannot resolve the phone.
  }

  return value.slice(0, -4);
}

function isPrivateChatId(chatId) {
  const value = String(chatId || "");
  return value.endsWith("@c.us") || value.endsWith("@lid");
}

function defaultQrRenderer(value) {
  qrcode.generate(value, { small: true });
}

function safeErrorName(error) {
  return String(error?.name || "Error").replace(/[^a-zA-Z0-9_-]/g, "");
}
