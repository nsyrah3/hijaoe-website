import {
  EMPTY_CUSTOMER_DATA,
  FIELD_BY_STATE,
  OPENING_MESSAGE,
} from "./assistant-data.js";

export function createSession(whatsappNumber) {
  return {
    state: "welcome",
    whatsappNumber,
    data: { ...EMPTY_CUSTOMER_DATA },
    failedUnderstanding: 0,
    handoffReason: "",
    completed: false,
  };
}

export function startConversation(session) {
  return {
    session: {
      ...session,
      state: "name",
    },
    messages: [OPENING_MESSAGE, FIELD_BY_STATE.get("name").prompt],
    lead: null,
  };
}
