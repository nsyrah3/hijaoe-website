import test from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  startConversation,
} from "../assistant/conversation-engine.js";

test("assistant opening creates a fresh session and asks for the name", () => {
  const session = createSession("628123456789");
  const result = startConversation(session);

  assert.equal(session.state, "welcome");
  assert.equal(session.whatsappNumber, "628123456789");
  assert.deepEqual(session.data, {
    name: "",
    service: "",
    location: "",
    dimensions: "",
    material: "",
    targetTime: "",
    photoReferences: "",
    email: "",
    emailMarketingConsent: "Tidak",
  });
  assert.equal(session.failedUnderstanding, 0);
  assert.equal(session.handoffReason, "");
  assert.equal(session.completed, false);

  assert.equal(result.session.state, "name");
  assert.equal(result.session.whatsappNumber, "628123456789");
  assert.deepEqual(result.messages, [
    "Halo, Kak. Saya Asisten HIJAOE. Saya bantu catat kebutuhan awalnya dulu, lalu admin kami akan lanjutkan.",
    "Boleh tahu namanya, Kak?",
  ]);
  assert.equal(result.lead, null);
});
