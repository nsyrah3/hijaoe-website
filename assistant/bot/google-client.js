import { Readable } from "node:stream";
import { google } from "googleapis";

const MAX_MEDIA_BYTES = 15 * 1024 * 1024;
const MEDIA_EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function createAuthenticatedGoogleApis(credentials) {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  return {
    sheetsApi: google.sheets({ version: "v4", auth }),
    driveApi: google.drive({ version: "v3", auth }),
  };
}

export function createGoogleClient({
  sheetsApi,
  driveApi,
  spreadsheetId,
  rootFolderId,
  sheetName = "Leads",
}) {
  const customerFolders = new Map();

  return {
    async appendLead(lead) {
      const photoUrls = Array.isArray(lead.photo_urls)
        ? lead.photo_urls.join("\n")
        : String(lead.photo_urls || "");
      const mediaLinks = [lead.drive_folder_url, photoUrls]
        .filter(Boolean)
        .join("\n");

      await sheetsApi.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:N`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [
            [
              lead.created_at || "",
              lead.status || "Baru",
              lead.customer_name || "",
              lead.whatsapp_number || "",
              lead.service_type || "",
              lead.location || "",
              lead.dimensions || "",
              lead.material_or_style || "",
              lead.target_time || "",
              lead.email || "",
              lead.conversation_summary || "",
              lead.handoff_reason || "",
              mediaLinks,
              lead.source || "WhatsApp",
            ],
          ],
        },
      });
    },

    async uploadPhoto({ number, messageId, mimeType, bytes }) {
      const extension = MEDIA_EXTENSIONS.get(mimeType);
      if (!extension) {
        throw new Error("Unsupported media type");
      }

      const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || []);
      if (buffer.byteLength > MAX_MEDIA_BYTES) {
        throw new Error("Media exceeds the 15 MB limit");
      }

      const folderId = await getOrCreateCustomerFolder({
        driveApi,
        rootFolderId,
        number,
        customerFolders,
      });
      const safeMessageId =
        String(messageId || "photo")
          .replace(/[^a-zA-Z0-9_-]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 120) || "photo";

      const response = await driveApi.files.create({
        requestBody: {
          name: `${safeMessageId}.${extension}`,
          parents: [folderId],
        },
        media: {
          mimeType,
          body: Readable.from(buffer),
        },
        fields: "id,webViewLink",
      });

      return {
        driveFileId: response.data.id,
        driveUrl:
          response.data.webViewLink ||
          `https://drive.google.com/file/d/${response.data.id}/view`,
        driveFolderId: folderId,
        driveFolderUrl: `https://drive.google.com/drive/folders/${folderId}`,
      };
    },
  };
}

async function getOrCreateCustomerFolder({
  driveApi,
  rootFolderId,
  number,
  customerFolders,
}) {
  if (customerFolders.has(number)) {
    return customerFolders.get(number);
  }

  const safeNumber = String(number || "").replace(/\D/g, "");
  const escapedName = `WA-${safeNumber}`.replace(/'/g, "\\'");
  const listResponse = await driveApi.files.list({
    q: [
      `'${rootFolderId}' in parents`,
      `name = '${escapedName}'`,
      "mimeType = 'application/vnd.google-apps.folder'",
      "trashed = false",
    ].join(" and "),
    fields: "files(id,name)",
    pageSize: 1,
  });

  let folderId = listResponse.data.files?.[0]?.id;
  if (!folderId) {
    const createResponse = await driveApi.files.create({
      requestBody: {
        name: escapedName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootFolderId],
      },
      fields: "id",
    });
    folderId = createResponse.data.id;
  }

  customerFolders.set(number, folderId);
  return folderId;
}
