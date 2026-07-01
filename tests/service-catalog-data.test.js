import test from "node:test";
import assert from "node:assert/strict";

import {
  getServiceModelCatalog,
  serviceModelCatalogItems,
} from "../assets/js/service-catalog-data.js";

test("school furniture service catalog has five ordered model examples", () => {
  const models = getServiceModelCatalog("meja-kursi-sekolah-makassar");

  assert.equal(models.length, 5);
  assert.deepEqual(
    models.map((item) => item.id),
    [
      "meja-siswa-single-kayu",
      "kursi-siswa-kayu",
      "set-meja-kursi-siswa",
      "meja-siswa-double-kayu",
      "meja-guru-sederhana",
    ],
  );
});

test("service catalog items use stable paths and honest model copy", () => {
  assert.equal(serviceModelCatalogItems.length, 5);
  assert.equal(
    new Set(serviceModelCatalogItems.map((item) => item.id)).size,
    serviceModelCatalogItems.length,
  );

  for (const item of serviceModelCatalogItems) {
    assert.equal(item.serviceSlug, "meja-kursi-sekolah-makassar");
    assert.match(
      item.image,
      /^assets\/images\/service-catalog\/meja-kursi-sekolah\/[a-z0-9-]+\.webp$/,
    );
    assert.equal(item.whatsappLabel, item.title);
    assert.ok(item.title.length >= 8, item.id);
    assert.ok(item.description.length >= 35, item.id);
    assert.ok(item.alt.length >= 45, item.id);
  }
});
