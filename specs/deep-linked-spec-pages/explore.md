# Exploration: deep-linked-spec-pages

## Context

Give every specification feature and its active artifact a shareable browser-addressable viewer page so a refresh restores that document instead of the landing screen; make the workspace MSDD brand return to the landing page.

## Codebase Analysis

src/viewer/app.js owns folder loading, feature and file selection, and rendering; tree.js creates feature paths and file relative paths; history.js stores File System Access handles in IndexedDB; index.html contains the non-interactive sidebar brand; src/server.js serves only exact static module paths, so document routes would otherwise return 404. Browser permissions may be revoked after reload and directory-upload fallback cannot be restored.

## Recommendations

Use pathname-based client routes such as /specs/<feature>/<artifact> plus server-side history fallback to index.html, while keeping JavaScript module and vendor routes explicit. Make route state derive from feature.path and file.relativePath, call history.pushState on user selection, and parse the route on startup after restoring the most recently used directory handle. If permission is still granted, reopen the routed document; otherwise retain the URL and present a clear reconnect action instead of silently navigating home. Replace the sidebar MSDD mark with an accessible same-origin home link that clears route state via normal navigation. Test pure route parsing and formatting, static-server fallback, restored selection, invalid paths, permission denial, and the brand link. Hash routing avoids server fallback but produces weaker page URLs; pathname routing is recommended.

## Open Questions

Should a deep URL identify a project folder too? The browser cannot safely expose a local folder path in the URL, so use the last permitted IndexedDB handle and show a reconnect state if unavailable. Recommend /specs/<feature-slug>/<explore|spec|task>, while nonstandard filenames use their encoded relative path. Confirm that clicking the home logo should show the landing screen while retaining recent folders.

## Decisions Confirmed

The user confirmed the behavior goals: refreshing an open specification must not return to the landing page, every spec document needs its own page URL, and the MSDD logo must return to Home. The pathname router, last-permitted-folder restoration, reconnect fallback, and normal Home link are recommendations awaiting specification.
