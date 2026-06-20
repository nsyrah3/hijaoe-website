import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(
  new URL("../assets/css/styles.css", import.meta.url),
  "utf8",
);

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
    /@media \(max-width: 1100px\)\s*\{\s*\.services-grid\s*\{[^}]*\}\s*\.catalog-grid\s*\{\s*grid-template-columns:\s*repeat\(2,/,
  );
});
