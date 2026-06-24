import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyIncomingMessage,
  classifyOwnMessage,
} from "../assistant/bot/message-policy.js";

test("accepts a fresh private customer message", () => {
  assert.deepEqual(
    classifyIncomingMessage({
      chatId: "628111@c.us",
      messageId: "m1",
      timestampSeconds: 950,
      nowMs: 1_000_000,
      maxAgeSeconds: 600,
      alreadyProcessed: false,
      paused: false,
    }),
    { action: "process", number: "628111" },
  );
});

test("accepts a private LID chat when the adapter resolved its phone number", () => {
  assert.deepEqual(
    classifyIncomingMessage({
      chatId: "100000000000001@lid",
      number: "628111",
      messageId: "m-lid",
    }),
    { action: "process", number: "628111" },
  );
});

for (const chatId of ["123@g.us", "status@broadcast", "news@newsletter"]) {
  test(`ignores unsupported chat ${chatId}`, () => {
    assert.equal(classifyIncomingMessage({ chatId }).reason, "unsupported_chat");
  });
}

test("ignores stale, duplicate, and paused messages", () => {
  assert.equal(
    classifyIncomingMessage({
      chatId: "1@c.us",
      messageId: "m1",
      timestampSeconds: 1,
      nowMs: 1_000_000,
      maxAgeSeconds: 10,
    }).reason,
    "stale",
  );
  assert.equal(
    classifyIncomingMessage({
      chatId: "1@c.us",
      messageId: "m1",
      alreadyProcessed: true,
    }).reason,
    "duplicate",
  );
  assert.equal(
    classifyIncomingMessage({
      chatId: "1@c.us",
      messageId: "m1",
      paused: true,
    }).reason,
    "manual_takeover",
  );
});

test("known bot message does not trigger takeover", () => {
  assert.equal(classifyOwnMessage({ knownBotMessage: true }).action, "ignore");
});

test("unknown own message triggers a takeover", () => {
  assert.deepEqual(
    classifyOwnMessage({
      chatId: "628111@c.us",
      knownBotMessage: false,
    }),
    {
      action: "pause",
      number: "628111",
    },
  );
});
