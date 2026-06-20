# HIJAOE Responsive Services Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present all six HIJAOE service categories in a balanced three-by-two desktop grid with readable tablet and mobile layouts.

**Architecture:** Keep the service data and renderer unchanged. Express the entire layout through the existing responsive stylesheet, using a three-column base grid, the existing two-column tablet breakpoint, and the existing one-column mobile breakpoint. Replace item-position-specific borders with grid-level and per-card dividers that work for any complete row.

**Tech Stack:** Static HTML, CSS Grid, Node.js built-in test runner

---

### Task 1: Lock the Responsive Grid Contract

**Files:**
- Modify: `tests/styles.test.js`
- Test: `tests/styles.test.js`

- [ ] **Step 1: Write the failing responsive grid test**

Append this test to `tests/styles.test.js`:

```js
test("services use balanced desktop, tablet, and mobile grids", () => {
  assert.match(
    styles,
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
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/styles.test.js`

Expected: FAIL because the base `.services-grid` still uses five columns.

- [ ] **Step 3: Add a border-system assertion**

Add this assertion inside the same test:

```js
  assert.match(
    styles,
    /\.services-grid\s*\{[^}]*border-left:\s*1px solid var\(--border-light\);[^}]*\}[\s\S]*?\.service-item\s*\{[^}]*border-bottom:\s*1px solid var\(--border-light\);/,
  );
```

- [ ] **Step 4: Run the focused test again**

Run: `node --test tests/styles.test.js`

Expected: FAIL because the continuous grid border system has not been implemented.

### Task 2: Implement the Responsive Service Grid

**Files:**
- Modify: `assets/css/styles.css:435-505`
- Modify: `assets/css/styles.css:1153-1177`
- Modify: `assets/css/styles.css:1316-1318`
- Modify: `assets/css/styles.css:1486-1500`
- Test: `tests/styles.test.js`

- [ ] **Step 1: Change the base grid and border system**

Update the base service rules to this structure:

```css
.services-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--steel-700);
  border-left: 1px solid var(--border-light);
}

.service-item {
  min-width: 0;
  padding: 26px 22px 12px;
  border-right: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
}
```

Delete the obsolete `.service-item:first-child` rule because the grid now owns the left boundary.

- [ ] **Step 2: Remove obsolete five-card breakpoint rules**

At `@media (max-width: 1100px)`, delete the redundant `.services-grid` three-column declaration and delete this obsolete selector:

```css
.service-item:nth-child(4),
.service-item:nth-child(5) {
  border-top: 1px solid var(--border-light);
}
```

Keep the existing `.service-item h3, .service-item p { min-height: auto; }` rule.

- [ ] **Step 3: Keep tablet at two columns**

Retain the existing rule inside `@media (max-width: 860px)`:

```css
.services-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

- [ ] **Step 4: Compact the mobile list**

Replace the mobile service rules inside `@media (max-width: 580px)` with:

```css
.services-grid {
  grid-template-columns: 1fr;
  border-left: 0;
}

.service-item,
.service-item:first-child {
  padding: 20px 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 1px solid var(--border-light);
}

.service-item h3 {
  margin: 18px 0 8px;
  font-size: 1.5rem;
}

.service-item ul {
  margin-top: 18px;
  padding-top: 14px;
}
```

- [ ] **Step 5: Run the focused tests**

Run: `node --test tests/styles.test.js`

Expected: all style tests pass.

- [ ] **Step 6: Run the full test suite**

Run: `npm.cmd test`

Expected: all tests pass with zero failures.

### Task 3: Verify Responsive Rendering

**Files:**
- Verify: `index.html`
- Verify: `assets/css/styles.css`

- [ ] **Step 1: Check the desktop layout**

Open `http://localhost:4173/#layanan` at a desktop viewport at least 1200 pixels wide.

Expected: six service cards appear as three equal columns and two rows, with complete outer and internal dividers and no orphaned card.

- [ ] **Step 2: Check the tablet layout**

Set the viewport between 581 and 860 pixels wide.

Expected: six cards appear as two columns and three rows with no horizontal overflow.

- [ ] **Step 3: Check the mobile layout**

Set the viewport to 390 by 844 pixels.

Expected: cards appear in one compact column; headings, descriptions, and lists remain readable; the page has no horizontal overflow.

- [ ] **Step 4: Check source formatting and commit**

Run: `git diff --check`

Expected: exit code 0 with no whitespace errors.

Commit:

```bash
git add tests/styles.test.js assets/css/styles.css
git commit -m "fix: balance responsive services grid"
```
