import test from "node:test";
import assert from "node:assert/strict";

import {
  catalogItems,
  featuredCatalogIds,
} from "../assets/js/catalog-data.js";
import {
  business,
  projects,
  serviceAreas,
  services,
  buildWhatsAppUrl,
} from "../assets/js/site-data.js";

test("business data contains the confirmed HIJAOE details", () => {
  assert.equal(business.name, "HIJAOE");
  assert.equal(business.phoneDisplay, "0897-6010-103");
  assert.equal(business.hours, "Senin-Sabtu, 08.00-17.00");
  assert.equal(business.city, "Makassar");
});

test("service groups cover the six confirmed categories", () => {
  assert.equal(services.length, 6);
  assert.deepEqual(
    services.map(({ title }) => title),
    [
      "Konstruksi & Renovasi",
      "Besi & Las",
      "Aluminium & Kaca",
      "Atap & Kanopi",
      "Plafon & Partisi",
      "Interior & Furnitur",
    ],
  );
});

test("service area covers Makassar, Gowa, Maros, and nearby areas", () => {
  assert.equal(
    business.serviceAreaTitle,
    "Melayani Makassar, Gowa, Maros, dan sekitarnya.",
  );
  assert.deepEqual(business.serviceCities, ["Makassar", "Gowa", "Maros"]);
  assert.deepEqual(
    serviceAreas.map((area) => area.city),
    ["Makassar", "Gowa", "Maros"],
  );
  assert.doesNotMatch(
    `${business.serviceArea} ${JSON.stringify(serviceAreas)}`,
    /Bulukumba|Palopo/,
  );
});

test("homepage projects are six featured catalog services", () => {
  assert.equal(projects.length, 6);
  assert.deepEqual(
    projects.map(({ id }) => id),
    featuredCatalogIds,
  );
  assert.equal(new Set(projects.map(({ category }) => category)).size, 6);
  assert.ok(projects.every((project) => catalogItems.some((item) => item.id === project.id)));
});

test("WhatsApp URL uses the international number and encoded message", () => {
  const url = buildWhatsAppUrl("Halo HIJAOE, saya ingin konsultasi.");

  assert.equal(
    url,
    "https://wa.me/628976010103?text=Halo%20HIJAOE%2C%20saya%20ingin%20konsultasi.",
  );
});
