import test from "node:test";
import assert from "node:assert/strict";

import {
  business,
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

test("service groups cover the five confirmed categories", () => {
  assert.equal(services.length, 5);
  assert.deepEqual(
    services.map(({ title }) => title),
    [
      "Konstruksi & Renovasi",
      "Besi & Las",
      "Aluminium & Kaca",
      "Atap & Plafon",
      "Interior & Furnitur",
    ],
  );
});

test("service area stays general to Makassar and nearby areas", () => {
  assert.equal(business.serviceAreaTitle, "Melayani Makassar dan sekitarnya.");
  assert.equal(serviceAreas.length, 1);
  assert.equal(serviceAreas[0].city, "Makassar & Sekitarnya");
  assert.doesNotMatch(
    `${business.serviceArea} ${JSON.stringify(serviceAreas)}`,
    /Bulukumba|Palopo/,
  );
});

test("WhatsApp URL uses the international number and encoded message", () => {
  const url = buildWhatsAppUrl("Halo HIJAOE, saya ingin konsultasi.");

  assert.equal(
    url,
    "https://wa.me/628976010103?text=Halo%20HIJAOE%2C%20saya%20ingin%20konsultasi.",
  );
});
