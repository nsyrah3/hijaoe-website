import assert from "node:assert/strict";
import test from "node:test";
import { createGoogleClient } from "../assistant/bot/google-client.js";

test("appends one normalized lead row", async () => {
  const calls = [];
  const client = createGoogleClient({
    sheetsApi: {
      spreadsheets: {
        values: {
          append: async (request) => calls.push(request),
        },
      },
    },
    driveApi: {},
    spreadsheetId: "sheet-1",
    rootFolderId: "folder-1",
    sheetName: "Leads",
  });

  await client.appendLead({
    created_at: "2026-06-23T00:00:00.000Z",
    status: "Baru",
    customer_name: "Ari",
    whatsapp_number: "628111",
    service_type: "Kanopi",
    location: "Gowa",
    dimensions: "3 x 4 m",
    material_or_style: "Baja ringan",
    target_time: "Bulan depan",
    email: "",
    conversation_summary: "Ringkasan",
    handoff_reason: "Selesai",
    drive_folder_url: "https://drive.google.com/drive/folders/f1",
    photo_urls: ["https://drive.google.com/file/d/p1/view"],
    source: "WhatsApp",
  });

  assert.equal(calls[0].range, "Leads!A:N");
  assert.equal(calls[0].requestBody.values[0][2], "Ari");
  assert.equal(calls[0].requestBody.values[0].length, 14);
});

test("uploads supported media with a generated safe filename", async () => {
  const created = [];
  const driveApi = {
    files: {
      list: async () => ({ data: { files: [] } }),
      create: async (request) => {
        created.push(request);
        if (request.requestBody.mimeType === "application/vnd.google-apps.folder") {
          return { data: { id: "folder-customer" } };
        }
        return {
          data: {
            id: "photo-1",
            webViewLink: "https://drive.google.com/file/d/photo-1/view",
          },
        };
      },
    },
  };
  const client = createGoogleClient({
    sheetsApi: {},
    driveApi,
    spreadsheetId: "sheet-1",
    rootFolderId: "folder-1",
  });

  const result = await client.uploadPhoto({
    number: "628111",
    messageId: "wamid/unsafe",
    mimeType: "image/jpeg",
    bytes: Buffer.from("photo"),
    originalFilename: "../../customer-secret.jpg",
  });

  assert.equal(result.driveFileId, "photo-1");
  assert.equal(result.driveFolderId, "folder-customer");
  assert.equal(created[1].requestBody.name, "wamid_unsafe.jpg");
  assert.equal("permissions" in created[1], false);
});

test("rejects unsupported or oversized media", async () => {
  const client = createGoogleClient({
    sheetsApi: {},
    driveApi: {},
    spreadsheetId: "sheet-1",
    rootFolderId: "folder-1",
  });

  await assert.rejects(
    () =>
      client.uploadPhoto({
        number: "628111",
        messageId: "m1",
        mimeType: "application/pdf",
        bytes: Buffer.from("pdf"),
      }),
    /Unsupported media type/,
  );

  await assert.rejects(
    () =>
      client.uploadPhoto({
        number: "628111",
        messageId: "m2",
        mimeType: "image/png",
        bytes: Buffer.alloc(15 * 1024 * 1024 + 1),
      }),
    /15 MB/,
  );
});
