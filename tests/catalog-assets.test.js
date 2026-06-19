import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import sharp from "sharp";
import { catalogItems } from "../assets/js/catalog-data.js";

const catalogDirectory = path.resolve("assets/images/catalog");

test("all catalog image files exist with expected dimensions", async () => {
  const files = await fs.readdir(catalogDirectory);
  const webpFiles = files.filter((file) => file.endsWith(".webp"));

  assert.equal(webpFiles.length, 50);

  for (const item of catalogItems) {
    const filename = path.basename(item.image);
    const imagePath = path.join(catalogDirectory, filename);
    const stat = await fs.stat(imagePath);
    const metadata = await sharp(imagePath).metadata();

    assert.ok(stat.size > 0, filename);
    assert.ok(stat.size < 250_000, filename);
    assert.equal(metadata.format, "webp", filename);
    assert.equal(metadata.width, 960, filename);
    assert.ok(metadata.height >= 500, filename);
  }
});
