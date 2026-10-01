# Exploration: Publish msdd as an npm repository

## Context

Publish msdd as a public npm package so users can install it globally or invoke it with npx, while preserving the current project-local workflow and making the package trustworthy and discoverable.

## Codebase Analysis

The package is an ESM Node CLI with `bin/msdd.js` mapped to the `msdd` executable, no runtime dependencies, and tests run with Node's built-in test runner. `package.json` is currently version `0.1.1` and marked `private: true`, so npm will refuse a public publish until that is removed. The README explains project-local agent installation but does not yet provide the normal `npm install -g`, `npx`, release, or package-content workflow. The repository contains source, tests, skills, documentation, and generated `specs/` artifacts.

`npm view msdd` currently returns 404 from the public registry, so the unscoped name appears available at exploration time; ownership should still be confirmed immediately before publishing. `npm pack --dry-run` shows that the current tarball includes source and CLI files, but also tests, the current exploration artifact, both installed and source skill trees, and duplicate workflow documentation. An explicit `files` allowlist is recommended so the published package contains only the runtime CLI, required workflow assets, README, and license. A pack/install smoke test should verify that the executable works from the packed artifact and that no secrets or unrelated project files are shipped.

## Recommendations

Recommended approach: update package metadata and README, remove private, define an explicit files allowlist, add npm pack and install smoke checks, and preserve the current zero-dependency CLI. An unscoped package is simplest if the name is available; a scoped package changes commands but avoids naming conflicts. Defer CI publishing until the package can be manually validated.

## Open Questions

The package name msdd may already exist; npm ownership and repository URLs are unknown. Decide public registry versus private registry, release version, scope, whether to add automated publishing, and which files are allowed in the tarball. Verify package contents before any real publish and ensure npm login, 2FA, and provenance requirements are understood.

## Decisions Confirmed

No decisions confirmed yet. Working assumption for the next discussion: target the public npm registry, keep the existing package name if available, retain semantic version 0.1.x, and require a dry-run tarball/install validation before publishing.
