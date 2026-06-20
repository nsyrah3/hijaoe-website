import test from "node:test";
import assert from "node:assert/strict";

import {
  renderServices,
  renderProjects,
  renderProjectPreview,
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

test("project preview renderer creates active image and thumbnail buttons", () => {
  const html = renderProjectPreview([
    {
      id: "pagar-besi",
      title: "Pagar Besi",
      category: "Besi & Las",
      image: "pagar.webp",
      alt: "Pagar besi rumah",
    },
    {
      id: "jendela-aluminium",
      title: "Jendela Aluminium",
      category: "Aluminium & Kaca",
      image: "jendela.webp",
      alt: "Jendela aluminium rumah",
    },
  ]);

  assert.match(html, /data-project-preview/);
  assert.match(html, /data-project-preview-image/);
  assert.match(html, /src="pagar\.webp"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /data-project-image="jendela\.webp"/);
});

test("project preview renderer escapes project content", () => {
  const html = renderProjectPreview([
    {
      id: "x",
      title: "<b>Kanopi</b>",
      category: 'Atap "Premium"',
      image: "sample.webp",
      alt: "Kanopi <rumah>",
    },
  ]);

  assert.doesNotMatch(html, /<b>/);
  assert.doesNotMatch(html, /Kanopi <rumah>/);
  assert.match(html, /&lt;b&gt;Kanopi&lt;\/b&gt;/);
  assert.match(html, /Atap &quot;Premium&quot;/);
  assert.match(html, /Kanopi &lt;rumah&gt;/);
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
