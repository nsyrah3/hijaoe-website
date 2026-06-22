import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_URL,
  seoPages,
} from "../assets/js/seo-pages-data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("SEO inventory contains six category and eight priority pages", () => {
  assert.equal(seoPages.length, 14);
  assert.equal(seoPages.filter((page) => page.kind === "category").length, 6);
  assert.equal(seoPages.filter((page) => page.kind === "priority").length, 8);
});

test("SEO pages have unique production search metadata", () => {
  for (const key of ["slug", "title", "description", "heading"]) {
    assert.equal(new Set(seoPages.map((page) => page[key])).size, seoPages.length);
  }

  for (const page of seoPages) {
    assert.match(page.slug, /^[a-z0-9-]+-makassar$/);
    assert.match(page.heading, /Makassar/i);
    assert.ok(page.description.length >= 100);
    assert.ok(page.intro.length >= 120);
    assert.ok(page.sections.length >= 2);
    assert.ok(page.faqs.length >= 3);
    assert.ok(page.relatedSlugs.length >= 2);
  }
});

test("SEO page images exist", async () => {
  await Promise.all(
    seoPages.map((page) => access(path.join(root, page.image))),
  );
});

test("production site URL uses the apex HTTPS domain", () => {
  assert.equal(SITE_URL, "https://hijaoe.id");
});
