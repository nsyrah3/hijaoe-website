import test from "node:test";
import assert from "node:assert/strict";

import {
  catalogCategories,
  catalogItems,
  featuredCatalogIds,
} from "../assets/js/catalog-data.js";

test("catalog contains 50 unique services split evenly across five categories", () => {
  assert.equal(catalogItems.length, 50);
  assert.equal(new Set(catalogItems.map(({ id }) => id)).size, 50);
  assert.equal(new Set(catalogItems.map(({ title }) => title)).size, 50);

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
    catalogItems.some(({ title }) => title === "Pekerjaan Pondasi dan Cor"),
  );
});

test("catalog assets use stable WebP paths and descriptive alt text", () => {
  for (const item of catalogItems) {
    assert.match(item.image, /^assets\/images\/catalog\/[a-z0-9-]+\.webp$/);
    assert.ok(item.alt.length >= 20, item.id);
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
