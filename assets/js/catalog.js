import { buildWhatsAppUrl } from "./site-data.js";
import { escapeHtml } from "./render.js";

export function filterCatalog(items, category) {
  if (category === "semua") {
    return items;
  }

  return items.filter((item) => item.category === category);
}

export function getCatalogBatch(items, offset, limit = 12) {
  return items.slice(offset, offset + limit);
}

export function shouldCloseLightboxOnKey(key, isOpen) {
  return key === "Escape" && isOpen;
}

export function buildServiceWhatsAppMessage(title) {
  return `Halo HIJAOE, saya ingin bertanya tentang layanan ${title}.`;
}

export function buildServiceWhatsAppUrl(title) {
  return buildWhatsAppUrl(buildServiceWhatsAppMessage(title));
}

export function renderCatalogCards(items) {
  return items
    .map(
      (item) => `
        <article class="catalog-card" data-catalog-id="${escapeHtml(item.id)}">
          <button
            class="catalog-card__image-button"
            type="button"
            data-lightbox-id="${escapeHtml(item.id)}"
            aria-label="Perbesar gambar ${escapeHtml(item.title)}"
          >
            <img
              src="${escapeHtml(item.image)}"
              alt="${escapeHtml(item.alt)}"
              loading="lazy"
              width="960"
              height="640"
            >
          </button>
          <div class="catalog-card__body">
            <span>${escapeHtml(item.categoryLabel)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <a
              href="${escapeHtml(buildServiceWhatsAppUrl(item.title))}"
              target="_blank"
              rel="noreferrer"
              data-service-whatsapp="${escapeHtml(item.id)}"
            >
              Tanyakan layanan ini
              <i data-lucide="message-circle" aria-hidden="true"></i>
            </a>
          </div>
        </article>
      `,
    )
    .join("");
}
