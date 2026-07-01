import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(
  new URL("../assets/css/styles.css", import.meta.url),
  "utf8",
);
const baseStyles = styles.split("@media", 1)[0];

test("catalog card images keep a stable three-by-two frame", () => {
  assert.match(
    styles,
    /\.catalog-card__image-button\s*\{[^}]*aspect-ratio:\s*3\s*\/\s*2;/s,
  );
  assert.match(
    styles,
    /\.catalog-card__image-button img\s*\{[^}]*height:\s*100%;/s,
  );
});

test("catalog uses two columns at the tablet breakpoint", () => {
  assert.match(
    styles,
    /@media \(max-width: 1100px\)[\s\S]*?\.catalog-grid\s*\{\s*grid-template-columns:\s*repeat\(2,/,
  );
});

test("project preview keeps a stable visual frame and responsive thumbnails", () => {
  assert.match(
    styles,
    /\.project-preview__stage\s*\{[^}]*min-height:\s*520px;/s,
  );
  assert.match(
    styles,
    /@media \(max-width: 680px\)[\s\S]*\.project-preview__stage\s*\{[^}]*aspect-ratio:\s*3\s*\/\s*2;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 680px\)[\s\S]*\.project-preview__thumbs\s*\{[^}]*overflow-x:\s*auto;/,
  );
});

test("services use balanced desktop, tablet, and mobile grids", () => {
  assert.match(
    baseStyles,
    /\.services-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s,
  );
  assert.match(
    styles,
    /@media \(max-width: 860px\)[\s\S]*?\.services-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/,
  );
  assert.match(
    styles,
    /@media \(max-width: 580px\)[\s\S]*?\.services-grid\s*\{[^}]*grid-template-columns:\s*1fr;/,
  );
});

test("services use continuous card dividers", () => {
  assert.match(
    styles,
    /\.services-grid\s*\{[^}]*border-left:\s*1px solid var\(--border-light\);[^}]*\}[\s\S]*?\.service-item\s*\{[^}]*border-bottom:\s*1px solid var\(--border-light\);/,
  );
});

test("service landing pages have stable responsive layout rules", () => {
  assert.match(
    styles,
    /\.service-page__hero-grid\s*\{[^}]*grid-template-columns:/s,
  );
  assert.match(
    styles,
    /\.service-page__hero-grid img\s*\{[^}]*aspect-ratio:\s*3\s*\/\s*2;/s,
  );
  assert.match(
    styles,
    /\.service-page__grid\s*\{[^}]*grid-template-columns:/s,
  );
  assert.match(styles, /\.service-related__grid\s*\{/);
  assert.match(
    styles,
    /@media \(max-width: 680px\)[\s\S]*?\.service-page__hero-grid\s*\{[^}]*grid-template-columns:\s*1fr;/,
  );
});

test("error page and service directory have dedicated layout rules", () => {
  assert.match(styles, /\.error-page__main\s*\{/);
  assert.match(styles, /\.service-directory\s*\{/);
});

test("service model catalog has a compact responsive gallery", () => {
  assert.match(
    styles,
    /\.service-model-gallery\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\);/s,
  );
  assert.doesNotMatch(
    baseStyles,
    /\.service-model-gallery\s*\{[^}]*overflow-x:\s*auto;/s,
  );
  assert.match(
    styles,
    /\.service-model-gallery__item img\s*\{[^}]*aspect-ratio:\s*5\s*\/\s*4;[^}]*object-fit:\s*cover;/s,
  );
  assert.match(
    styles,
    /\.service-model-gallery__item\s*\{[^}]*box-shadow:\s*0\s+10px\s+24px\s+rgba\(10,\s*15,\s*11,\s*0\.08\);/s,
  );
  assert.match(
    styles,
    /\.service-model-gallery__item figcaption\s*\{[^}]*position:\s*absolute;[^}]*left:\s*6px;[^}]*right:\s*6px;[^}]*bottom:\s*6px;/s,
  );
  assert.match(
    styles,
    /@media \(max-width: 680px\)[\s\S]*?\.service-model-gallery\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[^}]*gap:\s*6px;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 680px\)[\s\S]*?\.service-model-gallery__item figcaption\s*\{[^}]*font-size:\s*0\.54rem;/,
  );
});
