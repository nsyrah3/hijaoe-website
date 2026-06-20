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

test("catalog lightbox is labelled by its service title", () => {
  const dialogTag = galleryHtml.match(
    /<dialog\b[^>]*\bid="catalog-lightbox"[^>]*>/,
  )?.[0];

  assert.ok(dialogTag);
  assert.match(dialogTag, /\baria-labelledby="catalog-lightbox-title"/);
  assert.match(
    galleryHtml,
    /<h2\b[^>]*\bid="catalog-lightbox-title"[^>]*\bdata-lightbox-title\b[^>]*>/,
  );
});

test("catalog lightbox image does not start with an empty src", () => {
  const imageTag = galleryHtml.match(
    /<img\b[^>]*\bdata-lightbox-image\b[^>]*>/,
  )?.[0];

  assert.ok(imageTag);
  assert.doesNotMatch(imageTag, /\bsrc\s*=/);
});

test("catalog load-more feedback is exposed as a polite live status", () => {
  const statusTag = galleryHtml.match(
    /<p\b[^>]*\bid="catalog-load-status"[^>]*>/,
  )?.[0];

  assert.ok(statusTag);
  assert.match(statusTag, /\brole="status"/);
  assert.match(statusTag, /\baria-live="polite"/);
  assert.match(statusTag, /\bclass="visually-hidden"/);
});
