# Spec viewer critique

## Design Health Score

| Heuristic | Score | Key issue |
| --- | ---: | --- |
| Visibility of system status | 2/4 | Active document is visible, but loading, permission, and reader state are not. |
| Match to the real world | 3/4 | Folder tree and document reader are familiar. |
| User control and freedom | 1/4 | There is no visible way to return to the landing or choose another folder. |
| Consistency and standards | 2/4 | Tree controls and document typography use different visual vocabularies. |
| Error prevention | 2/4 | Direct `specs/` validation exists, but the UI does not prepare users for permission outcomes. |
| Recognition over recall | 3/4 | Tree labels and recent folders support recognition. |
| Flexibility and efficiency | 1/4 | No keyboard navigation, folder switcher, or reader controls are visible. |
| Aesthetic and minimalist design | 2/4 | The shell is calm, but the reading surface resembles raw rendered Markdown more than the visual reference. |
| Error recovery | 2/4 | Inline error copy exists but is visually disconnected from the relevant action. |
| Help and documentation | 1/4 | No contextual explanation exists after the initial selection flow. |
| **Total** | **21/40** | **Acceptable, but significant reader UX work remains.** |

## Strengths

- The parchment, paper, and hairline-border palette follows the intended restrained visual system.
- The sidebar tree makes feature documents directly discoverable.
- The selected file uses a visible neutral-pill state without decorative color.

## Priority issues

1. **P1: Raw-document feeling.** The reader lacks a breadcrumb, document metadata, measured prose rhythm, and a distinct reading frame. Reduce visual competition from large section headings and make the document context explicit.
2. **P1: No escape or folder switcher.** Once a folder is open, the user cannot visibly return home, choose another folder, or access recent folders. Add a labeled “Change folder” control and a compact project identity in the sidebar header.
3. **P2: Tree hierarchy is weak.** Browser-native disclosure triangles and uneven nesting make sibling feature groups hard to scan. Use intentional folder/file rows, consistent indentation, and a stronger active-item treatment.
4. **P2: Typography is under-resolved.** Body text, lists, code pills, and headings lack a clear reading cadence. Constrain prose to 65–75ch, reduce heading scale contrast, and introduce purposeful vertical rhythm.

## Persona red flags

- **Alex, power user:** No keyboard path to change folders or move through documents; repeat visits require an unclear escape path.
- **Jordan, first-timer:** After a folder opens, there is no clear cue for how to select a different project.
- **Sam, keyboard/screen-reader user:** No confirmed focus treatment or semantic state announcement for document loading and folder-permission changes.
