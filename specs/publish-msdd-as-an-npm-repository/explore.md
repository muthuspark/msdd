# Exploration: Publish msdd as an npm repository

## Context

Publish msdd as a public npm package so users can install it globally or invoke it with npx, while preserving the current project-local workflow and making the package trustworthy and discoverable.

## Codebase Analysis

The package is an ESM Node CLI with `bin/msdd.js` mapped to the `msdd` executable, no runtime dependencies, and tests run with Node's built-in test runner. The repository contains source, tests, skills, documentation, and generated `specs/` artifacts. The current package metadata and README are inconsistent with the proposed public package name and release workflow, so the spec must treat metadata, package contents, and release configuration as one contract.

`npm view msdd` currently returns 404 from the public registry, so the unscoped name appears available at exploration time; ownership should still be confirmed immediately before publishing. `npm pack --dry-run` shows that the current tarball includes source and CLI files, but also tests, the current exploration artifact, both installed and source skill trees, and duplicate workflow documentation. An explicit `files` allowlist is recommended so the published package contains only the runtime CLI, required workflow assets, README, and license. A pack/install smoke test should verify that the executable works from the packed artifact and that no secrets or unrelated project files are shipped.

## Recommendations

Recommended approach: update package metadata and README, define an explicit files allowlist, add npm pack and install smoke checks, and preserve the current zero-dependency CLI. The spec should be written as an implementation contract: stable REQ-* and AC-* identifiers, structured flows and failure branches, explicit confirmed/assumption/constraint/open-question labels, ordered tasks, and test evidence. Add a review gate to the tool so unresolved or prose-only sections are reported before build. Defer CI publishing until the package can be manually validated.

## Open Questions

The package name may already exist; npm ownership and repository URLs are unknown. Decide public registry versus private registry, release version, scope, whether to add automated publishing, and which files are allowed in the tarball. Verify package contents before any real publish and ensure npm login, 2FA, and provenance requirements are understood. The existing spec also needs review for prose-only sections, missing stable identifiers, missing explicit decision categories, and implementation-plan steps that are not independently executable.

## Decisions Confirmed

No decisions confirmed yet. Working assumption for the next discussion: target the public npm registry, keep the existing package name if available, retain semantic version 0.1.x, and require a dry-run tarball/install validation before publishing.
