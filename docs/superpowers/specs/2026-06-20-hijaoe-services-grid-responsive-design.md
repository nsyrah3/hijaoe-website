# HIJAOE Responsive Services Grid Design

## Goal

Arrange the six service categories as a balanced grid at every supported viewport. The desktop layout must not leave the sixth category alone on a new row, while smaller layouts must remain readable without horizontal scrolling.

## Layout

- Desktop uses three equal columns and two rows.
- Tablet uses two equal columns and three rows.
- Mobile uses one column and six compact rows.
- The existing category order, numbering, icons, descriptions, and bullet lists remain unchanged.
- Cards in the same row stretch to a consistent height through the CSS grid.

## Responsive Rules

- The default services grid uses three columns.
- At the existing tablet breakpoint, the grid changes to two columns.
- At the existing mobile breakpoint, the grid changes to one column.
- Mobile card padding and heading spacing are reduced so the section does not feel oversized.
- No card content is hidden or collapsed.

## Borders

- The grid keeps one outer top border.
- Each card receives a right and bottom divider as needed for its breakpoint.
- Left borders begin each row so the grid reads as one continuous table.
- Breakpoint-specific selectors account for all six cards, including the newly added sixth category.

## Scope

This change is limited to the services section CSS. It does not alter service data, text, catalog behavior, project previews, or WhatsApp actions.

## Verification

- Automated style tests assert the desktop three-column rule and responsive two-column and one-column rules.
- Existing site tests remain green.
- Browser checks cover desktop, tablet, and mobile widths.
- Visual checks confirm that all six cards are visible, no card is orphaned, borders are coherent, and there is no horizontal overflow.
