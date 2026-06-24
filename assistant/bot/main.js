import "dotenv/config";
import { startBotRuntime } from "./runtime.js";

startBotRuntime().catch((error) => {
  console.error(
    JSON.stringify({
      event: "bot_start_failed",
      name: String(error?.name || "Error").replace(/[^a-zA-Z0-9_-]/g, ""),
    }),
  );
  process.exitCode = 1;
});
