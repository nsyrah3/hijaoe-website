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

test("required field cannot be skipped", () => {
  const session = {
    ...createSession("628123456789"),
    state: "name",
  };

  const result = handleMessage(session, "lewati");

  assert.equal(result.session.state, "name");
  assert.equal(result.session.data.name, "");
  assert.equal(result.session.failedUnderstanding, 1);
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

test("confirmation uses the injected timestamp when creating a lead", () => {
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
  const now = new Date("2026-06-21T09:30:00.000Z");

  const result = handleMessage(session, "ya", { now });

  assert.equal(result.lead.created_at, "2026-06-21T09:30:00.000Z");
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

test("confirmation correction cannot skip a required field", () => {
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

  const result = handleMessage(session, "ubah lokasi: lewati");

  assert.equal(result.session.state, "confirmation");
  assert.equal(result.session.data.location, "Panakkukang");
  assert.equal(result.session.failedUnderstanding, 1);
  assert.equal(result.lead, null);
  assert.match(result.messages[0], /lokasi|field|ubah|koreksi/i);
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

test("confirmation email correction rejects invalid email", () => {
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

  const result = handleMessage(session, "ubah email: salah");

  assert.equal(result.session.state, "confirmation");
  assert.equal(result.session.data.email, "rina@example.com");
  assert.equal(result.session.failedUnderstanding, 1);
  assert.equal(result.lead, null);
  assert.match(result.messages[0], /format email/i);
});

test("confirmation email correction asks marketing consent for a new email", () => {
  const session = {
    ...createSession("628123456789"),
    state: "confirmation",
    data: {
      ...createSession().data,
      name: "Rina",
      service: "Pagar geser besi",
      location: "Panakkukang",
      email: "",
      emailMarketingConsent: "Tidak",
    },
  };

  const result = handleMessage(session, "ubah email: rina@example.com");

  assert.equal(result.session.state, "marketing_consent");
  assert.equal(result.session.data.email, "rina@example.com");
  assert.equal(result.session.failedUnderstanding, 0);
  assert.equal(result.lead, null);
  assert.equal(
    result.messages[0],
    "Apakah Kakak bersedia menerima informasi dan penawaran HIJAOE melalui email? Jawab ya atau tidak.",
  );
});

test("confirmation email correction can clear email consent", () => {
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

  const result = handleMessage(session, "ubah email: lewati");

  assert.equal(result.session.state, "confirmation");
  assert.equal(result.session.data.email, "");
  assert.equal(result.session.data.emailMarketingConsent, "Tidak");
  assert.equal(result.session.failedUnderstanding, 0);
  assert.equal(result.lead, null);
  assert.match(result.messages[0], /Email: /);
  assert.match(result.messages[0], /Izin email promosi: Tidak/);
});

test("confirmation correction accepts displayed optional labels", () => {
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

  const materialResult = handleMessage(
    session,
    "ubah bahan atau model: Kayu jati",
  );

  assert.equal(materialResult.session.state, "confirmation");
  assert.equal(materialResult.session.data.material, "Kayu jati");
  assert.equal(materialResult.lead, null);

  const photoResult = handleMessage(
    materialResult.session,
    "ubah foto referensi: foto contoh",
  );

  assert.equal(photoResult.session.state, "confirmation");
  assert.equal(photoResult.session.data.photoReferences, "foto contoh");
  assert.equal(photoResult.lead, null);
});

test("confirmation correction can clear optional fields", () => {
  const session = {
    ...createSession("628123456789"),
    state: "confirmation",
    data: {
      ...createSession().data,
      name: "Rina",
      service: "Pagar geser besi",
      location: "Panakkukang",
      material: "Kayu",
    },
  };

  const result = handleMessage(session, "ubah bahan: lewati");

  assert.equal(result.session.state, "confirmation");
  assert.equal(result.session.data.material, "");
  assert.equal(result.lead, null);
  assert.match(result.messages[0], /Bahan atau model: Belum ada/);
});

test("email marketing consent cannot be enabled without email", () => {
  const session = {
    ...createSession("628123456789"),
    state: "confirmation",
    data: {
      ...createSession().data,
      name: "Rina",
      service: "Pagar geser besi",
      location: "Panakkukang",
      email: "",
      emailMarketingConsent: "Tidak",
    },
  };

  const result = handleMessage(session, "ubah izin email promosi: ya");

  assert.equal(result.session.state, "confirmation");
  assert.equal(result.session.data.emailMarketingConsent, "Tidak");
  assert.equal(result.session.failedUnderstanding, 1);
  assert.equal(result.lead, null);
  assert.match(result.messages[0], /email/i);
});

test("two misunderstandings hand off without creating an incomplete lead", () => {
  const session = {
    ...createSession("628123456789"),
    state: "name",
  };

  const firstResult = handleMessage(session, "");
  const secondResult = handleMessage(firstResult.session, "");

  assert.equal(secondResult.session.state, "handoff");
  assert.equal(
    secondResult.session.handoffReason,
    "Bot tidak memahami dua jawaban berturut-turut",
  );
  assert.equal(secondResult.lead, null);
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
