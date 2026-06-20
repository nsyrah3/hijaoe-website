import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProjectPreviewUpdate,
  getProjectThumbPressedState,
} from "../assets/js/project-preview.js";

test("buildProjectPreviewUpdate reads preview content from thumbnail dataset", () => {
  assert.deepEqual(
    buildProjectPreviewUpdate({
      projectImage: "pagar.webp",
      projectAlt: "Pagar besi rumah",
      projectCategory: "Besi & Las",
      projectTitle: "Pagar Besi",
    }),
    {
      image: "pagar.webp",
      alt: "Pagar besi rumah",
      category: "Besi & Las",
      title: "Pagar Besi",
    },
  );
});

test("buildProjectPreviewUpdate ignores incomplete thumbnail data", () => {
  assert.equal(
    buildProjectPreviewUpdate({
      projectImage: "pagar.webp",
      projectAlt: "",
      projectCategory: "Besi & Las",
      projectTitle: "Pagar Besi",
    }),
    null,
  );
});

test("getProjectThumbPressedState marks only the active thumbnail", () => {
  assert.deepEqual(getProjectThumbPressedState(4, 2), ["false", "false", "true", "false"]);
});
