import "dotenv/config";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createBotStore } from "./store.js";

const dataDir = path.resolve(
  process.cwd(),
  process.env.BOT_DATA_DIR || "data/whatsapp-bot",
);
mkdirSync(dataDir, { recursive: true });
const store = createBotStore(path.join(dataDir, "session.sqlite"));

try {
  console.log(JSON.stringify(store.getHealthSnapshot(), null, 2));
} finally {
  store.close();
}
