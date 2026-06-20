# HIJAOE Project Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage "Bidang pekerjaan" static image grid with an interactive featured preview and thumbnail selector.

**Architecture:** Keep the feature inside the existing static site structure. Add focused renderer output in `assets/js/render.js`, wire the browser behavior in `assets/js/main.js`, and style the new layout in `assets/css/styles.css`. Reuse the existing `projects` data derived from the six featured catalog services.

**Tech Stack:** Static HTML, CSS, ES modules, Node built-in test runner, existing catalog WebP assets.

---

## File Structure

- Modify `assets/js/render.js`: add `renderProjectPreview(items)` and keep escaping via `escapeHtml`.
- Modify `assets/js/main.js`: render the new preview and add thumbnail click/focus/hover behavior.
- Modify `assets/css/styles.css`: replace the old project grid presentation with the preview layout and responsive thumbnail styling.
- Modify `tests/render.test.js`: cover preview markup, active state, thumbnails, and escaping.
- Modify `tests/styles.test.js`: cover stable preview aspect ratio and mobile stacking behavior.

---

### Task 1: Add Renderer Tests

**Files:**
- Modify: `tests/render.test.js`

- [ ] **Step 1: Add failing tests for the project preview renderer**

Add `renderProjectPreview` to the import list:

```js
import {
  renderServices,
  renderProjects,
  renderProjectPreview,
  renderProcess,
} from "../assets/js/render.js";
```

Add these tests after the existing project renderer test:

```js
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
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm.cmd test`

Expected: FAIL because `renderProjectPreview` is not exported yet.

---

### Task 2: Implement Preview Markup

**Files:**
- Modify: `assets/js/render.js`
- Test: `tests/render.test.js`

- [ ] **Step 1: Add the renderer**

Add this function after `renderProjects(items)`:

```js
export function renderProjectPreview(items) {
  const activeProject = items[0];

  if (!activeProject) {
    return "";
  }

  return `
    <div class="project-preview" data-project-preview>
      <article class="project-preview__stage">
        <img
          src="${escapeHtml(activeProject.image)}"
          alt="${escapeHtml(activeProject.alt)}"
          width="960"
          height="640"
          loading="lazy"
          data-project-preview-image
        >
        <div class="project-preview__shade"></div>
        <div class="project-preview__content">
          <p data-project-preview-category>${escapeHtml(activeProject.category)}</p>
          <h3 data-project-preview-title>${escapeHtml(activeProject.title)}</h3>
        </div>
      </article>
      <div class="project-preview__thumbs" aria-label="Pilih contoh bidang pekerjaan">
        ${items
          .map(
            (project, index) => `
              <button
                class="project-preview__thumb"
                type="button"
                aria-label="Tampilkan ${escapeHtml(project.title)}"
                aria-pressed="${index === 0 ? "true" : "false"}"
                data-project-thumb
                data-project-title="${escapeHtml(project.title)}"
                data-project-category="${escapeHtml(project.category)}"
                data-project-image="${escapeHtml(project.image)}"
                data-project-alt="${escapeHtml(project.alt)}"
              >
                <img src="${escapeHtml(project.image)}" alt="" width="160" height="107" loading="lazy">
                <span>${escapeHtml(project.category)}</span>
                <strong>${escapeHtml(project.title)}</strong>
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}
```

- [ ] **Step 2: Run renderer tests**

Run: `npm.cmd test`

Expected: PASS for renderer tests or fail only on CSS tests that have not been updated yet.

---

### Task 3: Wire Homepage Interaction

**Files:**
- Modify: `assets/js/main.js`

- [ ] **Step 1: Render project preview instead of static grid**

Change the render import to include `renderProjectPreview`:

```js
import {
  renderProcess,
  renderProjectPreview,
  renderProjects,
  renderServiceAreas,
  renderServices,
} from "./render.js";
```

Change the project render call:

```js
document.querySelector("#projects-grid").innerHTML = renderProjectPreview(projects);
```

- [ ] **Step 2: Add thumbnail activation behavior**

Add this block after the menu constants are defined:

```js
const projectPreview = document.querySelector("[data-project-preview]");

function activateProjectPreview(button) {
  if (!projectPreview || !button) {
    return;
  }

  const image = projectPreview.querySelector("[data-project-preview-image]");
  const category = projectPreview.querySelector("[data-project-preview-category]");
  const title = projectPreview.querySelector("[data-project-preview-title]");

  if (!image || !category || !title) {
    return;
  }

  image.src = button.dataset.projectImage;
  image.alt = button.dataset.projectAlt;
  category.textContent = button.dataset.projectCategory;
  title.textContent = button.dataset.projectTitle;

  projectPreview.querySelectorAll("[data-project-thumb]").forEach((thumb) => {
    thumb.setAttribute("aria-pressed", String(thumb === button));
  });
}

if (projectPreview) {
  const hoverPreview = window.matchMedia("(hover: hover)").matches;

  projectPreview.querySelectorAll("[data-project-thumb]").forEach((button) => {
    button.addEventListener("click", () => activateProjectPreview(button));
    button.addEventListener("focus", () => activateProjectPreview(button));

    if (hoverPreview) {
      button.addEventListener("pointerenter", () => activateProjectPreview(button));
    }
  });
}
```

- [ ] **Step 3: Run tests**

Run: `npm.cmd test`

Expected: PASS for JavaScript unit tests.

---

### Task 4: Style Preview Layout

**Files:**
- Modify: `assets/css/styles.css`
- Modify: `tests/styles.test.js`

- [ ] **Step 1: Replace the static project grid styles with preview styles**

Update the project CSS block around the existing `.projects-grid` and `.project-item` rules so the section has:

```css
.projects-grid {
  display: block;
}

.project-preview {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.8fr);
  gap: 16px;
}

.project-preview__stage {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-small);
  background: var(--charcoal-800);
}

.project-preview__stage img,
.project-preview__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.project-preview__stage img {
  object-fit: cover;
  transition: opacity 180ms ease, transform 420ms ease;
}

.project-preview__stage:hover img {
  transform: scale(1.018);
}

.project-preview__shade {
  background: linear-gradient(0deg, rgba(7, 10, 8, 0.92) 0%, rgba(7, 10, 8, 0.08) 64%);
}

.project-preview__content {
  position: absolute;
  z-index: 2;
  left: 28px;
  right: 28px;
  bottom: 28px;
}

.project-preview__content p,
.project-preview__thumb span {
  margin: 0 0 4px;
  color: var(--green-400);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}

.project-preview__content h3 {
  margin: 0;
  max-width: 12ch;
  font-family: "Barlow Condensed", Impact, sans-serif;
  font-size: clamp(2.4rem, 5vw, 5.4rem);
  line-height: 0.92;
}

.project-preview__thumbs {
  display: grid;
  gap: 10px;
}

.project-preview__thumb {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-height: 86px;
  padding: 8px;
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-small);
  background: rgba(255, 255, 255, 0.035);
  color: var(--white);
  text-align: left;
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
}

.project-preview__thumb:hover,
.project-preview__thumb:focus-visible,
.project-preview__thumb[aria-pressed="true"] {
  border-color: rgba(112, 184, 122, 0.85);
  background: rgba(112, 184, 122, 0.12);
}

.project-preview__thumb:focus-visible {
  outline: 3px solid var(--green-400);
  outline-offset: 3px;
}

.project-preview__thumb img {
  width: 88px;
  height: 62px;
  object-fit: cover;
  border-radius: 4px;
}

.project-preview__thumb strong {
  display: block;
  overflow-wrap: anywhere;
  font-family: "Barlow Condensed", Impact, sans-serif;
  font-size: 1.35rem;
  line-height: 0.95;
}
```

At `max-width: 1100px`, make `.project-preview` one column and `.project-preview__thumbs` a two-column grid.

At `max-width: 680px`, make `.project-preview__stage` use `aspect-ratio: 3 / 2` and `min-height: 0`, and make thumbnails a horizontally scrollable row with fixed-width buttons.

- [ ] **Step 2: Add style regression tests**

Add to `tests/styles.test.js`:

```js
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
```

- [ ] **Step 3: Run tests**

Run: `npm.cmd test`

Expected: all tests pass.

---

### Task 5: Browser Verification

**Files:**
- No code changes unless verification finds a defect.

- [ ] **Step 1: Verify desktop**

Open `http://localhost:4173/#proyek`.

Expected:
- Large project preview is visible.
- Six thumbnails are visible.
- Hovering/clicking thumbnails changes the large image/title/category.
- No console errors.

- [ ] **Step 2: Verify mobile**

Use a 390px-wide viewport on `http://localhost:4173/#proyek`.

Expected:
- The stage stays inside the viewport.
- Thumbnail row is scrollable or fits without horizontal page overflow.
- Tapping a thumbnail changes the preview.
- The existing WhatsApp floating button and next sections do not overlap the preview controls.

- [ ] **Step 3: Final verification**

Run:

```powershell
npm.cmd test
git diff --check
```

Expected:
- `npm.cmd test` exits 0.
- `git diff --check` exits 0.
