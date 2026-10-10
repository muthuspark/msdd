# Add reader header and in-document navigation

## Summary

<!-- Format: State the outcome, scope, and measurable reason for doing this. -->

Add a compact sticky reader header and heading-based outline to the local Spec Viewer. It gives readers the active filename and relative path, plus reliable in-pane navigation for long Markdown specs without changing local-only operation or the existing sidebar.

## Problem

<!-- Format: Describe the current behavior, observed failure/opportunity, affected users, and evidence. -->

The reader currently replaces its document contents with rendered Markdown and gives no persistent indication of which file is open or a way to jump to a section. Developers reading long specs must retain context from the sidebar and scroll manually, even though the reader already has an independent scrollport.

## Goals and Non-Goals

<!-- Format: Use `### Goals` and `### Non-goals` headings, each followed by a Markdown bullet list. Keep each item testable or explicitly bounded. -->

### Goals

- Show the active filename and relative path in a header that remains visible while the reader scrolls.
- Generate an accessible outline from every non-empty H1-H6 heading and scroll the reader to a selected heading.
- Use one collapsible header control: a compact popover on desktop and a compact mobile drawer/popover.
- Preserve sanitized local Markdown rendering, Mermaid rendering, the sidebar, and independent scrollports.

### Non-goals

- Add reading progress, URL fragments/history, a persistent third-column rail, remote content, or new dependencies.

## Users and Scenarios

<!-- Format: Use `### Actors` followed by a Markdown bullet list, then `### Scenarios` followed by a Markdown numbered list. Include the expected result for each scenario. -->

### Actors

- Developers reading local MSDD specification files in the browser viewer.

### Scenarios

1. A developer opens a file; the reader header shows its filename and relative path and remains visible while the document scrolls.
2. A developer opens the outline; nested heading labels identify available sections and selecting one moves focus and the reader to that section.
3. A developer uses a narrow screen; the same control exposes the outline without reducing the document to a permanent rail.
4. A file has no non-empty headings; the reader stays usable and does not offer an empty outline.

## Requirements

<!-- Format: Use stable IDs such as REQ-001. For each requirement state the behavior, inputs/outputs, and priority. -->

- REQ-001 (high): On each successful file selection, render a reader header from file.relativePath; output filename as title and full relative path as secondary text.
- REQ-002 (high): Keep the header sticky within #reader without restoring document-level scrolling or changing sidebar behavior.
- REQ-003 (high): From sanitized rendered content, collect non-empty H1-H6 in document order, create deterministic collision-free heading IDs, and expose their text and level in an outline.
- REQ-004 (high): The outline toggle shall be keyboard operable, identify its expanded state and controlled content, close with Escape, and move reader focus and scroll to the selected heading with motion respecting user preferences.
- REQ-005 (medium): Use responsive CSS to make the same outline UI compact on narrow screens; hide or disable it when no headings exist.
- REQ-006 (high): Preserve render failure recovery, sanitized Markdown, Mermaid behavior, local-only operation, and no new runtime dependency.
- REQ-007 (medium): Update the package version before release verification and commit all scoped changes in one final commit.

## User/System Flows

<!-- Format: Use numbered steps. Name the actor, system action, state change, and failure branch at each relevant step. -->

1. Developer selects a Markdown leaf; the system marks the tree item current and reads its local text.
2. System parses and sanitizes Markdown, creates the reader header and document container, then inserts the safe rendered content.
3. System collects valid headings, assigns IDs, and renders the outline; if none exist, it hides the outline control.
4. Developer opens the control; the system sets its expanded state and presents the responsive outline.
5. Developer chooses an entry; the system closes the control, scrolls the #reader scrollport to the target, and focuses the heading.
6. Mermaid rendering completes or displays its existing per-block fallback; if file rendering fails, the system replaces reader content with the existing recoverable error.

## Technical Design

<!-- Format: Describe components, interfaces, data, dependencies, compatibility, security, and operational concerns. -->

### Solution Description

Extend the client-only selection render path. It will build a stable reader shell, then derive navigable heading metadata from the sanitized document DOM. The sticky header owns the single outline control; its chosen item controls the existing #reader scrollport.

### Current State

#reader is both the content root and independent vertical scrollport. selectFile injects sanitized marked output directly and then replaces Mermaid code blocks asynchronously.

### Proposed Design

Keep #reader as the scroll container. Add header, outline panel, and document-content elements per successful selection. Build IDs and outline after safe HTML insertion, before Mermaid replacement. Recreate all reader-owned elements on every selection. Preserve a unique safe pre-existing heading ID; otherwise derive a collision-free ID from the displayed heading label.

### Architecture / Components

- index.html supplies stable reader landmarks and initial empty content.
- app.js adds pure heading and slug metadata helpers, reader-shell rendering, disclosure and focus handlers, and selection orchestration.
- server.js adds the viewer route for the new browser module.
- styles.css provides sticky-header, outline, heading nesting, desktop popover, and mobile compact styles.

```mermaid
sequenceDiagram
  participant D as Developer
  participant A as Viewer app
  participant R as Reader scrollport
  D->>A: Select local Markdown file
  A->>A: Sanitize and render Markdown
  A->>A: Extract headings and create outline
  A->>R: Render sticky header and document
  D->>A: Select outline entry
  A->>R: Focus and scroll to heading
```

### Data Model / API Changes

None. Ephemeral heading objects contain id, text, and level. No URL, persistence, server route, or dependency changes.

### Technical Decisions

Use filename plus relative path, all non-empty H1-H6 headings, deterministic unique IDs, and no URL fragments. Use native buttons and ARIA with Escape close and focus restoration. Respect reduced motion.

### Trade-offs

A header popover keeps the reader measure and avoids another grid column but exposes less outline content than a persistent rail. Fresh DOM per selection keeps state simple but does not retain open outline state across files.

### Failure Handling

If Markdown parsing or file reading fails, retain the existing reader error. If no headings survive, omit the outline. Preserve existing Mermaid block fallback independently of outline creation.

### Testing Strategy

Unit-test heading metadata and unique IDs where extracted. Add source or DOM assertions for semantic header, ARIA control, sticky and responsive CSS, and run node tests plus package check.

## Decisions and Constraints

<!-- Format: Use `### Confirmed Decisions`, `### Assumptions`, `### Constraints`, and `### Open Questions` headings, each followed by Markdown bullets. Do not hide unresolved choices. -->

### Confirmed Decisions

- Use a header-controlled outline popover or drawer, filename title plus relative path, all non-empty H1-H6 headings, no progress, and no URL fragments.
- Update version and commit all changes as the final closing phase.

### Assumptions

- DOM APIs needed for focus, scroll, and media query behavior are available in supported browsers.

### Constraints

- Keep static localhost serving, offline bundled dependencies, sanitized Markdown, existing Mermaid behavior, 100dvh shell, and independent panes.
- Do not add dependencies or a persistent right rail.

### Open Questions

- None for this specification.

## Edge Cases and Failure Handling

<!-- Format: Use a case/action table or bullets with trigger, expected behavior, recovery, and user-visible error. -->

- File has no headings or only whitespace headings: Render header and content; hide the outline control.
- Duplicate, punctuation-only, or repeated heading labels: Generate unique stable IDs and usable outline labels without throwing.
- Outline is open when another file is selected: Replace the reader shell and start closed for the new file.
- Escape is pressed: Close the outline and restore focus to its toggle.
- Heading selection cannot receive focus normally: Assign temporary programmatic focusability, focus it, and retain readable scroll position.
- File, parse, sanitize, or Mermaid failure: Preserve the existing reader or diagram-specific fallback; do not leave stale header or outline data.
- Narrow viewport or reduced motion: Keep controls operable in the compact layout and avoid forced smooth motion.

## Acceptance Criteria

<!-- Format: Use stable IDs such as AC-001. Make each criterion observable and state how it will be verified. -->

- AC-001: Selecting any Markdown file shows its basename and relative path in a sticky reader header; verify with DOM behavior and CSS tests.
- AC-002: A document with multiple headings produces an ordered, level-indented outline; every entry targets one unique heading ID; verify with helper or DOM tests.
- AC-003: Keyboard users can open the outline, select an item, reach the target, and close it with Escape; verify with focused interaction tests or documented manual check.
- AC-004: The outline is compact at the mobile breakpoint and does not create a desktop permanent rail; verify stylesheet assertions and responsive manual check.
- AC-005: A heading-free document, duplicate heading text, render failure, and Mermaid failure preserve usable reader fallback behavior; verify automated cases where practical.
- AC-006: npm test and npm run package:check pass after the version update; the final git commit includes all intended scoped changes and no unrelated files.

## Explanation and Output Artifacts

<!-- Format: Use a Markdown bullet list with separate `Audience:`, `Writing profile:`, `Primary artifact:`, `Supporting artifacts:`, and `Accessibility:` fields. Prefer an 80% ASD-STE100 controlled-language style for explanatory prose unless strict ASD-STE100 or plain language is required. Choose the clearest medium: prose, diagram, interactive HTML, or narrated explainer video. State the topic, purpose, interaction or narration needs, delivery location, and acceptance evidence for each requested artifact. -->

- Audience: Maintainers and developers who run the local MSDD Spec Viewer.
- Writing profile: 80% ASD-STE100 controlled-language style.
- Primary artifact: The implemented reader header and interactive outline in src/viewer; it explains itself through visible filename, path, and section labels. Acceptance evidence is the passing suite and manual reader check.
- Supporting artifacts: This specification and automated tests document the layout, interaction, and release evidence. No separate prose guide, diagram artifact, or video is required.
- Accessibility: Use semantic landmarks, visible text labels, keyboard-operated controls, ARIA expanded and controls linkage, Escape close, focus movement, and reduced-motion-respecting scroll behavior.

## Implementation Plan

<!-- Format: Use ordered, independently verifiable tasks. Include dependencies and the files or boundaries affected. -->

1. Create and test isolated heading metadata and ID helpers in src/viewer/app.js or a focused viewer module; cover empty, duplicate, and punctuation-only text before wiring DOM behavior.
2. Update src/viewer/index.html, src/viewer/app.js, and src/server.js to render and serve the semantic reader header, document container, heading outline, disclosure interactions, focus and scroll behavior, and retained failure paths; depends on task 1.
3. Update src/viewer/styles.css for sticky header, compact outline, heading nesting, mobile presentation, and reduced-motion behavior while preserving existing scrollports; depends on task 2.
4. Add or extend viewer tests for helper output, semantic and ARIA markup, sticky and responsive CSS, and error and heading-free behavior; depends on tasks 1-3.
5. Run npm test, npm run package:check, and responsive or manual reader checks; resolve feature defects; depends on task 4.
6. As the final closing phase, update package.json and package-lock.json version as required, rerun release checks, inspect git status and diff, and create one git commit containing all and only the scoped feature, spec, test, and version changes; depends on task 5.

## Verification and Implementation Notes

<!-- Format: List commands/tests, expected evidence, rollout checks, and a place to record deviations. -->

Evidence: Run `npm test`, `npm run package:check`, responsive reader checks, `git diff --check`, and scoped status/staged-diff inspection during the implementation-plan verification task. The final closing task updates the version, reruns release checks, records deviations, and creates the one scoped commit only after all other work is complete.

Evidence: `node --test test/headings.test.js` passed 2 tests after adding the dependency-free `src/viewer/headings.js` helpers. The helpers normalize labels to readable slugs, use `section` for punctuation-only headings, omit whitespace-only headings, and suffix repeated IDs deterministically.

Evidence: `node --check src/viewer/app.js && node --test test/headings.test.js test/tree.test.js` passed. The render path now creates a fresh reader header and document container for each selected file, constructs the outline from sanitized headings before Mermaid replacement, preserves unique valid IDs, closes on Escape or outside pointer interaction, and uses reader-relative focus and scrolling.

Evidence: `node --test test/viewer-style.test.js && node --check src/viewer/app.js` passed. The header is sticky against the reader scrollport, heading targets have header-aware scroll margins, the outline is an anchored compact panel, and the 700px rule converts its presentation for narrow screens without changing the independent pane geometry.

Evidence: The static server uses an explicit route allowlist, so `src/server.js` and the package manifest check now include `headings.js`. `node --test test/server.test.js test/headings.test.js && node --check src/viewer/app.js` passed 6 tests and confirms the browser can request the new module.

Evidence: `node --test test/headings.test.js test/server.test.js test/viewer-reader.test.js test/viewer-style.test.js` passed 12 tests. The coverage verifies heading output, served module access, the labelled reader landmark, ARIA disclosure hooks, Escape and focus behavior, heading-free conditional rendering, both failure paths, sticky context, responsive compact layout, and reduced-motion CSS.

Evidence: `npm test` passed 29 tests, `npm run package:check` produced a valid 0.4.2 package with 21 files, and `git diff --check` passed. A local server returned the reader landmark, `app.js`, and `headings.js` successfully. Browser-based folder selection could not be exercised because no computer-use browser was available in this environment; responsive and interaction contracts are covered by the focused automated tests above.

Evidence: Version updated from 0.4.2 to 0.4.3 in package.json and package-lock.json. Final `npm test` passed 29 tests, `npm run package:check` validated the 0.4.3 package with 21 files, `git diff --check` passed, and `msdd review` passed. The final scoped diff and status were inspected before committing.
