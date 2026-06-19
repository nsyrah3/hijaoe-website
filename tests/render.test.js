import test from "node:test";
import assert from "node:assert/strict";

import {
  renderServices,
  renderProjects,
  renderProcess,
} from "../assets/js/render.js";

test("service renderer exposes escaped titles and detail lists", () => {
  const html = renderServices([
    {
      icon: "anvil",
      title: "Besi & Las",
      description: "Pekerjaan custom",
      items: ["Pagar", "Teralis"],
    },
  ]);

  assert.match(html, /Besi &amp; Las/);
  assert.match(html, /Pagar/);
  assert.match(html, /data-lucide="anvil"/);
});

test("project renderer does not place an inspiration badge over images", () => {
  const html = renderProjects([
    {
      title: "Pekerjaan Besi",
      category: "Besi & Las",
      image: "sample.webp",
      alt: "Pekerjaan besi",
    },
  ]);

  assert.doesNotMatch(html, /Inspirasi kategori/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /sample\.webp/);
});

test("process renderer numbers each step", () => {
  const html = renderProcess([
    {
      title: "Konsultasi",
      description: "Ceritakan kebutuhan Anda.",
    },
  ]);

  assert.match(html, /01/);
  assert.match(html, /Konsultasi/);
});

test("renderers escape untrusted HTML", () => {
  const html = renderServices([
    {
      icon: "hammer",
      title: "<script>alert(1)</script>",
      description: "Aman",
      items: ["<b>Pagar</b>"],
    },
  ]);

  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<b>/);
  assert.match(html, /&lt;script&gt;/);
});
