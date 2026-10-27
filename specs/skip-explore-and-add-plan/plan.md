# Skip Explore and Add Plan — Low-Level Design

## Proposed Design

Preserve the current command names and feature directory convention. Treat `explore` as an interactive, non-persistent investigation step. Make `spec` the only artifact authoring step: collect high-level requirements and low-level design, write `spec.md` and `plan.md`, and create/reconcile `task.md` from plan tasks. `build` validates both design artifacts and advances the checklist. `review` reports issues from both artifacts.

## Components

- **CLI (`src/cli.js`)**: Keep `explore`, `spec`, `review`, and `build`. Remove the explore.md prerequisite from spec. The explore flow may retain its current prompts, but must not write an artifact. Spec gathers separate spec and plan answers and invokes a core writer that writes both documents. Review/build load the appropriate documents and report artifact-specific failures.
- **Artifact model (`src/core.js`)**: Split the combined `SECTIONS`/`SECTION_FORMATS` model into high-level spec sections and low-level plan sections. Add render/parse/validate/review helpers for plan.md. Add a paired writer that safely creates spec.md and plan.md. Derive tasks from the plan's ordered implementation steps and verification steps. Reconcile against existing task.md using the current stable-task-text behavior so unchanged task IDs and checked state survive.
- **Viewer (`src/viewer/app.js`, `src/viewer/tree.js`)**: Special order and labels become `spec.md` → Spec, `plan.md` → Plan, `task.md` → Tasks. Prefer spec.md as the initial document. Keep generic Markdown discovery/rendering so existing explore.md and other files remain accessible without an Explore-specific tab.
- **Agent adapters (`skills/codex-sdd/`, `skills/claude-sdd/`)**: Update exploration instructions to say the command records no file. Update spec instructions to author both spec.md and plan.md with their distinct responsibilities. Update build instructions to use plan.md as the task source while consulting spec.md acceptance criteria. Preserve existing slash/skill command names.
- **Documentation (`README.md`, `shared-workflow.md`)**: Describe explore → spec + plan + tasks → build; list the three standard artifacts and define their roles.
- **Tests (`test/`)**: Replace expectations that explore creates explore.md or spec requires it. Cover paired artifact writing, plan validation/task derivation, viewer sorting and labels, legacy folders, and adapter/docs installation content.

## Interfaces and Data Flow

```text
explore command
  └─ interactive investigation; no persistent artifact

spec command
  ├─ high-level answers ──> spec.md
  ├─ low-level design ────> plan.md
  └─ ordered plan steps ──> task.md

build command
  ├─ validate spec.md and plan.md
  ├─ reconcile task.md against plan.md
  └─ present next unchecked task; agent uses spec acceptance criteria to verify

review command
  └─ review spec.md and plan.md; report findings by artifact/section

viewer
  └─ discover Markdown; special order: spec.md, plan.md, task.md
```

## Data Model / API Changes

No external API or serialized machine format. Add a plan Markdown schema and internal section definitions. Keep task lines in the existing `- [ ] Tn: ...` format unless implementation finds a compatibility reason to revise it.

## Task Derivation and Reconciliation

The plan contains a structured, ordered Implementation Steps section and a Verification Steps section. Derive one task per independently checkable step, preserving order and avoiding prose-only extraction where possible. Existing reconciliation semantics remain: preserve ID and checked state when normalized task text is unchanged; changed/new task text is unchecked; obsolete tasks are removed from the active task list. Ensure acceptance criteria in spec.md are referenced by verification steps or otherwise checked before completion.

## Legacy Compatibility

- Viewer remains permissive and displays any Markdown files, including existing explore.md files.
- For existing folders with spec.md/task.md but no plan.md, review/build should retain the current spec-derived task behavior as a legacy path. Do not silently generate or overwrite a plan.md for existing work.
- New spec invocations create the new paired format. If either spec.md or plan.md already exists, refuse to overwrite unless an existing explicit force/overwrite convention is established; preserve current refusal to overwrite spec.md.

## Failure Handling

- Missing spec.md or plan.md in a new-format build/review reports the exact missing file and a command to create or repair the feature artifacts.
- Invalid section structure or unresolved required content reports artifact and section.
- A write failure creating either paired document must not leave a misleading half-created new feature; stage contents before writing or clean up only newly created files on failure.
- Existing user artifacts are never deleted during migration or failure recovery.

## Technical Decisions and Trade-offs

- **One `spec` invocation creates both design documents**: preserves the command interface and keeps the artifacts aligned; the interview needs clear high-level/low-level separation.
- **Tasks derive from plan**: implementation work stays traceable to low-level design; verification tasks must cover spec acceptance criteria.
- **Legacy CLI support**: avoids breaking in-flight work, at the cost of maintaining a legacy branch in build/review. Viewer support is naturally backward-compatible because it already reads arbitrary Markdown.
- **No explore.md output**: removes an artifact from the workflow while preserving the user's explicit exploration command.

## Verification Strategy

Add focused tests for non-persistent explore, paired spec/plan generation and overwrite safety, separate validation/review, plan-derived tasks and checked-state reconciliation, build/review legacy behavior, viewer labels/order/defaults, and updated installed skills/docs. Run `npm test` and `npm run package:check` during implementation.
