import {
  COMPLETION_MESSAGE,
  EMPTY_CUSTOMER_DATA,
  FIELD_BY_STATE,
  FIELD_DEFINITIONS,
  HANDOFF_MESSAGE,
  OPENING_MESSAGE,
} from "./assistant-data.js";
import {
  detectHandoffRequest,
  detectPriceIntent,
  detectScheduleGuaranteeIntent,
  findFaq,
} from "./faq.js";

const SKIP_WORDS = new Set([
  "lewati",
  "skip",
  "tidak ada",
  "belum ada",
  "belum tahu",
  "tidak tahu",
]);

const CORRECTION_FIELD_ALIASES = new Map([
  ["bahan", "material"],
  ["model", "material"],
  ["foto", "photoReferences"],
  ["referensi", "photoReferences"],
]);

const FIELD_BY_KEY = new Map(FIELD_DEFINITIONS.map((field) => [field.key, field]));
const CORRECTION_FIELDS = buildCorrectionFields();

const CONFIRMATION_WORDS = new Set(["ya", "iya", "sudah benar", "benar"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createSession(whatsappNumber = "") {
  return {
    state: "welcome",
    whatsappNumber,
    data: { ...EMPTY_CUSTOMER_DATA },
    failedUnderstanding: 0,
    handoffReason: "",
    completed: false,
  };
}

export function startConversation(session) {
  const firstField = FIELD_DEFINITIONS[0];

  return {
    session: {
      ...session,
      state: firstField.state,
    },
    messages: [OPENING_MESSAGE],
    lead: null,
  };
}

export function handleMessage(session, message, { now = new Date() } = {}) {
  const answer = normalize(message);
  const rawAnswer = String(message ?? "").trim();

  if (session.state === "welcome") {
    return startConversation(session);
  }

  if (session.state === "handoff" || session.state === "closed") {
    return { session, messages: [], lead: null };
  }

  if (detectHandoffRequest(rawAnswer)) {
    return handoffResult(session, "Pelanggan meminta admin manusia");
  }

  const priceReason = detectPriceIntent(rawAnswer);
  if (priceReason) {
    return handoffResult(session, priceReason);
  }

  if (session.state !== "target_time") {
    const scheduleGuaranteeReason = detectScheduleGuaranteeIntent(rawAnswer);
    if (scheduleGuaranteeReason) {
      return handoffResult(session, scheduleGuaranteeReason);
    }
  }

  const faq = findFaq(rawAnswer);
  if (faq && session.state === "confirmation") {
    return {
      session,
      messages: [faq.answer, buildSummary(session)],
      lead: null,
    };
  }

  if (faq && FIELD_BY_STATE.has(session.state)) {
    return {
      session,
      messages: [faq.answer, FIELD_BY_STATE.get(session.state).prompt],
      lead: null,
    };
  }

  if (session.state === "confirmation") {
    return handleConfirmation(session, answer, rawAnswer, now);
  }

  if (session.state === "marketing_consent") {
    return handleMarketingConsent(session, answer);
  }

  if (session.state === "email") {
    return handleEmail(session, answer);
  }

  const field = FIELD_BY_STATE.get(session.state);
  if (!field) {
    return misunderstanding(session);
  }

  if (!answer && field.required) {
    return misunderstanding(session);
  }

  if (SKIP_WORDS.has(answer) && field.required) {
    return invalidResult(session, field.prompt);
  }

  const value = SKIP_WORDS.has(answer) ? "" : rawAnswer;
  const nextSession = {
    ...session,
    data: {
      ...session.data,
      [field.key]: value,
    },
    failedUnderstanding: 0,
  };

  return askNext(nextSession);
}

export function buildSummary(session) {
  const data = session.data;

  return [
    "Ringkasan kebutuhan awal:",
    `Nama: ${summaryValue(data.name)}`,
    `Pekerjaan: ${summaryValue(data.service)}`,
    `Lokasi: ${summaryValue(data.location)}`,
    `Ukuran: ${summaryValue(data.dimensions)}`,
    `Bahan atau model: ${summaryValue(data.material)}`,
    `Target waktu: ${summaryValue(data.targetTime)}`,
    `Foto referensi: ${summaryValue(data.photoReferences)}`,
    `Pertanyaan customer: ${summaryValue(data.customerQuestions)}`,
    `Email: ${summaryValue(data.email)}`,
    `Izin email promosi: ${summaryValue(data.emailMarketingConsent)}`,
    "",
    "Kalau sudah benar, balas ya. Kalau ada yang perlu diubah, tulis ubah field: nilai.",
  ].join("\n");
}

export function buildLead(session, now = new Date()) {
  const data = session.data;

  return {
    created_at: now.toISOString(),
    status: "Baru",
    customer_name: data.name,
    whatsapp_number: session.whatsappNumber,
    email: data.email,
    email_marketing_consent: data.emailMarketingConsent,
    service_type: data.service,
    location: data.location,
    dimensions: data.dimensions,
    material_or_style: data.material,
    target_time: data.targetTime,
    notes: data.customerQuestions,
    photo_references: data.photoReferences,
    conversation_summary: buildSummary(session),
    handoff_reason:
      session.handoffReason || "Kebutuhan awal sudah dikonfirmasi",
    source: "WhatsApp",
  };
}

function askNext(session) {
  const currentIndex = FIELD_DEFINITIONS.findIndex(
    (field) => field.state === session.state,
  );
  const nextField = FIELD_DEFINITIONS[currentIndex + 1];

  if (!nextField) {
    const confirmationSession = {
      ...session,
      state: "confirmation",
    };

    return {
      session: confirmationSession,
      messages: [buildSummary(confirmationSession)],
      lead: null,
    };
  }

  return {
    session: {
      ...session,
      state: nextField.state,
    },
    messages: [nextField.prompt],
    lead: null,
  };
}

function handleEmail(session, answer) {
  if (SKIP_WORDS.has(answer)) {
    const nextSession = {
      ...session,
      state: "confirmation",
      failedUnderstanding: 0,
      data: {
        ...session.data,
        email: "",
        emailMarketingConsent: "Tidak",
      },
    };

    return {
      session: nextSession,
      messages: [buildSummary(nextSession)],
      lead: null,
    };
  }

  if (!EMAIL_PATTERN.test(answer)) {
    return misunderstanding(session);
  }

  const nextSession = {
    ...session,
    state: "marketing_consent",
    failedUnderstanding: 0,
    data: {
      ...session.data,
      email: answer,
    },
  };

  return {
    session: nextSession,
    messages: [FIELD_BY_STATE.get("marketing_consent").prompt],
    lead: null,
  };
}

function handleMarketingConsent(session, answer) {
  const consent = parseYesNo(answer);
  if (!consent) {
    return misunderstanding(session);
  }

  const nextSession = {
    ...session,
    state: "confirmation",
    failedUnderstanding: 0,
    data: {
      ...session.data,
      emailMarketingConsent: consent,
    },
  };

  return {
    session: nextSession,
    messages: [buildSummary(nextSession)],
    lead: null,
  };
}

function handleConfirmation(session, answer, rawAnswer, now) {
  if (CONFIRMATION_WORDS.has(answer)) {
    const nextSession = {
      ...session,
      state: "handoff",
      completed: true,
      failedUnderstanding: 0,
      handoffReason:
        session.handoffReason || "Kebutuhan awal sudah dikonfirmasi",
    };

    return {
      session: nextSession,
      messages: [COMPLETION_MESSAGE, HANDOFF_MESSAGE],
      lead: buildLead(nextSession, now),
    };
  }

  const correction = parseCorrection(rawAnswer);
  if (correction) {
    if (correction.key === "email") {
      const email = normalize(correction.value);

      if (SKIP_WORDS.has(email)) {
        const nextSession = {
          ...session,
          failedUnderstanding: 0,
          data: {
            ...session.data,
            email: "",
            emailMarketingConsent: "Tidak",
          },
        };

        return {
          session: nextSession,
          messages: [buildSummary(nextSession)],
          lead: null,
        };
      }

      if (!EMAIL_PATTERN.test(email)) {
        return invalidResult(
          session,
          "Maaf, format email belum sesuai. Bisa tulis email yang benar, Kak?",
        );
      }

      const nextSession = {
        ...session,
        state: "marketing_consent",
        failedUnderstanding: 0,
        data: {
          ...session.data,
          email,
          emailMarketingConsent: "Tidak",
        },
      };

      return {
        session: nextSession,
        messages: [FIELD_BY_STATE.get("marketing_consent").prompt],
        lead: null,
      };
    }

    if (
      correction.key === "emailMarketingConsent" &&
      correction.value === "Ya" &&
      !session.data.email.trim()
    ) {
      return invalidResult(
        session,
        "Maaf, izin email promosi bisa diaktifkan setelah email diisi. Bisa ubah email dulu, Kak?",
      );
    }

    if (
      isRequiredCorrectionField(correction.key) &&
      SKIP_WORDS.has(normalize(correction.value))
    ) {
      const fieldLabel = FIELD_BY_KEY.get(correction.key).label.toLowerCase();

      return invalidResult(
        session,
        `Maaf, ${fieldLabel} wajib diisi dan tidak bisa dilewati. Bisa tulis koreksi ${fieldLabel} yang benar, Kak?`,
      );
    }

    const value =
      isOptionalTextCorrectionField(correction.key) &&
      SKIP_WORDS.has(normalize(correction.value))
        ? ""
        : correction.value;

    const nextSession = {
      ...session,
      failedUnderstanding: 0,
      data: {
        ...session.data,
        [correction.key]: value,
      },
    };

    return {
      session: nextSession,
      messages: [buildSummary(nextSession)],
      lead: null,
    };
  }

  return misunderstanding(session);
}

function buildCorrectionFields() {
  return new Map([
    ...FIELD_DEFINITIONS.map((field) => [normalize(field.label), field.key]),
    ...CORRECTION_FIELD_ALIASES,
  ]);
}

function invalidResult(session, message) {
  const result = misunderstanding(session);
  if (result.session.state === "handoff") {
    return result;
  }

  return {
    ...result,
    messages: [message],
  };
}

function handoffResult(session, reason) {
  return {
    session: {
      ...session,
      state: "handoff",
      handoffReason: reason,
    },
    messages: [HANDOFF_MESSAGE],
    lead: null,
  };
}

function parseCorrection(answer) {
  const match = answer.match(/^ubah\s+([^:]+):\s*(.+)$/i);
  if (!match) {
    return null;
  }

  const field = normalize(match[1]);
  const key = CORRECTION_FIELDS.get(field);
  if (!key) {
    return null;
  }

  const rawValue = match[2].trim();
  const value =
    key === "emailMarketingConsent" ? parseYesNo(normalize(rawValue)) : rawValue;
  if (value === null) {
    return null;
  }

  return { key, value };
}

function isRequiredCorrectionField(key) {
  return FIELD_BY_KEY.get(key)?.required === true;
}

function isOptionalTextCorrectionField(key) {
  const field = FIELD_BY_KEY.get(key);
  return field && !field.required && key !== "emailMarketingConsent";
}

function parseYesNo(answer) {
  if (["ya", "iya", "yes", "boleh", "bersedia"].includes(answer)) {
    return "Ya";
  }

  if (
    ["tidak", "nggak", "enggak", "no", "tidak bersedia"].includes(answer)
  ) {
    return "Tidak";
  }

  return null;
}

function misunderstanding(session) {
  const failedUnderstanding = session.failedUnderstanding + 1;

  if (failedUnderstanding >= 2) {
    const nextSession = {
      ...session,
      state: "handoff",
      failedUnderstanding,
      handoffReason: "Bot tidak memahami dua jawaban berturut-turut",
    };

    return {
      session: nextSession,
      messages: [HANDOFF_MESSAGE],
      lead: null,
    };
  }

  return {
    session: {
      ...session,
      failedUnderstanding,
    },
    messages: ["Maaf, saya belum memahami. Bisa ditulis ulang, Kak?"],
    lead: null,
  };
}

function summaryValue(value) {
  return value || "Belum ada";
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}
