import test from "node:test";
import assert from "node:assert/strict";

import {
  buildServiceWhatsAppMessage,
  filterCatalog,
  getCatalogBatch,
  renderCatalogCards,
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

test("WhatsApp message includes the selected service name", () => {
  assert.equal(
    buildServiceWhatsAppMessage("Lemari Aluminium"),
    "Halo HIJAOE, saya ingin bertanya tentang layanan Lemari Aluminium.",
  );
});
