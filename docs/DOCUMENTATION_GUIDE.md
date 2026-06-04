# Documentation Maintenance Guide

The goal is to keep DawnDesk documentation useful without creating a new file for every feature.

## Default Workflow

When you add or change a feature, update the existing docs in this order:

1. `docs/FEATURES.md` for what changed from a user perspective.
2. `docs/ARCHITECTURE.md` for route, module, command, storage, or data-flow changes.
3. `docs/DEVELOPMENT.md` for setup, build, scripts, environment, testing, or troubleshooting changes.
4. `docs/TESTING.md` for test strategy, required coverage, mocks, fixtures, or command changes.
5. `docs/VERSIONING.md` for release version rules, current version, or version bump process changes.
6. `docs/RELEASE_NOTES.md` for GitHub release title and release notes format changes.
7. `docs/ASSETS.md` for new, renamed, or removed images, video, icons, and other static assets.
8. `docs/FEATURE_AND_SUB_APP_FORMAT.md` for the required feature or sub-app checklist.

## When to Create a New Doc

Create a new doc only when all of these are true:

- The topic will be maintained long term.
- The content would make an existing doc hard to scan.
- The doc has a clear owner topic, such as `API.md`, `SECURITY.md`, or `RELEASES.md`.

If the topic is temporary, put it in an issue, PR description, or implementation note instead of the repo docs.

## Writing Rules

- Keep docs in plain Markdown.
- Prefer current facts over plans.
- Use stable headings so links do not break.
- Remove stale sections when behavior changes.
- Keep screenshots and large media out of docs unless they are actively maintained.
- Link to code paths when the implementation location matters.

## Feature Update Template

Use this checklist in PRs or commits:

```text
Feature:
User-facing docs updated in docs/FEATURES.md:
Architecture docs updated if needed:
Development docs updated if needed:
Testing docs updated if needed:
Versioning updated if shipping a new app version:
Asset inventory updated if needed:
Feature/sub-app format checklist completed:
Stale docs or assets removed:
```
