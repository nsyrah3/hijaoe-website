# HIJAOE Service Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a 50-image service catalog with category filters, progressive loading, lightbox viewing, and service-specific WhatsApp enquiries.

**Architecture:** Keep the static-site architecture and add catalog data in a dedicated module, pure catalog rendering/state helpers in another module, and browser behavior in a page-specific entry point. The homepage will consume six featured catalog records while `galeri.html` renders all 50 records in batches of twelve.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, Node.js built-in test runner, Lucide icons, generated WebP assets, Playwright browser verification.

---

## File Structure

- `assets/js/catalog-data.js`: 50 unique service records and the six featured IDs.
- `assets/js/catalog.js`: Pure filtering, batching, card markup, and WhatsApp-message helpers.
- `assets/js/gallery-page.js`: Filter controls, progressive loading, lightbox, keyboard behavior, and icon refresh.
- `galeri.html`: Dedicated catalog page.
- `assets/css/styles.css`: Shared catalog grid, filters, lightbox, and responsive states.
- `assets/images/catalog/*.webp`: 50 generated catalog images.
- `assets/js/site-data.js`: Homepage featured gallery derived from catalog records.
- `assets/js/main.js`: Homepage rendering and catalog navigation.
- `index.html`: Catalog links and `Lihat semua pekerjaan` action.
- `tests/catalog-data.test.js`: Count, category balance, uniqueness, and asset-path tests.
- `tests/catalog.test.js`: Filtering, batching, markup, and message tests.
- `README.md`: Catalog asset and content update instructions.

### Task 1: Catalog Data Contract

**Files:**
- Create: `tests/catalog-data.test.js`
- Create: `assets/js/catalog-data.js`

- [x] **Step 1: Write failing catalog-data tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { catalogItems, catalogCategories, featuredCatalogIds } from "../assets/js/catalog-data.js";

test("catalog contains 50 unique services split evenly across five categories", () => {
  assert.equal(catalogItems.length, 50);
  assert.equal(new Set(catalogItems.map(({ id }) => id)).size, 50);
  assert.equal(new Set(catalogItems.map(({ title }) => title)).size, 50);

  for (const category of catalogCategories) {
    assert.equal(
      catalogItems.filter((item) => item.category === category.id).length,
      10,
      category.id,
    );
  }
});

test("catalog assets use stable WebP paths and descriptive alt text", () => {
  for (const item of catalogItems) {
    assert.match(item.image, /^assets\/images\/catalog\/[a-z0-9-]+\.webp$/);
    assert.ok(item.alt.length >= 20);
  }
});

test("homepage has six valid featured catalog entries", () => {
  assert.equal(featuredCatalogIds.length, 6);
  assert.equal(new Set(featuredCatalogIds).size, 6);
  assert.ok(featuredCatalogIds.every((id) => catalogItems.some((item) => item.id === id)));
});
```

- [x] **Step 2: Run tests and verify failure**

Run: `node --test tests/catalog-data.test.js`

Expected: FAIL because `assets/js/catalog-data.js` does not exist.

- [x] **Step 3: Implement the full catalog dataset**

Create five category definitions and 50 records matching the approved design. Each record must include:

```js
{
  id: "lemari-aluminium",
  title: "Lemari Aluminium",
  category: "aluminium-kaca",
  categoryLabel: "Aluminium & Kaca",
  image: "assets/images/catalog/lemari-aluminium.webp",
  alt: "Lemari aluminium custom untuk penyimpanan rumah",
}
```

Use the exact 50 service names from the catalog design. Export six featured IDs covering all five categories, with one additional high-demand aluminium item.

- [x] **Step 4: Run catalog-data tests**

Run: `npm.cmd test`

Expected: all existing tests plus 3 catalog-data tests PASS.

- [x] **Step 5: Commit catalog contract**

```powershell
git add assets/js/catalog-data.js tests/catalog-data.test.js
git commit -m "feat: add HIJAOE catalog data"
```

### Task 2: Generate 50 Catalog Assets

**Files:**
- Create: `assets/images/catalog/*.webp`

- [x] **Step 1: Generate 10 construction and renovation images**

Use one built-in image-generation call per service. Each prompt must name the exact service, use a realistic Indonesian home or small-business setting, request landscape framing, mechanically believable construction, no logos, no text, and no watermark.

Generate:

```text
renovasi-fasad-rumah
penambahan-teras
gudang-rangka-besi
mezanin-toko
bangunan-tambahan-rumah
pemasangan-keramik
pondasi-dan-cor
renovasi-ruang-usaha
pengecatan-eksterior
pembangunan-rumah-sederhana
```

- [x] **Step 2: Generate 10 iron and welding images**

Generate:

```text
pagar-geser-besi
pagar-laser-cutting
teralis-jendela
railing-tangga
tangga-besi
rak-gudang
ranjang-besi
dudukan-tandon
gerobak-booth-besi
rangka-papan-nama
```

- [x] **Step 3: Generate 10 aluminium and glass images**

Generate:

```text
lemari-aluminium
jendela-aluminium
pintu-aluminium
kusen-aluminium
etalase-aluminium-kaca
storefront-toko
partisi-kaca
pintu-lipat-aluminium-kaca
pintu-kamar-mandi-aluminium
kawat-nyamuk-aluminium
```

- [x] **Step 4: Generate 10 roof and ceiling images**

Generate:

```text
kanopi-alderon
kanopi-polikarbonat
kanopi-spandek
kanopi-membran
rangka-atap-baja-ringan
plafon-pvc
plafon-gypsum
talang-air
pergola-besi
carport-beratap
```

- [x] **Step 5: Generate 10 interior and furniture images**

Generate:

```text
kitchen-set-aluminium
kabinet-dapur-aluminium
rak-piring-aluminium
rak-sepatu-aluminium
meja-sekolah
kursi-sekolah
meja-rangka-besi
rak-display-toko
wall-panel
booth-kios-usaha
```

- [x] **Step 6: Copy, inspect, and optimize each category batch**

After each ten-image batch:

1. Copy outputs from the generated-images directory into `assets/images/catalog/`.
2. Visually inspect every image for malformed structures, duplicate compositions, unrelated text, or implausible fabrication.
3. Regenerate rejected images before proceeding.
4. Convert each image to 960 px wide WebP using Sharp at quality 74-78.
5. Confirm every file is below 250 KB where quality permits.

- [x] **Step 7: Validate asset count and dimensions**

Run a Node script using Sharp to assert:

```text
50 .webp files
all files have width 960
all files have nonzero height and size
all expected filenames from catalog-data.js exist
```

Expected: zero missing or unexpected files.

- [x] **Step 8: Commit catalog assets**

```powershell
git add assets/images/catalog
git commit -m "assets: add HIJAOE service catalog images"
```

### Task 3: Catalog Filtering and Rendering

**Files:**
- Create: `tests/catalog.test.js`
- Create: `assets/js/catalog.js`

- [x] **Step 1: Write failing behavior tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  filterCatalog,
  getCatalogBatch,
  renderCatalogCards,
  buildServiceWhatsAppMessage,
} from "../assets/js/catalog.js";

const sample = [
  { id: "a", title: "Pagar Besi", category: "besi-las", categoryLabel: "Besi & Las", image: "a.webp", alt: "Pagar besi rumah" },
  { id: "b", title: "Jendela Aluminium", category: "aluminium-kaca", categoryLabel: "Aluminium & Kaca", image: "b.webp", alt: "Jendela aluminium rumah" },
];

test("filterCatalog returns all records or one selected category", () => {
  assert.equal(filterCatalog(sample, "semua").length, 2);
  assert.deepEqual(filterCatalog(sample, "besi-las").map(({ id }) => id), ["a"]);
});

test("getCatalogBatch slices twelve records at a time", () => {
  const records = Array.from({ length: 25 }, (_, index) => ({ id: String(index) }));
  assert.equal(getCatalogBatch(records, 0, 12).length, 12);
  assert.equal(getCatalogBatch(records, 12, 12).length, 12);
  assert.equal(getCatalogBatch(records, 24, 12).length, 1);
});

test("catalog card exposes service data and lazy image", () => {
  const html = renderCatalogCards(sample);
  assert.match(html, /Jendela Aluminium/);
  assert.match(html, /data-catalog-id="b"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /Tanyakan layanan ini/);
});

test("WhatsApp message includes the selected service name", () => {
  assert.equal(
    buildServiceWhatsAppMessage("Lemari Aluminium"),
    "Halo HIJAOE, saya ingin bertanya tentang layanan Lemari Aluminium.",
  );
});
```

- [x] **Step 2: Run tests and verify failure**

Run: `node --test tests/catalog.test.js`

Expected: FAIL because `assets/js/catalog.js` does not exist.

- [x] **Step 3: Implement pure catalog helpers**

Implement:

```js
export function filterCatalog(items, category) {}
export function getCatalogBatch(items, offset, limit = 12) {}
export function renderCatalogCards(items) {}
export function buildServiceWhatsAppMessage(title) {}
```

Reuse HTML escaping behavior from `render.js` by exporting `escapeHtml`, rather than duplicating string escaping.

- [x] **Step 4: Run all unit tests**

Run: `npm.cmd test`

Expected: all tests PASS.

- [x] **Step 5: Commit catalog helpers**

```powershell
git add assets/js/render.js assets/js/catalog.js tests/catalog.test.js
git commit -m "feat: add catalog filtering and rendering"
```

### Task 4: Catalog Page and Interactions

**Files:**
- Create: `galeri.html`
- Create: `assets/js/gallery-page.js`
- Modify: `assets/css/styles.css`

- [x] **Step 1: Build semantic catalog page**

Create `galeri.html` with:

- The same site header, text brand, mobile menu, footer, and floating WhatsApp action as `index.html`.
- A compact dark catalog hero.
- Filter buttons generated from `catalogCategories`.
- `#catalog-grid`, empty state, and `#load-more`.
- A native `<dialog id="catalog-lightbox">` containing image, category, title, WhatsApp link, and icon-only close button.
- Canonical navigation back to `index.html` sections.

- [x] **Step 2: Implement page state**

In `gallery-page.js`, keep:

```js
const state = {
  category: "semua",
  visibleCount: 12,
};
```

On filter selection:

- Update `aria-pressed`.
- Reset `visibleCount` to 12.
- Render filtered records.

On `Muat lebih banyak`:

- Increase `visibleCount` by 12.
- Hide the button when all matching records are visible.

- [x] **Step 3: Implement lightbox behavior**

- Open the native dialog from an image click or card details action.
- Populate image, alt text, category, title, and service-specific WhatsApp URL.
- Close with the icon button, Escape, or click on the dialog backdrop.
- Restore focus to the card that opened it.

- [x] **Step 4: Style the catalog**

Add:

- Compact catalog hero.
- Horizontally scrollable segmented filter control.
- Responsive 4-column desktop, 2-column tablet, and 1-column phone grid.
- Stable `3 / 2` image aspect ratios.
- Service titles sized for compact cards.
- Native dialog backdrop and a full-bleed image region inside the lightbox.
- Stable load-more button and empty state.

- [x] **Step 5: Run unit tests and CSS constraint scan**

Run:

```powershell
npm.cmd test
rg -n "font-size:.*vw|letter-spacing:.*-|border-radius: (9|[1-9][0-9])px" assets/css/styles.css
```

Expected: all tests PASS and no prohibited CSS patterns.

- [x] **Step 6: Commit catalog page**

```powershell
git add galeri.html assets/js/gallery-page.js assets/css/styles.css
git commit -m "feat: build HIJAOE catalog page"
```

### Task 5: Homepage Catalog Integration

**Files:**
- Modify: `assets/js/site-data.js`
- Modify: `assets/js/main.js`
- Modify: `index.html`
- Modify: `tests/site-data.test.js`

- [x] **Step 1: Write failing homepage-feature tests**

Add assertions that homepage projects contain exactly six records derived from `featuredCatalogIds`, and that all IDs exist in `catalogItems`.

- [x] **Step 2: Run the focused test**

Run: `node --test tests/site-data.test.js`

Expected: FAIL because homepage project data is still independent from the catalog.

- [x] **Step 3: Derive homepage projects from catalog records**

Import `catalogItems` and `featuredCatalogIds` into `site-data.js`, replace the current five hardcoded project records with six mapped catalog records, and preserve the existing `title`, `category`, `image`, and `alt` renderer interface.

- [x] **Step 4: Add catalog navigation**

- Add `Katalog` to desktop and mobile navigation.
- Add `Lihat semua pekerjaan` below the homepage gallery.
- Link both to `galeri.html`.
- Keep `Proyek` as the anchor link to the homepage selection.

- [x] **Step 5: Run all tests**

Run: `npm.cmd test`

Expected: all tests PASS.

- [x] **Step 6: Commit homepage integration**

```powershell
git add assets/js/site-data.js assets/js/main.js index.html tests/site-data.test.js
git commit -m "feat: connect homepage to HIJAOE catalog"
```

### Task 6: Documentation and Browser Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-06-20-hijaoe-catalog.md`

- [x] **Step 1: Update maintenance documentation**

Document:

- How catalog records map to filenames.
- How to replace one generated visual with an authentic photo.
- How to add or remove a service without breaking category counts.
- That generated visuals illustrate available service types and must not be presented as customer-project documentation.

- [x] **Step 2: Run final automated tests**

Run: `npm.cmd test`

Expected: all tests PASS with zero failures.

- [x] **Step 3: Verify HTTP assets**

Use PowerShell to request:

- `/`
- `/galeri.html`
- shared CSS and JavaScript
- all 50 catalog image URLs

Expected: HTTP 200 for every request.

- [x] **Step 4: Verify desktop catalog**

At 1440x900:

- First 12 items are visible.
- Filters show 10 correct records for each category.
- `Muat lebih banyak` reveals 24, 36, 48, then 50 records for Semua.
- Lightbox opens the correct image and service title.
- WhatsApp URL includes the selected service title.
- No horizontal overflow or browser errors.

- [x] **Step 5: Verify mobile catalog**

At 390x844:

- Filter row scrolls without widening the page.
- Cards are one column and titles fit.
- Fixed WhatsApp action does not cover load-more or footer content.
- Mobile navigation opens and closes.
- Lightbox image and controls fit without overlap.

- [x] **Step 6: Verify homepage**

- Six featured services render.
- `Lihat semua pekerjaan` and `Katalog` open `galeri.html`.
- Hero and the next section remain properly framed.
- No regressions in existing WhatsApp, map, or mobile-menu behavior.

- [x] **Step 7: Update checklist and commit documentation**

```powershell
git add README.md docs/superpowers/plans/2026-06-20-hijaoe-catalog.md
git commit -m "docs: add HIJAOE catalog maintenance guide"
```
