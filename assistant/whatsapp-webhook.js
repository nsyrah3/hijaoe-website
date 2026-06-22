const SIGNATURE_PREFIX = "sha256=";

export async function handleWhatsAppWebhook(
  request,
  env,
  { log = defaultLog } = {},
) {
  if (request.method === "GET") {
    return verifyWebhookSubscription(request, env);
  }

  if (request.method === "POST") {
    return receiveWebhookEvent(request, env, log);
  }

  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
}

async function verifyWebhookSubscription(request, env) {
  if (!env?.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response("Webhook is not configured", { status: 503 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode !== "subscribe" ||
    !challenge ||
    !safeEqual(token, env.META_WEBHOOK_VERIFY_TOKEN)
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function receiveWebhookEvent(request, env, log) {
  if (!env?.META_APP_SECRET) {
    return new Response("Webhook is not configured", { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const isAuthentic = await verifyMetaSignature(
    env.META_APP_SECRET,
    body,
    signature,
  );

  if (!isAuthentic) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload?.object !== "whatsapp_business_account") {
    return new Response("Ignored", { status: 200 });
  }

  for (const event of extractSanitizedEvents(payload)) {
    log(event);
  }

  return new Response("EVENT_RECEIVED", { status: 200 });
}

export async function verifyMetaSignature(secret, body, signatureHeader) {
  if (
    typeof secret !== "string" ||
    !secret ||
    typeof signatureHeader !== "string" ||
    !signatureHeader.startsWith(SIGNATURE_PREFIX)
  ) {
    return false;
  }

  const signatureHex = signatureHeader.slice(SIGNATURE_PREFIX.length);
  if (!/^[a-f0-9]{64}$/i.test(signatureHex)) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    hexToBytes(signatureHex),
    new TextEncoder().encode(body),
  );
}

export function extractSanitizedEvents(payload) {
  const events = [];

  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      if (change?.field !== "messages") {
        continue;
      }

      for (const status of change?.value?.statuses ?? []) {
        events.push({
          event: "whatsapp_message_status",
          messageId: String(status?.id ?? ""),
          status: String(status?.status ?? "unknown"),
          errorCodes: (status?.errors ?? [])
            .map((error) => Number(error?.code))
            .filter(Number.isFinite),
          errorTitles: (status?.errors ?? [])
            .map((error) => String(error?.title ?? "").slice(0, 160))
            .filter(Boolean),
        });
      }

      for (const message of change?.value?.messages ?? []) {
        events.push({
          event: "whatsapp_message_received",
          messageId: String(message?.id ?? ""),
          messageType: String(message?.type ?? "unknown"),
        });
      }
    }
  }

  return events;
}

function safeEqual(left, right) {
  const leftBytes = new TextEncoder().encode(String(left ?? ""));
  const rightBytes = new TextEncoder().encode(String(right ?? ""));
  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function defaultLog(event) {
  console.log(JSON.stringify(event));
}
