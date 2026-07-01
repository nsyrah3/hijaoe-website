import test from "node:test";
import assert from "node:assert/strict";

import {
  getServiceModelCatalog,
  serviceModelCatalogItems,
} from "../assets/js/service-catalog-data.js";

test("school furniture service catalog has ten compact gallery examples", () => {
  const models = getServiceModelCatalog("meja-kursi-sekolah-makassar");

  assert.equal(models.length, 10);
  assert.deepEqual(
    models.map((item) => item.id),
    [
      "meja-siswa-single-kayu",
      "kursi-siswa-kayu",
      "set-meja-kursi-siswa",
      "meja-siswa-double-kayu",
      "meja-guru-sederhana",
      "kursi-guru-kayu",
      "set-tk-sd-kayu-natural",
      "meja-panjang-ruang-kelas",
      "meja-lipat-sekolah-kayu",
      "bangku-panjang-sekolah-kayu",
    ],
  );
});

test("service catalog items use stable paths and honest model copy", () => {
  assert.equal(serviceModelCatalogItems.length, 10);
  assert.equal(
    new Set(serviceModelCatalogItems.map((item) => item.id)).size,
    serviceModelCatalogItems.length,
  );

  for (const item of serviceModelCatalogItems) {
    assert.equal(item.serviceSlug, "meja-kursi-sekolah-makassar");
    assert.match(
      item.image,
      /^assets\/images\/service-catalog\/meja-kursi-sekolah-gallery\/[a-z0-9-]+\.webp$/,
    );
    assert.equal(item.whatsappLabel, item.title);
    assert.ok(item.title.length >= 8, item.id);
    assert.ok(item.description.length >= 35, item.id);
    assert.ok(item.alt.length >= 45, item.id);
  }
});
