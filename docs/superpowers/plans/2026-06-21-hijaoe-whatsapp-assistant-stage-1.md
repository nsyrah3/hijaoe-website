# HIJAOE WhatsApp Assistant Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, testable HIJAOE conversation engine and local simulator that collect an initial customer brief without external credentials.

**Architecture:** Keep the engine independent from WhatsApp, DeepSeek, and Google Sheets. Pure JavaScript modules own conversation copy, state transitions, FAQ matching, lead summaries, and privacy sanitization. A terminal adapter drives the same engine that the live WhatsApp webhook will use in Stage 2.

**Tech Stack:** Node.js ESM, Node.js built-in test runner, readline/promises

---

## File structure

- `assistant/assistant-data.js`: approved states, prompts, field metadata, and fixed copy.
- `assistant/conversation-engine.js`: session creation, transitions, confirmation, correction, and lead output.
- `assistant/faq.js`: deterministic FAQ, human handoff, and restricted-intent matching.
- `assistant/privacy.js`: PII sanitization and future DeepSeek context construction.
- `assistant/simulator.js`: terminal adapter for manual conversations.
- `tests/assistant-flow.test.js`: normal flow, optional fields, corrections, and lead shape.
- `tests/assistant-guardrails.test.js`: FAQ resume behavior, handoff, pricing, and schedule restrictions.
- `tests/assistant-privacy.test.js`: PII redaction and model payload boundaries.
- `tests/assistant-simulator.test.js`: end-to-end simulator behavior with injected input/output.

### Task 1: Define Conversation Data and Opening

**Files:**
- Create: `assistant/assistant-data.js`
- Create: `assistant/conversation-engine.js`
- Create: `tests/assistant-flow.test.js`

- [ ] **Step 1: Write the failing opening test**

Create `tests/assistant-flow.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  startConversation,
} from "../assistant/conversation-engine.js";

test("assistant introduces itself and asks for the customer name", () => {
  const initial = createSession("628123456789");
  const result = startConversation(initial);

  assert.equal(result.session.state, "name");
  assert.equal(result.session.whatsappNumber, "628123456789");
  assert.deepEqual(result.messages, [
    "Halo, Kak. Saya Asisten HIJAOE. Saya bantu catat kebutuhan awalnya dulu, lalu admin kami akan lanjutkan.",
    "Boleh tahu namanya, Kak?",
  ]);
  assert.equal(result.lead, null);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/assistant-flow.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `assistant/conversation-engine.js`.

- [ ] **Step 3: Create the approved field definitions**

Create `assistant/assistant-data.js`:

```js
export const OPENING_MESSAGE =
  "Halo, Kak. Saya Asisten HIJAOE. Saya bantu catat kebutuhan awalnya dulu, lalu admin kami akan lanjutkan.";

export const HANDOFF_MESSAGE =
  "Baik, Kak. Saya teruskan ke admin HIJAOE. Admin membalas Senin-Sabtu pukul 08.00-17.00.";

export const COMPLETION_MESSAGE =
  "Siap, Kak. Sudah saya catat. Admin HIJAOE akan cek kebutuhan dan fotonya dulu sebelum membahas harga serta jadwal.";

export const FIELD_DEFINITIONS = [
  {
    state: "name",
    key: "name",
    label: "Nama",
    prompt: "Boleh tahu namanya, Kak?",
    required: true,
  },
  {
    state: "service",
    key: "service",
    label: "Pekerjaan",
    prompt: "Kakak mau buat atau kerjakan apa? Ceritakan singkat saja.",
    required: true,
  },
  {
    state: "location",
    key: "location",
    label: "Lokasi",
    prompt: "Lokasi pengerjaan atau pengirimannya di daerah mana, Kak?",
    required: true,
  },
  {
    state: "dimensions",
    key: "dimensions",
    label: "Ukuran",
    prompt: "Kalau sudah ada, berapa ukuran perkiraannya? Kalau belum tahu, bilang belum tahu juga tidak apa-apa.",
    required: false,
  },
  {
    state: "material",
    key: "material",
    label: "Bahan atau model",
    prompt: "Ada bahan, model, atau contoh yang diinginkan, Kak?",
    required: false,
  },
  {
    state: "target_time",
    key: "targetTime",
    label: "Target waktu",
    prompt: "Rencananya ingin dikerjakan atau selesai sekitar kapan?",
    required: false,
  },
  {
    state: "photo",
    key: "photoReferences",
    label: "Foto referensi",
    prompt: "Bisa kirim foto lokasi atau contoh modelnya. Kalau belum ada, tulis lewati.",
    required: false,
  },
  {
    state: "email",
    key: "email",
    label: "Email",
    prompt: "Kalau berkenan, boleh kirim email untuk menerima katalog atau penawaran. Kalau tidak, tulis lewati.",
    required: false,
  },
  {
    state: "marketing_consent",
    key: "emailMarketingConsent",
    label: "Izin email promosi",
    prompt: "Apakah Kakak bersedia menerima informasi dan penawaran HIJAOE melalui email? Jawab ya atau tidak.",
    required: false,
  },
];

export const FIELD_BY_STATE = new Map(
  FIELD_DEFINITIONS.map((field) => [field.state, field]),
);

export const EMPTY_CUSTOMER_DATA = Object.freeze({
  name: "",
  service: "",
  location: "",
  dimensions: "",
  material: "",
  targetTime: "",
  photoReferences: "",
  email: "",
  emailMarketingConsent: "Tidak",
});
```

- [ ] **Step 4: Implement session creation and opening**

Create `assistant/conversation-engine.js`:

```js
import {
  EMPTY_CUSTOMER_DATA,
  FIELD_BY_STATE,
  OPENING_MESSAGE,
} from "./assistant-data.js";

export function createSession(whatsappNumber = "") {
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
  const nextSession = {
    ...session,
    state: "name",
  };

  return {
    session: nextSession,
    messages: [OPENING_MESSAGE, FIELD_BY_STATE.get("name").prompt],
    lead: null,
  };
}
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `node --test tests/assistant-flow.test.js`

Expected: 1 test passes, 0 failures.

- [ ] **Step 6: Commit the opening flow**

```powershell
git add assistant/assistant-data.js assistant/conversation-engine.js tests/assistant-flow.test.js
git commit -m "feat: add WhatsApp assistant opening flow"
```

### Task 2: Implement Collection, Confirmation, and Lead Output

**Files:**
- Modify: `assistant/conversation-engine.js`
- Modify: `tests/assistant-flow.test.js`

- [ ] **Step 1: Add failing happy-path and correction tests**

Append to `tests/assistant-flow.test.js`:

```js
import {
  buildLead,
  buildSummary,
  handleMessage,
} from "../assistant/conversation-engine.js";

function answer(session, message) {
  return handleMessage(session, message);
}

test("assistant collects a complete brief and creates one lead", () => {
  let session = startConversation(createSession("628123456789")).session;
  const replies = [
    "Rina",
    "Pagar geser besi",
    "Panakkukang",
    "Lebar 4 meter, tinggi 1,8 meter",
    "Besi hollow model minimalis",
    "Bulan depan",
    "lewati",
    "rina@example.com",
    "ya",
  ];

  for (const reply of replies) {
    session = answer(session, reply).session;
  }

  assert.equal(session.state, "confirmation");
  assert.match(buildSummary(session), /Pagar geser besi/);

  const confirmed = answer(session, "ya");
  assert.equal(confirmed.session.state, "handoff");
  assert.equal(confirmed.session.completed, true);
  assert.equal(confirmed.lead.customer_name, "Rina");
  assert.equal(confirmed.lead.email_marketing_consent, "Ya");
  assert.equal(confirmed.lead.status, "Baru");
});

test("optional email can be skipped without marketing consent", () => {
  let session = createSession("628123456789");
  session = {
    ...session,
    state: "email",
    data: {
      ...session.data,
      name: "Dedi",
      service: "Kanopi",
      location: "Tamalanrea",
    },
  };

  const skipped = answer(session, "lewati");

  assert.equal(skipped.session.state, "confirmation");
  assert.equal(skipped.session.data.email, "");
  assert.equal(skipped.session.data.emailMarketingConsent, "Tidak");
});

test("customer can correct a field before confirmation", () => {
  const base = createSession("628123456789");
  const session = {
    ...base,
    state: "confirmation",
    data: {
      ...base.data,
      name: "Dedi",
      service: "Kanopi",
      location: "Makassar",
    },
  };

  const corrected = answer(session, "ubah lokasi: Gowa");

  assert.equal(corrected.session.state, "confirmation");
  assert.equal(corrected.session.data.location, "Gowa");
  assert.match(corrected.messages[0], /Gowa/);
});

test("customer can revoke email marketing consent before confirmation", () => {
  const base = createSession("628123456789");
  const session = {
    ...base,
    state: "confirmation",
    data: {
      ...base.data,
      name: "Dedi",
      service: "Kanopi",
      location: "Makassar",
      email: "dedi@example.com",
      emailMarketingConsent: "Ya",
    },
  };

  const corrected = answer(
    session,
    "ubah izin email promosi: tidak",
  );

  assert.equal(corrected.session.data.emailMarketingConsent, "Tidak");
  assert.match(corrected.messages[0], /Izin email promosi: Tidak/);
});

test("buildLead uses a stable Stage 2 field shape", () => {
  const base = createSession("628123456789");
  const session = {
    ...base,
    data: {
      ...base.data,
      name: "Rina",
      service: "Pagar",
      location: "Makassar",
    },
  };

  const lead = buildLead(session, new Date("2026-06-21T02:00:00.000Z"));

  assert.deepEqual(Object.keys(lead), [
    "created_at",
    "status",
    "customer_name",
    "whatsapp_number",
    "email",
    "email_marketing_consent",
    "service_type",
    "location",
    "dimensions",
    "material_or_style",
    "target_time",
    "notes",
    "photo_references",
    "conversation_summary",
    "handoff_reason",
    "source",
  ]);
  assert.equal(lead.created_at, "2026-06-21T02:00:00.000Z");
});
```

- [ ] **Step 2: Run the flow tests and verify RED**

Run: `node --test tests/assistant-flow.test.js`

Expected: FAIL because `handleMessage`, `buildSummary`, and `buildLead` are not exported.

- [ ] **Step 3: Add transition helpers and lead construction**

Add these imports and functions to `assistant/conversation-engine.js`:

```js
import {
  COMPLETION_MESSAGE,
  EMPTY_CUSTOMER_DATA,
  FIELD_BY_STATE,
  FIELD_DEFINITIONS,
  HANDOFF_MESSAGE,
  OPENING_MESSAGE,
} from "./assistant-data.js";

const SKIP_WORDS = new Set([
  "lewati",
  "skip",
  "tidak ada",
  "belum ada",
  "belum tahu",
  "tidak tahu",
]);

const CORRECTION_FIELDS = new Map([
  ["nama", "name"],
  ["pekerjaan", "service"],
  ["lokasi", "location"],
  ["ukuran", "dimensions"],
  ["bahan", "material"],
  ["target waktu", "targetTime"],
  ["email", "email"],
  ["izin email promosi", "emailMarketingConsent"],
]);

function normalize(value) {
  return String(value ?? "").trim();
}

function normalizeLower(value) {
  return normalize(value).toLocaleLowerCase("id-ID");
}

function isSkip(value) {
  return SKIP_WORDS.has(normalizeLower(value));
}

function parseYesNo(value) {
  const normalized = normalizeLower(value);
  if (["ya", "iya", "yes", "boleh", "bersedia"].includes(normalized)) {
    return "Ya";
  }
  if (["tidak", "nggak", "enggak", "no", "tidak bersedia"].includes(normalized)) {
    return "Tidak";
  }
  return null;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getNextState(currentState, data) {
  const index = FIELD_DEFINITIONS.findIndex(
    (field) => field.state === currentState,
  );
  const next = FIELD_DEFINITIONS[index + 1];

  if (next?.state === "marketing_consent" && !data.email) {
    return "confirmation";
  }

  return next?.state ?? "confirmation";
}

function invalidResult(session, message) {
  const failedUnderstanding = session.failedUnderstanding + 1;
  if (failedUnderstanding >= 2) {
    return {
      session: {
        ...session,
        state: "handoff",
        failedUnderstanding,
        handoffReason: "Bot tidak memahami dua jawaban berturut-turut",
      },
      messages: [HANDOFF_MESSAGE],
      lead: null,
    };
  }

  return {
    session: { ...session, failedUnderstanding },
    messages: [message],
    lead: null,
  };
}

export function buildSummary(session) {
  const value = (entry) => entry || "Belum ada";
  return [
    "Ini ringkasannya, Kak:",
    `Nama: ${value(session.data.name)}`,
    `Pekerjaan: ${value(session.data.service)}`,
    `Lokasi: ${value(session.data.location)}`,
    `Ukuran: ${value(session.data.dimensions)}`,
    `Bahan atau model: ${value(session.data.material)}`,
    `Target waktu: ${value(session.data.targetTime)}`,
    `Foto referensi: ${value(session.data.photoReferences)}`,
    `Email: ${value(session.data.email)}`,
    `Izin email promosi: ${session.data.emailMarketingConsent}`,
    "Kalau sudah benar, jawab ya. Kalau ada yang keliru, tulis seperti: ubah lokasi: Gowa.",
  ].join("\n");
}

export function buildLead(session, now = new Date()) {
  return {
    created_at: now.toISOString(),
    status: "Baru",
    customer_name: session.data.name,
    whatsapp_number: session.whatsappNumber,
    email: session.data.email,
    email_marketing_consent: session.data.emailMarketingConsent,
    service_type: session.data.service,
    location: session.data.location,
    dimensions: session.data.dimensions,
    material_or_style: session.data.material,
    target_time: session.data.targetTime,
    notes: "",
    photo_references: session.data.photoReferences,
    conversation_summary: buildSummary(session),
    handoff_reason: session.handoffReason || "Kebutuhan awal sudah dikonfirmasi",
    source: "WhatsApp",
  };
}
```

Replace the duplicate initial import block with the combined import shown above.

- [ ] **Step 4: Implement message handling**

Append to `assistant/conversation-engine.js`:

```js
function handleConfirmation(session, input, now) {
  if (["ya", "iya", "sudah benar", "benar"].includes(normalizeLower(input))) {
    const completedSession = {
      ...session,
      state: "handoff",
      completed: true,
      handoffReason: "Kebutuhan awal sudah dikonfirmasi",
      failedUnderstanding: 0,
    };
    return {
      session: completedSession,
      messages: [COMPLETION_MESSAGE],
      lead: buildLead(completedSession, now),
    };
  }

  const correction = normalize(input).match(/^ubah\s+([^:]+):\s*(.+)$/i);
  if (!correction) {
    return invalidResult(
      session,
      "Tulis koreksinya seperti: ubah lokasi: Gowa. Kalau ringkasannya sudah benar, jawab ya.",
    );
  }

  const key = CORRECTION_FIELDS.get(correction[1].trim().toLocaleLowerCase("id-ID"));
  if (!key) {
    return invalidResult(
      session,
      "Bagian itu belum saya kenali. Kakak bisa mengubah nama, pekerjaan, lokasi, ukuran, bahan, target waktu, email, atau izin email promosi.",
    );
  }

  let correctedValue = correction[2].trim();
  if (key === "emailMarketingConsent") {
    correctedValue = parseYesNo(correctedValue);
    if (!correctedValue) {
      return invalidResult(
        session,
        "Untuk izin email promosi, jawab ya atau tidak, Kak.",
      );
    }
  }

  if (key === "email") {
    if (isSkip(correctedValue)) {
      correctedValue = "";
    } else if (!isValidEmail(correctedValue)) {
      return invalidResult(
        session,
        "Format emailnya belum terbaca, Kak. Contohnya nama@email.com.",
      );
    }
  }

  const nextData = {
    ...session.data,
    [key]: correctedValue,
  };
  if (key === "email" && !correctedValue) {
    nextData.emailMarketingConsent = "Tidak";
  }

  const nextSession = {
    ...session,
    failedUnderstanding: 0,
    data: nextData,
  };

  return {
    session: nextSession,
    messages: [buildSummary(nextSession)],
    lead: null,
  };
}

export function handleMessage(session, input, { now = new Date() } = {}) {
  if (session.state === "welcome") {
    return startConversation(session);
  }

  if (session.state === "confirmation") {
    return handleConfirmation(session, input, now);
  }

  if (["handoff", "closed"].includes(session.state)) {
    return {
      session,
      messages: [],
      lead: null,
    };
  }

  const field = FIELD_BY_STATE.get(session.state);
  const value = normalize(input);
  if (!field || (!value && field.required)) {
    return invalidResult(session, field?.prompt ?? HANDOFF_MESSAGE);
  }

  if (session.state === "email") {
    if (isSkip(value)) {
      const nextSession = {
        ...session,
        state: "confirmation",
        failedUnderstanding: 0,
        data: {
          ...session.data,
          email: "",
          emailMarketingConsent: "Tidak",
        },
      };
      return {
        session: nextSession,
        messages: [buildSummary(nextSession)],
        lead: null,
      };
    }

    if (!isValidEmail(value)) {
      return invalidResult(
        session,
        "Format emailnya belum terbaca, Kak. Contohnya nama@email.com. Kalau tidak ingin mengisi, tulis lewati.",
      );
    }
  }

  let storedValue = value;
  if (session.state === "marketing_consent") {
    storedValue = parseYesNo(value);
    if (!storedValue) {
      return invalidResult(session, FIELD_BY_STATE.get(session.state).prompt);
    }
  } else if (!field.required && isSkip(value)) {
    storedValue = "";
  }

  const nextData = {
    ...session.data,
    [field.key]: storedValue,
  };
  const nextState = getNextState(session.state, nextData);
  const nextSession = {
    ...session,
    state: nextState,
    data: nextData,
    failedUnderstanding: 0,
  };
  const nextMessage =
    nextState === "confirmation"
      ? buildSummary(nextSession)
      : FIELD_BY_STATE.get(nextState).prompt;

  return {
    session: nextSession,
    messages: [nextMessage],
    lead: null,
  };
}
```

- [ ] **Step 5: Run flow tests and verify GREEN**

Run: `node --test tests/assistant-flow.test.js`

Expected: all assistant flow tests pass.

- [ ] **Step 6: Commit the collection flow**

```powershell
git add assistant/conversation-engine.js tests/assistant-flow.test.js
git commit -m "feat: collect and confirm WhatsApp leads"
```

### Task 3: Add FAQ, Handoff, and Restricted Intents

**Files:**
- Create: `assistant/faq.js`
- Modify: `assistant/conversation-engine.js`
- Create: `tests/assistant-guardrails.test.js`

- [ ] **Step 1: Write failing guardrail tests**

Create `tests/assistant-guardrails.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  handleMessage,
  startConversation,
} from "../assistant/conversation-engine.js";

function sessionAt(state) {
  const base = createSession("628123456789");
  return {
    ...base,
    state,
    data: {
      ...base.data,
      name: "Rina",
      service: "Pagar",
    },
  };
}

test("FAQ answer resumes the current collection question", () => {
  const session = sessionAt("location");
  const result = handleMessage(session, "Jam bukanya kapan?");

  assert.equal(result.session.state, "location");
  assert.match(result.messages[0], /Senin-Sabtu, 08\.00-17\.00/);
  assert.match(result.messages[1], /daerah mana/);
});

test("FAQ answer resumes the confirmation summary", () => {
  const session = sessionAt("confirmation");
  const result = handleMessage(session, "Jam bukanya kapan?");

  assert.equal(result.session.state, "confirmation");
  assert.match(result.messages[0], /Senin-Sabtu, 08\.00-17\.00/);
  assert.match(result.messages[1], /Ini ringkasannya/);
});

test("customer can request a human at any state", () => {
  const session = startConversation(createSession("628123456789")).session;
  const result = handleMessage(session, "Saya mau bicara dengan admin");

  assert.equal(result.session.state, "handoff");
  assert.equal(result.session.handoffReason, "Pelanggan meminta admin manusia");
  assert.match(result.messages[0], /admin HIJAOE/);
});

test("price questions are handed to a human without an estimate", () => {
  const result = handleMessage(sessionAt("location"), "Berapa harga pagar ini?");

  assert.equal(result.session.state, "handoff");
  assert.equal(result.session.handoffReason, "Pelanggan menanyakan harga");
  assert.doesNotMatch(result.messages[0], /Rp|rupiah|juta|ribu/i);
});

test("schedule guarantees are handed to a human", () => {
  const result = handleMessage(
    sessionAt("material"),
    "Bisa dipastikan selesai hari Jumat?",
  );

  assert.equal(result.session.state, "handoff");
  assert.equal(result.session.handoffReason, "Pelanggan meminta kepastian jadwal");
});

test("a target-time answer is collected instead of treated as a guarantee", () => {
  const result = handleMessage(sessionAt("target_time"), "Bulan depan");

  assert.equal(result.session.data.targetTime, "Bulan depan");
  assert.equal(result.session.state, "photo");
});
```

- [ ] **Step 2: Run guardrail tests and verify RED**

Run: `node --test tests/assistant-guardrails.test.js`

Expected: FAIL because FAQ and global handoff detection do not exist.

- [ ] **Step 3: Implement deterministic intent matching**

Create `assistant/faq.js`:

```js
import { business, services } from "../assets/js/site-data.js";

const serviceNames = services.map((service) => service.title).join(", ");

const FAQ_ENTRIES = [
  {
    id: "hours",
    patterns: [/jam buka/i, /buka hari apa/i, /operasional/i],
    answer: `${business.hours}. ${business.closed}.`,
  },
  {
    id: "service_area",
    patterns: [/melayani daerah/i, /area layanan/i, /luar makassar/i],
    answer:
      "HIJAOE melayani Makassar dan sekitarnya. Pengiriman atau pengerjaan di luar area dibicarakan dulu sesuai kebutuhan, Kak.",
  },
  {
    id: "services",
    patterns: [/layanan apa/i, /bisa bikin apa/i, /kerja apa saja/i],
    answer: `Layanan utama HIJAOE: ${serviceNames}.`,
  },
  {
    id: "workshop_location",
    patterns: [/alamat bengkel/i, /lokasi bengkel/i, /google maps/i],
    answer: `Bengkel HIJAOE berada di ${business.city}. Lokasinya bisa dibuka di ${business.mapUrl}`,
  },
];

const HANDOFF_PATTERNS = [
  /bicara.*admin/i,
  /chat.*admin/i,
  /orangnya/i,
  /manusia/i,
  /hubungkan.*admin/i,
];

const PRICE_PATTERNS = [
  /berapa.*harga/i,
  /harga.*berapa/i,
  /perkiraan.*biaya/i,
  /ongkos.*berapa/i,
];

const SCHEDULE_PATTERNS = [
  /bisa dipastikan.*selesai/i,
  /pasti.*selesai/i,
  /jamin.*selesai/i,
  /kepastian.*jadwal/i,
];

export function findFaq(message) {
  return (
    FAQ_ENTRIES.find((entry) =>
      entry.patterns.some((pattern) => pattern.test(message)),
    ) ?? null
  );
}

export function detectHandoffRequest(message) {
  return HANDOFF_PATTERNS.some((pattern) => pattern.test(message));
}

export function detectRestrictedIntent(message) {
  if (PRICE_PATTERNS.some((pattern) => pattern.test(message))) {
    return "Pelanggan menanyakan harga";
  }
  if (SCHEDULE_PATTERNS.some((pattern) => pattern.test(message))) {
    return "Pelanggan meminta kepastian jadwal";
  }
  return null;
}
```

- [ ] **Step 4: Integrate FAQ and handoff before field handling**

Add to the imports in `assistant/conversation-engine.js`:

```js
import {
  detectHandoffRequest,
  detectRestrictedIntent,
  findFaq,
} from "./faq.js";
```

Add this helper before `handleMessage`:

```js
function handoffResult(session, reason) {
  return {
    session: {
      ...session,
      state: "handoff",
      handoffReason: reason,
    },
    messages: [HANDOFF_MESSAGE],
    lead: null,
  };
}
```

Inside `handleMessage`, after the `welcome` branch and before the `confirmation` branch, insert:

```js
  const normalizedInput = normalize(input);

  if (detectHandoffRequest(normalizedInput)) {
    return handoffResult(session, "Pelanggan meminta admin manusia");
  }

  if (session.state !== "target_time") {
    const restrictedReason = detectRestrictedIntent(normalizedInput);
    if (restrictedReason) {
      return handoffResult(session, restrictedReason);
    }
  }

  const faq = findFaq(normalizedInput);
  if (faq && session.state === "confirmation") {
    return {
      session,
      messages: [faq.answer, buildSummary(session)],
      lead: null,
    };
  }

  if (faq && FIELD_BY_STATE.has(session.state)) {
    return {
      session,
      messages: [faq.answer, FIELD_BY_STATE.get(session.state).prompt],
      lead: null,
    };
  }
```

- [ ] **Step 5: Run assistant tests and verify GREEN**

Run: `node --test tests/assistant-flow.test.js tests/assistant-guardrails.test.js`

Expected: all assistant flow and guardrail tests pass.

- [ ] **Step 6: Commit guardrails**

```powershell
git add assistant/faq.js assistant/conversation-engine.js tests/assistant-guardrails.test.js
git commit -m "feat: add assistant FAQ and handoff guardrails"
```

### Task 4: Add Privacy Sanitization for Future DeepSeek Calls

**Files:**
- Create: `assistant/privacy.js`
- Create: `tests/assistant-privacy.test.js`

- [ ] **Step 1: Write failing privacy tests**

Create `tests/assistant-privacy.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createSession } from "../assistant/conversation-engine.js";
import {
  buildModelContext,
  sanitizeTextForModel,
} from "../assistant/privacy.js";

test("sanitizer removes email, phone, and explicit name introductions", () => {
  const sanitized = sanitizeTextForModel(
    "Nama saya Rina, nomor 0812-3456-7890 dan email rina@example.com. Mau buat pagar.",
  );

  assert.doesNotMatch(sanitized, /Rina/);
  assert.doesNotMatch(sanitized, /0812/);
  assert.doesNotMatch(sanitized, /rina@example\.com/);
  assert.match(sanitized, /\[nama\]/);
  assert.match(sanitized, /\[nomor\]/);
  assert.match(sanitized, /\[email\]/);
});

test("model context excludes stored identity and location fields", () => {
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
      photoReferences: "https://example.com/private-photo.jpg",
    },
  };

  const context = buildModelContext(
    session,
    "Hubungi saya di 081234567890 untuk model minimalis",
  );
  const serialized = JSON.stringify(context);

  assert.doesNotMatch(serialized, /Rina|rina@example|Jalan Mawar|private-photo/);
  assert.doesNotMatch(serialized, /081234567890/);
  assert.equal(context.service, "Pagar besi");
  assert.equal(context.dimensions, "4 x 2 meter");
});
```

- [ ] **Step 2: Run privacy tests and verify RED**

Run: `node --test tests/assistant-privacy.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `assistant/privacy.js`.

- [ ] **Step 3: Implement PII sanitization and bounded context**

Create `assistant/privacy.js`:

```js
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?62|0)[\s-]?(?:\d[\s-]?){8,13}\d/g;
const NAME_INTRO_PATTERN = /\b(?:nama saya|saya bernama)\s+[\p{L}][\p{L}\s.'-]{1,50}(?=,|\.|\s+nomor|\s+dan|$)/giu;

export function sanitizeTextForModel(value) {
  return String(value ?? "")
    .replace(EMAIL_PATTERN, "[email]")
    .replace(PHONE_PATTERN, "[nomor]")
    .replace(NAME_INTRO_PATTERN, (match) =>
      match.replace(/(?:nama saya|saya bernama).*/iu, "nama saya [nama]"),
    )
    .trim();
}

export function buildModelContext(session, currentMessage) {
  return {
    state: session.state,
    message: sanitizeTextForModel(currentMessage),
    service: sanitizeTextForModel(session.data.service),
    dimensions: sanitizeTextForModel(session.data.dimensions),
    material: sanitizeTextForModel(session.data.material),
    targetTime: sanitizeTextForModel(session.data.targetTime),
  };
}
```

- [ ] **Step 4: Run privacy and assistant tests**

Run: `node --test tests/assistant-privacy.test.js tests/assistant-flow.test.js tests/assistant-guardrails.test.js`

Expected: all tests pass.

- [ ] **Step 5: Commit privacy boundaries**

```powershell
git add assistant/privacy.js tests/assistant-privacy.test.js
git commit -m "feat: sanitize assistant model context"
```

### Task 5: Build the Local Conversation Simulator

**Files:**
- Create: `assistant/simulator.js`
- Create: `tests/assistant-simulator.test.js`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Write a failing simulator test**

Create `tests/assistant-simulator.test.js`:

```js
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
  assert.match(output.join("\n"), /Ini ringkasannya/);
});
```

- [ ] **Step 2: Run the simulator test and verify RED**

Run: `node --test tests/assistant-simulator.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `assistant/simulator.js`.

- [ ] **Step 3: Implement an injectable simulator and CLI**

Create `assistant/simulator.js`:

```js
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
```

- [ ] **Step 4: Add the simulator command**

Add this script to `package.json`:

```json
"assistant:simulate": "node assistant/simulator.js"
```

The complete scripts object becomes:

```json
"scripts": {
  "test": "node --test",
  "serve": "npx --yes serve .",
  "assistant:simulate": "node assistant/simulator.js"
}
```

- [ ] **Step 5: Document the Stage 1 simulator**

Append this section to `README.md`:

````markdown
## Simulator Asisten WhatsApp

Tahap pertama Asisten WhatsApp dapat diuji tanpa akun Meta, DeepSeek, atau Google Sheets:

```powershell
npm.cmd run assistant:simulate
```

Simulator memakai alur yang sama dengan integrasi WhatsApp mendatang. Bot mengumpulkan kebutuhan, menjawab FAQ yang telah disetujui, menolak memberi harga atau kepastian jadwal, dan menampilkan data lead setelah pelanggan mengonfirmasi ringkasan.

Kode simulator berada di `assistant/`. Integrasi API eksternal belum aktif pada tahap ini dan tidak ada API key yang disimpan di repository.
````

- [ ] **Step 6: Run the simulator test and full suite**

Run: `node --test tests/assistant-simulator.test.js`

Expected: simulator test passes.

Run: `npm.cmd test`

Expected: the complete website and assistant test suite passes with zero failures.

- [ ] **Step 7: Manually exercise the simulator**

Run: `npm.cmd run assistant:simulate`

Use this conversation:

```text
Rina
Pagar geser besi
Panakkukang
4 x 2 meter
Besi hollow minimalis
Bulan depan
lewati
lewati
ya
```

Expected: the assistant asks one question per response, shows a summary, prints a lead with status `Baru`, and never provides a price.

- [ ] **Step 8: Check formatting and commit**

Run: `git diff --check`

Expected: exit code 0 with no whitespace errors.

```powershell
git add assistant/simulator.js tests/assistant-simulator.test.js package.json README.md
git commit -m "feat: add WhatsApp assistant simulator"
```

### Task 6: Final Verification

**Files:**
- Verify: `assistant/`
- Verify: `tests/assistant-*.test.js`
- Verify: `package.json`
- Verify: `README.md`

- [ ] **Step 1: Run all tests from a clean command**

Run: `npm.cmd test`

Expected: zero failures.

- [ ] **Step 2: Confirm Stage 1 contains no external credentials**

Run:

```powershell
rg -n "api[_-]?key|access[_-]?token|client[_-]?secret|deepseek|graph\.facebook" assistant tests package.json README.md
```

Expected: only documentation references to DeepSeek are allowed. No credential values, live API endpoints, or secret assignments exist.

- [ ] **Step 3: Confirm the working tree scope**

Run: `git status --short`

Expected: no uncommitted Stage 1 files remain. The unrelated existing `ui-ux-pro-max-skill-main/` directory may remain untracked and must not be added.
