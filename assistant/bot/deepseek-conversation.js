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
  findFaq,
} from "../faq.js";

const FALLBACK_REPLY =
  "Maaf Kak, boleh dikirim ulang singkat kebutuhannya? Nanti saya catat untuk admin.";
const PHOTO_RECEIVED_FALLBACK_REPLY =
  "Baik Kak, fotonya sudah saya terima dan saya catat sebagai referensi modelnya. Nanti admin HIJAOE bantu cek detail lanjutannya.";
const NO_PHOTO_REFERENCES_VALUE = "Tidak ada referensi foto";
const DEFERRED_DIMENSIONS_VALUE =
  "Belum ditentukan, admin HIJAOE menyesuaikan dari referensi dan kebutuhan";
const COLOR_OPTIONS_FALLBACK_REPLY =
  "Saya catat pertanyaan soal pilihan warna. Detailnya nanti admin HIJAOE cek, Kak. Kalau Kakak punya preferensi warna, boleh disebutkan.";
const UNSUPPORTED_DETAIL_FALLBACK_REPLY =
  "Saya catat pertanyaannya, Kak. Detail itu nanti admin HIJAOE cek dulu supaya tidak salah info.";
const NAME_ONLY_FALLBACK_REPLY =
  "Boleh tahu atas nama siapa untuk catatan, Kak?";
const TECHNICAL_DECISION_FALLBACK_REPLY =
  "Baik Kak, fotonya saya catat sebagai referensi. Untuk ukuran pastinya nanti admin HIJAOE bantu tentukan sesuai model dan kebutuhan Kakak.";
const LINEAR_OR_AREA_SCOPE_FALLBACK_REPLY =
  "Baik Kak. Kalau ada, boleh kirim perkiraan ukuran, panjang area, atau foto lokasinya supaya kebutuhan awalnya bisa saya catat.";
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
const DIMENSION_DEFER_PATTERN =
  /\b(?:kamu|admin|hijaoe|tim)?\s*(?:tentukan|sesuaikan)\b|\b(?:terserah|bebas|belum tahu|tidak tahu|nggak tahu|ga tau|gak tau|belum ada ukuran)\b/i;
const DIMENSION_CONTEXT_PATTERN =
  /\b(?:ukuran|dimensi|panjang|lebar|tinggi|spesifikasi|size)\b/i;
const NO_PHOTO_REFERENCES_PATTERN =
  /\b(?:gak|ga|nggak|ngga|tidak|belum|gada|nggada|enggak)\s*(?:ada|punya)?\s*(?:(?:refe?rensi|refrensi)\s*)?(?:foto|gambar|model)\b|\b(?:foto|gambar|model|refe?rensi|refrensi)\s*(?:gak|ga|nggak|ngga|tidak|belum|gada|nggada|enggak)\s*(?:ada|punya)?\b/i;
const COLOR_QUESTION_PATTERN =
  /\bwarna\b.*\b(?:apa|apa aja|apa saja|pilihan|tersedia)\b|\b(?:apa|apa aja|apa saja|pilihan)\b.*\bwarna\b/i;
const COLOR_PREFERENCE_PATTERN =
  /\bwarna(?:nya)?\s+([a-zA-Z0-9\s-]{2,60})/i;
const UNSUPPORTED_COLOR_OPTIONS_PATTERN =
  /\b(?:biru|hijau|merah|kuning|putih)\s*,\s*(?:biru|hijau|merah|kuning|putih)\b|\bpilihan warna standar\b|\bwarna standar\b/i;
const UNSUPPORTED_AVAILABILITY_CLAIM_PATTERN =
  /\btersedia\b.*\b(?:bahan|warna|pilihan|stok|model)\b|\b(?:bahan|warna|pilihan|stok|model)\b.*\btersedia\b|\bkami\s+(?:punya|menyediakan)\b|\b(?:kayu jati|multipleks|besi hollow|aluminium)\b/i;
const CONTACT_OR_REDUNDANT_NAME_REQUEST_PATTERN =
  /\b(?:kontak|nomor|no\.?|wa|whatsapp|telepon|hp)\b|\bnama lengkap\b|\bnama pemesan\b|\batas nama siapa\b/i;
const QUANTITY_REQUEST_PATTERN =
  /\bberapa\s+(?:jumlah|banyak|unit|set|buah|pcs|item)\b|\bjumlah(?:nya)?\b|\bbutuh\s+berapa\b/i;
const UNIT_BASED_SERVICE_PATTERN =
  /\b(?:meja|kursi|bangku|lemari|rak|kabinet|furnitur|furniture)\b/i;
const LINEAR_OR_AREA_SERVICE_PATTERN =
  /\b(?:pagar|kanopi|railing|plafon|partisi|aluminium|alumunium|kaca|kusen|pintu|jendela|atap|baja ringan|kitchen set|dapur|teras|dinding)\b/i;
const FENCE_SERVICE_PATTERN = /\b(?:pagar|railing|teralis|gerbang)\b/i;
const CANOPY_SERVICE_PATTERN = /\b(?:kanopi|atap|baja ringan)\b/i;
const CEILING_SERVICE_PATTERN = /\b(?:plafon|partisi|gypsum|gipsum|pvc)\b/i;
const ALUMINIUM_GLASS_SERVICE_PATTERN =
  /\b(?:aluminium|alumunium|kaca|kusen|pintu|jendela)\b/i;
const CUSTOMER_DETAIL_QUESTION_TOPIC_PATTERN =
  /\b(?:bahan|warna|model|stok|pilihan|ukuran|custom|tersedia|ready|finishing|spesifikasi)\b/i;
const QUESTION_INTENT_PATTERN =
  /\?|(?:apa|apakah|bisa|boleh|emang|memang|gimana|bagaimana|berapa|tersedia|ready)\b/i;

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
  const currentSession = applyCustomerContextPatches(
    normalizeSession(session),
    customerText,
  );

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

  const faq = findFaq(customerText);
  if (faq) {
    return {
      session: currentSession,
      messages: [faq.answer],
      lead: null,
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
      if (
        restrictedOutputReason === "unneeded_contact_or_name" &&
        hasMinimumLeadData(currentSession)
      ) {
        const confirmingSession = {
          ...currentSession,
          state: "confirming",
        };
        return {
          session: confirmingSession,
          messages: [buildSummary(confirmingSession)],
          lead: null,
          replyIsFinal: true,
        };
      }
      return fallback(
        currentSession,
        fallbackReplyForRestriction(restrictedOutputReason),
      );
    }

    const nextSession = applyOutput(currentSession, output);

    if (hasMinimumLeadData(nextSession)) {
      const confirmingSession = {
        ...nextSession,
        state: "confirming",
      };
      return {
        session: confirmingSession,
        messages: [
          output.readyToConfirm && output.reply
            ? output.reply
            : buildSummary(confirmingSession),
        ],
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
        "Jika session.introShown false, buka dengan penjelasan singkat dalam kata-katamu sendiri bahwa kamu asisten digital atau AI agent HIJAOE yang membantu mencatat kebutuhan pelanggan.",
        "Jika session.introShown true, jangan ulangi intro AI/asisten digital; langsung lanjutkan konteks percakapan.",
        "Tujuan utama percakapan adalah melengkapi data kebutuhan pelanggan ke dataPatch, bukan sekadar menjawab umum.",
        "Isi semua data yang sudah jelas dari customerMessages: service, location, dimensions, material, targetTime, photoReferences, customerQuestions, name, email, dan emailMarketingConsent.",
        "Field minimal sebelum konfirmasi adalah service, location, dan name; field lain dicatat jika pelanggan menyebutnya atau mengirim foto.",
        "Jika pelanggan belum tahu, menyerahkan, atau meminta HIJAOE menentukan ukuran, isi dataPatch.dimensions dengan \"Belum ditentukan\" dan lanjutkan ke info penting berikutnya.",
        "Jika pelanggan bilang tidak ada foto atau referensi, isi dataPatch.photoReferences dengan \"Tidak ada referensi foto\" dan jangan tanyakan foto lagi.",
        "Field material juga boleh dipakai untuk warna atau finishing, misalnya \"Warna natural\".",
        "Kamu bukan sales, katalog, atau product knowledge base; tugasmu hanya mencatat kebutuhan dan pertanyaan pelanggan.",
        "Jika pelanggan bertanya detail yang tidak ada di session atau customerMessages, jangan mengarang jawaban; isi customerQuestions dengan pertanyaan itu, lalu katakan admin HIJAOE perlu cek detail itu.",
        "Jika beberapa data kurang, pilih satu pertanyaan lanjutan yang paling penting untuk melengkapi lead.",
        "Pertanyaan lanjutan harus sesuai jenis pekerjaan: untuk meja, kursi, lemari, rak, atau furnitur satuan boleh tanya jumlah/unit/set; untuk pagar, kanopi, railing, plafon, partisi, aluminium kaca, kitchen set, atau pekerjaan area/linear jangan tanya jumlah, tanyakan ukuran, panjang area, foto lokasi, model, atau nama.",
        "Jangan menyebut bot, robot, template, otomasi, atau proses internal.",
        "Jangan memberi harga, kisaran biaya, DP, diskon, atau angka rupiah.",
        "Jangan memberi kepastian survei, produksi, pemasangan, atau tanggal selesai.",
        "Jangan mengarang stok, ketersediaan bahan, ukuran standar, angka dimensi, atau keputusan struktur.",
        "Jika pelanggan bertanya pilihan warna atau bahan, jangan mengarang daftar pilihan; jawab bahwa warna atau bahan bisa disesuaikan dan minta preferensi pelanggan.",
        "Jangan menyebut ukuran pasti atau ukuran standar kecuali pelanggan sudah menyebut ukuran itu.",
        "Jika customerMessages berisi [Foto diterima...] atau data.photoReferences sudah terisi, jangan minta foto lagi; akui bahwa foto sudah diterima.",
        "Jangan meminta nomor, kontak, WA, telepon, atau HP karena nomor WhatsApp sudah tersedia dari chat.",
        "Jika data.name sudah terisi, jangan minta nama lengkap atau nama pemesan lagi.",
        "Jika pelanggan meminta kamu menentukan ukuran atau detail teknis, jangan menentukan sendiri; katakan admin HIJAOE akan bantu sesuaikan dari referensi dan kebutuhan.",
        "Gunakan leadGuidance sebagai arahan utama untuk memilih pertanyaan berikutnya.",
        "Ikuti suggestedNextStep dan suggestedNextQuestions, dan jangan menanyakan hal yang ada di avoidQuestions.",
        "Jika leadGuidance.readyToConfirm true, jangan memaksa data opsional lagi; tampilkan ringkasan atau minta konfirmasi singkat.",
        "Kalau pelanggan tanya harga, negosiasi, komplain, minta admin, atau minta jadwal pasti, set handoff true.",
        "Ekstrak data yang sudah jelas disebut pelanggan dan jangan tanya ulang data yang sudah ada.",
        "Jika data kurang, tanyakan satu hal utama yang paling masuk akal.",
        "Schema JSON: {\"reply\":\"\",\"dataPatch\":{\"name\":\"\",\"service\":\"\",\"location\":\"\",\"dimensions\":\"\",\"material\":\"\",\"targetTime\":\"\",\"photoReferences\":\"\",\"customerQuestions\":\"\",\"email\":\"\",\"emailMarketingConsent\":\"\"},\"state\":\"active|confirming|handoff|closed\",\"readyToConfirm\":false,\"handoff\":false,\"handoffReason\":\"\",\"historySummary\":\"\"}",
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
        leadGuidance: buildLeadGuidance({ session, messages }),
        customerMessages: messages,
      }),
    },
  ];
}

function buildLeadGuidance({ session, messages }) {
  const data = {
    ...EMPTY_CUSTOMER_DATA,
    ...(session?.data || {}),
  };
  const customerText = messages.map((message) => String(message || "").trim())
    .filter(Boolean)
    .join("\n");
  const serviceText = [
    data.service,
    session?.historySummary || "",
    customerText,
  ].join("\n");
  const serviceKind = classifyServiceKind(serviceText);
  const missingRequiredFields = requiredLeadFields(data);
  const readyToConfirm = missingRequiredFields.length === 0;

  return {
    serviceKind,
    missingRequiredFields,
    optionalFieldStatus: {
      dimensions: leadFieldStatus(data.dimensions),
      material: leadFieldStatus(data.material),
      targetTime: leadFieldStatus(data.targetTime),
      photoReferences: leadFieldStatus(data.photoReferences),
      customerQuestions: leadFieldStatus(data.customerQuestions),
      email: leadFieldStatus(data.email),
    },
    serviceChecklist: serviceChecklist(serviceText),
    readyToConfirm,
    suggestedNextStep: readyToConfirm
      ? "confirm_lead"
      : "ask_one_contextual_question",
    suggestedNextQuestions: suggestedNextQuestions({
      data,
      serviceKind,
      missingRequiredFields,
      readyToConfirm,
    }),
    avoidQuestions: avoidQuestions({
      data,
      serviceKind,
      readyToConfirm,
    }),
  };
}

function classifyServiceKind(serviceText) {
  if (LINEAR_OR_AREA_SERVICE_PATTERN.test(serviceText)) {
    return "linear_or_area";
  }
  if (UNIT_BASED_SERVICE_PATTERN.test(serviceText)) {
    return "unit_based";
  }
  return "unknown";
}

function requiredLeadFields(data) {
  return [
    ["service", data.service],
    ["location", data.location],
    ["name", data.name],
  ]
    .filter(([, value]) => !String(value || "").trim())
    .map(([key]) => key);
}

function leadFieldStatus(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "missing";
  }
  if (/belum ditentukan|tidak ada referensi foto/i.test(text)) {
    return "deferred_or_absent";
  }
  return "provided";
}

function serviceChecklist(serviceText) {
  if (FENCE_SERVICE_PATTERN.test(serviceText)) {
    return [
      "panjang area pagar",
      "tinggi pagar jika sudah ada",
      "model atau foto referensi",
      "foto lokasi",
    ];
  }
  if (CANOPY_SERVICE_PATTERN.test(serviceText)) {
    return [
      "panjang dan lebar area",
      "model kanopi",
      "foto lokasi",
      "material jika pelanggan sudah tahu",
    ];
  }
  if (CEILING_SERVICE_PATTERN.test(serviceText)) {
    return [
      "panjang dan lebar ruangan",
      "jenis plafon atau partisi jika sudah tahu",
      "foto area",
      "tinggi atau kondisi ruangan jika relevan",
    ];
  }
  if (ALUMINIUM_GLASS_SERVICE_PATTERN.test(serviceText)) {
    return [
      "jenis item seperti pintu, jendela, kusen, atau partisi",
      "ukuran bukaan jika sudah ada",
      "foto lokasi",
      "model atau arah bukaan jika relevan",
    ];
  }
  if (UNIT_BASED_SERVICE_PATTERN.test(serviceText)) {
    return [
      "jumlah unit atau set",
      "ukuran jika sudah ada",
      "model atau foto referensi",
      "warna atau finishing",
    ];
  }
  return [
    "kebutuhan utama",
    "lokasi pengerjaan",
    "ukuran atau foto jika relevan",
  ];
}

function suggestedNextQuestions({
  data,
  serviceKind,
  missingRequiredFields,
  readyToConfirm,
}) {
  if (readyToConfirm) {
    return ["Tampilkan ringkasan kebutuhan dan minta konfirmasi singkat."];
  }

  const questions = [];
  if (missingRequiredFields.includes("service")) {
    questions.push("Tanyakan kebutuhan atau jenis pekerjaan utama.");
  }
  if (missingRequiredFields.includes("location")) {
    questions.push("Tanyakan lokasi pengerjaan.");
  }

  const hasScopeData = Boolean(
    data.dimensions.trim() ||
      data.material.trim() ||
      data.photoReferences.trim(),
  );
  if (!hasScopeData && data.service.trim() && data.location.trim()) {
    if (serviceKind === "unit_based") {
      questions.push("Tanyakan jumlah/unit/set, ukuran, atau foto/model; pilih satu yang paling natural.");
    } else if (serviceKind === "linear_or_area") {
      questions.push("Tanyakan ukuran, panjang area, foto lokasi, atau model; pilih satu yang paling natural.");
    } else {
      questions.push("Tanyakan ukuran, jumlah jika relevan, foto/model, atau detail kebutuhan; pilih satu yang paling natural.");
    }
  }

  if (missingRequiredFields.includes("name")) {
    questions.push("Tanyakan nama hanya setelah kebutuhan utama cukup jelas.");
  }

  return questions;
}

function avoidQuestions({ data, serviceKind, readyToConfirm }) {
  const avoid = [];
  if (serviceKind === "linear_or_area") {
    avoid.push("Jangan tanya jumlah, unit, atau set untuk pekerjaan area/linear.");
  }
  if (data.photoReferences.trim()) {
    avoid.push("Jangan minta foto lagi.");
  }
  if (data.name.trim()) {
    avoid.push("Jangan minta nama atau kontak lagi.");
  }
  if (readyToConfirm) {
    avoid.push("jangan paksa data opsional yang belum ada.");
  }
  avoid.push("Jangan minta nomor WhatsApp, telepon, HP, atau kontak.");
  return avoid;
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

function applyCustomerContextPatches(session, customerText) {
  let data = session.data;

  if (shouldMarkDimensionsDeferred({ ...session, data }, customerText)) {
    data = {
      ...data,
      dimensions: DEFERRED_DIMENSIONS_VALUE,
    };
  }

  if (shouldMarkNoPhotoReferences({ ...session, data }, customerText)) {
    data = {
      ...data,
      photoReferences: NO_PHOTO_REFERENCES_VALUE,
    };
  }

  const colorPreference = extractColorPreference(customerText);
  if (colorPreference && !data.material.trim()) {
    data = {
      ...data,
      material: colorPreference,
    };
  }

  const customerQuestion = extractCustomerDetailQuestion(customerText);
  if (customerQuestion) {
    data = {
      ...data,
      customerQuestions: appendUniqueNote(data.customerQuestions, customerQuestion),
    };
  }

  return {
    ...session,
    data,
  };
}

function extractCustomerDetailQuestion(customerText) {
  const text = limitText(customerText, 240);
  if (
    !text ||
    !CUSTOMER_DETAIL_QUESTION_TOPIC_PATTERN.test(text) ||
    !QUESTION_INTENT_PATTERN.test(text)
  ) {
    return "";
  }
  return text.replace(/\s+/g, " ").trim();
}

function appendUniqueNote(existing, value) {
  const current = String(existing || "").trim();
  const next = String(value || "").trim();
  if (!next) {
    return current;
  }
  if (!current) {
    return next;
  }
  if (current.toLowerCase().includes(next.toLowerCase())) {
    return current;
  }
  return limitText(`${current}; ${next}`, 500);
}

function shouldMarkDimensionsDeferred(session, customerText) {
  return Boolean(
    !session.data.dimensions.trim() &&
      DIMENSION_DEFER_PATTERN.test(customerText) &&
      (
        DIMENSION_CONTEXT_PATTERN.test(customerText) ||
        DIMENSION_CONTEXT_PATTERN.test(session.historySummary || "") ||
        hasPhotoContext(session, customerText)
      ),
  );
}

function shouldMarkNoPhotoReferences(session, customerText) {
  return Boolean(
    !session.data.photoReferences.trim() &&
      NO_PHOTO_REFERENCES_PATTERN.test(customerText),
  );
}

function extractColorPreference(customerText) {
  if (COLOR_QUESTION_PATTERN.test(customerText)) {
    return "";
  }
  const match = customerText.match(COLOR_PREFERENCE_PATTERN);
  if (!match) {
    return "";
  }
  const value = match[1]
    .replace(/\b(?:aja|saja|dong|ya|kak)\b/gi, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return value ? `Warna ${value}` : "";
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
  if (UNSUPPORTED_COLOR_OPTIONS_PATTERN.test(output.reply)) {
    return "unsupported_color_options";
  }
  if (UNSUPPORTED_AVAILABILITY_CLAIM_PATTERN.test(output.reply)) {
    return "unsupported_availability_claim";
  }
  if (
    asksQuantityForLinearOrAreaWork(output.reply, context)
  ) {
    return "linear_or_area_quantity_request";
  }
  if (
    CONTACT_OR_REDUNDANT_NAME_REQUEST_PATTERN.test(output.reply) &&
    (context.session.data.name.trim() || /\b(?:kontak|nomor|no\.?|wa|whatsapp|telepon|hp)\b/i.test(output.reply))
  ) {
    return "unneeded_contact_or_name";
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
  if (reason === "unsupported_color_options") {
    return COLOR_OPTIONS_FALLBACK_REPLY;
  }
  if (reason === "unsupported_availability_claim") {
    return UNSUPPORTED_DETAIL_FALLBACK_REPLY;
  }
  if (reason === "linear_or_area_quantity_request") {
    return LINEAR_OR_AREA_SCOPE_FALLBACK_REPLY;
  }
  if (reason === "unneeded_contact_or_name") {
    return NAME_ONLY_FALLBACK_REPLY;
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

function asksQuantityForLinearOrAreaWork(reply, { session, customerText }) {
  if (!QUANTITY_REQUEST_PATTERN.test(reply)) {
    return false;
  }
  const serviceText = [
    session.data.service,
    session.historySummary || "",
    customerText,
  ].join("\n");
  return Boolean(
    LINEAR_OR_AREA_SERVICE_PATTERN.test(serviceText) &&
      !UNIT_BASED_SERVICE_PATTERN.test(serviceText),
  );
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
