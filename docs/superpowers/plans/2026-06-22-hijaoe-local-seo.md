# HIJAOE Local SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-ready local SEO foundation and 14 useful service landing pages for HIJAOE on `https://hijaoe.id`.

**Architecture:** Store explicit page-specific content in one JavaScript data module and render committed static HTML with a local Node.js generator. Keep Cloudflare Pages deployment build-free while sharing navigation, metadata, schema, breadcrumbs, FAQs, and calls to action through the generator. Test the generated pages, canonical URL inventory, crawl files, claims, links, and assets with Node's built-in test runner.

**Tech Stack:** Static HTML/CSS, Node.js ESM, Node.js built-in test runner, Cloudflare Pages

---

## File Structure

- `assets/js/seo-pages-data.js`: explicit metadata and unique content for six category pages and eight priority service pages.
- `scripts/generate-seo-pages.js`: HTML escaping, JSON-LD construction, service-page rendering, sitemap rendering, and file output.
- `layanan/*.html`: 14 committed generated landing pages served by Cloudflare Pages at extensionless URLs.
- `robots.txt`: crawl permission and production sitemap location.
- `sitemap.xml`: the 16 canonical production URLs.
- `404.html`: real not-found page so Cloudflare Pages does not apply SPA fallback behavior.
- `index.html`: canonical, social metadata, LocalBusiness schema, and service-page discovery links.
- `galeri.html`: canonical, social metadata, CollectionPage schema, and clean internal links.
- `assets/css/styles.css`: responsive service-page, breadcrumb, FAQ, and related-link styles.
- `tests/seo.test.js`: SEO inventory, metadata, content, schema, sitemap, assets, claims, and link tests.
- `tests/markup.test.js`: update existing navigation expectations to canonical extensionless URLs.
- `package.json`: local SEO generation command.
- `README.md`: generation, deployment, Search Console, and Business Profile instructions.

### Task 1: Define And Validate The SEO Page Inventory

**Files:**
- Create: `assets/js/seo-pages-data.js`
- Create: `tests/seo.test.js`

- [ ] **Step 1: Write the failing inventory tests**

Create `tests/seo.test.js` with tests that import `seoPages` and verify:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seoPages } from "../assets/js/seo-pages-data.js";

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
```

- [ ] **Step 2: Run the inventory test and verify RED**

Run: `node --test tests/seo.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `assets/js/seo-pages-data.js`.

- [ ] **Step 3: Add the explicit SEO page data**

Create `assets/js/seo-pages-data.js` exporting:

```js
export const SITE_URL = "https://hijaoe.id";

export const seoPages = [
  {
    kind: "category",
    slug: "konstruksi-renovasi-makassar",
    title: "Jasa Konstruksi & Renovasi Makassar | HIJAOE",
    description:
      "Jasa konstruksi dan renovasi di Makassar untuk rumah, toko, sekolah, gudang, teras, pondasi, pengecatan, dan pekerjaan bangunan sesuai kebutuhan.",
    heading: "Jasa Konstruksi & Renovasi Makassar",
    eyebrow: "Konstruksi & renovasi",
    intro:
      "HIJAOE menangani kebutuhan konstruksi dan renovasi untuk rumah, toko, sekolah, serta tempat usaha di Makassar dan sekitarnya. Lingkup pekerjaan dibicarakan berdasarkan kondisi bangunan, ukuran, material, lokasi, dan hasil yang ingin dicapai.",
    image: "assets/images/project-construction.webp",
    imageAlt: "Bangunan rumah yang sedang ditangani untuk pekerjaan konstruksi dan renovasi",
    sections: [
      {
        heading: "Pekerjaan yang dapat dibicarakan",
        body:
          "Kebutuhan dapat mencakup pembangunan rumah sederhana, penambahan ruang atau teras, pondasi dan pekerjaan beton, pemasangan keramik, pengecatan eksterior, renovasi ruang usaha, gudang rangka besi, serta perbaikan bagian bangunan.",
        items: [
          "Bangun dan renovasi rumah",
          "Pondasi, cor, keramik, dan pengecatan",
          "Teras, gudang, dan ruang usaha",
          "Pekerjaan tambahan sesuai kondisi lokasi",
        ],
      },
      {
        heading: "Perencanaan berdasarkan kondisi lapangan",
        body:
          "Ukuran awal dan foto membantu pembicaraan pertama. Untuk pekerjaan yang berkaitan dengan struktur, sambungan bangunan, atau banyak bagian sekaligus, survei diperlukan agar lingkup kerja dan material dapat ditentukan dengan lebih jelas.",
        items: [],
      },
    ],
    faqs: [
      {
        question: "Apakah HIJAOE melayani renovasi rumah di Makassar?",
        answer:
          "Ya. Kebutuhan renovasi dibicarakan berdasarkan bagian yang ingin diperbaiki, kondisi bangunan, ukuran, lokasi, dan material yang dipilih.",
      },
      {
        question: "Apakah bisa mengerjakan toko atau ruang usaha?",
        answer:
          "Bisa dibicarakan. HIJAOE melayani kebutuhan bangunan untuk rumah, toko, sekolah, dan tempat usaha sesuai lingkup pekerjaan.",
      },
      {
        question: "Apa yang perlu dikirim untuk konsultasi awal?",
        answer:
          "Kirim lokasi, foto kondisi saat ini, bagian yang ingin dikerjakan, ukuran perkiraan, dan target waktu melalui WhatsApp.",
      },
    ],
    relatedSlugs: [
      "renovasi-rumah-makassar",
      "besi-las-makassar",
      "atap-kanopi-makassar",
    ],
  },
];
```

Add the other 13 records with this exact content contract:

| Kind | Slug | Title | Description | Image | Required section focus | Required FAQ focus | Related slugs |
|---|---|---|---|---|---|---|---|
| category | `besi-las-makassar` | `Jasa Las & Besi Makassar | HIJAOE` | `Jasa las dan pembuatan besi di Makassar untuk pagar, teralis, gerbang, railing, tangga, mezanin, rak, rangka, dan kebutuhan custom sesuai ukuran.` | `assets/images/project-metalwork.webp` | Jenis pekerjaan besi; ukuran, model, dan kondisi pemasangan | pembuatan custom; perbaikan las; data konsultasi | `pagar-besi-makassar`, `konstruksi-renovasi-makassar`, `atap-kanopi-makassar` |
| category | `aluminium-kaca-makassar` | `Aluminium & Kaca Makassar | HIJAOE` | `Pembuatan aluminium dan kaca di Makassar untuk kusen, pintu, jendela, etalase, storefront, pintu geser, pintu lipat, dan kebutuhan custom.` | `assets/images/project-aluminium.webp` | Produk aluminium dan kaca; pilihan model dan pengukuran | pintu/jendela; etalase; konsultasi ukuran | `pintu-jendela-aluminium-makassar`, `lemari-kitchen-set-aluminium-makassar`, `partisi-kaca-kalsiboard-makassar` |
| category | `atap-kanopi-makassar` | `Jasa Atap & Kanopi Makassar | HIJAOE` | `Jasa atap dan kanopi di Makassar untuk rangka baja ringan, spandek, alderon, polikarbonat, membran, pergola, talang, dan perbaikan atap.` | `assets/images/project-roofing.webp` | Jenis penutup dan rangka; ukuran, aliran air, dan lokasi | bahan kanopi; perbaikan bocor; survei | `kanopi-makassar`, `konstruksi-renovasi-makassar`, `besi-las-makassar` |
| category | `plafon-partisi-makassar` | `Plafon & Partisi Makassar | HIJAOE` | `Pemasangan plafon dan partisi di Makassar menggunakan PVC, gypsum, kaca, aluminium, atau kalsiboard untuk rumah dan tempat usaha.` | `assets/images/catalog/plafon-minimalis-ruang-tamu.webp` | Jenis plafon; jenis partisi dan kebutuhan ruang | PVC/gypsum; partisi; data ukuran | `plafon-pvc-gypsum-makassar`, `partisi-kaca-kalsiboard-makassar`, `interior-furnitur-makassar` |
| category | `interior-furnitur-makassar` | `Interior & Furnitur Custom Makassar | HIJAOE` | `Pembuatan interior dan furnitur custom di Makassar untuk kitchen set, kabinet aluminium, lemari, rak, meja, kursi sekolah, booth, dan wall panel.` | `assets/images/project-interior.webp` | Furnitur rumah/usaha; produk sekolah dan display | custom ukuran; aluminium/kayu; konsultasi model | `lemari-kitchen-set-aluminium-makassar`, `meja-kursi-sekolah-makassar`, `plafon-partisi-makassar` |
| priority | `kanopi-makassar` | `Jasa Kanopi Makassar Sesuai Ukuran | HIJAOE` | `Pembuatan dan pemasangan kanopi di Makassar dengan pilihan spandek, alderon, polikarbonat, membran, pergola, dan rangka sesuai kebutuhan lokasi.` | `assets/images/catalog/kanopi-alderon.webp` | Pilihan jenis kanopi; pengukuran area dan pembuangan air | pilihan penutup; area pemasangan; konsultasi awal | `atap-kanopi-makassar`, `besi-las-makassar`, `konstruksi-renovasi-makassar` |
| priority | `pagar-besi-makassar` | `Pagar Besi Makassar Custom | HIJAOE` | `Pembuatan pagar besi custom di Makassar untuk model geser, gerbang, teralis, dan kebutuhan pengamanan rumah atau tempat usaha sesuai ukuran.` | `assets/images/catalog/pagar-geser-besi.webp` | Pagar geser dan gerbang; ukuran bukaan dan model | pagar custom; perbaikan pagar; data pengukuran | `besi-las-makassar`, `konstruksi-renovasi-makassar`, `kanopi-makassar` |
| priority | `pintu-jendela-aluminium-makassar` | `Pintu & Jendela Aluminium Makassar | HIJAOE` | `Pembuatan pintu dan jendela aluminium di Makassar untuk rumah, toko, serta tempat usaha dengan model dan ukuran yang disesuaikan.` | `assets/images/catalog/jendela-aluminium.webp` | Jenis bukaan; kusen, kaca, dan pengukuran | pintu/jendela custom; penggantian; foto lokasi | `aluminium-kaca-makassar`, `partisi-kaca-kalsiboard-makassar`, `lemari-kitchen-set-aluminium-makassar` |
| priority | `lemari-kitchen-set-aluminium-makassar` | `Lemari & Kitchen Set Aluminium Makassar | HIJAOE` | `Pembuatan lemari, kabinet, dan kitchen set aluminium di Makassar sesuai ukuran ruang, kebutuhan penyimpanan, dan model yang diinginkan.` | `assets/images/catalog/kitchen-set-aluminium.webp` | Kabinet dapur dan lemari; pembagian ruang penyimpanan | kelebihan penggunaan; pengukuran; referensi model | `interior-furnitur-makassar`, `aluminium-kaca-makassar`, `pintu-jendela-aluminium-makassar` |
| priority | `plafon-pvc-gypsum-makassar` | `Plafon PVC & Gypsum Makassar | HIJAOE` | `Pemasangan plafon PVC dan gypsum di Makassar untuk ruang tamu, kamar, rumah, toko, serta kebutuhan drop ceiling sesuai kondisi ruangan.` | `assets/images/catalog/plafon-pvc.webp` | Perbedaan kebutuhan PVC/gypsum; bidang dan tinggi ruang | pilihan bahan; perbaikan; data luas ruang | `plafon-partisi-makassar`, `partisi-kaca-kalsiboard-makassar`, `interior-furnitur-makassar` |
| priority | `partisi-kaca-kalsiboard-makassar` | `Partisi Kaca & Kalsiboard Makassar | HIJAOE` | `Pemasangan partisi kaca, aluminium, kalsiboard, gypsum, dan PVC di Makassar untuk membagi ruang rumah, kantor, toko, atau tempat usaha.` | `assets/images/catalog/partisi-kaca.webp` | Pilihan partisi transparan dan tertutup; fungsi ruangan | kaca/kalsiboard; pintu partisi; pengukuran | `plafon-partisi-makassar`, `aluminium-kaca-makassar`, `plafon-pvc-gypsum-makassar` |
| priority | `renovasi-rumah-makassar` | `Jasa Renovasi Rumah Makassar | HIJAOE` | `Jasa renovasi rumah di Makassar untuk perbaikan, penambahan ruang, teras, fasad, keramik, pengecatan, atap, dan pekerjaan sesuai kondisi bangunan.` | `assets/images/catalog/renovasi-fasad-rumah.webp` | Renovasi sebagian atau gabungan; penentuan lingkup | renovasi bagian tertentu; survei; konsultasi awal | `konstruksi-renovasi-makassar`, `atap-kanopi-makassar`, `plafon-partisi-makassar` |
| priority | `meja-kursi-sekolah-makassar` | `Meja & Kursi Sekolah Makassar | HIJAOE` | `Pembuatan meja dan kursi sekolah di Makassar menggunakan kayu dan rangka sesuai ukuran, jumlah, model, serta kebutuhan ruang belajar.` | `assets/images/catalog/meja-sekolah.webp` | Meja/kursi siswa; ukuran, jumlah, dan konstruksi | pemesanan satuan/jumlah; ukuran; pengiriman | `interior-furnitur-makassar`, `besi-las-makassar`, `konstruksi-renovasi-makassar` |

For every record, write:

- `heading` as the title text before `| HIJAOE`;
- a short `eyebrow` matching the service;
- an `intro` of 120-260 characters that expands the description without
  copying it;
- two sections matching the required section focus, each with specific body
  copy and at least one section containing three or four list items;
- three FAQs matching the required FAQ focus, with direct answers grounded in
  confirmed business data;
- a descriptive `imageAlt` that names the object or space shown without using
  the words “proyek HIJAOE” or “hasil pekerjaan HIJAOE”.

Use only confirmed services from `assets/js/site-data.js` and
`assets/js/catalog-data.js`. Do not add prices, warranties, testimonials,
experience duration, project counts, or service areas beyond Makassar and
nearby areas.

- [ ] **Step 4: Run the inventory tests and verify GREEN**

Run: `node --test tests/seo.test.js`

Expected: 3 tests pass, 0 failures.

- [ ] **Step 5: Commit the SEO content inventory**

```powershell
git add assets/js/seo-pages-data.js tests/seo.test.js
git commit -m "feat: define HIJAOE SEO page inventory"
```

### Task 2: Generate Search-Ready Static Service Pages

**Files:**
- Create: `scripts/generate-seo-pages.js`
- Create: `layanan/*.html`
- Modify: `package.json`
- Modify: `tests/seo.test.js`

- [ ] **Step 1: Add failing generator and page-contract tests**

Append tests that expect:

```js
test("every SEO page has a generated HTML file", async () => {
  for (const page of seoPages) {
    const html = await readFile(
      path.join(root, "layanan", `${page.slug}.html`),
      "utf8",
    );

    assert.match(html, new RegExp(`<h1[^>]*>${page.heading}</h1>`));
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

    assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large">/);
    assert.match(html, /<meta property="og:type" content="website">/);
    assert.match(html, /<meta property="og:site_name" content="HIJAOE">/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
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

    assert.ok(blocks.length >= 2);
    blocks.forEach((block) => JSON.parse(block[1]));
  }
});
```

- [ ] **Step 2: Run the generator tests and verify RED**

Run: `node --test tests/seo.test.js`

Expected: FAIL with `ENOENT` for files under `layanan/`.

- [ ] **Step 3: Implement the local generator**

Create `scripts/generate-seo-pages.js` with:

```js
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_URL,
  seoPages,
} from "../assets/js/seo-pages-data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "layanan");
const whatsappNumber = "628976010103";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function absoluteAsset(assetPath) {
  return `${SITE_URL}/${assetPath}`;
}

function serviceUrl(slug) {
  return `${SITE_URL}/layanan/${slug}`;
}

function buildWhatsAppUrl(serviceName) {
  const message =
    `Halo HIJAOE, saya ingin konsultasi tentang ${serviceName}. ` +
    "Lokasi pengerjaan saya di ...";
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function renderJsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function renderItems(items) {
  if (items.length === 0) {
    return "";
  }

  return `<ul class="service-page__list">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function renderSections(sections) {
  return sections
    .map(
      (section) => `<section class="service-page__section">
        <h2>${escapeHtml(section.heading)}</h2>
        <p>${escapeHtml(section.body)}</p>
        ${renderItems(section.items)}
      </section>`,
    )
    .join("");
}

function renderFaqs(faqs) {
  return faqs
    .map(
      (faq) => `<details class="service-page__faq">
        <summary>${escapeHtml(faq.question)}</summary>
        <p>${escapeHtml(faq.answer)}</p>
      </details>`,
    )
    .join("");
}

function renderRelatedPages(relatedPages) {
  return relatedPages
    .map(
      (related) => `<a href="/layanan/${related.slug}">
        <span>${escapeHtml(related.eyebrow)}</span>
        <strong>${escapeHtml(related.heading)}</strong>
      </a>`,
    )
    .join("");
}

function renderPage(page) {
  const canonical = serviceUrl(page.slug);
  const relatedPages = page.relatedSlugs.map((slug) => {
    const related = seoPages.find((candidate) => candidate.slug === slug);
    if (!related) {
      throw new Error(`Unknown related SEO page: ${slug}`);
    }
    return related;
  });
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.heading,
    description: page.description,
    url: canonical,
    image: absoluteAsset(page.image),
    areaServed: {
      "@type": "City",
      name: "Makassar",
    },
    provider: {
      "@type": "LocalBusiness",
      name: "HIJAOE",
      url: SITE_URL,
      telephone: "+62 897-6010-103",
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Layanan",
        item: `${SITE_URL}/#layanan`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.heading,
        item: canonical,
      },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="HIJAOE">
    <meta property="og:locale" content="id_ID">
    <meta property="og:title" content="${escapeHtml(page.title)}">
    <meta property="og:description" content="${escapeHtml(page.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${absoluteAsset(page.image)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(page.title)}">
    <meta name="twitter:description" content="${escapeHtml(page.description)}">
    <meta name="twitter:image" content="${absoluteAsset(page.image)}">
    <meta name="theme-color" content="#101411">
    <link rel="icon" href="/assets/images/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/styles.css">
    <script type="application/ld+json">${renderJsonLd(serviceSchema)}</script>
    <script type="application/ld+json">${renderJsonLd(breadcrumbSchema)}</script>
    <script type="application/ld+json">${renderJsonLd(faqSchema)}</script>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Lewati ke konten</a>
    <header class="site-header">
      <div class="site-header__inner container">
        <a class="brand" href="/" aria-label="HIJAOE, kembali ke beranda">
          <span class="brand__mark" aria-hidden="true"></span>
          <span>HIJAOE</span>
        </a>
        <button class="icon-button menu-button" id="menu-button" type="button" aria-label="Buka menu" aria-controls="primary-navigation" aria-expanded="false">
          <i data-lucide="menu" aria-hidden="true"></i>
        </button>
        <nav class="primary-navigation" id="primary-navigation" aria-label="Navigasi utama" data-open="false">
          <a href="/#layanan">Layanan</a>
          <a href="/#proyek">Proyek</a>
          <a href="/galeri">Katalog</a>
          <a href="/#tentang">Tentang</a>
          <a href="/#kontak">Kontak</a>
          <a class="button button--compact button--green" href="${buildWhatsAppUrl(page.heading)}" target="_blank" rel="noreferrer">
            <i data-lucide="message-circle" aria-hidden="true"></i>
            Konsultasi
          </a>
        </nav>
      </div>
    </header>
    <main id="main-content">
      <nav class="breadcrumb container" aria-label="Breadcrumb">
        <a href="/">Beranda</a>
        <span aria-hidden="true">/</span>
        <a href="/#layanan">Layanan</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escapeHtml(page.heading)}</span>
      </nav>
      <section class="service-page__hero">
        <div class="container service-page__hero-grid">
          <div>
            <p class="eyebrow"><span></span>${escapeHtml(page.eyebrow)}</p>
            <h1>${escapeHtml(page.heading)}</h1>
            <p class="service-page__lead">${escapeHtml(page.intro)}</p>
            <a class="button button--green" href="${buildWhatsAppUrl(page.heading)}" target="_blank" rel="noreferrer">
              <i data-lucide="message-circle" aria-hidden="true"></i>
              Konsultasi ${escapeHtml(page.eyebrow)}
            </a>
          </div>
          <img src="/${page.image}" alt="${escapeHtml(page.imageAlt)}" width="960" height="640" fetchpriority="high">
        </div>
      </section>
      <section class="section">
        <div class="container service-page__grid">
          <div>${renderSections(page.sections)}</div>
          <aside class="service-page__aside">
            <p class="eyebrow eyebrow--dark">Area layanan</p>
            <h2>Makassar dan sekitarnya</h2>
            <p>Pengerjaan dan layanan tersedia untuk wilayah Makassar serta area sekitarnya sesuai kebutuhan.</p>
            <a href="https://www.google.com/maps/place/HIJAOE/@-5.0853325,119.5327585,15z" target="_blank" rel="noreferrer">Lihat lokasi HIJAOE</a>
          </aside>
        </div>
      </section>
      <section class="section section--dark">
        <div class="container">
          <p class="eyebrow"><span></span>Alur pemesanan</p>
          <h2>Dibicarakan dari kebutuhan awal sampai pemasangan.</h2>
          <ol class="service-process">
            <li><strong>Konsultasi</strong><span>Kirim kebutuhan, lokasi, ukuran awal, dan foto melalui WhatsApp.</span></li>
            <li><strong>Survei & ukur</strong><span>Kondisi dan ukuran diperiksa bila pekerjaan memerlukan pengecekan lokasi.</span></li>
            <li><strong>Penawaran</strong><span>Bahan, lingkup pekerjaan, biaya, dan jadwal disepakati sebelum produksi.</span></li>
            <li><strong>Pengerjaan</strong><span>Pesanan dikerjakan di bengkel atau di lokasi sesuai jenis pekerjaan.</span></li>
            <li><strong>Pasang & serah terima</strong><span>Hasil dikirim atau dipasang lalu diperiksa bersama pelanggan.</span></li>
          </ol>
        </div>
      </section>
      <section class="section">
        <div class="container service-page__faq-wrap">
          <p class="eyebrow eyebrow--dark">Pertanyaan umum</p>
          <h2>Hal yang sering ditanyakan.</h2>
          ${renderFaqs(page.faqs)}
        </div>
      </section>
      <section class="section service-related">
        <div class="container">
          <p class="eyebrow eyebrow--dark">Layanan terkait</p>
          <h2>Pekerjaan lain yang mungkin dibutuhkan.</h2>
          <div class="service-related__grid">${renderRelatedPages(relatedPages)}</div>
        </div>
      </section>
      <section class="service-page__cta">
        <div class="container">
          <div>
            <p class="eyebrow"><span></span>Diskusikan kebutuhan</p>
            <h2>Kirim ukuran awal, lokasi, dan model yang diinginkan.</h2>
          </div>
          <a class="button button--green" href="${buildWhatsAppUrl(page.heading)}" target="_blank" rel="noreferrer">
            <i data-lucide="message-circle" aria-hidden="true"></i>
            Chat HIJAOE
          </a>
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <a class="brand" href="/" aria-label="HIJAOE, kembali ke beranda">
          <span class="brand__mark" aria-hidden="true"></span>
          <span>HIJAOE</span>
        </a>
        <p>Konstruksi, las, aluminium, atap, plafon, partisi, dan furnitur custom di Makassar.</p>
      </div>
    </footer>
    <script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script>
    <script type="module" src="/assets/js/main.js"></script>
  </body>
</html>`;
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  seoPages.map((page) =>
    writeFile(
      path.join(outputDirectory, `${page.slug}.html`),
      renderPage(page),
      "utf8",
    ),
  ),
);
```

- [ ] **Step 4: Add the generator command**

Add to `package.json`:

```json
"seo:generate": "node scripts/generate-seo-pages.js"
```

- [ ] **Step 5: Generate pages and run tests**

Run:

```powershell
npm.cmd run seo:generate
node --test tests/seo.test.js
```

Expected: all SEO tests pass.

- [ ] **Step 6: Commit the generator and generated pages**

```powershell
git add scripts/generate-seo-pages.js assets/js/seo-pages-data.js package.json tests/seo.test.js layanan
git commit -m "feat: generate HIJAOE service landing pages"
```

### Task 3: Add Crawl Files, Canonicals, And Structured Data

**Files:**
- Modify: `scripts/generate-seo-pages.js`
- Create: `robots.txt`
- Create: `sitemap.xml`
- Create: `404.html`
- Modify: `index.html`
- Modify: `galeri.html`
- Modify: `tests/seo.test.js`
- Modify: `tests/markup.test.js`

- [ ] **Step 1: Add failing crawl and metadata tests**

Add tests for:

```js
const canonicalPaths = [
  "/",
  "/galeri",
  ...seoPages.map((page) => `/layanan/${page.slug}`),
];

test("sitemap contains every canonical URL exactly once", async () => {
  const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(
    urls,
    canonicalPaths.map((urlPath) => `${SITE_URL}${urlPath === "/" ? "" : urlPath}`),
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
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}">`));
    assert.match(html, /<meta property="og:site_name" content="HIJAOE">/);
    assert.match(html, /<script type="application\/ld\+json">/);
  }
});

test("a root 404 page disables accidental SPA fallback indexing", async () => {
  const html = await readFile(path.join(root, "404.html"), "utf8");
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /Halaman tidak ditemukan/);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test tests/seo.test.js tests/markup.test.js`

Expected: FAIL because crawl files and canonical metadata do not exist.

- [ ] **Step 3: Generate `robots.txt` and `sitemap.xml`**

Extend `scripts/generate-seo-pages.js` to render:

```txt
User-agent: *
Allow: /

Sitemap: https://hijaoe.id/sitemap.xml
```

Generate an XML sitemap containing the home page, gallery, and 14 service
pages. Use `2026-06-22` as the initial `lastmod` for this release and do not add
unsupported priority or change-frequency hints.

- [ ] **Step 4: Add production metadata to the home page**

Add to `index.html`:

```html
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="https://hijaoe.id">
<meta property="og:type" content="website">
<meta property="og:site_name" content="HIJAOE">
<meta property="og:locale" content="id_ID">
<meta property="og:title" content="HIJAOE | Konstruksi, Las & Aluminium Makassar">
<meta property="og:description" content="HIJAOE melayani konstruksi, renovasi, las, aluminium, atap, plafon, dan furnitur custom di Makassar dan sekitarnya.">
<meta property="og:url" content="https://hijaoe.id">
<meta property="og:image" content="https://hijaoe.id/assets/images/hijaoe-workshop.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="HIJAOE | Konstruksi, Las & Aluminium Makassar">
<meta name="twitter:description" content="Konstruksi, renovasi, las, aluminium, atap, plafon, dan furnitur custom di Makassar dan sekitarnya.">
<meta name="twitter:image" content="https://hijaoe.id/assets/images/hijaoe-workshop.webp">
```

Add a `LocalBusiness` JSON-LD block using confirmed business values:

```json
{
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
  "@id": "https://hijaoe.id/#business",
  "name": "HIJAOE",
  "url": "https://hijaoe.id",
  "telephone": "+62 897-6010-103",
  "image": "https://hijaoe.id/assets/images/hijaoe-workshop.webp",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Makassar",
    "addressRegion": "Sulawesi Selatan",
    "addressCountry": "ID"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -5.0853325,
    "longitude": 119.5327585
  },
  "hasMap": "https://www.google.com/maps/place/HIJAOE/@-5.0853324,119.5224587,15z/data=!3m1!4b1!4m6!3m5!1s0x2dbefbcbfcf97c0b:0xb8cad84f65c55a60!8m2!3d-5.0853325!4d119.5327585!16s%2Fg%2F11g0vyt5dz",
  "areaServed": {
    "@type": "City",
    "name": "Makassar"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "08:00",
      "closes": "17:00"
    }
  ],
  "sameAs": [
    "https://www.google.com/maps/place/HIJAOE/@-5.0853324,119.5224587,15z/data=!3m1!4b1!4m6!3m5!1s0x2dbefbcbfcf97c0b:0xb8cad84f65c55a60!8m2!3d-5.0853325!4d119.5327585!16s%2Fg%2F11g0vyt5dz"
  ]
}
```

Use the exact existing map URL from `assets/js/site-data.js`.

- [ ] **Step 5: Add gallery metadata and CollectionPage schema**

Add equivalent canonical and social metadata to `galeri.html` with canonical
`https://hijaoe.id/galeri`. Add a JSON-LD graph containing
`CollectionPage`, `BreadcrumbList`, and a reference to
`https://hijaoe.id/#business`.

- [ ] **Step 6: Add a real 404 page**

Create `404.html` with:

- unique title;
- `noindex,follow`;
- existing favicon and stylesheet;
- a compact HIJAOE header;
- “Halaman tidak ditemukan” H1;
- links to `/`, `/galeri`, and WhatsApp.

- [ ] **Step 7: Replace `.html` navigation links**

Update internal links in `index.html`, `galeri.html`, generated service pages,
and relevant markup tests:

```text
index.html#... -> /#...
galeri.html -> /galeri
```

File-based test reads may still use `index.html` and `galeri.html`; only browser
URLs become clean.

- [ ] **Step 8: Generate and verify**

Run:

```powershell
npm.cmd run seo:generate
node --test tests/seo.test.js tests/markup.test.js
```

Expected: all focused tests pass.

- [ ] **Step 9: Commit crawl and metadata work**

```powershell
git add index.html galeri.html 404.html robots.txt sitemap.xml scripts/generate-seo-pages.js layanan tests/seo.test.js tests/markup.test.js
git commit -m "feat: add HIJAOE technical SEO foundation"
```

### Task 4: Add Internal Discovery And Responsive Service-Page Styling

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`
- Modify: `scripts/generate-seo-pages.js`
- Modify: `layanan/*.html`
- Modify: `tests/seo.test.js`
- Modify: `tests/styles.test.js`

- [ ] **Step 1: Add failing discovery and style tests**

Add tests verifying:

```js
test("home page links to all category hubs", async () => {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  for (const page of seoPages.filter((entry) => entry.kind === "category")) {
    assert.match(html, new RegExp(`href="/layanan/${page.slug}"`));
  }
});

test("service pages expose breadcrumbs, FAQs, related services, and WhatsApp", async () => {
  for (const page of seoPages) {
    const html = await readFile(
      path.join(root, "layanan", `${page.slug}.html`),
      "utf8",
    );
    assert.match(html, /aria-label="Breadcrumb"/);
    assert.match(html, /class="service-page__faq"/);
    assert.match(html, /class="service-related"/);
    assert.match(html, /https:\/\/wa\.me\/628976010103/);
  }
});
```

Extend `tests/styles.test.js` to require:

```js
assert.match(styles, /\.service-page__hero/);
assert.match(styles, /\.service-page__grid/);
assert.match(styles, /\.service-related/);
assert.match(styles, /@media \(max-width: 720px\)/);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
node --test tests/seo.test.js tests/styles.test.js
```

Expected: FAIL because discovery links and service page styles are absent.

- [ ] **Step 3: Add category discovery links to the home service cards**

Modify the service-card data or rendering so each of the six service groups
links to its category hub:

```text
Konstruksi & Renovasi -> /layanan/konstruksi-renovasi-makassar
Besi & Las -> /layanan/besi-las-makassar
Aluminium & Kaca -> /layanan/aluminium-kaca-makassar
Atap & Kanopi -> /layanan/atap-kanopi-makassar
Plafon & Partisi -> /layanan/plafon-partisi-makassar
Interior & Furnitur -> /layanan/interior-furnitur-makassar
```

Use a visible text link such as “Lihat detail layanan” at the end of each card.

- [ ] **Step 4: Implement service-page styling**

Extend `assets/css/styles.css` with focused styles for:

- breadcrumb navigation;
- service page hero with a stable 3:2 image frame;
- two-column desktop content and one-column mobile content;
- section lists and process steps;
- native `<details>` FAQ controls;
- related-service link grid;
- final WhatsApp call-to-action band.

Keep cards at `8px` radius or less, reuse the existing HIJAOE colors and type,
avoid nested cards, and ensure the floating WhatsApp control does not overlap
page content.

- [ ] **Step 5: Regenerate pages and run focused tests**

Run:

```powershell
npm.cmd run seo:generate
node --test tests/seo.test.js tests/styles.test.js tests/render.test.js
```

Expected: all focused tests pass.

- [ ] **Step 6: Commit discovery and styling**

```powershell
git add index.html assets/js/site-data.js assets/js/render.js assets/css/styles.css scripts/generate-seo-pages.js layanan tests/seo.test.js tests/styles.test.js tests/render.test.js
git commit -m "feat: connect and style HIJAOE service pages"
```

### Task 5: Guard Content Quality And Document Operations

**Files:**
- Modify: `tests/seo.test.js`
- Modify: `README.md`

- [ ] **Step 1: Add failing content-quality tests**

Add tests that concatenate all service page text and verify:

```js
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
      assert.doesNotMatch(html, pattern);
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
      .replace(/\s+/g, " ")
      .trim();
    assert.ok(text.length >= 1200);
    bodies.push(text);
  }
  assert.equal(new Set(bodies).size, seoPages.length);
});
```

- [ ] **Step 2: Run the content tests and verify RED if any page is thin**

Run: `node --test tests/seo.test.js`

Expected: any thin or duplicated page fails with the page-specific assertion.

- [ ] **Step 3: Strengthen only the failing page data**

Expand page-specific sections or FAQs in `assets/js/seo-pages-data.js`. Do not
pad pages with repeated generic text. Regenerate after each content update:

```powershell
npm.cmd run seo:generate
node --test tests/seo.test.js
```

Expected: all SEO tests pass.

- [ ] **Step 4: Document SEO operations**

Append to `README.md`:

```markdown
## SEO Lokal

Domain kanonis website adalah `https://hijaoe.id`.

Konten 14 halaman layanan berada di `assets/js/seo-pages-data.js`. Setelah
mengubah konten, jalankan:

```powershell
npm.cmd run seo:generate
npm.cmd test
```

File HTML di `layanan/` dan `sitemap.xml` merupakan hasil generator dan harus
ikut dikomit. Jangan mengedit file hasil generator secara manual.

### Google Search Console

1. Tambahkan Domain property `hijaoe.id`.
2. Tambahkan TXT verifikasi Google di Cloudflare DNS.
3. Kirim `https://hijaoe.id/sitemap.xml`.
4. Gunakan URL Inspection untuk halaman utama dan halaman layanan prioritas.

### Profil Bisnis Google

Tambahkan `https://hijaoe.id` sebagai website HIJAOE. Pastikan nama bisnis,
nomor WhatsApp, jam operasional, dan area layanan sama dengan website.
```

- [ ] **Step 5: Run full verification**

Run:

```powershell
npm.cmd run seo:generate
npm.cmd test
git diff --check
```

Expected: complete test suite passes with zero failures and no whitespace
errors.

- [ ] **Step 6: Commit content safeguards and documentation**

```powershell
git add assets/js/seo-pages-data.js layanan sitemap.xml tests/seo.test.js README.md
git commit -m "docs: add HIJAOE SEO operating guide"
```

### Task 6: Deploy And Verify Production SEO

**Files:**
- Verify: all committed SEO files

- [ ] **Step 1: Confirm working tree scope**

Run: `git status --short`

Expected: no uncommitted SEO files. The unrelated existing
`ui-ux-pro-max-skill-main/` directory may remain untracked and must not be
added.

- [ ] **Step 2: Push production**

Run:

```powershell
git push origin master
```

Expected: push succeeds and Cloudflare Pages starts a new production
deployment.

- [ ] **Step 3: Verify production URLs**

After Cloudflare deploys, verify:

```powershell
curl.exe -I https://hijaoe.id
curl.exe -I https://hijaoe.id/galeri
curl.exe -I https://hijaoe.id/layanan/kanopi-makassar
curl.exe -I https://hijaoe.id/robots.txt
curl.exe -I https://hijaoe.id/sitemap.xml
```

Expected: every request returns `200`.

- [ ] **Step 4: Verify live metadata and crawling files**

Fetch live HTML and confirm:

```powershell
curl.exe -sS https://hijaoe.id
curl.exe -sS https://hijaoe.id/layanan/kanopi-makassar
curl.exe -sS https://hijaoe.id/robots.txt
curl.exe -sS https://hijaoe.id/sitemap.xml
```

Expected:

- canonical URLs use `https://hijaoe.id`;
- JSON-LD blocks are present;
- robots references the production sitemap;
- sitemap contains all 16 canonical URLs.

- [ ] **Step 5: Configure the host redirect**

In Cloudflare for the `hijaoe.id` zone, add a permanent Single Redirect:

```text
Incoming requests: Hostname equals www.hijaoe.id
Target URL: concat("https://hijaoe.id", http.request.uri.path)
Status code: 301
Preserve query string: On
```

Verify:

```powershell
curl.exe -I https://www.hijaoe.id/layanan/kanopi-makassar
```

Expected: `301` with `Location:
https://hijaoe.id/layanan/kanopi-makassar`.

- [ ] **Step 6: Start Search Console and Business Profile setup**

Guide the user through:

1. Search Console Domain property verification via Cloudflare TXT.
2. Sitemap submission.
3. URL Inspection and indexing requests.
4. Setting `https://hijaoe.id` as the HIJAOE Google Business Profile website.
