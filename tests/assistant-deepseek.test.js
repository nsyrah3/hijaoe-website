import test from "node:test";
import assert from "node:assert/strict";
import { createSession } from "../assistant/conversation-engine.js";
import {
  analyzeCustomerMessage,
  buildDeepSeekRequest,
  fallbackDeepSeekAnalysis,
} from "../assistant/deepseek-adapter.js";

test("DeepSeek request uses sanitized model context and JSON output", () => {
  const base = createSession("628123456789");
  const session = {
    ...base,
    state: "material",
    data: {
      ...base.data,
      name: "Rina",
      email: "rina@example.com",
      location: "Jalan Mawar 10",
      service: "Pagar besi",
      dimensions: "4 x 2 meter",
      material: "Besi hollow",
      targetTime: "Bulan depan",
      photoReferences: "https://files.example.com/private/photo.jpg",
    },
  };

  const request = buildDeepSeekRequest(
    session,
    "Nama saya Rina, nomor 0812-3456-7890. Mau model minimalis.",
  );
  const serialized = JSON.stringify(request);

  assert.equal(request.model, "deepseek-v4-flash");
  assert.deepEqual(request.thinking, { type: "disabled" });
  assert.deepEqual(request.response_format, { type: "json_object" });
  assert.match(serialized, /JSON/);
  assert.match(serialized, /Pagar besi/);
  assert.doesNotMatch(
    serialized,
    /Rina|rina@example|Jalan Mawar|0812|3456|private\/photo/i,
  );
});

test("analyzeCustomerMessage sends API key only in authorization header", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                intent: "collect",
                serviceCategory: "Besi & Las",
                summary: "Pelanggan ingin membuat pagar besi.",
                shouldHandoff: false,
                nextQuestionHint: "Tanyakan lokasi pemasangan.",
                confidence: 0.91,
              }),
            },
          },
        ],
      }),
    };
  };

  const result = await analyzeCustomerMessage(
    createSession("628123456789"),
    "mau buat pagar besi",
    {
      apiKey: "fake-deepseek-secret",
      fetchImpl,
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.analysis.intent, "collect");
  assert.equal(result.analysis.serviceCategory, "Besi & Las");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.deepseek.com/chat/completions");
  assert.equal(
    calls[0].options.headers.Authorization,
    "Bearer fake-deepseek-secret",
  );
  assert.doesNotMatch(calls[0].options.body, /fake-deepseek-secret/);
});

test("analyzeCustomerMessage falls back without exposing secrets", async () => {
  const result = await analyzeCustomerMessage(
    createSession("628123456789"),
    "mau buat kanopi",
    {
      apiKey: "fake-deepseek-secret",
      fetchImpl: async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: "secret should not leak" }),
      }),
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.fallback, true);
  assert.equal(result.analysis.intent, "other");
  assert.doesNotMatch(JSON.stringify(result), /fake-deepseek-secret/);
});

test("fallbackDeepSeekAnalysis returns a safe empty analysis", () => {
  const result = fallbackDeepSeekAnalysis("DEEPSEEK_API_KEY is not configured");

  assert.deepEqual(result, {
    ok: false,
    fallback: true,
    reason: "DEEPSEEK_API_KEY is not configured",
    analysis: {
      intent: "other",
      serviceCategory: "",
      summary: "",
      shouldHandoff: false,
      nextQuestionHint: "",
      confidence: 0,
    },
  });
});
