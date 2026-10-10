# Exploration: Full Viewport App Shell

## Context

Change the local MSDD spec viewer so its application shell occupies the full browser viewport. Replace the centered outer paper card with a full-width, full-height shell. Keep the existing parchment color only as a subtle page-level surface, not as large gutters around the application.

## Codebase Analysis

The current layout lives in src/viewer/styles.css. .app adds 24px padding, .landing and .workspace subtract 48px from the viewport, and .workspace is limited to 1200px with auto margins, a border, rounded corners, and overflow hidden. The responsive breakpoint already removes app padding and card rounding on narrow screens. The viewer must keep the existing sidebar/reader grid, palette tokens, semantic shell, responsive behavior, and no-shadow visual constraint from DESIGN.md.

## Recommendations

Make the desktop shell follow the existing small-screen model: .app has viewport dimensions and no external padding; .workspace has width: 100%, min-height: 100vh, no max-width, auto margin, outer border, or rounded-card treatment. Use the paper surface inside the application and retain parchment only as the body/page fallback or a subtle edge surface. Update landing sizing to use the viewport directly. Preserve the internal sidebar divider and reader content measure. Add CSS-focused checks or an appropriate UI assertion for the desktop shell and retain responsive validation.

## Open Questions

No material ambiguity remains. Full viewport applies to both landing and workspace states. The request does not change reader content width, sidebar width, controls, typography, selection, or Markdown behavior.

## Decisions Confirmed

The app uses the entire viewport at desktop and mobile sizes. It must not render as a centered, max-width paper card. Parchment remains part of the palette only as a subtle page surface and must not create large surrounding gutters. The existing paper application interior and sidebar/reader layout remain in scope.
