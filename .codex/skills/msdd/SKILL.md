---
name: msdd
description: Use the project-local SDD CLI to explore, specify, and build features through explore.md, spec.md, and task.md.
---

# Codex SDD adapter

Follow the project's `.msdd/shared-workflow.md` for the shared lifecycle and file contract. The Node CLI is authoritative for interview output, task derivation, reconciliation, validation, and status; do not recreate those rules in prose or code.

Use three modes: explore the codebase and analyze options; spec the confirmed decisions into the detailed thirteen-section spec; build by implementing the approved spec. The `Explanation and Output Artifacts` section must select the clearest audience-facing medium—prose, diagram, interactive HTML, or narrated explainer video—and use an 80%-ASD-STE100 writing profile unless the user specifies another level. Use `review` before build when an existing spec needs a technical completeness check. When working with a human, clarify ambiguity in conversation. State a recommendation and ask for explicit confirmation when a choice materially changes scope, architecture, dependencies, or behavior. Capture the accepted decision in `Decisions and Constraints`.

Invoke the repository-local commands with `npm run msdd -- explore "Feature name"`, `npm run msdd -- spec "Feature name"`, and `npm run msdd -- build "Feature name"`. A single build invocation starts a continuous agent loop: reconcile and validate `spec.md`, implement the next task, test it, mark it `[x]`, then internally invoke build again for the next task. Do not ask the user to rerun build between tasks. Record implementation updates in `Verification and Implementation Notes`.

The available modes are:

- `explore` — investigate code, produce analysis and recommendations, and surface questions.
- `spec` — turn confirmed exploration into the detailed implementation spec.
- `review` — report unresolved sections, prose-only actionable content, missing traceability, and weak verification detail.
- `build` — continuously write and verify one task from the spec at a time, marking each task complete before internally requesting the next, until all tasks are done or a real blocker needs user input.
