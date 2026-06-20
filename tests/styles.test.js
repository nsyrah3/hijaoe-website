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
