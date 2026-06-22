import test from "node:test";
import assert from "node:assert/strict";
import { handleWhatsAppWebhook } from "../assistant/whatsapp-webhook.js";

const VERIFY_TOKEN = "test-verify-token";
const APP_SECRET = "test-app-secret";

test("webhook verification returns the Meta challenge for a valid token", async () => {
  const request = new Request(
    `https://hijaoe.id/api/whatsapp?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=123456`,
  );

  const response = await handleWhatsAppWebhook(request, {
    META_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN,
  });

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "123456");
});

test("webhook verification rejects an invalid token", async () => {
  const request = new Request(
    "https://hijaoe.id/api/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123456",
  );

  const response = await handleWhatsAppWebhook(request, {
    META_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN,
  });

  assert.equal(response.status, 403);
});

test("webhook rejects a POST with an invalid Meta signature", async () => {
  const request = new Request("https://hijaoe.id/api/whatsapp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hub-signature-256": "sha256=invalid",
    },
    body: JSON.stringify({ object: "whatsapp_business_account", entry: [] }),
  });

  const response = await handleWhatsAppWebhook(request, {
    META_APP_SECRET: APP_SECRET,
  });

  assert.equal(response.status, 401);
});

test("webhook accepts a signed delivery status and logs sanitized diagnostics", async () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: {
              statuses: [
                {
                  id: "wamid.test-message",
                  status: "failed",
                  recipient_id: "6281324138159",
                  errors: [
                    {
                      code: 131026,
                      title: "Message undeliverable",
                      message: "Message undeliverable",
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const body = JSON.stringify(payload);
  const signature = await createSignature(APP_SECRET, body);
  const logs = [];
  const request = new Request("https://hijaoe.id/api/whatsapp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hub-signature-256": signature,
    },
    body,
  });

  const response = await handleWhatsAppWebhook(
    request,
    { META_APP_SECRET: APP_SECRET },
    { log: (event) => logs.push(event) },
  );

  assert.equal(response.status, 200);
  assert.equal(logs.length, 1);
  assert.deepEqual(logs[0], {
    event: "whatsapp_message_status",
    messageId: "wamid.test-message",
    status: "failed",
    errorCodes: [131026],
    errorTitles: ["Message undeliverable"],
  });
  assert.doesNotMatch(JSON.stringify(logs), /6281324138159/);
});

async function createSignature(secret, body) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  return `sha256=${Buffer.from(signature).toString("hex")}`;
}
