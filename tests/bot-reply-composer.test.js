import assert from "node:assert/strict";
import test from "node:test";
import { composeReply } from "../assistant/bot/reply-composer.js";

test("uses a concise DeepSeek rewrite that preserves the question", async () => {
  const result = await composeReply({
    deterministicMessages: ["Halo Kak, bisa. Mau bikin atau kerjakan apa?"],
    customerMessage: "halo",
    session: { state: "service", data: {} },
    complete: async () => "Halo Kak, boleh. Mau bikin apa?",
  });

  assert.equal(
    result,
    "Halo Kak, boleh. Mau bikin apa?",
  );
});

test("falls back when model adds AI wording, a price, or exact promise", async () => {
  const fallback = "Admin kami akan cek kebutuhannya dulu, Kak.";

  for (const output of [
    "Saya asisten HIJAOE, ada yang bisa saya bantu?",
    "Bot HIJAOE siap membantu, Kak.",
    "AI kami akan mencatat kebutuhan Kakak.",
    "Harganya sekitar Rp2 juta, Kak.",
    "Pasti selesai hari Senin, Kak.",
    "Kami jamin selesai besok.",
  ]) {
    assert.equal(
      await composeReply({
        deterministicMessages: [fallback],
        complete: async () => output,
      }),
      fallback,
    );
  }
});

test("falls back on timeout, empty output, or excessive length", async () => {
  const fallback = "Bisa dijelaskan ulang, Kak?";

  for (const complete of [
    async () => {
      throw new DOMException("timeout", "AbortError");
    },
    async () => "",
    async () => "x".repeat(801),
  ]) {
    assert.equal(
      await composeReply({ deterministicMessages: [fallback], complete }),
      fallback,
    );
  }
});

test("skips model rewriting for handoff sessions", async () => {
  let called = false;
  const fallback = "Baik, Kak. Saya teruskan ke admin HIJAOE.";
  const result = await composeReply({
    deterministicMessages: [fallback],
    session: { state: "handoff", handoffReason: "Pelanggan meminta admin" },
    complete: async () => {
      called = true;
      return "ignored";
    },
  });

  assert.equal(result, fallback);
  assert.equal(called, false);
});

test("does not send confirmation summaries to DeepSeek", async () => {
  let called = false;
  const fallback = [
    "Ringkasan kebutuhan awal:",
    "Nama: Ari",
    "Lokasi: Gowa",
    "Email: ari@example.com",
  ].join("\n");

  const result = await composeReply({
    deterministicMessages: [fallback],
    customerMessage: "ya",
    session: { state: "confirmation" },
    complete: async () => {
      called = true;
      return "ignored";
    },
  });

  assert.equal(result, fallback);
  assert.equal(called, false);
});

test("does not send sensitive current-message PII to DeepSeek", async () => {
  let captured;
  await composeReply({
    deterministicMessages: ["Boleh tahu nama Kakak untuk catatan admin?"],
    customerMessage: "Nama saya Ari, 085121508159, ari@example.com",
    session: {
      state: "name",
      data: {
        service: "",
        dimensions: "",
        material: "",
        targetTime: "",
      },
    },
    complete: async ({ messages }) => {
      captured = messages;
      return "Boleh tahu nama Kakak untuk catatan admin?";
    },
  });

  const payload = captured.map((message) => message.content).join(" ");
  assert.doesNotMatch(payload, /Ari|085121508159|ari@example\.com/);
});
