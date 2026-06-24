import { buildModelContext } from "./privacy.js";

export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEEPSEEK_CHAT_COMPLETIONS_PATH = "/chat/completions";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

const ALLOWED_INTENTS = new Set([
  "collect",
  "faq",
  "handoff",
  "restricted",
  "other",
]);

const EMPTY_ANALYSIS = Object.freeze({
  intent: "other",
  serviceCategory: "",
  summary: "",
  shouldHandoff: false,
  nextQuestionHint: "",
  confidence: 0,
});

export function buildDeepSeekRequest(
  session,
  message,
  { model = DEFAULT_DEEPSEEK_MODEL } = {},
) {
  const context = buildModelContext(session, message);

  return {
    model,
    messages: [
      {
        role: "system",
        content: [
          "Anda adalah analis internal untuk Asisten WhatsApp HIJAOE.",
          "Balas hanya dengan JSON valid.",
          "Jangan memberi harga, rentang harga, atau janji jadwal.",
          "Jangan meminta data pribadi tambahan di luar kebutuhan pekerjaan.",
          "Pakai kategori layanan yang ringkas seperti Konstruksi & Renovasi, Besi & Las, Aluminium & Kaca, Atap & Kanopi, Plafon & Partisi, atau Interior & Furnitur.",
          "Schema JSON: {\"intent\":\"collect|faq|handoff|restricted|other\",\"serviceCategory\":\"\",\"summary\":\"\",\"shouldHandoff\":false,\"nextQuestionHint\":\"\",\"confidence\":0}",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Analisis pesan pelanggan HIJAOE berikut.",
          context,
        }),
      },
    ],
    response_format: { type: "json_object" },
    thinking: { type: "disabled" },
    temperature: 0.2,
    max_tokens: 350,
    stream: false,
  };
}

export async function analyzeCustomerMessage(
  session,
  message,
  {
    apiKey = process.env.DEEPSEEK_API_KEY,
    baseUrl = DEEPSEEK_BASE_URL,
    model = DEFAULT_DEEPSEEK_MODEL,
    fetchImpl = globalThis.fetch,
  } = {},
) {
  if (!apiKey) {
    return fallbackDeepSeekAnalysis("DEEPSEEK_API_KEY is not configured");
  }

  if (typeof fetchImpl !== "function") {
    return fallbackDeepSeekAnalysis("fetch is not available");
  }

  const body = buildDeepSeekRequest(session, message, { model });

  try {
    const response = await fetchImpl(
      `${baseUrl}${DEEPSEEK_CHAT_COMPLETIONS_PATH}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      return fallbackDeepSeekAnalysis(`DeepSeek request failed: ${response.status}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return fallbackDeepSeekAnalysis("DeepSeek response did not include content");
    }

    return {
      ok: true,
      fallback: false,
      analysis: normalizeAnalysis(JSON.parse(content)),
    };
  } catch (error) {
    return fallbackDeepSeekAnalysis(toSafeReason(error));
  }
}

export async function requestDeepSeekCompletion({
  apiKey = process.env.DEEPSEEK_API_KEY,
  messages,
  baseUrl = DEEPSEEK_BASE_URL,
  model = "deepseek-chat",
  fetchImpl = globalThis.fetch,
  signal,
} = {}) {
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is not available");
  }

  const response = await fetchImpl(
    `${baseUrl}${DEEPSEEK_CHAT_COMPLETIONS_PATH}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.5,
        max_tokens: 350,
        stream: false,
      }),
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`DeepSeek request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("DeepSeek response did not include content");
  }

  return content;
}

export function fallbackDeepSeekAnalysis(reason = "DeepSeek is unavailable") {
  return {
    ok: false,
    fallback: true,
    reason,
    analysis: { ...EMPTY_ANALYSIS },
  };
}

function normalizeAnalysis(rawAnalysis) {
  if (!rawAnalysis || typeof rawAnalysis !== "object") {
    return { ...EMPTY_ANALYSIS };
  }

  const intent = ALLOWED_INTENTS.has(rawAnalysis.intent)
    ? rawAnalysis.intent
    : "other";

  return {
    intent,
    serviceCategory: limitText(rawAnalysis.serviceCategory, 80),
    summary: limitText(rawAnalysis.summary, 240),
    shouldHandoff: rawAnalysis.shouldHandoff === true,
    nextQuestionHint: limitText(rawAnalysis.nextQuestionHint, 160),
    confidence: normalizeConfidence(rawAnalysis.confidence),
  };
}

function limitText(value, maxLength) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

function normalizeConfidence(value) {
  const confidence = Number(value);
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(1, Math.max(0, confidence));
}

function toSafeReason(error) {
  if (error instanceof SyntaxError) {
    return "DeepSeek response was not valid JSON";
  }

  if (error instanceof Error && error.name === "AbortError") {
    return "DeepSeek request timed out";
  }

  return "DeepSeek request failed";
}
