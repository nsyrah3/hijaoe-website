import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const privacyPageUrl = new URL("../kebijakan-privasi.html", import.meta.url);

test("a public HIJAOE privacy policy page exists", () => {
  assert.equal(existsSync(privacyPageUrl), true);
});

test("privacy policy exposes Meta-ready policy and deletion information", () => {
  const html = readFileSync(privacyPageUrl, "utf8");

  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/hijaoe\.id\/kebijakan-privasi">/,
  );
  assert.match(html, /<h1[^>]*>Kebijakan Privasi HIJAOE<\/h1>/);

  for (const sectionId of [
    "data-yang-dikumpulkan",
    "penggunaan-data",
    "layanan-pihak-ketiga",
    "penyimpanan-keamanan",
    "penghapusan-data",
    "kontak",
  ]) {
    assert.match(html, new RegExp(`id="${sectionId}"`));
  }

  assert.match(html, /https:\/\/wa\.me\/6285121508159/);
  assert.doesNotMatch(html, /nas[y]?rah008@gmail\.com/i);
});

test("public pages link to the privacy policy", () => {
  for (const filename of ["index.html", "galeri.html"]) {
    const html = readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.match(html, /href="\/kebijakan-privasi"/);
  }

  const servicePage = readFileSync(
    new URL("../layanan/kanopi-makassar.html", import.meta.url),
    "utf8",
  );
  assert.match(servicePage, /href="\/kebijakan-privasi"/);
});
