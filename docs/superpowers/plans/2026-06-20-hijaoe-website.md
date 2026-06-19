# HIJAOE Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a responsive, modern-industrial one-page website for HIJAOE that presents its services and sends prospective customers to WhatsApp.

**Architecture:** Use a static HTML, CSS, and JavaScript site with no application framework. Keep business content in a dedicated JavaScript data module, rendering helpers in a separate module, and generated visual assets under `assets/images` so project photos can be replaced without restructuring the page.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, Node.js built-in test runner, Lucide icons, Playwright for browser verification.

---

## File Structure

- `index.html`: Semantic page shell, metadata, section containers, and fixed WhatsApp action.
- `assets/css/styles.css`: Design tokens, responsive layout, typography, interactions, and accessibility states.
- `assets/js/site-data.js`: Business details, service categories, process steps, project placeholders, and map/WhatsApp links.
- `assets/js/render.js`: Pure rendering helpers for service, project, and process markup.
- `assets/js/main.js`: Page initialization, navigation behavior, current year, and icon initialization.
- `assets/images/hijaoe-workshop.webp`: Generated temporary hero image that will be replaced or supplemented with authentic workshop photography.
- `assets/images/project-*.webp`: Generated temporary project images clearly presented as category illustrations rather than customer-project claims.
- `tests/site-data.test.js`: Unit tests for business data and contact links.
- `tests/render.test.js`: Unit tests for generated section markup.
- `package.json`: Test and local preview scripts.
- `README.md`: Local preview, content-editing, and photo-replacement instructions.

### Task 1: Project Foundation and Business Data

**Files:**
- Create: `package.json`
- Create: `assets/js/site-data.js`
- Create: `tests/site-data.test.js`

- [x] **Step 1: Write failing data tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { business, services, buildWhatsAppUrl } from "../assets/js/site-data.js";

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
    ["Konstruksi & Renovasi", "Besi & Las", "Aluminium & Kaca", "Atap & Plafon", "Interior & Furnitur"]
  );
});

test("WhatsApp URL uses the Indonesian international number and encoded message", () => {
  const url = buildWhatsAppUrl("Halo HIJAOE, saya ingin konsultasi.");
  assert.equal(
    url,
    "https://wa.me/628976010103?text=Halo%20HIJAOE%2C%20saya%20ingin%20konsultasi."
  );
});
```

- [x] **Step 2: Run tests and verify failure**

Run: `node --test tests/site-data.test.js`

Expected: FAIL because `assets/js/site-data.js` does not exist.

- [x] **Step 3: Implement package metadata and confirmed business data**

Create `package.json` with ES modules and scripts:

```json
{
  "name": "hijaoe-website",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "serve": "npx --yes serve ."
  }
}
```

Implement `site-data.js` with the confirmed phone number, hours, Makassar location, Google Maps URL, five service categories, five ordering steps, three service-area labels, and a `buildWhatsAppUrl(message)` function that calls `encodeURIComponent`.

- [x] **Step 4: Run data tests**

Run: `npm test`

Expected: 3 tests PASS.

- [x] **Step 5: Commit foundation**

```bash
git add package.json assets/js/site-data.js tests/site-data.test.js
git commit -m "feat: add HIJAOE business data"
```

### Task 2: Generated Temporary Visual Assets

**Files:**
- Create: `assets/images/hijaoe-workshop.webp`
- Create: `assets/images/project-construction.webp`
- Create: `assets/images/project-metalwork.webp`
- Create: `assets/images/project-aluminium.webp`
- Create: `assets/images/project-roofing.webp`
- Create: `assets/images/project-interior.webp`

- [x] **Step 1: Generate a wide hero asset**

Generate a realistic wide photograph of a modest Indonesian metalworking and construction workshop in Makassar, showing steel frames, welding equipment, aluminium profiles, and active craftsmanship. Keep the right side visually clear enough for cropping and avoid visible brand names or fabricated project claims.

- [x] **Step 2: Generate five category assets**

Generate realistic landscape images for construction/renovation, metal gates and welding, aluminium/glass storefronts, roofing/canopies, and aluminium interior furniture. These are temporary category illustrations, not labelled customer projects.

- [x] **Step 3: Convert and optimize assets**

Convert each output to WebP. Target approximately 1600 px width for the hero and 960 px width for category assets, with each file under 350 KB where visual quality permits.

- [x] **Step 4: Inspect all assets**

Verify every image is nonblank, has no malformed tools or structures, contains no unrelated text, and crops cleanly at `object-fit: cover`.

- [x] **Step 5: Commit visual assets**

```bash
git add assets/images
git commit -m "assets: add temporary HIJAOE visuals"
```

### Task 3: Rendering Helpers and Semantic Page

**Files:**
- Create: `tests/render.test.js`
- Create: `assets/js/render.js`
- Create: `index.html`
- Create: `assets/js/main.js`

- [x] **Step 1: Write failing rendering tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { renderServices, renderProjects, renderProcess } from "../assets/js/render.js";

test("service renderer exposes titles and detail lists", () => {
  const html = renderServices([{ icon: "hammer", title: "Besi & Las", items: ["Pagar", "Teralis"] }]);
  assert.match(html, /Besi &amp; Las/);
  assert.match(html, /Pagar/);
  assert.match(html, /data-lucide="hammer"/);
});

test("project renderer marks temporary images as category inspiration", () => {
  const html = renderProjects([{ title: "Pekerjaan Besi", image: "sample.webp", alt: "Pekerjaan besi" }]);
  assert.match(html, /Inspirasi kategori/);
  assert.match(html, /loading="lazy"/);
});

test("process renderer numbers each step", () => {
  const html = renderProcess([{ title: "Konsultasi", description: "Ceritakan kebutuhan Anda." }]);
  assert.match(html, /01/);
  assert.match(html, /Konsultasi/);
});
```

- [x] **Step 2: Run tests and verify failure**

Run: `node --test tests/render.test.js`

Expected: FAIL because `assets/js/render.js` does not exist.

- [x] **Step 3: Implement pure rendering helpers**

Create an HTML escaping helper and export `renderServices`, `renderProjects`, and `renderProcess`. Ensure external data is escaped, project images use meaningful `alt` text and `loading="lazy"`, and each temporary project item contains the visible label `Inspirasi kategori`.

- [x] **Step 4: Run rendering tests**

Run: `npm test`

Expected: 6 total tests PASS.

- [x] **Step 5: Build the semantic page**

Create `index.html` with:

- SEO title and Indonesian description.
- Header navigation for Layanan, Proyek, Tentang, and Kontak.
- Full-width hero using `hijaoe-workshop.webp`.
- Service, project, about, ordering process, service area, and contact sections.
- Testimonial section omitted until authentic testimonials exist.
- Contact panel with phone, hours, location, Google Maps, and WhatsApp.
- Fixed WhatsApp button with accessible label.
- Lucide browser script and `assets/js/main.js` module.

- [x] **Step 6: Initialize dynamic content**

In `main.js`, import data and render helpers, populate the dynamic sections, set all consultation links to the generated WhatsApp URL, set the current footer year, close the mobile menu after navigation, and call `lucide.createIcons()`.

- [x] **Step 7: Commit page behavior**

```bash
git add index.html assets/js/main.js assets/js/render.js tests/render.test.js
git commit -m "feat: build HIJAOE one-page structure"
```

### Task 4: Modern-Industrial Responsive Styling

**Files:**
- Create: `assets/css/styles.css`
- Modify: `index.html`

- [x] **Step 1: Define design tokens**

Add CSS custom properties for charcoal backgrounds, off-white surfaces, steel gray borders, HIJAOE green, text colors, 4-8 px radii, stable container widths, and restrained shadows.

- [x] **Step 2: Style the desktop experience**

Implement a full-bleed photographic hero, compact sticky header, five-column service grid where space allows, fixed-aspect project grid, unframed section bands, process timeline, service-area strip, and high-contrast contact section.

- [x] **Step 3: Style mobile navigation and layout**

At mobile widths, use a menu icon, single-column content, horizontal-safe buttons, stable image aspect ratios, and a full-width bottom WhatsApp action that does not cover footer content.

- [x] **Step 4: Add interaction and accessibility states**

Add visible keyboard focus, reduced-motion handling, hover states that do not shift layout, sufficient color contrast, readable line lengths, and `scroll-margin-top` for anchored sections.

- [x] **Step 5: Scan CSS against design constraints**

Run:

```powershell
rg -n "border-radius|font-size:.*vw|letter-spacing:.*-" assets/css/styles.css
```

Expected: no viewport-scaled font sizes, no negative letter spacing, and no card radius above 8 px.

- [x] **Step 6: Commit responsive styling**

```bash
git add assets/css/styles.css index.html
git commit -m "style: add HIJAOE industrial responsive design"
```

### Task 5: Documentation and End-to-End Verification

**Files:**
- Create: `README.md`
- Modify: `docs/superpowers/plans/2026-06-20-hijaoe-website.md`

- [x] **Step 1: Document content updates**

Create `README.md` documenting:

- `npm test`
- `npm run serve`
- Where to update phone, hours, services, and map URL.
- How to replace temporary images while keeping filenames stable.
- That temporary images must be replaced with authentic project photographs before presenting them as completed HIJAOE projects.

- [x] **Step 2: Run automated tests**

Run: `npm test`

Expected: all unit tests PASS with zero failures.

- [x] **Step 3: Start the local server**

Run: `npm run serve -- --listen 4173`

Expected: local site available at `http://localhost:4173`.

- [x] **Step 4: Verify desktop and mobile in Playwright**

Check at 1440x900 and 390x844:

- Hero image is visible and correctly cropped.
- HIJAOE and the service proposition appear in the first viewport.
- A hint of the next section remains visible.
- Navigation and mobile menu work.
- No text, buttons, images, or fixed controls overlap.
- All sections fit their containers.
- WhatsApp links contain `628976010103`.
- Google Maps link opens the supplied HIJAOE listing.

- [x] **Step 5: Check browser console and asset loading**

Expected: no JavaScript errors, no missing assets, and all image requests return HTTP 200.

- [x] **Step 6: Update plan checkboxes and commit**

```bash
git add README.md docs/superpowers/plans/2026-06-20-hijaoe-website.md
git commit -m "docs: add HIJAOE website usage guide"
```
