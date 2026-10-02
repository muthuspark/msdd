# msdd

`msdd` is a Minimal markdown-first, specification-driven development skill for your coding agents. It keeps a feature’s exploration, detailed spec, and generated execution tasks together under `specs/<feature-slug>/`.

## Install

Install globally and then initialize the claude and codex skill:

```sh
npm install -g msdd-it
```

## Install for coding agents

From the target project, install the local adapters with:

```sh
msdd init
```

This installs:

- Claude: `.claude/skills/msdd/` and the commands `.claude/commands/msdd-explore.md`, `msdd-spec.md`, and `msdd-buld.md`
- Codex: `.codex/skills/msdd/`
- Shared workflow: `.msdd/shared-workflow.md`

The `--force` option refreshes previously installed adapters. Installation is the only setup step; the workflow is intended to be operated by a coding agent.

## Workflow

The shared workflow has three modes:

1. `/msdd-explore` investigates the codebase and records options and open questions.
2. `/msdd-spec` records confirmed decisions in a thirteen-section `spec.md` and generates `task.md`.
3. `/msdd-buld` implements the next unchecked task, verifies it, and continues until the spec is complete.

The generated spec is an engineering document, not a narrative: the interview asks for identifiers, actors, interfaces, failure branches, decisions, executable tasks, verification evidence, and an explanation plan. That plan uses a readable controlled-language profile (80% ASD-STE100 by default) and selects the clearest artifact for the audience: prose, a diagram, interactive HTML, or a narrated explainer video. Review an existing spec before building:

```sh
msdd review "Feature name"
```

The review fails on unresolved sections and prose-only actionable sections, and warns about missing requirement/acceptance identifiers or verification evidence.

Feature artifacts are stored in `specs/<feature-slug>/`:

```text
explore.md  # investigation and discussion
spec.md     # approved source of truth
task.md     # generated sequential execution view
```

## Package contents

The npm package contains the CLI, source modules, license, documentation, shared workflow, and source adapter assets required by `msdd init`. Tests, generated specifications, and local `.msdd`, `.codex`, and `.claude` directories are intentionally excluded.

## Development and validation

```sh
npm test
npm pack --dry-run
```

Before a release, build the tarball and test it from outside this repository:

```sh
package_file=$(npm pack --silent)
smoke_dir=$(mktemp -d)
cd "$smoke_dir"
npm init --yes
npm install "/path/to/msdd/$package_file"
npx msdd --version
npx msdd init
```

## Releases

Releases are published automatically by GitHub Actions after the repository’s configured release trigger passes tests and packed-artifact validation. Before the first release, configure an npm trusted publisher for package `msdd-it` using GitHub Actions, repository `muthuspark/msdd`, workflow `.github/workflows/publish.yml`, and the `npm` environment. The workflow requests only `contents: read` and `id-token: write`; no long-lived npm token belongs in the repository.

Package versions on npm are immutable. If a release is incorrect, fix the issue and publish a new patch version rather than reusing the same version. Do not run `npm publish` manually unless the automated release process is unavailable and the release has been explicitly reviewed.

## Claude guidelines

Use the Claude commands:

- `/msdd-explore <feature>` — inspect the codebase, analyze options, make recommendations, and ask the user the questions that affect the implementation.
- `/msdd-spec <feature>` — turn the confirmed exploration into `spec.md` and `task.md`. Resolve important open questions before finalizing.
- `/msdd-buld <feature>` — continuously implement the approved spec. The agent handles one task at a time, runs tests, marks the task `[x]`, and internally continues to the next task until complete or blocked.

Do not skip exploration, invent unresolved requirements, or ask the user to rerun build between tasks. If implementation changes scope, update the spec before continuing.

## Codex guidelines

Use the installed `msdd` skill and follow the same three modes:

1. `explore` — investigate the repository and produce analysis, recommendations, trade-offs, and questions.
2. `spec` — document confirmed decisions in the detailed `spec.md` and generate the task list.
3. `build` — implement tasks sequentially from `spec.md`, verifying and marking each one complete before continuing automatically.

Codex should use the project-local CLI internally as needed, but the user should only need to request the workflow mode. Both agents share the same Markdown contract and task reconciliation behavior.

## License

MIT
