import { catalogCategories, catalogItems } from "./catalog-data.js";
import {
  buildCatalogLoadAnnouncement,
  buildServiceWhatsAppUrl,
  filterCatalog,
  getCatalogBatch,
  renderCatalogCards,
  shouldCloseLightboxOnKey,
  shouldFocusFirstNewCatalogItem,
  shouldRestoreMenuFocusOnKey,
} from "./catalog.js";
import { buildWhatsAppUrl } from "./site-data.js";

const BATCH_SIZE = 12;
const consultationMessage =
  "Halo HIJAOE, saya ingin konsultasi mengenai pekerjaan konstruksi atau pesanan custom.";

const state = {
  category: "semua",
  visibleCount: BATCH_SIZE,
  lastTrigger: null,
};

const filters = document.querySelector("#catalog-filters");
const grid = document.querySelector("#catalog-grid");
const emptyState = document.querySelector("#catalog-empty");
const loadMore = document.querySelector("#load-more");
const loadStatus = document.querySelector("#catalog-load-status");
const menuButton = document.querySelector("#menu-button");
const primaryNavigation = document.querySelector("#primary-navigation");
const dialog = document.querySelector("#catalog-lightbox");
const dialogImage = document.querySelector("[data-lightbox-image]");
const dialogCategory = document.querySelector("[data-lightbox-category]");
const dialogTitle = document.querySelector("[data-lightbox-title]");
const dialogWhatsApp = document.querySelector("[data-lightbox-whatsapp]");

function filteredItems() {
  return filterCatalog(catalogItems, state.category);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        "stroke-width": 1.75,
      },
    });
  }
}

function renderFilters() {
  const categories = [
    { id: "semua", label: "Semua" },
    ...catalogCategories.map((category) => ({
      ...category,
      label: category.filterLabel ?? category.label,
    })),
  ];

  filters.innerHTML = categories
    .map(
      (category) => `
        <button
          class="catalog-filter"
          type="button"
          data-category="${category.id}"
          aria-pressed="${category.id === state.category ? "true" : "false"}"
        >
          ${category.label}
        </button>
      `,
    )
    .join("");
}

function renderGrid() {
  const items = filteredItems();
  const visibleItems = getCatalogBatch(items, 0, state.visibleCount);

  grid.innerHTML = renderCatalogCards(visibleItems);
  emptyState.hidden = items.length > 0;
  loadMore.hidden = visibleItems.length >= items.length;

  refreshIcons();
}

function setCategory(category) {
  state.category = category;
  state.visibleCount = BATCH_SIZE;
  loadStatus.textContent = "";

  filters.querySelectorAll("[data-category]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.category === category),
    );
  });

  renderGrid();
}

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  primaryNavigation.dataset.open = "false";
}

function openLightbox(item, trigger) {
  state.lastTrigger = trigger;
  dialogImage.src = item.image;
  dialogImage.alt = item.alt;
  dialogCategory.textContent = item.categoryLabel;
  dialogTitle.textContent = item.title;
  dialogWhatsApp.href = buildServiceWhatsAppUrl(item.title);
  dialog.showModal();
  refreshIcons();
}

function closeLightbox() {
  if (dialog.open) {
    dialog.close();
  }
}

function restoreLightboxFocus() {
  if (state.lastTrigger) {
    state.lastTrigger.focus();
    state.lastTrigger = null;
  }
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) {
    return;
  }

  setCategory(button.dataset.category);
});

loadMore.addEventListener("click", () => {
  const items = filteredItems();
  const previousVisibleCount = Math.min(state.visibleCount, items.length);

  state.visibleCount += BATCH_SIZE;
  renderGrid();

  const visibleCount = Math.min(state.visibleCount, items.length);
  const newItemCount = visibleCount - previousVisibleCount;
  loadStatus.textContent = buildCatalogLoadAnnouncement(
    newItemCount,
    visibleCount,
    items.length,
  );

  if (shouldFocusFirstNewCatalogItem(loadMore.hidden, newItemCount)) {
    grid
      .querySelectorAll("[data-lightbox-id]")
      .item(previousVisibleCount)
      ?.focus();
  }
});

grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lightbox-id]");
  if (!button) {
    return;
  }

  const item = catalogItems.find((catalogItem) => catalogItem.id === button.dataset.lightboxId);
  if (item) {
    openLightbox(item, button);
  }
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog || event.target.closest("[data-lightbox-close]")) {
    closeLightbox();
  }
});

dialog.addEventListener("close", restoreLightboxFocus);

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  primaryNavigation.dataset.open = String(!isOpen);
});

primaryNavigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const shouldRestoreMenuFocus = shouldRestoreMenuFocusOnKey(
      event.key,
      menuButton.getAttribute("aria-expanded") === "true",
    );

    closeMenu();
    if (shouldRestoreMenuFocus) {
      menuButton.focus();
    }
  }

  if (shouldCloseLightboxOnKey(event.key, dialog.open)) {
    closeLightbox();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 860) {
    closeMenu();
  }
});

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.href = buildWhatsAppUrl(consultationMessage);
});

document.querySelector("[data-year]").textContent = new Date().getFullYear();

renderFilters();
renderGrid();
refreshIcons();
