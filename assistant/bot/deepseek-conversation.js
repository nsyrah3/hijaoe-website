import {
  buildLead,
  buildSummary,
} from "../conversation-engine.js";
import {
  COMPLETION_MESSAGE,
  HANDOFF_MESSAGE,
  EMPTY_CUSTOMER_DATA,
} from "../assistant-data.js";
import {
  detectHandoffRequest,
  detectPriceIntent,
  detectScheduleGuaranteeIntent,
} from "../faq.js";

const FALLBACK_REPLY =
  "Maaf Kak, boleh dikirim ulang singkat kebutuhannya? Nanti saya catat untuk admin.";
const PHOTO_RECEIVED_FALLBACK_REPLY =
  "Baik Kak, fotonya sudah saya terima dan saya catat sebagai referensi modelnya. Nanti admin HIJAOE bantu cek detail lanjutannya.";
const TECHNICAL_DECISION_FALLBACK_REPLY =
  "Baik Kak, fotonya saya catat sebagai referensi. Untuk ukuran pastinya nanti admin HIJAOE bantu tentukan sesuai model dan kebutuhan Kakak.";
const RESTRICTED_HANDOFF_REPLY =
  "Siap Kak, untuk bagian itu saya teruskan ke admin HIJAOE biar dicek langsung.";
const CONFIRMATION_WORDS = new Set(["ya", "iya", "benar", "sudah benar"]);
const PATCH_KEYS = new Set(Object.keys(EMPTY_CUSTOMER_DATA));
const ALLOWED_STATES = new Set(["active", "confirming", "handoff", "closed"]);
const RESTRICTED_REPLY = [
  /\b(?:bot|robot|template|otomasi)\b/i,
  /\bRp\s?[\d.,]+/i,
  /\b\d+(?:[.,]\d+)?\s*(?:ribu|juta|jt)\b/i,
  /\bharga(?:nya)?\s+(?:sekitar|mulai|hanya)?/i,
  /\bpasti\s+selesai\b/i,
  /\bjamin(?:an)?\s+selesai\b/i,
  /\bselesai\s+(?:besok|hari\s+\w+)\b/i,
];
const PHOTO_CONTEXT_PATTERN = /\[Foto diterima/i;
const PHOTO_REQUEST_PATTERN =
  /\b(?:kirim(?:kan)?|upload|unggah)\s+(?:ulang\s+)?(?:foto|fotonya|gambar|gambarnya)\b|\b(?:foto|fotonya|gambar|gambarnya)\s+(?:boleh\s+)?(?:dikirim|diupload|diunggah)\b/i;
const STANDARD_SIZE_CLAIM_PATTERN =
  /\bukuran\s+standar\b|\bstandar\s+yang\s+sering\s+(?:kami|kita)\s+buat\b/i;
const DIMENSION_SEQUENCE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?\s*(?:cm|mm|meter|m)?\b/gi;
const DIMENSION_WITH_UNIT_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:cm|mm|meter|m)\b/gi;
const NUMBER_PATTERN = /\d+(?:[.,]\d+)?/g;

export async function runDeepSeekConversation({
  session,
  messages = [],
  complete,
  now = new Date(),
}) {
  const customerText = messages.map((message) => String(message || "").trim())
    .filter(Boolean)
    .join("\n");
  const normalized = customerText.toLowerCase();
  const currentSession = normalizeSession(session);

  if (currentSession.state === "confirming" && CONFIRMATION_WORDS.has(normalized)) {
    const nextSession = {
      ...currentSession,
      state: "handoff",
      completed: true,
      handoffReason: "Kebutuhan awal sudah dikonfirmasi",
    };

    return {
      session: nextSession,
      messages: [COMPLETION_MESSAGE, HANDOFF_MESSAGE],
      lead: buildLead(nextSession, now),
      replyIsFinal: true,
    };
  }

  const restrictedReason = detectRestrictedReason(customerText);
  if (restrictedReason) {
    return handoff(currentSession, restrictedReason);
  }

  if (typeof complete !== "function") {
    return fallback(currentSession);
  }

  try {
    const rawOutput = await complete({
      messages: buildConversationMessages({
        session: currentSession,
        messages,
      }),
    });
    const output = normalizeDeepSeekConversationOutput(rawOutput);

    if (
      output.handoff ||
      output.state === "handoff" ||
      output.handoffReason
    ) {
      const nextSession = applyOutput(currentSession, output);
      return handoff(nextSession, output.handoffReason || "DeepSeek meminta handoff");
    }

    const restrictedOutputReason = getRestrictedOutputReason(output, {
      session: currentSession,
      customerText,
    });
    if (restrictedOutputReason) {
      return fallback(
        currentSession,
        fallbackReplyForRestriction(restrictedOutputReason),
      );
    }

    const nextSession = applyOutput(currentSession, output);

    if (output.readyToConfirm && hasMinimumLeadData(nextSession)) {
      const confirmingSession = {
        ...nextSession,
        state: "confirming",
      };
      return {
        session: confirmingSession,
        messages: [output.reply || buildSummary(confirmingSession)],
        lead: null,
        replyIsFinal: true,
      };
    }

    return {
      session: {
        ...nextSession,
        state: nextSession.state === "welcome" ? "active" : nextSession.state,
      },
      messages: [output.reply || FALLBACK_REPLY],
      lead: null,
      replyIsFinal: true,
    };
  } catch {
    return fallback(currentSession);
  }
}

export function buildConversationMessages({ session, messages }) {
  return [
    {
      role: "system",
      content: [
        "Anda adalah admin WhatsApp HIJAOE, usaha jasa konstruksi, las besi, aluminium kaca, kanopi, plafon, partisi, interior, furnitur, dan meja kursi sekolah di area Makassar, Gowa, Maros, dan sekitar.",
        "Balas hanya JSON valid.",
        "Tulis reply dengan bahasa Indonesia natural seperti admin manusia, singkat, sopan, dan tidak kaku.",
        "Jika session.introShown false, buka dengan penjelasan singkat dalam kata-katamu sendiri bahwa kamu asisten digital atau AI agent HIJAOE yang membantu mencatat kebutuhan pelanggan lalu meneruskannya ke admin.",
        "Jika session.introShown true, jangan ulangi intro AI/asisten digital; langsung lanjutkan konteks percakapan.",
        "Jangan menyebut bot, robot, template, otomasi, atau proses internal.",
        "Jangan memberi harga, kisaran biaya, DP, diskon, atau angka rupiah.",
        "Jangan memberi kepastian survei, produksi, pemasangan, atau tanggal selesai.",
        "Jangan mengarang stok, ketersediaan bahan, ukuran standar, angka dimensi, atau keputusan struktur.",
        "Jangan menyebut ukuran pasti atau ukuran standar kecuali pelanggan sudah menyebut ukuran itu.",
        "Jika customerMessages berisi [Foto diterima...] atau data.photoReferences sudah terisi, jangan minta foto lagi; akui bahwa foto sudah diterima.",
        "Jika pelanggan meminta kamu menentukan ukuran atau detail teknis, jangan menentukan sendiri; katakan admin HIJAOE akan bantu sesuaikan dari referensi dan kebutuhan.",
        "Kalau pelanggan tanya harga, negosiasi, komplain, minta admin, atau minta jadwal pasti, set handoff true.",
        "Ekstrak data yang sudah jelas disebut pelanggan dan jangan tanya ulang data yang sudah ada.",
        "Jika data kurang, tanyakan satu hal utama yang paling masuk akal.",
        "Schema JSON: {\"reply\":\"\",\"dataPatch\":{\"name\":\"\",\"service\":\"\",\"location\":\"\",\"dimensions\":\"\",\"material\":\"\",\"targetTime\":\"\",\"photoReferences\":\"\",\"email\":\"\",\"emailMarketingConsent\":\"\"},\"state\":\"active|confirming|handoff|closed\",\"readyToConfirm\":false,\"handoff\":false,\"handoffReason\":\"\",\"historySummary\":\"\"}",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        session: {
          state: session.state,
          introShown: session.introShown === true,
          data: session.data,
          historySummary: session.historySummary || "",
        },
        customerMessages: messages,
      }),
    },
  ];
}

export function normalizeDeepSeekConversationOutput(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("DeepSeek conversation output must be an object");
  }

  const dataPatch = {};
  if (parsed.dataPatch && typeof parsed.dataPatch === "object") {
    for (const [key, value] of Object.entries(parsed.dataPatch)) {
      if (PATCH_KEYS.has(key)) {
        dataPatch[key] = normalizePatchValue(value);
      }
    }
  }

  const state = ALLOWED_STATES.has(parsed.state) ? parsed.state : "active";

  return {
    reply: limitText(parsed.reply, 1200),
    dataPatch,
    state,
    readyToConfirm: parsed.readyToConfirm === true,
    handoff: parsed.handoff === true,
    handoffReason: limitText(parsed.handoffReason, 160),
    historySummary: limitText(parsed.historySummary, 500),
  };
}

function normalizeSession(session) {
  return {
    ...session,
    state: session?.state && session.state !== "welcome" ? session.state : "active",
    data: {
      ...EMPTY_CUSTOMER_DATA,
      ...(session?.data || {}),
    },
    failedUnderstanding: session?.failedUnderstanding || 0,
    handoffReason: session?.handoffReason || "",
    completed: session?.completed === true,
    introShown: session?.introShown === true,
  };
}

function applyOutput(session, output) {
  const nextData = { ...session.data };
  for (const [key, value] of Object.entries(output.dataPatch)) {
    if (value === null && isOptionalKey(key)) {
      nextData[key] = "";
    } else if (typeof value === "string" && value.trim()) {
      nextData[key] = value.trim();
    }
  }

  return {
    ...session,
    state: output.state,
    data: nextData,
    historySummary: output.historySummary || session.historySummary || "",
    failedUnderstanding: 0,
    introShown: session.introShown || Boolean(output.reply),
  };
}

function fallback(session, reply = FALLBACK_REPLY) {
  return {
    session: {
      ...session,
      state: session.state === "welcome" ? "active" : session.state,
    },
    messages: [reply],
    lead: null,
    replyIsFinal: true,
  };
}

function handoff(session, reason) {
  const nextSession = {
    ...session,
    state: "handoff",
    handoffReason: reason,
  };
  return {
    session: nextSession,
    messages: [RESTRICTED_HANDOFF_REPLY],
    lead: null,
    replyIsFinal: true,
  };
}

function detectRestrictedReason(text) {
  if (detectHandoffRequest(text)) {
    return "Pelanggan meminta admin manusia";
  }
  return detectPriceIntent(text) || detectScheduleGuaranteeIntent(text);
}

function getRestrictedOutputReason(output, context) {
  if (isRestrictedReply(output.reply)) {
    return "restricted_reply";
  }
  if (
    hasPhotoContext(context.session, context.customerText) &&
    PHOTO_REQUEST_PATTERN.test(output.reply)
  ) {
    return "photo_already_received";
  }
  if (
    hasUnsupportedDimensionClaim(
      [output.reply, output.dataPatch.dimensions || ""].join("\n"),
      context,
    )
  ) {
    return "unsupported_dimensions";
  }
  return "";
}

function fallbackReplyForRestriction(reason) {
  if (reason === "photo_already_received") {
    return PHOTO_RECEIVED_FALLBACK_REPLY;
  }
  if (reason === "unsupported_dimensions") {
    return TECHNICAL_DECISION_FALLBACK_REPLY;
  }
  return FALLBACK_REPLY;
}

function isRestrictedReply(reply) {
  return RESTRICTED_REPLY.some((pattern) => pattern.test(reply));
}

function hasPhotoContext(session, customerText) {
  return Boolean(
    session.data.photoReferences.trim() ||
      PHOTO_CONTEXT_PATTERN.test(customerText),
  );
}

function hasUnsupportedDimensionClaim(text, { session, customerText }) {
  if (!String(text || "").trim()) {
    return false;
  }
  if (STANDARD_SIZE_CLAIM_PATTERN.test(text)) {
    return true;
  }

  const replyDimensions = extractDimensionNumbers(text);
  if (replyDimensions.size === 0) {
    return false;
  }

  const knownDimensions = extractDimensionNumbers(
    [customerText, session.data.dimensions].join("\n"),
  );
  for (const value of replyDimensions) {
    if (!knownDimensions.has(value)) {
      return true;
    }
  }
  return false;
}

function extractDimensionNumbers(text) {
  const values = new Set();
  for (const pattern of [DIMENSION_SEQUENCE_PATTERN, DIMENSION_WITH_UNIT_PATTERN]) {
    pattern.lastIndex = 0;
    for (const match of String(text || "").matchAll(pattern)) {
      const numbers = match[0].match(NUMBER_PATTERN) || [];
      for (const number of numbers) {
        values.add(normalizeDimensionNumber(number));
      }
    }
  }
  return values;
}

function normalizeDimensionNumber(value) {
  return String(value || "")
    .replace(",", ".")
    .replace(/^0+(?=\d)/, "");
}

function hasMinimumLeadData(session) {
  return Boolean(
    session.data.service.trim() &&
      session.data.location.trim() &&
      session.data.name.trim(),
  );
}

function normalizePatchValue(value) {
  if (value === null) {
    return null;
  }
  return limitText(value, 500);
}

function limitText(value, maxLength) {
  const text = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

function isOptionalKey(key) {
  return !["name", "service", "location"].includes(key);
}
