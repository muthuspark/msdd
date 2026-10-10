# Exploration: Add reader header and in-document navigation

## Context

Add a compact, sticky reader context header for the active Markdown document and heading-derived in-document navigation for long specifications. The goal is to make orientation and jumping within a long local spec fast while preserving the existing tree sidebar, local/offline viewer, and independent scroll regions.

## Codebase Analysis

The static viewer is src/viewer/index.html, app.js, and styles.css. The workspace has a 260px tree sidebar and #reader as its own overflow-y:auto scrollport inside a 100dvh shell; at max-width:700px it stacks the sidebar and reader. selectFile currently reads each local file, sanitizes marked output, replaces #reader innerHTML, and renders Mermaid blocks. File objects expose relativePath and readText, so title/path are available at selection time. There is no state model, router, browser framework, or existing heading-anchor/TOC utility. Existing viewer tests are source-level node:test CSS assertions; any behavior test will need either extracted pure helpers or a minimal DOM harness. Mermaid rendering is asynchronous, so navigation should be generated from rendered Markdown headings before/alongside the Mermaid replacement without depending on diagram completion.

## Recommendations

Use a semantic reader shell inside the existing reader scrollport: a sticky header containing the selected filename as title, relativePath as secondary context, and an outline toggle. Keep the scrollport on #reader so the header sticks relative to the reading pane, while a nested document content container holds sanitized Markdown. After marked parses Markdown, identify h1-h6 in DOM order, assign deterministic unique IDs without overwriting safe existing IDs, and build TOC controls from their text and levels. Use hash-free in-pane scrolling with focus management and reduced-motion-aware behavior. Prefer a desktop reader-header outline popover initially over a persistent third column, avoiding a new desktop grid and content-measure squeeze. On small screens use the same toggle control as an anchored popover/drawer with Escape and outside/close behavior. Do not show an outline control when no navigable headings exist. Treat reading-progress as optional and defer it unless it can be added without competing with required navigation; header/path and TOC are the core scope. Trade-off: a persistent desktop right rail offers more scanning but substantially changes layout and requires responsive rails; a shared header control is more compact and reuses one interaction model.

## Open Questions

Confirm whether the desktop outline should be a header popover (recommended) or persistent collapsible right rail. Confirm whether the selected title should use the document first H1 when present or always the filename; recommend filename title plus path so it remains stable and truthful. Decide if progress is wanted in the initial build; recommend excluding it from the first scope. Define heading policy: include h2-h4 by default with h1 as context, or include all h1-h6; recommend all valid headings with visual nesting and optional omission of empty headings. Clarify whether deep-linkable URL fragments are required; recommend not adding URL/history mutation in the initial version because documents are local session data.

## Decisions Confirmed

The user confirmed the need for a sticky compact header showing selected document title and relative path, plus generated in-document navigation that is collapsible on desktop and compact on mobile. No choice has been confirmed between desktop right rail and header control, and reading progress remains explicitly optional.
