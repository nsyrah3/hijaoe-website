import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_URL,
  seoPages,
} from "../assets/js/seo-pages-data.js";
import {
  business,
  processSteps,
} from "../assets/js/site-data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "layanan");

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

function renderSitemap() {
  const urls = [
    SITE_URL,
    `${SITE_URL}/galeri`,
    `${SITE_URL}/kebijakan-privasi`,
    ...seoPages.map((page) => serviceUrl(page.slug)),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <lastmod>2026-06-22</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

function buildWhatsAppUrl(serviceName) {
  const message =
    `Halo HIJAOE, saya ingin konsultasi tentang ${serviceName}. ` +
    "Lokasi pengerjaan saya di ...";
  return `https://wa.me/${business.phoneInternational}?text=${encodeURIComponent(message)}`;
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
              <i data-lucide="arrow-up-right" aria-hidden="true"></i>
            </a>`,
    )
    .join("");
}

function renderProcess() {
  return processSteps
    .map(
      (step, index) => `<li>
              <span>${String(index + 1).padStart(2, "0")}</span>
              <strong>${escapeHtml(step.title)}</strong>
              <p>${escapeHtml(step.description)}</p>
            </li>`,
    )
    .join("");
}

function getRelatedPages(page) {
  return page.relatedSlugs.map((slug) => {
    const related = seoPages.find((candidate) => candidate.slug === slug);
    if (!related) {
      throw new Error(`Unknown related SEO page: ${slug}`);
    }
    return related;
  });
}

function renderPage(page) {
  const canonical = serviceUrl(page.slug);
  const relatedPages = getRelatedPages(page);
  const whatsappUrl = buildWhatsAppUrl(page.heading);
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.heading,
    description: page.description,
    url: canonical,
    image: absoluteAsset(page.image),
    areaServed: business.serviceCities.map((city) => ({
      "@type": "City",
      name: city,
    })),
    provider: {
      "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
      "@id": `${SITE_URL}/#business`,
      name: business.name,
      url: SITE_URL,
      telephone: `+${business.phoneInternational}`,
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
    <meta property="og:image:alt" content="${escapeHtml(page.imageAlt)}">
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
        <button
          class="icon-button menu-button"
          id="menu-button"
          type="button"
          aria-label="Buka menu"
          aria-controls="primary-navigation"
          aria-expanded="false"
        >
          <i data-lucide="menu" aria-hidden="true"></i>
        </button>
        <nav
          class="primary-navigation"
          id="primary-navigation"
          aria-label="Navigasi utama"
          data-open="false"
        >
          <a href="/#layanan">Layanan</a>
          <a href="/#proyek">Proyek</a>
          <a href="/galeri">Katalog</a>
          <a href="/#tentang">Tentang</a>
          <a href="/#kontak">Kontak</a>
          <a
            class="button button--compact button--green"
            href="${whatsappUrl}"
            target="_blank"
            rel="noreferrer"
          >
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
            <p class="eyebrow">
              <span></span>
              ${escapeHtml(page.eyebrow)}
            </p>
            <h1>${escapeHtml(page.heading)}</h1>
            <p class="service-page__lead">${escapeHtml(page.intro)}</p>
            <a
              class="button button--green"
              href="${whatsappUrl}"
              target="_blank"
              rel="noreferrer"
            >
              <i data-lucide="message-circle" aria-hidden="true"></i>
              Konsultasi ${escapeHtml(page.eyebrow)}
            </a>
          </div>
          <img
            src="/${page.image}"
            alt="${escapeHtml(page.imageAlt)}"
            width="960"
            height="640"
            fetchpriority="high"
          >
        </div>
      </section>

      <section class="section service-page__content">
        <div class="container service-page__grid">
          <div>${renderSections(page.sections)}</div>
          <aside class="service-page__aside">
            <p class="eyebrow eyebrow--dark">Area layanan</p>
            <h2>${escapeHtml(business.serviceAreaTitle)}</h2>
            <p>${escapeHtml(business.serviceArea)}</p>
            <a href="${business.mapUrl}" target="_blank" rel="noreferrer">
              Lihat lokasi HIJAOE
              <i data-lucide="external-link" aria-hidden="true"></i>
            </a>
          </aside>
        </div>
      </section>

      <section class="section section--dark service-page__process">
        <div class="container">
          <p class="eyebrow"><span></span>Alur pemesanan</p>
          <h2>Dibicarakan dari kebutuhan awal sampai pemasangan.</h2>
          <ol class="service-process">${renderProcess()}</ol>
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
          <a
            class="button button--green"
            href="${whatsappUrl}"
            target="_blank"
            rel="noreferrer"
          >
            <i data-lucide="message-circle" aria-hidden="true"></i>
            Chat HIJAOE
          </a>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container site-footer__inner">
        <a class="brand brand--footer" href="/">
          <span class="brand__mark" aria-hidden="true"></span>
          <span>HIJAOE</span>
        </a>
        <div class="site-footer__meta">
          <a href="/kebijakan-privasi">Kebijakan Privasi</a>
          <p>&copy; <span data-year></span> HIJAOE. Konstruksi & bengkel custom Makassar.</p>
        </div>
      </div>
    </footer>

    <a
      class="floating-whatsapp"
      href="${whatsappUrl}"
      target="_blank"
      rel="noreferrer"
      aria-label="Konsultasi ${escapeHtml(page.heading)} melalui WhatsApp"
    >
      <i data-lucide="message-circle" aria-hidden="true"></i>
      <span>Chat HIJAOE</span>
    </a>

    <script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script>
    <script type="module" src="/assets/js/service-page.js"></script>
  </body>
</html>
`;
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

await Promise.all([
  writeFile(
    path.join(root, "robots.txt"),
    `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`,
    "utf8",
  ),
  writeFile(path.join(root, "sitemap.xml"), renderSitemap(), "utf8"),
]);
