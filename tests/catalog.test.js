import test from "node:test";
import assert from "node:assert/strict";

import * as catalog from "../assets/js/catalog.js";
import {
  buildServiceWhatsAppMessage,
  filterCatalog,
  getCatalogBatch,
  renderCatalogCards,
  renderCatalogFilters,
  shouldCloseLightboxOnKey,
} from "../assets/js/catalog.js";

const sample = [
  {
    id: "a",
    title: "Pagar Besi",
    category: "besi-las",
    categoryLabel: "Besi & Las",
    image: "a.webp",
    alt: "Pagar besi rumah",
  },
  {
    id: "b",
    title: "Jendela Aluminium",
    category: "aluminium-kaca",
    categoryLabel: "Aluminium & Kaca",
    image: "b.webp",
    alt: "Jendela aluminium rumah",
  },
];

test("filterCatalog returns all records or one selected category", () => {
  assert.equal(filterCatalog(sample, "semua").length, 2);
  assert.deepEqual(
    filterCatalog(sample, "besi-las").map(({ id }) => id),
    ["a"],
  );
});

test("getCatalogBatch slices twelve records at a time", () => {
  const records = Array.from({ length: 25 }, (_, index) => ({
    id: String(index),
  }));

  assert.equal(getCatalogBatch(records, 0, 12).length, 12);
  assert.equal(getCatalogBatch(records, 12, 12).length, 12);
  assert.equal(getCatalogBatch(records, 24, 12).length, 1);
});

test("catalog card exposes service data and lazy image", () => {
  const html = renderCatalogCards(sample);

  assert.match(html, /Jendela Aluminium/);
  assert.match(html, /data-catalog-id="b"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /Tanyakan layanan ini/);
});

test("catalog card shows detail catalog link only when configured", () => {
  const html = renderCatalogCards([
    {
      ...sample[0],
      catalogUrl: "/layanan/meja-kursi-sekolah-makassar",
    },
    sample[1],
  ]);

  assert.match(html, /Lihat katalog/);
  assert.match(html, /href="\/layanan\/meja-kursi-sekolah-makassar"/);
  assert.equal((html.match(/Lihat katalog/g) || []).length, 1);
});

test("catalog filter renderer escapes labels and category ids", () => {
  const html = renderCatalogFilters(
    [
      {
        id: 'atap" onclick="alert(1)',
        label: "Atap & <Plafon>",
      },
    ],
    "semua",
  );

  assert.match(html, /data-category="atap&quot; onclick=&quot;alert\(1\)"/);
  assert.match(html, /Atap &amp; &lt;Plafon&gt;/);
  assert.doesNotMatch(html, /Atap & <Plafon>/);
});

test("WhatsApp message includes the selected service name", () => {
  assert.equal(
    buildServiceWhatsAppMessage("Lemari Aluminium"),
    "Halo HIJAOE, saya ingin bertanya tentang layanan Lemari Aluminium.",
  );
});

test("Escape closes an open catalog lightbox", () => {
  assert.equal(shouldCloseLightboxOnKey("Escape", true), true);
  assert.equal(shouldCloseLightboxOnKey("Escape", false), false);
  assert.equal(shouldCloseLightboxOnKey("Enter", true), false);
});

test("load-more announcement reports the new and total visible item counts", () => {
  assert.equal(typeof catalog.buildCatalogLoadAnnouncement, "function");
  assert.equal(
    catalog.buildCatalogLoadAnnouncement(12, 24, 50),
    "12 layanan baru ditampilkan. 24 dari 50 layanan terlihat.",
  );
});

test("the first new catalog item receives focus only after the button is hidden", () => {
  assert.equal(typeof catalog.shouldFocusFirstNewCatalogItem, "function");
  assert.equal(catalog.shouldFocusFirstNewCatalogItem(false, 12), false);
  assert.equal(catalog.shouldFocusFirstNewCatalogItem(true, 0), false);
  assert.equal(catalog.shouldFocusFirstNewCatalogItem(true, 2), true);
});

test("Escape restores menu focus only when the mobile menu was open", () => {
  assert.equal(typeof catalog.shouldRestoreMenuFocusOnKey, "function");
  assert.equal(catalog.shouldRestoreMenuFocusOnKey("Escape", true), true);
  assert.equal(catalog.shouldRestoreMenuFocusOnKey("Escape", false), false);
  assert.equal(catalog.shouldRestoreMenuFocusOnKey("Enter", true), false);
});
