import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import sharp from "sharp";
import { serviceModelCatalogItems } from "../assets/js/service-catalog-data.js";

test("all school furniture service catalog images exist as optimized WebP", async () => {
  for (const item of serviceModelCatalogItems) {
    const imagePath = path.resolve(item.image);
    const stat = await fs.stat(imagePath);
    const metadata = await sharp(imagePath).metadata();

    assert.ok(stat.size > 0, item.image);
    assert.ok(stat.size < 70_000, item.image);
    assert.equal(metadata.format, "webp", item.image);
    assert.equal(metadata.width, 640, item.image);
    assert.equal(metadata.height, 480, item.image);
  }
});
