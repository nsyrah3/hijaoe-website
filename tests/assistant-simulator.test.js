import test from "node:test";
import assert from "node:assert/strict";
import { runSimulator } from "../assistant/simulator.js";

test("simulator completes a scripted conversation", async () => {
  const replies = [
    "Rina",
    "Pagar besi",
    "Panakkukang",
    "4 x 2 meter",
    "Besi hollow",
    "Bulan depan",
    "lewati",
    "lewati",
    "ya",
  ];
  const output = [];

  const result = await runSimulator({
    whatsappNumber: "628123456789",
    ask: async () => replies.shift(),
    write: (message) => output.push(message),
  });

  assert.equal(result.session.state, "handoff");
  assert.equal(result.lead.customer_name, "Rina");
  assert.equal(result.lead.service_type, "Pagar besi");
  assert.match(output.join("\n"), /Asisten HIJAOE/);
  assert.match(output.join("\n"), /Ini ringkasannya|Ringkasan kebutuhan awal/);
});

test("simulator can run optional DeepSeek analysis without changing the flow", async () => {
  const replies = [
    "Rina",
    "Pagar besi",
    "Panakkukang",
    "4 x 2 meter",
    "Besi hollow",
    "Bulan depan",
    "lewati",
    "lewati",
    "ya",
  ];
  const analyzed = [];
  const debug = [];

  const result = await runSimulator({
    whatsappNumber: "628123456789",
    ask: async () => replies.shift(),
    write: () => {},
    useDeepSeek: true,
    writeDebug: (message) => debug.push(message),
    analyze: async (session, message) => {
      analyzed.push({ state: session.state, message });
      return {
        ok: true,
        fallback: false,
        analysis: {
          intent: "collect",
          serviceCategory: "Besi & Las",
          summary: "Pelanggan mengisi kebutuhan awal.",
          shouldHandoff: false,
          nextQuestionHint: "",
          confidence: 0.8,
        },
      };
    },
  });

  assert.equal(result.session.state, "handoff");
  assert.equal(result.lead.service_type, "Pagar besi");
  assert.equal(analyzed.length, 9);
  assert.deepEqual(analyzed[0], { state: "name", message: "Rina" });
  assert.match(debug.join("\n"), /DeepSeek: Pelanggan mengisi kebutuhan awal/);
});
