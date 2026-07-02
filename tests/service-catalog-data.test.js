import test from "node:test";
import assert from "node:assert/strict";

import {
  getServiceModelCatalog,
  getServiceModelCatalogSection,
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

test("iron fence service catalog has ten compact gallery examples", () => {
  const models = getServiceModelCatalog("pagar-besi-makassar");

  assert.equal(models.length, 10);
  assert.deepEqual(
    models.map((item) => item.id),
    [
      "pagar-besi-minimalis-hollow",
      "pagar-besi-geser-minimalis",
      "pagar-besi-kombinasi-plat",
      "pagar-besi-lipat-ruko",
      "pagar-besi-laser-cut",
      "pagar-besi-klasik-modern",
      "pagar-besi-kombinasi-kayu",
      "pagar-besi-tinggi-privasi",
      "pagar-besi-bengkel-preview",
      "pagar-besi-gerbang-lebar",
    ],
  );
});

test("canopy service catalog has ten compact gallery examples", () => {
  const models = getServiceModelCatalog("kanopi-makassar");

  assert.equal(models.length, 10);
  assert.deepEqual(
    models.map((item) => item.id),
    [
      "kanopi-alderon-carport-minimalis",
      "kanopi-spandek-teras-rumah",
      "kanopi-polikarbonat-transparan",
      "kanopi-baja-ringan-simple",
      "kanopi-rooftop-dak-terbuka",
      "kanopi-pergola-minimalis",
      "kanopi-toko-ruko",
      "kanopi-membran-modern",
      "kanopi-carport-dua-mobil",
      "kanopi-samping-rumah-multifungsi",
    ],
  );
});

test("service catalog sections use service-specific heading and CTA", () => {
  const schoolCatalog = getServiceModelCatalogSection("meja-kursi-sekolah-makassar");
  const fenceCatalog = getServiceModelCatalogSection("pagar-besi-makassar");
  const canopyCatalog = getServiceModelCatalogSection("kanopi-makassar");

  assert.equal(schoolCatalog.heading, "Inspirasi Model Meja & Kursi Sekolah");
  assert.equal(schoolCatalog.ctaLabel, "Konsultasi model meja kursi sekolah");
  assert.equal(fenceCatalog.heading, "Inspirasi Model Pagar Besi");
  assert.equal(fenceCatalog.ctaLabel, "Konsultasi model pagar besi");
  assert.equal(canopyCatalog.heading, "Inspirasi Model Kanopi");
  assert.equal(canopyCatalog.ctaLabel, "Konsultasi model kanopi");
});

test("service catalog items use stable paths and honest model copy", () => {
  assert.equal(serviceModelCatalogItems.length, 30);
  assert.equal(
    new Set(serviceModelCatalogItems.map((item) => item.id)).size,
    serviceModelCatalogItems.length,
  );

  for (const item of serviceModelCatalogItems) {
    assert.match(
      item.serviceSlug,
      /^(meja-kursi-sekolah-makassar|pagar-besi-makassar|kanopi-makassar)$/,
    );
    assert.match(
      item.image,
      /^assets\/images\/service-catalog\/[a-z0-9-]+-gallery\/[a-z0-9-]+\.webp$/,
    );
    assert.equal(item.whatsappLabel, item.title);
    assert.ok(item.title.length >= 8, item.id);
    assert.ok(item.description.length >= 35, item.id);
    assert.ok(item.alt.length >= 45, item.id);
  }
});
