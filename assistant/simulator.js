import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { pathToFileURL } from "node:url";
import {
  createSession,
  handleMessage,
  startConversation,
} from "./conversation-engine.js";

export async function runSimulator({
  whatsappNumber = "628976010103",
  ask,
  write,
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

    const result = handleMessage(session, reply);
    session = result.session;
    lead = result.lead ?? lead;
    result.messages.forEach(write);
  }

  return { session, lead };
}

async function runCli() {
  const terminal = createInterface({ input, output });
  try {
    const result = await runSimulator({
      ask: () => terminal.question("Anda: "),
      write: (message) => console.log(`\nAsisten HIJAOE:\n${message}\n`),
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
