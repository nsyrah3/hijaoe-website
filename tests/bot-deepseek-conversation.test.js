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
          "Halo Kak, saya AI agent HIJAOE. Saya bantu catat dulu kebutuhan Kakak. Mau dibantu buat apa?",
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

test("first intro prompt focuses on collecting lead info without promising admin forwarding", () => {
  const messages = buildConversationMessages({
    session: createSession("628111"),
    messages: ["halo kak"],
  });
  const systemPrompt = messages[0].content;

  assert.match(systemPrompt, /mencatat kebutuhan/i);
  assert.doesNotMatch(systemPrompt, /menerus(?:kan|kannya)\s+ke\s+admin/i);
  assert.doesNotMatch(systemPrompt, /teruskan\s+ke\s+admin/i);
  assert.match(systemPrompt, /service/i);
  assert.match(systemPrompt, /location/i);
  assert.match(systemPrompt, /dimensions/i);
  assert.match(systemPrompt, /material/i);
  assert.match(systemPrompt, /targetTime/i);
  assert.match(systemPrompt, /photoReferences/i);
  assert.match(systemPrompt, /Belum ditentukan/i);
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

test("does not ask for another photo after a photo was already received", async () => {
  const session = {
    ...createSession("628111"),
    introShown: true,
    data: {
      ...createSession("628111").data,
      service: "Meja sekolah",
      location: "Gowa",
      photoReferences: "https://drive.google.com/file/d/photo/view",
    },
  };

  const result = await runDeepSeekConversation({
    session,
    messages: [
      "itu kak modelnya\n[Foto diterima: https://drive.google.com/file/d/photo/view]",
    ],
    complete: async () =>
      JSON.stringify({
        reply:
          "Silakan kirim fotonya, nanti admin kami bantu tentukan ukuran yang pas.",
        dataPatch: {},
        state: "active",
        readyToConfirm: false,
        handoff: false,
        handoffReason: "",
        historySummary: "",
      }),
  });

  assert.notEqual(
    result.messages[0],
    "Silakan kirim fotonya, nanti admin kami bantu tentukan ukuran yang pas.",
  );
  assert.match(result.messages[0], /fotonya sudah.*terima|foto.*catat/i);
  assert.doesNotMatch(result.messages[0], /kirim(?:kan)?\s+fotonya/i);
});

test("does not send exact dimensions that the customer never provided", async () => {
  const session = {
    ...createSession("628111"),
    introShown: true,
    data: {
      ...createSession("628111").data,
      service: "Meja sekolah",
      location: "Gowa",
      photoReferences: "https://drive.google.com/file/d/photo/view",
    },
  };

  const result = await runDeepSeekConversation({
    session,
    messages: ["kamu tentukan coba"],
    complete: async () =>
      JSON.stringify({
        reply:
          "Baik kak, ukuran standar yang sering kami buat biasanya panjang 120cm x lebar 60cm x tinggi 75cm.",
        dataPatch: { dimensions: "120cm x 60cm x 75cm" },
        state: "active",
        readyToConfirm: false,
        handoff: false,
        handoffReason: "",
        historySummary: "",
      }),
  });

  assert.notEqual(
    result.messages[0],
    "Baik kak, ukuran standar yang sering kami buat biasanya panjang 120cm x lebar 60cm x tinggi 75cm.",
  );
  assert.doesNotMatch(result.messages[0], /120cm|60cm|75cm/i);
  assert.match(result.messages[0], /admin HIJAOE.*ukuran|ukuran.*admin HIJAOE/i);
  assert.match(result.session.data.dimensions, /belum ditentukan/i);
  assert.doesNotMatch(result.session.data.dimensions, /120cm|60cm|75cm/i);
});

test("records deferred dimensions and lets DeepSeek move to the next missing lead field", async () => {
  const session = {
    ...createSession("628111"),
    introShown: true,
    historySummary: "Admin menanyakan ukuran atau spesifikasi tambahan.",
    data: {
      ...createSession("628111").data,
      service: "Meja sekolah",
      location: "Gowa",
      photoReferences: "https://drive.google.com/file/d/photo/view",
    },
  };

  const result = await runDeepSeekConversation({
    session,
    messages: ["kamu tentukan coba"],
    complete: async () =>
      JSON.stringify({
        reply:
          "Siap Kak, ukuran nanti kami sesuaikan dari referensi modelnya. Boleh tahu atas nama siapa untuk catatan?",
        dataPatch: {},
        state: "active",
        readyToConfirm: false,
        handoff: false,
        handoffReason: "",
        historySummary:
          "Pelanggan menyerahkan ukuran meja sekolah kepada HIJAOE dari foto referensi.",
      }),
  });

  assert.match(result.session.data.dimensions, /belum ditentukan/i);
  assert.match(result.messages[0], /atas nama siapa|nama/i);
});

test("records absent photo references so DeepSeek does not ask for them again", async () => {
  const session = {
    ...createSession("628111"),
    introShown: true,
    data: {
      ...createSession("628111").data,
      service: "Meja sekolah",
      location: "Tamalanrea",
    },
  };

  const result = await runDeepSeekConversation({
    session,
    messages: ["gada refrensi foto"],
    complete: async () =>
      JSON.stringify({
        reply: "Baik Kak, tidak masalah kalau belum ada foto referensi. Boleh tahu target waktunya kapan?",
        dataPatch: {},
        state: "active",
        readyToConfirm: false,
        handoff: false,
        handoffReason: "",
        historySummary: "Pelanggan tidak memiliki foto referensi.",
      }),
  });

  assert.match(result.session.data.photoReferences, /tidak ada referensi foto/i);
  assert.doesNotMatch(result.messages[0], /kirim(?:kan)?\s+foto|referensi foto.*dikirim/i);
});

test("records natural color as material or style context", async () => {
  const session = {
    ...createSession("628111"),
    introShown: true,
    data: {
      ...createSession("628111").data,
      service: "Meja sekolah",
      location: "Tamalanrea",
    },
  };

  const result = await runDeepSeekConversation({
    session,
    messages: ["warna natural aja"],
    complete: async () =>
      JSON.stringify({
        reply: "Baik Kak, warna natural saya catat. Ada referensi foto atau contoh model?",
        dataPatch: {},
        state: "active",
        readyToConfirm: false,
        handoff: false,
        handoffReason: "",
        historySummary: "Pelanggan memilih warna natural.",
      }),
  });

  assert.match(result.session.data.material, /warna natural/i);
});

test("does not invent available color options", async () => {
  const session = {
    ...createSession("628111"),
    introShown: true,
    data: {
      ...createSession("628111").data,
      service: "Meja sekolah",
      location: "Tamalanrea",
    },
  };

  const result = await runDeepSeekConversation({
    session,
    messages: ["emang ada warna apa aja"],
    complete: async () =>
      JSON.stringify({
        reply:
          "Pilihan warna standar biasanya biru, hijau, merah, kuning, dan putih. Ada preferensi warna tertentu?",
        dataPatch: {},
        state: "active",
        readyToConfirm: false,
        handoff: false,
        handoffReason: "",
        historySummary: "",
      }),
  });

  assert.notEqual(
    result.messages[0],
    "Pilihan warna standar biasanya biru, hijau, merah, kuning, dan putih. Ada preferensi warna tertentu?",
  );
  assert.doesNotMatch(result.messages[0], /biru, hijau, merah, kuning/i);
  assert.match(result.messages[0], /warna.*sesuai|disesuaikan/i);
});

test("does not ask for contact after the customer name is already known", async () => {
  const session = {
    ...createSession("628111"),
    introShown: true,
    data: {
      ...createSession("628111").data,
      name: "Nasroh",
      service: "Meja & Kursi Sekolah",
      location: "Tamalanrea",
      dimensions: "Belum ditentukan",
      material: "Warna natural",
      targetTime: "Secepatnya",
      photoReferences: "Tidak ada referensi foto",
    },
  };

  const result = await runDeepSeekConversation({
    session,
    messages: ["nasroh"],
    complete: async () =>
      JSON.stringify({
        reply:
          "Terima kasih, Kak Nasroh. Untuk kelengkapan data, boleh kami tahu nama lengkap dan kontak yang bisa dihubungi?",
        dataPatch: {},
        state: "active",
        readyToConfirm: false,
        handoff: false,
        handoffReason: "",
        historySummary: "",
      }),
  });

  assert.equal(result.session.state, "confirming");
  assert.match(result.messages[0], /Ringkasan kebutuhan awal/);
  assert.doesNotMatch(result.messages[0], /kontak|nomor|nama lengkap/i);
});

test("allows exact dimensions when they came from the customer", async () => {
  const session = {
    ...createSession("628111"),
    introShown: true,
    data: {
      ...createSession("628111").data,
      service: "Meja sekolah",
      location: "Gowa",
      dimensions: "120cm x 60cm x 75cm",
    },
  };

  const reply =
    "Saya catat ukuran 120cm x 60cm x 75cm ya, Kak. Ada jumlah meja yang dibutuhkan?";

  const result = await runDeepSeekConversation({
    session,
    messages: ["ukurannya 120cm x 60cm x 75cm"],
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

  assert.equal(result.messages[0], reply);
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
