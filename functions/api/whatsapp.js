import { handleWhatsAppWebhook } from "../../assistant/whatsapp-webhook.js";

export function onRequest(context) {
  return handleWhatsAppWebhook(context.request, context.env);
}
