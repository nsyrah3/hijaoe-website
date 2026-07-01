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

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;");
}

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

test("every SEO page has a generated HTML file", async () => {
  for (const page of seoPages) {
    const html = await readFile(
      path.join(root, "layanan", `${page.slug}.html`),
      "utf8",
    );

    assert.match(
      html,
      new RegExp(`<h1[^>]*>${escapeHtml(page.heading)}</h1>`),
    );
    assert.match(
      html,
      new RegExp(
        `<link rel="canonical" href="${SITE_URL}/layanan/${page.slug}">`,
      ),
    );
  }
});

test("generated pages contain complete search and social metadata", async () => {
  for (const page of seoPages) {
    const html = await readFile(
      path.join(root, "layanan", `${page.slug}.html`),
      "utf8",
    );

    assert.match(
      html,
      /<meta name="robots" content="index,follow,max-image-preview:large">/,
    );
    assert.match(html, /<meta property="og:type" content="website">/);
    assert.match(html, /<meta property="og:site_name" content="HIJAOE">/);
    assert.match(
      html,
      /<meta name="twitter:card" content="summary_large_image">/,
    );
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
  }
});

test("generated service schemas are valid JSON", async () => {
  for (const page of seoPages) {
    const html = await readFile(
      path.join(root, "layanan", `${page.slug}.html`),
      "utf8",
    );
    const blocks = [
      ...html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ),
    ];

    assert.ok(blocks.length >= 3);
    blocks.forEach((block) => JSON.parse(block[1]));
  }
});

test("generated pages link only to known related services", () => {
  const slugs = new Set(seoPages.map((page) => page.slug));
  for (const page of seoPages) {
    for (const relatedSlug of page.relatedSlugs) {
      assert.ok(slugs.has(relatedSlug), `${page.slug} -> ${relatedSlug}`);
      assert.notEqual(relatedSlug, page.slug);
    }
  }
});

const canonicalPaths = [
  "/",
  "/galeri",
  "/kebijakan-privasi",
  ...seoPages.map((page) => `/layanan/${page.slug}`),
];

test("sitemap contains every canonical URL exactly once", async () => {
  const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(
    urls,
    canonicalPaths.map((urlPath) =>
      urlPath === "/" ? SITE_URL : `${SITE_URL}${urlPath}`,
    ),
  );
});

test("robots allows crawling and declares the production sitemap", async () => {
  const robots = await readFile(path.join(root, "robots.txt"), "utf8");
  assert.match(robots, /^User-agent: \*\r?\nAllow: \/$/m);
  assert.match(robots, /Sitemap: https:\/\/hijaoe\.id\/sitemap\.xml/);
});

test("home and gallery expose production metadata and JSON-LD", async () => {
  for (const [filename, canonical] of [
    ["index.html", "https://hijaoe.id"],
    ["galeri.html", "https://hijaoe.id/galeri"],
  ]) {
    const html = await readFile(path.join(root, filename), "utf8");
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="${canonical}">`),
    );
    assert.match(html, /<meta property="og:site_name" content="HIJAOE">/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
    const blocks = [
      ...html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ),
    ];
    assert.ok(blocks.length >= 1);
    blocks.forEach((block) => JSON.parse(block[1]));
  }
});

test("a root 404 page disables accidental SPA fallback indexing", async () => {
  const html = await readFile(path.join(root, "404.html"), "utf8");
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /Halaman tidak ditemukan/);
  assert.match(html, /href="\/galeri"/);
});

test("home page links directly to all category hubs", async () => {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  for (const page of seoPages.filter((entry) => entry.kind === "category")) {
    assert.match(html, new RegExp(`href="/layanan/${page.slug}"`));
  }
});

test("service pages expose discovery and conversion landmarks", async () => {
  for (const page of seoPages) {
    const html = await readFile(
      path.join(root, "layanan", `${page.slug}.html`),
      "utf8",
    );
    assert.match(html, /aria-label="Breadcrumb"/);
    assert.match(html, /class="service-page__faq"/);
    assert.match(html, /class="section service-related"/);
    assert.match(html, /https:\/\/wa\.me\/6285121508159/);
    assert.doesNotMatch(html, /628976010103/);
    assert.match(html, /href="\/galeri"/);
    assert.match(
      html,
      /Melayani Makassar dan berbagai wilayah Sulawesi Selatan\./,
    );
    assert.match(
      html,
      /Beberapa pekerjaan sebelumnya dikerjakan di area Bulukumba hingga Palopo\./,
    );
  }
});

const unsupportedClaimPatterns = [
  /\bgaransi\b/i,
  /\bberpengalaman\s+\d+/i,
  /\b\d+\s+tahun\s+pengalaman\b/i,
  /\bratusan\s+proyek\b/i,
  /\btestimoni\b/i,
  /\bharga\s+mulai\b/i,
  /\btermurah\b/i,
  /\bnomor\s+1\b/i,
  /\bterbaik\s+di\s+Makassar\b/i,
];

test("SEO pages avoid unsupported business claims", async () => {
  for (const page of seoPages) {
    const html = await readFile(
      path.join(root, "layanan", `${page.slug}.html`),
      "utf8",
    );
    for (const pattern of unsupportedClaimPatterns) {
      assert.doesNotMatch(html, pattern, `${page.slug}: ${pattern}`);
    }
  }
});

test("SEO pages contain substantive unique visible copy", async () => {
  const bodies = [];
  for (const page of seoPages) {
    const html = await readFile(
      path.join(root, "layanan", `${page.slug}.html`),
      "utf8",
    );
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replaceAll("&amp;", "&")
      .replaceAll("&#039;", "'")
      .replace(/\s+/g, " ")
      .trim();

    assert.ok(text.length >= 1200, `${page.slug}: ${text.length}`);
    bodies.push(text);
  }
  assert.equal(new Set(bodies).size, seoPages.length);
});

test("AI service visuals are not presented as completed customer projects", async () => {
  for (const page of seoPages) {
    const html = await readFile(
      path.join(root, "layanan", `${page.slug}.html`),
      "utf8",
    );
    assert.doesNotMatch(html, /hasil proyek|proyek pelanggan|hasil pekerjaan HIJAOE/i);
  }
});

test("school furniture page renders model catalog examples", async () => {
  const html = await readFile(
    path.join(root, "layanan", "meja-kursi-sekolah-makassar.html"),
    "utf8",
  );
  const itemCount = (html.match(/class="service-model-gallery__item"/g) || []).length;

  assert.match(html, /class="section service-model-catalog"/);
  assert.match(html, />Galeri model</);
  assert.match(html, />Inspirasi Model Meja &amp; Kursi Sekolah</);
  assert.match(html, /contoh model pesanan/i);
  assert.equal(itemCount, 10);
  assert.match(html, /Meja Siswa Single Kayu/);
  assert.match(html, /Meja Guru Sederhana/);
  assert.match(html, /Bangku Panjang Sekolah Kayu/);
  assert.match(html, /Meja Lipat Sekolah Kayu/);
  assert.doesNotMatch(html, /Tanyakan model ini/);
  assert.match(html, /Konsultasi model meja kursi sekolah/);
  assert.match(html, /meja-kursi-sekolah-gallery\/meja-siswa-single-kayu\.webp/);
});
