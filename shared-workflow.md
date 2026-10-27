# Shared SDD workflow

Each feature lives in `specs/<kebab-case-name>/` and uses three standard artifacts:

- `spec.md` — high-level design: intent, goals, users, behavior, flows, constraints, edge cases, and acceptance criteria.
- `plan.md` — low-level design: components, interfaces, data flow, technical decisions, affected files, failure handling, verification, and ordered implementation steps.
- `task.md` — small, checkable agent steps derived from the plan.

Available workflow commands retain their names:

- `explore <feature>` — investigate the codebase, analyze options, recommend an approach, and discuss questions. This command creates no `explore.md` file; keep exploration findings in the conversation until specification.
- `spec <feature>` — capture confirmed high-level and low-level design in `spec.md` and `plan.md`, then generate `task.md`.
- `review <feature>` — check spec and plan completeness, structure, traceability, and verification coverage. Legacy folders without `plan.md` continue to use the existing spec review behavior.
- `build <feature>` — validate the new spec and plan, reconcile plan-derived tasks, then expose exactly the next unchecked task for implementation. Legacy folders without `plan.md` continue to use spec-derived tasks.

`init [--force]` installs the skills and Claude command files; it is not a workflow mode.

Use the project-local CLI:

```sh
msdd explore "Feature name"
msdd spec "Feature name"
msdd review "Feature name"
msdd build "Feature name"
```

The viewer gives the standard artifacts the order Spec, Plan, Tasks, and still displays other Markdown files, including legacy `explore.md` files.

During implementation, keep `spec.md` current with behavior and acceptance criteria. Keep `plan.md` current with technical decisions, file changes, implementation steps, and verification. Tasks are reconciled from plan steps; unchanged task statements retain their checked state. Build proceeds one task at a time and uses the spec acceptance criteria when verifying the implementation.
