import test from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  handleMessage,
  startConversation,
} from "../assistant/conversation-engine.js";
import { business } from "../assets/js/site-data.js";

function sessionAt(state) {
  const base = createSession("628123456789");
  return {
    ...base,
    state,
    data: {
      ...base.data,
      name: "Rina",
      service: "Pagar",
    },
  };
}

test("FAQ answer resumes the current collection question", () => {
  const session = sessionAt("location");
  const result = handleMessage(session, "Jam bukanya kapan?");

  assert.equal(result.session.state, "location");
  assert.match(result.messages[0], /Senin-Sabtu, 08\.00-17\.00/);
  assert.match(result.messages[1], /daerah mana/);
});

test("FAQ answers business address questions with Google Maps", () => {
  const session = sessionAt("location");
  const result = handleMessage(session, "Alamatnya di mana?");

  assert.equal(result.session.state, "location");
  assert.match(result.messages[0], /Bengkel HIJAOE/i);
  assert.match(result.messages[0], /Makassar/i);
  assert.match(result.messages[0], new RegExp(escapeRegExp(business.mapUrl)));
  assert.match(result.messages[1], /daerah mana/);
});

test("customer work location is not treated as a business address FAQ", () => {
  const session = sessionAt("location");
  const result = handleMessage(session, "lokasi pengerjaan saya di Gowa");

  assert.equal(result.session.state, "dimensions");
  assert.equal(result.session.data.location, "lokasi pengerjaan saya di Gowa");
  assert.doesNotMatch(result.messages[0], new RegExp(escapeRegExp(business.mapUrl)));
});

test("FAQ answer resumes the confirmation summary", () => {
  const session = sessionAt("confirmation");
  const result = handleMessage(session, "Jam bukanya kapan?");

  assert.equal(result.session.state, "confirmation");
  assert.match(result.messages[0], /Senin-Sabtu, 08\.00-17\.00/);
  assert.match(result.messages[1], /Ini ringkasannya|Ringkasan kebutuhan awal/);
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("customer can request a human at any state", () => {
  const session = startConversation(createSession("628123456789")).session;
  const result = handleMessage(session, "Saya mau bicara dengan admin");

  assert.equal(result.session.state, "handoff");
  assert.equal(result.session.handoffReason, "Pelanggan meminta admin manusia");
  assert.match(result.messages[0], /admin HIJAOE/);
});

for (const phrase of [
  "Saya mau admin",
  "Saya mau bicara dengan admin",
  "Saya mau bicara sama orangnya",
  "Tolong hubungkan ke admin",
  "Saya ingin bicara dengan CS",
  "Saya ingin bicara langsung dengan manusia",
]) {
  test(`human handoff phrase is detected: ${phrase}`, () => {
    const result = handleMessage(sessionAt("location"), phrase);

    assert.equal(result.session.state, "handoff");
    assert.equal(
      result.session.handoffReason,
      "Pelanggan meminta admin manusia",
    );
    assert.equal(result.lead, null);
  });
}

for (const phrase of [
  "Saya bicara soal pagar agar manusia tidak masuk",
  "Pagar untuk orangnya di rumah sebelah",
  "Saya mau pagar supaya orang tidak masuk",
]) {
  test(`descriptive human wording is not a handoff request: ${phrase}`, () => {
    const result = handleMessage(sessionAt("service"), phrase);

    assert.equal(result.session.state, "location");
    assert.equal(result.session.data.service, phrase);
    assert.equal(result.session.handoffReason, "");
  });
}

for (const phrase of [
  "Berapa harga pagar ini?",
  "Berapa biayanya?",
  "Kisaran harganya?",
  "Biayanya berapa?",
  "Kisaran biaya berapa?",
]) {
  test(`price question hands off without an estimate: ${phrase}`, () => {
    const result = handleMessage(sessionAt("location"), phrase);

    assert.equal(result.session.state, "handoff");
    assert.equal(result.session.handoffReason, "Pelanggan menanyakan harga");
    assert.equal(result.lead, null);
    assert.doesNotMatch(result.messages[0], /Rp|rupiah|juta|ribu/i);
  });
}

test("price questions still hand off while collecting target time", () => {
  const result = handleMessage(
    sessionAt("target_time"),
    "Berapa harga pagar ini?",
  );

  assert.equal(result.session.state, "handoff");
  assert.equal(result.session.handoffReason, "Pelanggan menanyakan harga");
  assert.equal(result.session.data.targetTime, "");
  assert.equal(result.lead, null);
  assert.doesNotMatch(result.messages[0], /Rp|rupiah|juta|ribu/i);
});

test("schedule guarantees are handed to a human", () => {
  const result = handleMessage(
    sessionAt("material"),
    "Bisa dipastikan selesai hari Jumat?",
  );

  assert.equal(result.session.state, "handoff");
  assert.equal(result.session.handoffReason, "Pelanggan meminta kepastian jadwal");
});

test("schedule guarantee wording is collected as target time while collecting target time", () => {
  const result = handleMessage(
    sessionAt("target_time"),
    "Pasti selesai hari Jumat",
  );

  assert.equal(result.session.data.targetTime, "Pasti selesai hari Jumat");
  assert.equal(result.session.state, "photo");
});

test("orangnya alone does not request human handoff", () => {
  const result = handleMessage(
    sessionAt("service"),
    "Pagar untuk orangnya di rumah sebelah",
  );

  assert.equal(result.session.state, "location");
  assert.equal(result.session.data.service, "Pagar untuk orangnya di rumah sebelah");
  assert.equal(result.session.handoffReason, "");
});

test("service request mentioning orang does not request human handoff", () => {
  const result = handleMessage(
    sessionAt("service"),
    "Saya mau pagar supaya orang tidak masuk",
  );

  assert.equal(result.session.state, "location");
  assert.equal(result.session.data.service, "Saya mau pagar supaya orang tidak masuk");
  assert.equal(result.session.handoffReason, "");
});

test("ordinary conversation mentioning bicara and orang does not request human handoff", () => {
  const result = handleMessage(
    sessionAt("service"),
    "Saya mau bicara soal pagar agar orang tidak masuk",
  );

  assert.equal(result.session.state, "location");
  assert.equal(
    result.session.data.service,
    "Saya mau bicara soal pagar agar orang tidak masuk",
  );
  assert.equal(result.session.handoffReason, "");
});

for (const state of ["handoff", "closed"]) {
  test(`${state} session stays silent and unchanged`, () => {
    const session = {
      ...sessionAt(state),
      handoffReason: "Sudah dialihkan",
    };

    const result = handleMessage(session, "Halo?");

    assert.strictEqual(result.session, session);
    assert.deepEqual(result.messages, []);
    assert.equal(result.lead, null);
  });
}
