import { buildModelContext } from "../privacy.js";

const RESTRICTED_OUTPUT = [
  /\b(?:ai|bot|asisten|assistant|otomasi|sistem)\b/i,
  /\bRp\s?[\d.,]+/i,
  /\b\d+(?:[.,]\d+)?\s*(?:ribu|juta|jt)\b/i,
  /\bharga(?:nya)?\s+(?:sekitar|mulai|hanya)?/i,
  /\bpasti\s+selesai\b/i,
  /\bjamin(?:an)?\s+selesai\b/i,
  /\bselesai\s+(?:besok|hari\s+\w+)\b/i,
];

export async function composeReply({
  deterministicMessages = [],
  customerMessage = "",
  session = {},
  complete,
  timeoutMs = 10_000,
}) {
  const fallback = deterministicMessages.filter(Boolean).join("\n\n").trim();
  if (!fallback || typeof complete !== "function" || shouldSkipRewrite(session)) {
    return fallback;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const output = String(
      await complete({
        messages: buildRewriteMessages({
          fallback,
          customerMessage,
          session,
        }),
        signal: controller.signal,
      }),
    ).trim();

    if (
      !output ||
      output.length > 800 ||
      RESTRICTED_OUTPUT.some((pattern) => pattern.test(output))
    ) {
      return fallback;
    }

    return output;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

export function buildRewriteMessages({ fallback, customerMessage, session }) {
  const context = buildModelContext(
    {
      state: session?.state || "",
      data: {
        service: session?.data?.service || "",
        dimensions: session?.data?.dimensions || "",
        material: session?.data?.material || "",
        targetTime: session?.data?.targetTime || "",
      },
    },
    customerMessage,
  );

  return [
    {
      role: "system",
      content: [
        "Tulis sebagai admin HIJAOE yang membalas WhatsApp pelanggan.",
        "Bahasa Indonesia sehari-hari, singkat, sopan, dan natural.",
        "Jaga maksud dan satu pertanyaan yang sama.",
        "Jangan menyebut AI, bot, asisten, sistem, template, atau otomasi.",
        "Jangan menambah harga, jadwal, jaminan, diskon, ketersediaan bahan, atau informasi baru.",
        "Balas hanya dengan teks yang akan dikirim ke pelanggan.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        context,
        deterministicReply: sanitizeText(fallback, 800),
      }),
    },
  ];
}

function shouldSkipRewrite(session) {
  return (
    session?.state === "confirmation" ||
    session?.state === "handoff" ||
    session?.state === "closed" ||
    Boolean(session?.handoffReason)
  );
}

function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
