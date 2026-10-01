# msdd

`msdd` is a project-local, Markdown-first specification-driven development CLI. It keeps a feature’s exploration, detailed spec, and generated execution tasks together under `specs/<feature-slug>/`.

## Install for coding agents

From the target project, install the local adapters with:

```sh
msdd init --force
```

This installs:

- Claude: `.claude/skills/msdd/` and `.claude/commands/msdd/`
- Codex: `.codex/skills/msdd/`
- Shared workflow: `.msdd/shared-workflow.md`

The `--force` option refreshes previously installed adapters. Installation is the only setup step; the workflow is intended to be operated by a coding agent.

## Claude guidelines

Use the namespaced Claude commands:

- `/msdd:explore <feature>` — inspect the codebase, analyze options, make recommendations, and ask the user the questions that affect the implementation.
- `/msdd:spec <feature>` — turn the confirmed exploration into `spec.md` and `task.md`. Resolve important open questions before finalizing.
- `/msdd:build <feature>` — continuously implement the approved spec. The agent handles one task at a time, runs tests, marks the task `[x]`, and internally continues to the next task until complete or blocked.

Do not skip exploration, invent unresolved requirements, or ask the user to rerun build between tasks. If implementation changes scope, update the spec before continuing.

## Codex guidelines

Use the installed `msdd` skill and follow the same three modes:

1. `explore` — investigate the repository and produce analysis, recommendations, trade-offs, and questions.
2. `spec` — document confirmed decisions in the detailed `spec.md` and generate the task list.
3. `build` — implement tasks sequentially from `spec.md`, verifying and marking each one complete before continuing automatically.

Codex should use the project-local CLI internally as needed, but the user should only need to request the workflow mode. Both agents share the same Markdown contract and task reconciliation behavior.

Feature artifacts are stored in `specs/<feature-slug>/`:

```text
explore.md  # investigation and discussion
spec.md     # approved source of truth
task.md     # generated sequential execution view
```
