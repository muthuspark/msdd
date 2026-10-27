# Skip Explore and Add Plan

## Summary

<!-- Format: State the outcome, scope, and measurable reason for doing this. -->

Replace the current explore.md → spec.md → task.md artifact flow with an exploration command that creates no file and a spec command that creates spec.md, plan.md, and task.md. Spec is the high-level design; Plan is the low-level design; Tasks are small, checkable agent steps.

## Problem

<!-- Format: Describe the current behavior, observed failure/opportunity, affected users, and evidence. -->

The current workflow persists exploratory notes in explore.md and combines high-level requirements with low-level technical design and implementation steps in spec.md. This blurs the purpose of each artifact, couples task generation to spec sections, and makes the viewer and agent instructions reflect an outdated three-document model.

## Goals and Non-Goals

<!-- Format: Use `### Goals` and `### Non-goals` headings, each followed by a Markdown bullet list. Keep each item testable or explicitly bounded. -->

### Goals
- Keep the existing explore, spec, review, and build command names.
- Make explore available for investigation without creating explore.md.
- Make spec create spec.md and plan.md, and continue to produce task.md.
- Define spec.md as the high-level design: intent, behavior, edge cases, constraints, and acceptance criteria.
- Define plan.md as the low-level design: components, interfaces, data flow, and affected files.
- Derive small, checkable tasks from plan.md and make the viewer present the new artifact set.

### Non-goals
- Add new workflow command names or require a separate plan command.
- Change the user's feature slug or specs/<feature>/ storage convention.
- Remove viewer support for arbitrary Markdown artifacts.

## Users and Scenarios

<!-- Format: Use `### Actors` followed by a Markdown bullet list, then `### Scenarios` followed by a Markdown numbered list. Include the expected result for each scenario. -->

### Actors
- A developer defining a feature.
- A coding agent implementing a feature.
- A maintainer reviewing feature artifacts.

### Scenarios
1. A developer runs explore to investigate a feature; the command supports exploration without writing explore.md.
2. A developer runs spec for a feature; the workflow creates spec.md, plan.md, and task.md.
3. A maintainer opens the feature in the viewer and can navigate Spec, Plan, and Tasks.
4. An agent runs build and receives the next unchecked task derived from the plan, with acceptance criteria available for verification.
5. A maintainer reviews a feature and gets meaningful findings for both high-level spec quality and low-level plan quality.

## Requirements

<!-- Format: Use stable IDs such as REQ-001. For each requirement state the behavior, inputs/outputs, and priority. -->

- REQ-001: The existing explore command remains available and does not create or update explore.md.
- REQ-002: The existing spec command does not require explore.md and creates spec.md and plan.md in the feature directory.
- REQ-003: The spec workflow also creates or refreshes task.md from plan.md.
- REQ-004: spec.md captures feature intent, goals, behavior/scenarios, edge cases, constraints, and observable acceptance criteria without requiring low-level file-by-file design.
- REQ-005: plan.md captures implementation components, interfaces, data flow, technical decisions, failure handling, verification approach, and affected files.
- REQ-006: build validates the spec and plan, reconciles tasks against the plan, preserves checked state for unchanged task statements, and presents one next task at a time.
- REQ-007: review reports completeness and structure issues for the high-level spec and low-level plan.
- REQ-008: The viewer labels, orders, and navigates spec.md, plan.md, and task.md as Spec, Plan, and Tasks; it no longer gives explore.md a special Explore tab.
- REQ-009: Agent skills, Claude commands, README, and shared workflow documentation describe the updated artifact responsibilities while retaining existing command names.
- REQ-010: Existing feature directories remain readable in the viewer. Existing feature folders without plan.md remain usable by review/build through the current spec-derived behavior, without creating or overwriting plan.md.

## User/System Flows

<!-- Format: Use numbered steps. Name the actor, system action, state change, and failure branch at each relevant step. -->

1. Developer invokes explore with a feature name; CLI runs the established exploration interaction; CLI does not write an explore.md artifact.
2. Developer invokes spec with a feature name; CLI conducts the existing specification interview, separates high-level content from low-level design, writes spec.md and plan.md, then derives task.md from plan.md.
3. Build reads and validates spec.md and plan.md; it reconciles task.md while preserving completion for unchanged task statements; it reports the next unchecked task or completion.
4. Review reads spec.md and plan.md; it reports actionable findings with artifact and section context.
5. Viewer loads Markdown files; it assigns the special labels and order Spec, Plan, Tasks to the corresponding files and keeps other Markdown files accessible.

## Technical Design

<!-- Format: Describe the high-level shape of the solution. Low-level components, interfaces, data flow, and file changes belong in plan.md. -->

- Solution Description: Keep the familiar command flow while separating the feature's high-level design from its implementation design. Exploration remains available without producing a saved exploration document. A single spec invocation creates a high-level spec, a low-level plan, and an agent task list.
- Proposed Design: The spec describes user needs and observable behavior. The plan turns that design into implementation choices. Tasks make the plan executable in small steps.
- Current State: The workflow currently saves explore.md and combines requirements, technical design, and implementation steps in spec.md.
- Technical Decisions: Keep the explore, spec, review, and build command names. Treat spec.md and plan.md as separate documents with distinct responsibilities. Keep task.md as the execution checklist.
- Trade-offs: Creating both designs in one spec invocation keeps the workflow direct, while clear separation is needed to prevent duplicated or conflicting content.
- Failure Handling: Explain missing or incomplete required artifacts with their names and a clear recovery action. Preserve existing feature documents when a new artifact cannot be created.
- Testing Strategy: Verify the observable behaviors and acceptance criteria listed in this spec. The low-level verification approach and affected implementation areas are defined in plan.md.

## Decisions and Constraints

<!-- Format: Use `### Confirmed Decisions`, `### Assumptions`, `### Constraints`, and `### Open Questions` headings, each followed by Markdown bullets. Do not hide unresolved choices. -->

### Confirmed Decisions
- Keep the existing explore, spec, review, and build command names.
- Explore remains a command and no explore.md file is created.
- Invoking spec creates spec.md and plan.md.
- Spec is high-level design; Plan is low-level design; Tasks are checkable implementation steps.
- Integrate the new artifacts in the viewer.

### Assumptions
- task.md remains the persistent execution checklist.
- The spec command can collect both high-level and low-level design answers in the same invocation.
- Existing arbitrary Markdown files remain viewable.
- Existing feature folders without plan.md continue through the current spec-derived review/build behavior.

### Constraints
- Preserve the existing feature directory convention and command names.
- Do not make explore.md a prerequisite for spec, review, or build.
- Avoid losing checked task progress when an unchanged task remains in the plan.
- Do not create or overwrite plan.md while operating on a legacy feature folder.

### Open Questions
- None. Legacy behavior is confirmed below.

## Edge Cases and Failure Handling

<!-- Format: Use a case/action table or bullets with trigger, expected behavior, recovery, and user-visible error. -->

- Existing explore.md is present: viewer treats it as a generic Markdown artifact; workflow does not create or specially label it.
- Existing spec.md/task.md exists but plan.md is missing: review/build use the current spec-derived behavior; do not create or overwrite plan.md during legacy use.
- Existing task statements are unchanged after plan edits: preserve their checked state and IDs.
- A plan task changes or disappears: changed tasks become unchecked; removed tasks are reconciled according to the existing task reconciliation contract.
- Spec or plan is missing/invalid during build: report the specific artifact and corrective action.
- Viewer feature contains only one or two of the three standard artifacts: show available files without failing or inventing missing tabs.

## Acceptance Criteria

<!-- Format: Use stable IDs such as AC-001. Make each criterion observable and state how it will be verified. -->

- AC-001: Running explore leaves no explore.md file and does not modify an existing explore.md.
- AC-002: Running spec without explore.md creates spec.md and plan.md, plus task.md.
- AC-003: Generated spec content expresses high-level intent and expected behavior, including edge cases, constraints, and acceptance criteria, without making implementation file changes mandatory there.
- AC-004: Generated plan content identifies components, interfaces, data flow, and affected files.
- AC-005: Generated tasks are small, independently checkable, and derived from plan.md.
- AC-006: Build validates both sources, reconciles task changes, preserves unchanged checked tasks, and emits the next unchecked task.
- AC-007: Review can identify unresolved or malformed spec and plan sections with actionable artifact-specific findings.
- AC-008: Viewer presents Spec, Plan, and Tasks in that order with correct labels, selects spec.md by default when present, and still renders legacy and arbitrary Markdown files.
- AC-009: Installed Codex and Claude workflow instructions, README, and shared-workflow.md describe the same commands and artifact responsibilities.
- AC-010: Existing feature folders without plan.md remain usable through the current spec-derived review/build behavior and are not silently modified.

## Explanation and Output Artifacts

<!-- Format: Use a Markdown bullet list with separate `Audience:`, `Writing profile:`, `Primary artifact:`, `Supporting artifacts:`, and `Accessibility:` fields. Prefer an 80% ASD-STE100 controlled-language style for explanatory prose unless strict ASD-STE100 or plain language is required. Choose the clearest medium: prose, diagram, interactive HTML, or narrated explainer video. State the topic, purpose, interaction or narration needs, delivery location, and acceptance evidence for each requested artifact. -->

- Audience: Developers, maintainers, and coding agents using MSDD.
- Writing profile: Concise, direct technical Markdown.
- Primary artifact: A clear spec.md that communicates high-level design.
- Supporting artifacts: plan.md for low-level design and task.md for checkable agent work.
- Accessibility: Use descriptive headings, readable lists, and clear viewer tab labels.

## Implementation Plan

<!-- Format: Transitional execution checklist. The new workflow will move this detail into plan.md. -->

1. Implement separate high-level spec and low-level plan models, renderers, parsers, and validators in src/core.js.
2. Implement paired spec.md and plan.md creation in the spec command without requiring explore.md.
3. Implement non-persistent exploration while retaining the explore command and interaction.
4. Implement task derivation and reconciliation from structured plan steps.
5. Update review and build for both new documents and legacy folders without plan.md.
6. Update the viewer to order and label Spec, Plan, and Tasks while keeping arbitrary Markdown support.
7. Update Codex and Claude skills and commands for the revised workflow.
8. Update README.md and shared-workflow.md for the revised artifact roles.
9. Add focused tests for generation, task handling, viewer behavior, commands, and legacy compatibility.

## Verification and Implementation Notes

<!-- Format: State the user-visible verification intent. Low-level commands and implementation evidence belong in plan.md. -->

- Evidence: Verify each acceptance criterion with automated or manual checks, and record deviations in plan.md.
