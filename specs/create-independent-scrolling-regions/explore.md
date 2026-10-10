# Exploration: Create independent scrolling regions

## Context

Change the Local MSDD Spec Viewer so the active workspace is locked to the dynamic viewport height (100dvh). The sidebar navigation and document reader must be separate scroll containers so a developer can keep the specification navigation visible while reading a long document.

## Codebase Analysis

The target is the CSS-only viewer shell in src/viewer/styles.css. The existing .workspace is a two-column grid with width:100%, min-height:100vh, and overflow:hidden. Its aside and #reader grid items have no explicit height or overflow, so document height expands the workspace and the browser page scrolls. The existing 700px breakpoint changes the workspace to one column and places the sidebar above the reader. index.html already provides semantic <aside>, <nav>, and <article> elements; app.js only loads content and needs no changes. The existing viewer stylesheet test checks only [hidden] behavior, so a focused CSS assertion or browser check is needed. The completed full-viewport-shell feature established that the workspace must remain edge-to-edge, preserve the 260px rail, reader 74ch measure, paper surfaces, divider, and responsive breakpoint.

## Recommendations

Set the active application/workspace shell to a definite 100dvh height rather than a minimum height, while keeping its overflow clipped. Give both desktop grid items min-height:0 and overflow-y:auto; use overflow-x:hidden or equivalent only where it does not break wide Markdown tables and code blocks, which already manage horizontal overflow. This makes the sidebar and reader independently scroll vertically, preserves the navigation rail while the reader scrolls, and lets each pane shrink within a CSS grid. Keep the landing state outside this change unless a shared shell rule requires it. At the 700px breakpoint, define explicit bounded grid rows if independent sidebar scrolling is also required on narrow screens; otherwise, a naturally sized top sidebar would not have a bounded scrollport. CSS-only changes preserve rendering, selection, and storage behavior, but use 100dvh instead of 100vh so mobile browser chrome changes do not leave a stale viewport height.

## Open Questions

None. The responsive behavior is confirmed: at the existing 700px breakpoint, the stacked sidebar and reader must remain independently scrollable inside the 100dvh workspace. The implementation must define bounded grid rows so each pane has a scrollport.

## Decisions Confirmed

Confirmed: lock the active application shell to 100dvh; make the sidebar independently scrollable; make the document reader independently scrollable; keep navigation visible while reading long specifications. Confirmed responsive behavior: at 700px and below, both stacked panes remain independently scrollable inside the 100dvh workspace, using bounded grid rows. Confirmed by existing scope: retain the full-width shell, 260px desktop sidebar rail, sidebar divider, constrained reader content width, semantic markup, and Markdown behavior. No dependency, API, data-model, or JavaScript changes are indicated.
