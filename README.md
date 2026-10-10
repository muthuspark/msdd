# msdd

`msdd` is a Minimal markdown-first, specification-driven development skill for your coding agents. It keeps a feature’s exploration, detailed spec, and generated execution tasks together under `specs/<feature-slug>/`.

## Install

Install or upgrade to the latest published version, then verify the active CLI:

```sh
npm install -g msdd-it@latest
msdd --version
```

## Install for coding agents

From the target project, install the local adapters with:

```sh
msdd init
```

This installs:

- Claude: `.claude/skills/msdd/` and the commands `.claude/commands/msdd-explore.md`, `msdd-spec.md`, and `msdd-build.md`
- Codex: `.codex/skills/msdd-explore/`, `.codex/skills/msdd-spec/`, and `.codex/skills/msdd-build/`

The `--force` option refreshes previously installed adapters. Installation is the only setup step; the workflow is intended to be operated by a coding agent.

## Workflow

The shared workflow has three modes:

1. `/msdd-explore` investigates the codebase and records options and open questions.
2. `/msdd-spec` records confirmed decisions in a thirteen-section `spec.md` and generates `task.md`.
3. `/msdd-build` implements the next unchecked task, verifies it, and continues until the spec is complete.

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

The npm package contains the CLI, source modules, license, documentation, and source adapter assets required by `msdd init`. Tests, generated specifications, and local `.codex` and `.claude` directories are intentionally excluded.

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

Publishing a stable GitHub Release in `muthuspark/msdd` starts
[the npm publishing workflow](.github/workflows/publish.yml). Pushing a tag alone
does not start it. Drafts, prereleases, and forks do not publish. The package is
`msdd-it`; its installed command is `msdd`.

### One-time account setup

A maintainer with access to `msdd-it` must configure these external settings:

1. In GitHub repository Settings → Environments, create or verify the `npm`
   environment. Ensure its deployment rules permit release tags such as `v0.4.13`.
   If required reviewers are configured, they must approve the job before it runs.
2. On npmjs.com, open `msdd-it` → Settings → Trusted publishing and add a GitHub
   Actions publisher with these exact values:

   | Field | Value |
   | --- | --- |
   | Organization or user | `muthuspark` |
   | Repository | `msdd` |
   | Workflow filename | `publish.yml` (filename only) |
   | Environment name | `npm` |
   | Allowed action | Permit direct publishing with `npm publish` |

3. Complete a successful publish within two days of creating a trust configuration;
   otherwise, delete the expired connection and create a new one when ready.

The job uses GitHub-hosted Ubuntu, Node 24, and bundled npm. A release check logs
both versions and requires npm ≥11.5.1. The workflow requests `contents: read` and
`id-token: write`. Publishing uses OIDC; do not add `NPM_TOKEN` or `NODE_AUTH_TOKEN`
secrets. Keep the repository public for public-package provenance. See
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for account
requirements and trust troubleshooting. Local validation cannot verify these
account settings or prove that OIDC publishing will succeed.

### Prepare and publish a stable release

Use Node 24 locally to match release CI. First inspect all published versions and
the current latest tag:

```sh
npm view msdd-it versions --json
npm view msdd-it dist-tags --json
```

Choose an unused stable `X.Y.Z` version newer than the current latest version.
Package versions are immutable, including versions no longer tagged latest.
Commit the reviewed source and workflow changes before preparing the release.
Then run this from a clean checkout of the intended release branch, replacing the
placeholder with the chosen version:

```sh
release_version='X.Y.Z'
npm version "$release_version" --no-git-tag-version
npm ci
npm test
npm run package:check
git diff -- package.json package-lock.json
```

Confirm that `package.json`, the top-level `package-lock.json`, and its root
`packages[""]` entry have identical names and versions. The release check requires
`msdd-it`, a stable version without prerelease/build suffixes, and an exact
`v<version>` tag. After reviewing the manifests:

```sh
git add package.json package-lock.json
git commit -m "Release v$release_version"
git tag "v$release_version"
git push
git push origin "v$release_version"
```

In GitHub → Releases → Draft a new release, select that existing tag and publish
the release. Leave the prerelease option off. The tag must point to the reviewed
commit containing the updated workflow and manifests; the job checks out that
release commit.

The workflow validates release metadata and npm compatibility, runs `npm ci`,
`npm test`, and the packed-artifact CLI smoke check, then runs
`npm publish --access public --tag latest --provenance`. Same-tag runs cannot
publish simultaneously. Reruns still fail if the version already exists.

### Verify and recover

Monitor GitHub → Actions → Publish to npm, including any `npm` environment approval.
After a successful job, verify the exact package version, latest tag, and CLI:

```sh
npm view "msdd-it@$release_version" version
npm view msdd-it dist-tags --json
npx --yes --package="msdd-it@$release_version" msdd --version
```

The exact version and CLI output must match the release version, and `latest`
should point to it. Check the package's npm page for provenance.

- **Tag or manifest mismatch:** Correct release preparation and use a tag pointing
  to the corrected commit. Do not move a published release tag to different code.
- **Old npm:** Check the logged versions and ensure the tagged workflow uses Node
  24 with bundled npm ≥11.5.1.
- **Install, test, or package validation failure:** Publishing stops. Fix the source
  and prepare a corrected release commit.
- **OIDC authentication failure (including unexpected E404):** Check npm maintainer
  access, exact owner/repository/filename/environment fields, direct publish
  permission, trust expiry, repository URL, and GitHub environment tag restrictions.
  Repair the trust relationship rather than adding an npm write token.
- **Duplicate version or uncertain network result:** Read the exact registry version
  before rerunning. If it exists, verify the prior publish; a rerun cannot overwrite
  it. For incorrect published content, fix it and choose a new version.
- **Skipped job:** Verify the release is stable and belongs to `muthuspark/msdd`.
  Prerelease channels and npm staged publishing are outside this workflow.

Account configuration and creating a live release are maintainer operations;
repository tests and package checks do not publish anything.

## Claude guidelines

Use the Claude commands:

- `/msdd-explore <feature>` — inspect the codebase, analyze options, make recommendations, and ask the user the questions that affect the implementation.
- `/msdd-spec <feature>` — turn the confirmed exploration into `spec.md` and `task.md`. Resolve important open questions before finalizing.
- `/msdd-build <feature>` — continuously implement the approved spec. The agent handles one task at a time, runs tests, marks the task `[x]`, and internally continues to the next task until complete or blocked.

Do not skip exploration, invent unresolved requirements, or ask the user to rerun build between tasks. If implementation changes scope, update the spec before continuing.

## Codex guidelines

Use the installed Codex skills:

1. `$msdd-explore` — investigate the repository and produce analysis, recommendations, trade-offs, and questions.
2. `$msdd-spec` — document confirmed decisions in the detailed `spec.md` and generate the task list.
3. `$msdd-build` — implement tasks sequentially from `spec.md`, verifying and marking each one complete before continuing automatically.

Codex should use the project-local CLI internally as needed, but the user should only need to request the workflow mode. Both agents share the same Markdown contract and task reconciliation behavior.

## License

MIT
