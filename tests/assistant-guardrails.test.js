import test from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  handleMessage,
  startConversation,
} from "../assistant/conversation-engine.js";

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

test("FAQ answer resumes the confirmation summary", () => {
  const session = sessionAt("confirmation");
  const result = handleMessage(session, "Jam bukanya kapan?");

  assert.equal(result.session.state, "confirmation");
  assert.match(result.messages[0], /Senin-Sabtu, 08\.00-17\.00/);
  assert.match(result.messages[1], /Ini ringkasannya|Ringkasan kebutuhan awal/);
});

test("customer can request a human at any state", () => {
  const session = startConversation(createSession("628123456789")).session;
  const result = handleMessage(session, "Saya mau bicara dengan admin");

  assert.equal(result.session.state, "handoff");
  assert.equal(result.session.handoffReason, "Pelanggan meminta admin manusia");
  assert.match(result.messages[0], /admin HIJAOE/);
});

test("price questions are handed to a human without an estimate", () => {
  const result = handleMessage(sessionAt("location"), "Berapa harga pagar ini?");

  assert.equal(result.session.state, "handoff");
  assert.equal(result.session.handoffReason, "Pelanggan menanyakan harga");
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

test("a target-time answer is collected instead of treated as a guarantee", () => {
  const result = handleMessage(sessionAt("target_time"), "Bulan depan");

  assert.equal(result.session.data.targetTime, "Bulan depan");
  assert.equal(result.session.state, "photo");
});
