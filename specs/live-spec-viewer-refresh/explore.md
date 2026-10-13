# Exploration: Live spec viewer refresh

## Context

When MSDD or a coding agent generates or updates `explore.md`, `spec.md`, or `task.md`, an already-open local spec viewer currently shows stale content until the user manually refreshes or reselects the folder. The desired behavior is live synchronization: the open reader should reflect file changes without a browser refresh.

## Codebase Analysis

The latest code now includes the viewer boundary that was missing in the first exploration:

- `msdd serve` starts a loopback-only static server in `src/server.js` and opens the browser from `src/cli.js`.
- `src/viewer/app.js` uses the browser File System Access API as the primary path. It stores a selected directory handle in IndexedDB history, recursively reads the direct `specs/` child through `filesFromDirectory`, and renders Markdown in the browser.
- `src/viewer/tree.js` currently converts each selected file into a descriptor containing a `File` snapshot and `readText: () => value.text()`. The descriptor does not retain a `FileSystemFileHandle`, so later edits are not visible to the reader.
- The directory-upload fallback (`webkitdirectory`) also produces one-time `File` snapshots and has no durable handle. It cannot provide reliable live updates after the browser receives the file list.
- The server serves only the viewer and packaged renderer assets. It does not receive the selected project path or project contents, so a server-side `fs.watch`/SSE design would require a new project-sharing boundary and would conflict with the current browser-local privacy model.
- There is no `FileSystemObserver`, polling loop, visibility-aware refresh, update status, or refresh-specific test coverage in the viewer.

The current File System Access path can support refresh without changing the server: retain the granted directory handle, rescan its `specs/` directory, call `getFile()` for metadata and current contents, and reload only when the selected artifact changed. Browser filesystem APIs do not provide a broadly reliable cross-browser change event, so a lightweight periodic check is the portable baseline. If an observer API is used where available, polling must remain the fallback.

The refresh design must account for generated bursts. `msdd spec` can create `spec.md` and `task.md` in sequence, and `msdd build` can rewrite `task.md`; refreshing after the first event can show an intermediate state. A short debounce/coalescing window should rescan once after changes settle. The viewer should preserve the selected feature, selected artifact, route, scroll position, and outline state where possible.

## Recommendations

Recommended approach: implement live refresh in the browser viewer, only for File System Access selections.

1. Preserve `FileSystemDirectoryHandle` and `FileSystemFileHandle` references in the in-memory descriptors. Do not persist file contents; continue persisting only the directory handle/display name in IndexedDB.
2. Add a refresh controller that periodically re-enumerates the selected direct `specs/` directory while the page is visible. Compare relative paths and `lastModified`/size metadata, then update the in-memory tree and reload the active artifact only when its metadata changed. Detect added, removed, and renamed Markdown files so the sidebar stays accurate.
3. Debounce/coalesce a burst of changes before one tree/read/render pass. Refetch the active file from its handle immediately after the debounce period; do not rely on the original `File` object.
4. Preserve navigation and reader context during a refresh. Keep the current route when the artifact still exists; preserve scroll position by saving/restoring the reader scroll offset, and retain the active heading when it can be matched after rerendering.
5. Pause or reduce checks when `document.hidden` and resume with an immediate rescan on `visibilitychange`. Stop the controller when the user selects a different folder or returns to the landing page.
6. Show a concise non-blocking status such as “Updated just now” or “Waiting for folder permission.” A transient read failure should keep the last valid document and retry on the next scan; permission loss should request access again and provide a clear recovery action.
7. For directory-upload fallback, document that content is a snapshot and offer a manual “Reload folder” action. Do not claim live updates where the browser has no persistent handle.

An optional progressive enhancement is `FileSystemObserver` if it is available in the target browser, with the same rescan-and-compare code path as the polling fallback. Avoid adding an SSE/WebSocket channel unless the product requires live refresh for upload fallback or for viewers without browser filesystem handles; the current server intentionally cannot see the selected project.

Trade-offs:

- Browser polling preserves the current privacy model and works with the existing `serve` architecture, but “immediate” means bounded by the selected interval and browser scheduling.
- A native filesystem observer can reduce latency and work, but browser support is uneven and it cannot replace the fallback.
- Server-side watching or SSE may deliver faster events, but requires passing a project path to Node, a new security boundary, route scoping, and a way to reconcile the browser's granted-folder model.
- Full reload is simpler but disrupts reading position and can hide the active document when task generation changes the tree; targeted refresh has more state-management work but provides the expected reader experience.

## Open Questions

1. What freshness target is acceptable for “immediately” (for example, within 250 ms, 1 second, or 2 seconds)?
2. Should live refresh apply only to File System Access selections, with an explicit manual reload for directory-upload fallback?
3. Should the viewer refresh all Markdown artifacts under `specs/`, or only the standard `explore.md`, `spec.md`, and `task.md` files?
4. Should the active reader preserve exact scroll offset, the current heading, or both after rerendering?
5. When a selected file is deleted or renamed, should the viewer select `spec.md`, the first remaining Markdown file, or show a recovery message?
6. Is an optional `FileSystemObserver` enhancement desirable, or should the first implementation use polling only for predictable behavior?
7. Should the viewer show an explicit live/snapshot mode indicator so users understand why upload fallback cannot update automatically?

## Decisions Confirmed

- Confirmed: an open viewer must reflect generated or edited Markdown changes without a manual browser refresh.
- Confirmed: the current implementation target is the local viewer launched by `msdd serve`.
- Confirmed: the viewer must continue to keep project contents in the browser and must not expose the selected project path or contents through the static server.
- Confirmed: exploration only; no production code, `spec.md`, or `task.md` should be created in this turn.
- Constraint: preserve the existing local File System Access and directory-upload fallback behavior.
- Constraint: the package currently uses browser-side rendering and a static loopback server; a server event channel would materially expand the security and architecture scope.
- Assumption: a bounded polling interval with debouncing is acceptable unless the user chooses a stricter freshness target.
- Open: freshness interval, fallback behavior, state preservation, deletion handling, observer enhancement, and live/snapshot indication.
