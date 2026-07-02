import test from "node:test";
import assert from "node:assert/strict";

import {
  catalogCategories,
  catalogItems,
  featuredCatalogIds,
} from "../assets/js/catalog-data.js";

test("catalog contains 60 unique services split evenly across six categories", () => {
  assert.equal(catalogCategories.length, 6);
  assert.equal(catalogItems.length, 60);
  assert.equal(new Set(catalogItems.map(({ id }) => id)).size, 60);
  assert.equal(new Set(catalogItems.map(({ title }) => title)).size, 60);

  for (const category of catalogCategories) {
    assert.equal(
      catalogItems.filter((item) => item.category === category.id).length,
      10,
      category.id,
    );
  }
});

test("catalog uses the approved filter label and service names", () => {
  assert.equal(catalogCategories[0].filterLabel, "Konstruksi");
  assert.ok(
    catalogCategories.some(({ label }) => label === "Plafon & Partisi"),
  );
  assert.ok(
    catalogItems.some(({ title }) => title === "Pekerjaan Pondasi dan Cor"),
  );
  assert.ok(
    catalogItems.some(({ title }) => title === "Partisi Kalsiboard"),
  );
});

test("catalog assets use stable WebP paths and descriptive alt text", () => {
  for (const item of catalogItems) {
    assert.match(item.image, /^assets\/images\/catalog\/[a-z0-9-]+\.webp$/);
    assert.ok(item.alt.length >= 20, item.id);
  }
});

test("school furniture catalog entries link to the detail catalog page", () => {
  const schoolCatalogIds = [
    "meja-sekolah",
    "kursi-sekolah",
    "meja-rangka-besi",
  ];

  for (const id of schoolCatalogIds) {
    const item = catalogItems.find((catalogItem) => catalogItem.id === id);

    assert.equal(item.catalogUrl, "/layanan/meja-kursi-sekolah-makassar");
  }
});

test("canopy catalog entries link to the detail catalog page", () => {
  const canopyCatalogIds = [
    "kanopi-alderon",
    "kanopi-polikarbonat",
    "kanopi-spandek",
    "kanopi-membran",
    "pergola-besi",
    "carport-beratap",
  ];

  for (const id of canopyCatalogIds) {
    const item = catalogItems.find((catalogItem) => catalogItem.id === id);

    assert.equal(item.catalogUrl, "/layanan/kanopi-makassar");
  }
});

test("homepage has six valid featured catalog entries", () => {
  assert.equal(featuredCatalogIds.length, 6);
  assert.equal(new Set(featuredCatalogIds).size, 6);
  assert.ok(
    featuredCatalogIds.every((id) =>
      catalogItems.some((item) => item.id === id),
    ),
  );
});
