import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLead,
  buildSummary,
  createSession,
  handleMessage,
  startConversation,
} from "../assistant/conversation-engine.js";

test("assistant opening creates a fresh session and asks for the name", () => {
  const session = createSession("628123456789");
  const defaultSession = createSession();
  const result = startConversation(session);

  assert.equal(session.state, "welcome");
  assert.equal(session.whatsappNumber, "628123456789");
  assert.equal(defaultSession.whatsappNumber, "");
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

test("assistant collects a complete brief and creates one lead", () => {
  let session = startConversation(createSession("628123456789")).session;

  for (const reply of [
    "Rina",
    "Pagar geser besi",
    "Panakkukang",
    "Lebar 4 meter, tinggi 1,8 meter",
    "Besi hollow model minimalis",
    "Bulan depan",
    "lewati",
    "rina@example.com",
    "ya",
  ]) {
    session = handleMessage(session, reply).session;
  }

  assert.equal(session.state, "confirmation");
  assert.match(buildSummary(session), /Pagar geser besi/);

  const result = handleMessage(session, "ya");

  assert.equal(result.session.state, "handoff");
  assert.equal(result.session.completed, true);
  assert.equal(result.lead.customer_name, "Rina");
  assert.equal(result.lead.email_marketing_consent, "Ya");
  assert.equal(result.lead.status, "Baru");
});

test("optional email can be skipped without marketing consent", () => {
  const session = {
    ...createSession("628123456789"),
    state: "email",
    data: {
      ...createSession().data,
      name: "Rina",
      service: "Pagar geser besi",
      location: "Panakkukang",
    },
  };

  const result = handleMessage(session, "lewati");

  assert.equal(result.session.state, "confirmation");
  assert.equal(result.session.data.email, "");
  assert.equal(result.session.data.emailMarketingConsent, "Tidak");
});

test("customer can correct a field before confirmation", () => {
  const session = {
    ...createSession("628123456789"),
    state: "confirmation",
    data: {
      ...createSession().data,
      name: "Rina",
      service: "Pagar geser besi",
      location: "Panakkukang",
    },
  };

  const result = handleMessage(session, "ubah lokasi: Gowa");

  assert.equal(result.session.state, "confirmation");
  assert.equal(result.session.data.location, "Gowa");
  assert.match(result.messages[0], /Gowa/);
});

test("customer can revoke email marketing consent before confirmation", () => {
  const session = {
    ...createSession("628123456789"),
    state: "confirmation",
    data: {
      ...createSession().data,
      name: "Rina",
      service: "Pagar geser besi",
      location: "Panakkukang",
      email: "rina@example.com",
      emailMarketingConsent: "Ya",
    },
  };

  const result = handleMessage(session, "ubah izin email promosi: tidak");

  assert.equal(result.session.state, "confirmation");
  assert.equal(result.session.data.emailMarketingConsent, "Tidak");
  assert.match(result.messages[0], /Izin email promosi: Tidak/);
});

test("buildLead uses a stable Stage 2 field shape", () => {
  const session = {
    ...createSession("628123456789"),
    data: {
      ...createSession().data,
      name: "Rina",
      service: "Pagar geser besi",
      location: "Panakkukang",
    },
  };

  const lead = buildLead(session, new Date("2026-06-21T02:00:00.000Z"));

  assert.deepEqual(Object.keys(lead), [
    "created_at",
    "status",
    "customer_name",
    "whatsapp_number",
    "email",
    "email_marketing_consent",
    "service_type",
    "location",
    "dimensions",
    "material_or_style",
    "target_time",
    "notes",
    "photo_references",
    "conversation_summary",
    "handoff_reason",
    "source",
  ]);
  assert.equal(lead.created_at, "2026-06-21T02:00:00.000Z");
});
