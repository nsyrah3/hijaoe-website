import assert from "node:assert/strict";
import test from "node:test";
import { createSession } from "../assistant/conversation-engine.js";
import {
  buildConversationMessages,
  runDeepSeekConversation,
} from "../assistant/bot/deepseek-conversation.js";

test("extracts lead fields and returns a natural DeepSeek reply", async () => {
  const result = await runDeepSeekConversation({
    session: createSession("628111"),
    messages: ["saya mau meja sekolah", "untuk daerah gowa"],
    complete: async () =>
      JSON.stringify({
        reply:
          "Siap Kak, meja sekolah untuk Gowa ya. Ada ukuran atau jumlah meja yang dibutuhkan?",
        dataPatch: { service: "Meja sekolah", location: "Gowa" },
        state: "active",
        readyToConfirm: false,
        handoff: false,
        handoffReason: "",
        historySummary: "Pelanggan butuh meja sekolah di Gowa.",
      }),
  });

  assert.equal(result.replyIsFinal, true);
  assert.equal(result.session.state, "active");
  assert.equal(result.session.data.service, "Meja sekolah");
  assert.equal(result.session.data.location, "Gowa");
  assert.match(result.messages[0], /ukuran|jumlah/i);
});

test("allows a transparent AI intro on the first DeepSeek reply and marks it shown", async () => {
  const result = await runDeepSeekConversation({
    session: createSession("628111"),
    messages: ["halo kak"],
    complete: async ({ messages }) => {
      const prompt = JSON.stringify(messages);
      assert.match(prompt, /introShown/);
      assert.match(prompt, /asisten digital|AI/i);

      return JSON.stringify({
        reply:
          "Halo Kak, saya AI agent HIJAOE. Saya bantu catat dulu kebutuhan Kakak, nanti saya teruskan ke admin ya. Mau dibantu buat apa?",
        dataPatch: {},
        state: "active",
        readyToConfirm: false,
        handoff: false,
        handoffReason: "",
        historySummary: "Pelanggan menyapa admin HIJAOE.",
      });
    },
  });

  assert.equal(result.session.introShown, true);
  assert.match(result.messages[0], /AI agent HIJAOE/);
});

test("tells DeepSeek not to repeat the intro once it was shown", () => {
  const session = {
    ...createSession("628111"),
    introShown: true,
  };

  const messages = buildConversationMessages({
    session,
    messages: ["saya mau meja sekolah"],
  });

  const prompt = JSON.stringify(messages);
  assert.match(prompt, /introShown/);
  assert.match(prompt, /jangan ulangi intro/i);
});

test("falls back when DeepSeek returns invalid JSON", async () => {
  const result = await runDeepSeekConversation({
    session: createSession("628111"),
    messages: ["halo"],
    complete: async () => "{",
  });

  assert.equal(
    result.messages[0],
    "Maaf Kak, boleh dikirim ulang singkat kebutuhannya? Nanti saya catat untuk admin.",
  );
  assert.equal(result.session.state, "active");
});

test("rejects restricted DeepSeek replies", async () => {
  for (const reply of [
    "Harganya Rp2 juta, Kak.",
    "Saya bot HIJAOE, siap membantu.",
    "Ini hanya template otomatis.",
    "Pasti selesai hari Senin.",
  ]) {
    const result = await runDeepSeekConversation({
      session: createSession("628111"),
      messages: ["halo"],
      complete: async () =>
        JSON.stringify({
          reply,
          dataPatch: {},
          state: "active",
          readyToConfirm: false,
          handoff: false,
          handoffReason: "",
          historySummary: "",
        }),
    });

    assert.notEqual(result.messages[0], reply);
    assert.doesNotMatch(
      result.messages[0],
      /Rp2 juta|bot HIJAOE|template otomatis|Pasti selesai/i,
    );
  }
});

test("creates a lead when a confirmation session is accepted", async () => {
  const session = {
    ...createSession("628111"),
    state: "confirming",
    data: {
      ...createSession("628111").data,
      name: "Ari",
      service: "Meja sekolah",
      location: "Gowa",
    },
  };

  const result = await runDeepSeekConversation({
    session,
    messages: ["ya"],
    complete: async () => {
      throw new Error("should not call DeepSeek for local confirmation");
    },
    now: new Date("2026-06-30T04:00:00.000Z"),
  });

  assert.equal(result.session.state, "handoff");
  assert.equal(result.lead.customer_name, "Ari");
  assert.equal(result.lead.service_type, "Meja sekolah");
  assert.equal(result.lead.created_at, "2026-06-30T04:00:00.000Z");
});
