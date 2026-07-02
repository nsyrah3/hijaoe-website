import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildServiceModelGalleryUpdate,
  getServiceModelThumbPressedState,
} from "../assets/js/service-model-gallery.js";

test("buildServiceModelGalleryUpdate reads preview content from thumbnail dataset", () => {
  assert.deepEqual(
    buildServiceModelGalleryUpdate({
      serviceModelImage: "/assets/images/service-catalog/pagar-besi-gallery/pagar-besi-minimalis-hollow.webp",
      serviceModelAlt: "Pagar besi minimalis warna hitam",
      serviceModelTitle: "Pagar Besi Minimalis Hollow",
    }),
    {
      image: "/assets/images/service-catalog/pagar-besi-gallery/pagar-besi-minimalis-hollow.webp",
      alt: "Pagar besi minimalis warna hitam",
      title: "Pagar Besi Minimalis Hollow",
    },
  );
});

test("buildServiceModelGalleryUpdate ignores incomplete thumbnail data", () => {
  assert.equal(
    buildServiceModelGalleryUpdate({
      serviceModelImage: "/assets/images/service-catalog/pagar-besi-gallery/pagar-besi-minimalis-hollow.webp",
      serviceModelAlt: "",
      serviceModelTitle: "Pagar Besi Minimalis Hollow",
    }),
    null,
  );
});

test("getServiceModelThumbPressedState marks only the active thumbnail", () => {
  assert.deepEqual(getServiceModelThumbPressedState(5, 3), [
    "false",
    "false",
    "false",
    "true",
    "false",
  ]);
});

test("service page registers pointer hover for model thumbnails", async () => {
  const script = await readFile("assets/js/service-page.js", "utf8");

  assert.match(script, /addEventListener\("pointerenter"/);
  assert.doesNotMatch(script, /matchMedia\("\(hover: hover\)"\)/);
});
