# Exploration: Publish to npm using GitHub Actions

## Context

Explore how to publish this repository to npm through GitHub Actions. This is an exploration only; no workflow, package metadata, specification, or task changes are authorized. Inspected on 2026-10-10.

## Codebase Analysis

- package.json identifies the public CLI package as `msdd-it`, version `0.4.12`; the executable remains `msdd`. Source is shipped directly, with no build script. Runtime dependencies are dompurify, marked, and mermaid.
- Git remote and package repository point to `muthuspark/msdd`.
- `.github/workflows/publish.yml` already runs on `release: types: [published]`, using an Ubuntu GitHub-hosted runner and the `npm` environment. It requests `contents: read` and `id-token: write`, runs `npm ci`, `npm test`, `npm run package:check`, then `npm publish --access public --provenance`.
- The workflow uses checkout/setup-node v4, pins Node 22.14.0, and enables npm caching. It does not upgrade npm. Node 22.14.0 ships npm 10.9.2, below the npm 11.5.1 minimum for trusted publishing. The Node minimum alone is insufficient.
- `scripts/package-check.js` verifies tarball contents and exclusions, installs the tarball into a temporary external project, exercises CLI version and init, and verifies viewer dependency assets. No transpilation stage is needed.
- README documents OIDC publishing but gives the full workflow path; npm asks for only `publish.yml` in its workflow filename field.
- Read-only `npm view msdd-it version repository.url --json` returned latest `0.3.9` and the expected repository. This confirms the package exists, but does not establish ownership, other published versions, or trusted publisher configuration. Local version is 0.4.12.
- Existing publishing exploration/spec/tasks are under `specs/publish-msdd-as-an-npm-repository/`; this record investigates the current operational setup rather than modifying those completed artifacts.
- Tests and package validation were inspected, not executed; no publish was attempted.

## Recommendations

Retain the existing GitHub Release trigger and use npm trusted publishing (OIDC). A published GitHub Release starts the job; pushing a tag alone does not start this workflow. Release versions should be committed with matching package.json/package-lock.json versions before tagging.

For a future implementation, prefer Node 24 with a verified compatible npm version, or retain Node 22.14.0 and explicitly install a compatible npm 11 version. Modernize action versions and consider disabling release dependency caching. Keep the existing validation gates. Consider an exact release-tag/package-version check, per-version concurrency, and rejecting prereleases until an explicit npm dist-tag policy is chosen. Currently a GitHub prerelease also reaches the publish command, which defaults to npm latest.

The npm account setup for the existing package should bind GitHub Actions to owner `muthuspark`, repository `msdd`, workflow filename `publish.yml`, and environment `npm`. Direct publishing must be permitted for the existing command. Verify the GitHub environment exists and its tag restrictions permit the intended release. npm supports this through GitHub-hosted runners with Node >=22.14.0 and npm >=11.5.1; no NPM_TOKEN is needed. New trust configurations require a successful publish within two days. Provenance is automatic for public packages from public repositories, so the explicit flag is optional. [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/)

Operational release sequence, once the workflow and account setup are verified: choose an unused version, commit matching manifests and intended changes, push the commit and matching `v<version>` tag, then publish a GitHub Release for that tag. Monitor the publish job and verify the resulting registry version. Do not publish the current version blindly: latest is not a complete list of published versions.

Release-triggered publishing is simple and gives maintainers a deliberate release boundary. Tag-triggered publishing is more direct but easier to activate accidentally. Semantic-release or Changesets would add version/changelog automation and dependencies; neither is necessary for this single-package CLI. Staged publishing is an alternative if every release should require separate npm approval.

Additional sources: [Node 22.14.0 release notes](https://nodejs.org/en/blog/release/v22.14.0), [setup-node usage](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md).

## Open Questions

- Does the user have npm maintainer access to `msdd-it`, and is its trusted publisher already configured correctly? These account settings were not inspected.
- Should releases continue to publish immediately after GitHub Release publication, or require npm staging approval?
- Are prereleases needed? If so, choose beta/next tagging behavior before enabling them.
- What version and commit should be the next release? Registry latest alone cannot answer this.
These remain open; the recommendation to retain the existing release trigger is an assumption, not a confirmed user decision.

## Decisions Confirmed

The user explicitly requested exploration of npm publishing using GitHub Actions. No workflow changes, publishing action, release version, or additional release policy has been confirmed.
