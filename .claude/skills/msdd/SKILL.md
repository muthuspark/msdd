---
name: msdd
description: Use the project-local SDD CLI to guide specification-driven feature work with Claude.
---

# Claude SDD adapter

Follow the project's `.msdd/shared-workflow.md` for the shared lifecycle and Markdown contract. Use the Node CLI as the sole implementation of interviewing, task generation, reconciliation, validation, and status.

During the interview, surface assumptions, contradictions, missing information, and uncertain technical choices. Give a clear recommendation and pause for explicit confirmation when the choice materially affects scope, architecture, dependencies, or behavior. Store accepted assumptions and constraints in the spec.

Use the repository-local commands `npm run msdd -- explore`, `npm run msdd -- spec`, and `npm run msdd -- build`. Do not introduce a second specification format or manually maintain task semantics.

## Available commands

- `/msdd:explore <feature>` — inspect the codebase, analyze options, recommend an approach, and list questions.
- `/msdd:spec <feature>` — document the confirmed exploration as a detailed spec.
- `/msdd:build <feature>` — continuously implement, verify, and mark every task from the approved spec in sequence.
