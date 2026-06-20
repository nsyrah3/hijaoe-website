# HIJAOE Project Preview Interaction Design

Date: 2026-06-20

## Goal

Make the homepage "Bidang pekerjaan" section feel more interactive and premium without changing the overall website direction that already works.

## Scope

- Change only the homepage project/work section.
- Keep the existing HIJAOE visual identity, catalog data, images, WhatsApp links, and gallery page.
- Reuse the current six featured catalog projects.
- Do not add a full automatic carousel.

## Recommended Interaction

Use a featured preview layout:

- One large active project image is shown as the main preview.
- The six featured projects are shown as compact thumbnail buttons.
- Clicking or focusing a thumbnail updates the large preview image, category, and title.
- Hover may preview a thumbnail on pointer devices, but click/focus must be the reliable interaction.
- The selected thumbnail has a clear active state.

This keeps the section controlled by the visitor, avoids distracting auto-rotation, and makes the work examples feel more like a premium catalog.

## Layout

Desktop:

- Keep the section heading text unchanged.
- Use a two-column composition:
  - Large visual preview on the left.
  - Thumbnail list/grid on the right.
- Preserve a dark section background so it still connects to the current design.

Tablet and mobile:

- Stack the large preview above the thumbnails.
- Thumbnails become a horizontal scroll row or a compact two-column grid, depending on fit.
- Text must not overlap images or buttons.

## Accessibility

- Thumbnails are real buttons.
- Each thumbnail has an accessible label that includes the project title.
- Active thumbnail uses `aria-pressed="true"` or an equivalent selected state.
- Keyboard users can tab through thumbnails and update the preview.
- Focus styles remain visible.
- Respect `prefers-reduced-motion`; transitions should be subtle and non-essential.

## Implementation Notes

- Add a focused renderer/helper for the interactive project preview instead of mixing behavior into unrelated code.
- Escape all project text and URLs using the existing renderer pattern.
- Add tests for:
  - Preview markup renders the active project and thumbnail buttons.
  - Project titles/categories are escaped.
  - Active state is represented in markup.
  - The homepage still uses the six featured catalog projects.

## Acceptance Criteria

- The homepage project section shows one large active image plus interactive thumbnails.
- Selecting a thumbnail changes the large preview content.
- The section stays responsive at mobile, tablet, and desktop widths.
- Existing gallery page behavior is unchanged.
- Existing test suite passes, with new tests covering the renderer/interaction.
