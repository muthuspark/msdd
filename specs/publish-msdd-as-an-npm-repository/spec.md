# Publish msdd as an npm repository

## Summary

Make msdd a public npm package named msdd at version 0.3.1, preserving the existing CLI and project-local SDD workflow. Add package metadata, a safe package boundary, user-facing npm installation documentation, release validation, and automated publishing from the GitHub repository.

## Problem

The package is currently marked private, lacks complete npm discovery and repository metadata, and does not provide a controlled release path. The current npm tarball includes tests, specs, installed agent adapters, and other development artifacts. Users need to install and invoke msdd reliably, while maintainers need repeatable validation and automated publication.

## Goals and Non-Goals

Goals: publish the unscoped package msdd publicly at version 0.3.1; retain the msdd executable and current behavior; include all runtime files required by msdd init and the CLI; exclude tests, generated specs, local editor/agent installations, and unrelated development files; document global, npx, and local usage; validate the packed artifact; and automate publishing from GitHub Actions. Non-goals: redesigning the CLI, adding runtime dependencies, changing the SDD workflow contract, creating a hosted service, or adding a full release-management system beyond automated npm publication.

## Users and Scenarios

Primary users are developers and coding agents consuming msdd from npm. A user installs msdd globally and runs msdd init, invokes it through npx, or installs it as a project dependency and uses the binary. A maintainer updates the version, runs tests and package validation, creates a GitHub release or approved release trigger, and lets GitHub Actions publish the package. Reviewers inspect the package contents and workflow before publication.

## Requirements

Set package name to msdd, version to 0.3.1, and make the package public-publishable by removing private. Preserve the msdd bin mapping and ESM behavior. Add repository https://github.com/muthuspark/msdd plus homepage, bugs, license, keywords, and a supported Node engines declaration. Define an explicit files allowlist containing package.json, README.md, LICENSE, bin/, src/, shared-workflow.md, and the source skills required by init; exclude tests, specs, .msdd, .codex, .claude, and other development artifacts. Update README with npm install, npx, local usage, package contents, validation, and release instructions. Add automated GitHub Actions publishing using npm trusted publishing/OIDC, restricted to the repository's release workflow and public npm access. Add checks for tests, npm pack dry-run/content, and packed-artifact CLI execution before publish.

## User/System Flows

For consumption: the user runs npm install -g msdd or npx msdd, npm resolves version 0.3.1, the msdd bin launches bin/msdd.js, and commands operate in the target project. For release: a maintainer updates package metadata and changelog/release notes as appropriate, pushes the change and creates the configured GitHub release/tag, GitHub Actions checks out the repository, installs dependencies with npm ci when a lockfile is present or uses the repository's dependency-free setup, runs tests, runs npm pack --dry-run and a packed-package smoke test, authenticates to npm through trusted publishing, and publishes with public access. A failed check must prevent publication and expose actionable logs.

## Technical Design

Use package.json metadata and an explicit files array as the package boundary. Keep bin/msdd.js as the executable entry point and include src/ plus the source shared workflow and skills directories consumed by installSkills. Add a GitHub Actions workflow under .github/workflows/ that runs on a deliberate release event, uses Node's setup action, enables npm provenance where supported, requests id-token write permission, and publishes with npm publish --access public only after validation. Use npm pack --json or equivalent to inspect the tarball and install the tarball into a temporary directory for a smoke test. Do not add runtime dependencies. The repository URL is https://github.com/muthuspark/msdd; issue tracking should point to its GitHub issues URL unless repository configuration requires another value.

## Decisions and Constraints

Confirmed: use unscoped package name msdd; release version 0.3.1; repository URL https://github.com/muthuspark/msdd; automate publishing. Recommended assumptions: use GitHub Actions and npm trusted publishing via OIDC rather than storing a long-lived npm token; trigger publication from GitHub releases or version tags, with the exact trigger documented and protected by repository permissions; publish to the public npm registry; retain the MIT license already present; support a current maintained Node LTS baseline, defaulting to >=18 unless compatibility testing establishes a stricter baseline. The package must remain zero-runtime-dependency and the existing CLI behavior must remain compatible.

## Edge Cases and Failure Handling

Fail before publish if package metadata is invalid, tests fail, the packed artifact is missing bin/msdd.js or required init assets, forbidden files appear in the tarball, the package name/version is already published, npm authentication or OIDC is unavailable, or the workflow is running from an unapproved branch/event. Ensure npm publish is the final step so validation failures cannot create a release. Document that npm versions are immutable and that a failed or incorrect release requires a new patch version. Ensure the smoke test runs from outside the repository so accidental source-relative access is detected.

## Acceptance Criteria

package.json identifies a public package named msdd at version 0.3.1 with complete repository, homepage, bugs, license, keywords, engines, bin, and files metadata. npm pack --dry-run contains the executable, source, README, license, shared workflow, and source skills required by init, and does not contain tests, specs, .msdd, .codex, or .claude artifacts. Existing tests pass. A packed tarball can be installed in a clean temporary project and its msdd executable can run at least --version and init successfully. README documents global, npx, and local usage. A GitHub Actions workflow validates before publishing and is configured for npm trusted publishing/public access. The workflow and package validation are reviewed without requiring a real production publish during implementation.

## Implementation Plan

Update package.json metadata, version, engines, keywords, repository links, and files allowlist. Add or refine package-content and packed-install smoke tests. Update README with consumer and maintainer instructions. Add the GitHub Actions validation and npm trusted-publishing workflow. Run the full test suite, npm pack dry-run, tarball inspection, and clean-install smoke test. Review the final diff and document the one-time npm trusted-publisher configuration needed for the GitHub repository before creating the 0.3.1 release.

## Verification and Implementation Notes

Use npm test as the baseline. Verify package contents with npm pack --dry-run --json and assert required and forbidden paths. Build a tarball and install it into a temporary directory outside the repository, then run the packaged msdd --version and init flow. Validate workflow YAML and ensure it uses least-privilege permissions and trusted publishing rather than a committed token. Record test commands, tarball results, and any npm/GitHub configuration still required. Do not run npm publish during implementation unless the user explicitly requests the live release and the npm trusted publisher is configured.
