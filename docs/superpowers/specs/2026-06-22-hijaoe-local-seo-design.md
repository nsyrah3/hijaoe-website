# HIJAOE Local SEO Design

**Date:** 2026-06-22

## Goal

Build a durable local SEO foundation for `https://hijaoe.id` and create useful
service landing pages that target customer searches in Makassar without
fabricated claims, keyword stuffing, or mass-produced doorway pages.

## Decisions

- The canonical host is `https://hijaoe.id`.
- `www.hijaoe.id` should redirect permanently to the apex domain.
- Cloudflare Pages extensionless URLs are canonical. HTML source files remain
  committed, but links, canonical tags, and the sitemap use paths without
  `.html`.
- AI-generated images may be used without a visible label.
- Copy must not describe AI images as completed HIJAOE customer projects.
- The site must not invent prices, guarantees, testimonials, project counts,
  years of experience, certifications, or service areas beyond Makassar and
  nearby areas.
- Indonesian is the only language for this phase.

## Information Architecture

The indexable site contains 16 canonical URLs:

1. `/`
2. `/galeri`
3. `/layanan/konstruksi-renovasi-makassar`
4. `/layanan/besi-las-makassar`
5. `/layanan/aluminium-kaca-makassar`
6. `/layanan/atap-kanopi-makassar`
7. `/layanan/plafon-partisi-makassar`
8. `/layanan/interior-furnitur-makassar`
9. `/layanan/kanopi-makassar`
10. `/layanan/pagar-besi-makassar`
11. `/layanan/pintu-jendela-aluminium-makassar`
12. `/layanan/lemari-kitchen-set-aluminium-makassar`
13. `/layanan/plafon-pvc-gypsum-makassar`
14. `/layanan/partisi-kaca-kalsiboard-makassar`
15. `/layanan/renovasi-rumah-makassar`
16. `/layanan/meja-kursi-sekolah-makassar`

The six category pages act as topic hubs. Each hub links to relevant priority
pages and catalog entries. Priority pages link back to their category hub and
to two or three related services.

## Page Content

Each service page has a distinct search intent and unique copy. A page includes:

- one descriptive H1 containing the service and Makassar;
- a concise introduction explaining who the service is for;
- available work types grounded in the existing catalog;
- material or model considerations without unsupported recommendations;
- the HIJAOE consultation, survey, agreement, work, and handover process;
- Makassar and nearby areas as the service area;
- three to five service-specific FAQs;
- a WhatsApp call to action carrying the page's service name;
- breadcrumbs and related-service links;
- one primary AI visual selected from the existing catalog.

Pages must remain useful when images are unavailable. Alt text describes the
visible service or object and does not claim that it is a completed HIJAOE
project.

## Technical SEO

Every indexable page contains:

- a unique title and meta description;
- an absolute self-referencing canonical URL;
- Open Graph title, description, URL, type, site name, and image;
- Twitter card metadata;
- `robots` set to `index,follow,max-image-preview:large`;
- valid JSON-LD;
- one H1 and a logical heading hierarchy.

The home page uses `LocalBusiness`-compatible structured data with:

- business name and canonical URL;
- telephone;
- Makassar as the locality and service area;
- confirmed map URL and geographic coordinates;
- confirmed opening hours;
- service categories;
- representative image.

The schema must not fabricate a street address. It may use the confirmed
locality, country, map, and coordinates. Service pages use `Service` and
`BreadcrumbList` JSON-LD. The gallery uses `CollectionPage`.

## Crawling And Canonicalization

- `robots.txt` allows normal search crawlers and references
  `https://hijaoe.id/sitemap.xml`.
- `sitemap.xml` contains only the 16 apex-domain canonical URLs.
- A root `404.html` prevents Cloudflare Pages from treating unknown routes as
  single-page application routes.
- Internal links use canonical extensionless paths.
- A Cloudflare redirect rule sends `www.hijaoe.id/*` to
  `https://hijaoe.id/$1` with status 301.
- The `pages.dev` URL is not submitted to Google. Canonical tags always point
  to `hijaoe.id`.

## Implementation Structure

SEO page content lives in a structured JavaScript data module. A local Node.js
generator renders the 14 service HTML files from a shared template and writes
them under `layanan/`. Generated HTML is committed so Cloudflare Pages can
continue deploying the repository with no build command.

The generator owns repeated metadata, navigation, footer, breadcrumbs, schema,
and call-to-action markup. Page-specific headings, descriptions, copy, FAQs,
related links, and images remain explicit data rather than inferred text.

The existing home and gallery pages receive their metadata and internal-link
updates directly. Existing visual styling is extended for service pages without
redesigning the current site.

## Testing

Automated tests verify:

- all 16 canonical URLs are unique and represented in the sitemap;
- `robots.txt` references the production sitemap;
- every indexable HTML page has one H1, title, description, canonical, Open
  Graph metadata, and parseable JSON-LD;
- canonical URLs and internal service links are extensionless and use the apex
  domain where absolute URLs are required;
- category and priority pages have unique titles, descriptions, headings, and
  substantive page-specific copy;
- images exist and have descriptive alt text;
- WhatsApp links contain the corresponding service;
- no page introduces unconfirmed price, warranty, review, project-count, or
  experience claims;
- the complete existing test suite remains green.

After deployment, live verification checks HTTP status, canonical tags,
`robots.txt`, `sitemap.xml`, redirects, and structured-data parsing.

## Search Console And Business Profile

After the deployment is live:

1. Add a Domain property for `hijaoe.id` in Google Search Console.
2. Verify it with a DNS TXT record in Cloudflare.
3. Submit `https://hijaoe.id/sitemap.xml`.
4. Inspect and request indexing for the home page, six category hubs, and the
   highest-priority service pages.
5. Add `https://hijaoe.id` to the HIJAOE Google Business Profile.
6. Keep the business name, telephone, hours, service area, and website details
   consistent between the site and Business Profile.

Ranking is not guaranteed. Future pages should be based on Search Console query
data, real customer questions, and verified business details rather than
creating many near-duplicate keyword pages.
