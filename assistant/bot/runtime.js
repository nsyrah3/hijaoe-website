import { mkdir } from "node:fs/promises";
import path from "node:path";
import { loadBotConfig } from "./config.js";
import { createBotStore } from "./store.js";
import {
  createAuthenticatedGoogleApis,
  createGoogleClient,
} from "./google-client.js";
import { createSyncService } from "./sync-service.js";
import { composeReply } from "./reply-composer.js";
import { createBotOrchestrator } from "./orchestrator.js";
import { createWhatsAppClient } from "./whatsapp-client.js";
import { requestDeepSeekCompletion } from "../deepseek-adapter.js";

export function createBotRuntime({
  directories,
  whatsapp,
  syncService,
  store,
  retryIntervalMs = 60_000,
  setIntervalImpl = setInterval,
  clearIntervalImpl = clearInterval,
  logger = console,
}) {
  let intervalId = null;
  let started = false;
  let stopped = false;
  let retryRunning = false;

  async function retryTick() {
    if (retryRunning || stopped) {
      return;
    }
    retryRunning = true;
    try {
      await syncService.processDueRetries();
    } catch (error) {
      logger?.warn?.(
        JSON.stringify({
          event: "retry_tick_failed",
          error: safeErrorName(error),
        }),
      );
    } finally {
      retryRunning = false;
    }
  }

  return {
    async start() {
      if (started) {
        return;
      }
      started = true;
      stopped = false;

      for (const directory of directories || []) {
        await mkdir(directory, { recursive: true });
      }
      await syncService.removeExpiredTemporaryMedia();
      await whatsapp.initialize();
      intervalId = setIntervalImpl(retryTick, retryIntervalMs);
      intervalId?.unref?.();
      logger?.info?.(JSON.stringify({ event: "bot_runtime_started" }));
    },

    async stop() {
      if (stopped) {
        return;
      }
      stopped = true;
      if (intervalId !== null) {
        clearIntervalImpl(intervalId);
        intervalId = null;
      }
      await whatsapp.destroy();
      store.close();
      logger?.info?.(JSON.stringify({ event: "bot_runtime_stopped" }));
    },

    getStatus() {
      return store.getHealthSnapshot(Date.now());
    },

    retryTick,
  };
}

export async function startBotRuntime({
  env = process.env,
  cwd = process.cwd(),
  logger = console,
  registerSignals = true,
} = {}) {
  const config = loadBotConfig(env, cwd);
  const databasePath = path.join(config.dataDir, "session.sqlite");
  await mkdir(config.dataDir, { recursive: true });
  const store = createBotStore(databasePath);
  const googleApis = createAuthenticatedGoogleApis(
    config.secrets.googleCredentials,
  );
  const googleClient = createGoogleClient({
    ...googleApis,
    spreadsheetId: config.secrets.spreadsheetId,
    rootFolderId: config.secrets.driveFolderId,
    sheetName: config.spreadsheetTab,
  });
  const syncService = createSyncService({
    store,
    googleClient,
    tempDir: config.tempDir,
    logger,
  });

  let orchestrator;
  const whatsapp = createWhatsAppClient({
    authDir: config.authDir,
    onIncoming: (message) => orchestrator.handleIncoming(message),
    onOwn: (message) => orchestrator.handleOwnMessage(message),
    onHealth: (state) => store.setRuntimeHealth("whatsapp", state),
    logger,
  });
  orchestrator = createBotOrchestrator({
    store,
    sender: whatsapp,
    syncService,
    composeReply: (input) =>
      composeReply({
        ...input,
        complete: ({ messages, signal }) =>
          requestDeepSeekCompletion({
            apiKey: config.secrets.deepseekApiKey,
            baseUrl: config.deepseekBaseUrl,
            model: config.deepseekModel,
            messages,
            signal,
          }),
      }),
    maxMessageAgeSeconds: config.maxMessageAgeSeconds,
    takeoverHours: config.takeoverHours,
    replyDelayMs: config.replyDelayMs,
    logger,
  });

  const runtime = createBotRuntime({
    directories: [
      config.dataDir,
      config.tempDir,
      config.authDir,
      config.logDir,
    ],
    whatsapp,
    syncService,
    store,
    retryIntervalMs: config.retryIntervalSeconds * 1000,
    logger,
  });

  if (registerSignals) {
    const shutdown = async (signal) => {
      logger?.info?.(JSON.stringify({ event: "shutdown_requested", signal }));
      await runtime.stop();
    };
    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
  }

  await runtime.start();
  return runtime;
}

function safeErrorName(error) {
  return String(error?.name || "Error").replace(/[^a-zA-Z0-9_-]/g, "");
}
