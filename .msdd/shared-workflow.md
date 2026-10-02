# Shared SDD workflow

`spec.md` is the source of truth. Each feature lives in `specs/<kebab-case-name>/` and contains `explore.md`, `spec.md`, and generated `task.md`.

When installed by `msdd init`, this workflow is also available at `.msdd/shared-workflow.md`.

Available workflow commands:

- `explore <feature>` — inspect the codebase, analyze implementation options, recommend an approach, and list questions.
- `spec <feature>` — document confirmed exploration in the detailed `spec.md` and generate `task.md`.
- `review <feature>` — check an existing `spec.md` for unresolved sections, prose-only engineering content, missing traceability, and weak verification detail.
- `build <feature>` — validate and reconcile the spec, then expose exactly the next unchecked task for implementation.

`init [--force]` remains the setup command for installing the skills and Claude command files; it is not a workflow mode.

Use the project-local CLI:

```sh
msdd explore "Feature name"
msdd spec "Feature name"
msdd build "Feature name"
```

The spec interview covers thirteen Markdown sections in order. The `Explanation and Output Artifacts` section records how people should understand the result: use a controlled writing profile (normally an accessible, 80%-ASD-STE100 style) and select the clearest artifact—prose, diagram, interactive HTML, or narrated explainer video. It must state the audience, purpose, delivery location, accessibility needs, and observable acceptance evidence. When a requirement is ambiguous or a decision changes scope, architecture, dependencies, or behavior, explain a recommendation and get explicit confirmation before recording it. Record accepted assumptions and constraints in the spec. Do not silently invent important requirements.

Generated specs should be technical documents: use stable requirement and acceptance IDs, structured bullets or numbered flows, explicit decisions and open questions, executable implementation tasks, and observable verification evidence. Prose-only actionable sections are rejected during review/build.

Tasks are regenerated from actionable spec sections. Reconciliation preserves checked state only for an unchanged task statement; changed statements receive a new unchecked task. Edit spec first, then run `msdd build "Feature name"`.

Build is sequential and continuous for the coding agent: after one user invocation, implement only the task returned by `build`, verify it, mark it `[x]`, and internally run `build` again for the next task. Do not ask the user to rerun build between tasks. When no unchecked tasks remain, the build is complete.
