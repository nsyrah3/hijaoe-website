import test from "node:test";
import assert from "node:assert/strict";
import { createSession } from "../assistant/conversation-engine.js";
import {
  buildModelContext,
  sanitizeTextForModel,
} from "../assistant/privacy.js";

test("sanitizer removes email, phone, and explicit name introductions", () => {
  const sanitized = sanitizeTextForModel(
    "Nama saya Rina, nomor 0812-3456-7890 dan email rina@example.com. Mau buat pagar.",
  );

  assert.doesNotMatch(sanitized, /Rina/);
  assert.doesNotMatch(sanitized, /0812/);
  assert.doesNotMatch(sanitized, /rina@example\.com/);
  assert.match(sanitized, /\[nama\]/);
  assert.match(sanitized, /\[nomor\]/);
  assert.match(sanitized, /\[email\]/);
});

test("model context excludes stored identity and location fields", () => {
  const base = createSession("628123456789");
  const session = {
    ...base,
    state: "material",
    data: {
      ...base.data,
      name: "Rina",
      email: "rina@example.com",
      location: "Jalan Mawar 10",
      service: "Pagar besi",
      dimensions: "4 x 2 meter",
      material: "Besi hollow",
      targetTime: "Bulan depan",
      photoReferences: "https://example.com/private-photo.jpg",
    },
  };

  const context = buildModelContext(
    session,
    "Hubungi saya di 081234567890 untuk model minimalis",
  );
  const serialized = JSON.stringify(context);

  assert.doesNotMatch(serialized, /Rina|rina@example|Jalan Mawar|private-photo/);
  assert.doesNotMatch(serialized, /081234567890/);
  assert.equal(context.service, "Pagar besi");
  assert.equal(context.dimensions, "4 x 2 meter");
});
