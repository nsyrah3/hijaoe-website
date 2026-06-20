import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync(
  new URL("../index.html", import.meta.url),
  "utf8",
);
const galleryHtml = readFileSync(
  new URL("../galeri.html", import.meta.url),
  "utf8",
);

test("both pages declare the HIJAOE favicon", () => {
  for (const html of [indexHtml, galleryHtml]) {
    assert.match(html, /rel="icon" href="assets\/images\/favicon\.svg"/);
  }
});

test("catalog introduction describes images as service examples", () => {
  assert.match(
    galleryHtml,
    /contoh jenis pekerjaan yang dapat dipesan/i,
  );
});
