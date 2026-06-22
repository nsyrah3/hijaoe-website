import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { pathToFileURL } from "node:url";
import {
  createSession,
  handleMessage,
  startConversation,
} from "./conversation-engine.js";
import { analyzeCustomerMessage } from "./deepseek-adapter.js";

export async function runSimulator({
  whatsappNumber = "628976010103",
  ask,
  write,
  useDeepSeek = false,
  analyze = analyzeCustomerMessage,
  writeDebug = () => {},
}) {
  let session = createSession(whatsappNumber);
  let lead = null;
  const opening = startConversation(session);
  session = opening.session;
  opening.messages.forEach(write);

  while (!["handoff", "closed"].includes(session.state)) {
    const reply = await ask();
    if (reply === undefined) {
      throw new Error("Simulator input ended before the conversation finished");
    }

    if (useDeepSeek) {
      const aiResult = await analyze(session, reply);
      if (aiResult.ok && aiResult.analysis.summary) {
        writeDebug(`DeepSeek: ${aiResult.analysis.summary}`);
      } else if (aiResult.fallback) {
        writeDebug(`DeepSeek fallback: ${aiResult.reason}`);
      }
    }

    const result = handleMessage(session, reply);
    session = result.session;
    lead = result.lead ?? lead;
    result.messages.forEach(write);
  }

  return { session, lead };
}

async function runCli() {
  const terminal = createInterface({ input, output });
  const useDeepSeek = process.argv.includes("--deepseek");
  try {
    const result = await runSimulator({
      ask: () => terminal.question("Anda: "),
      write: (message) => console.log(`\nAsisten HIJAOE:\n${message}\n`),
      useDeepSeek,
      writeDebug: (message) => console.log(`\n${message}\n`),
    });

    if (result.lead) {
      console.log("Lead simulator:");
      console.log(JSON.stringify(result.lead, null, 2));
    }
  } finally {
    terminal.close();
  }
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  runCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
