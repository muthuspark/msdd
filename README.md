# msdd

`msdd` is a minimal, markdown-first SDD workflow for coding agents. It focuses on three actions: explore, spec, and build.

Existing SDD tools such as Speckit and OpenSpec felt more complex than my workflow required, so I built `msdd` around the three actions I use most: explore, spec, and build.

It also includes a local Markdown viewer for reading and reviewing generated specifications.

## Quick Overview

1. Install `msdd`:

```sh
npm install -g msdd-it@latest
msdd --version
```

2. From your repository, initialize the agent skills:

```sh
msdd init
```

This installs:

- Claude: `.claude/skills/msdd/` and the commands `.claude/commands/msdd-explore.md`, `msdd-spec.md`, and `msdd-build.md`
- Codex: `.codex/skills/msdd-explore/`, `.codex/skills/msdd-spec/`, and `.codex/skills/msdd-build/`

The `--force` option refreshes previously installed adapters.

3. Open the viewer with `msdd serve`. You can run it from any directory and select a project folder in the browser.
4. Use the workflow described below for each task.


## Detailed Guide

### Local specification viewer

Run `msdd serve` to open a local viewer. Select a project folder to browse rendered `spec.md`, `plan.md`, and `task.md` files with Mermaid diagrams and live refresh. Existing Markdown files in feature folders remain accessible.

<p align="center">
  <img src="public/Screenshot 2026-10-13 at 12.32.49 PM.png" alt="MSDD local specification viewer landing page" width="100%">
</p>

<p align="center"><em>Open a project folder and return to recently viewed specification work.</em></p>

<p align="center">
  <img src="public/Screenshot 2026-10-13 at 12.32.29 PM.png" alt="MSDD rendered specification reader with navigation and Mermaid diagram" width="100%">
</p>

<p align="center"><em>Read the full specification with artifact tabs, section navigation, and rendered diagrams.</em></p>

### Workflow

The workflow keeps the existing command names:

1. `/msdd-explore` investigates the codebase and discusses options and open questions. It does not create an `explore.md` file.
2. `/msdd-spec` creates `spec.md`, `plan.md`, and `task.md` together from confirmed decisions.
3. `/msdd-build` implements the next unchecked plan task, verifies it against the spec's acceptance criteria, and continues until the plan is complete.

Start each task with exploration, then review the generated spec and task list before building:

```text
$msdd-explore "Feature name"
$msdd-spec
$msdd-build
```

Review an existing spec with:

```sh
msdd review "Feature name"
```

The review reports unresolved sections, prose-only actionable sections, missing requirement or acceptance identifiers, and missing verification evidence in the spec and plan.

Feature artifacts are stored in `specs/<feature-slug>/`:

```text
spec.md   # high-level design: intent, behavior, constraints, edge cases, acceptance criteria
plan.md   # low-level design: components, interfaces, data flow, affected files, implementation steps
task.md   # small, checkable agent steps derived from the plan
```

## License

MIT
