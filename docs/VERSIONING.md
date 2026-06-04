# Versioning Guide

DawnDesk uses semantic versioning while it is in early development.

Current version: `0.9.3`

## Version Sources

These files must always have the same app version:

| File | Field |
| --- | --- |
| `package.json` | `version` |
| `package-lock.json` | root package `version` |
| `src-tauri/Cargo.toml` | `[package].version` |
| `src-tauri/tauri.conf.json` | `version` |
| `README.md` | version badge |

If any of these are out of sync, the release is not ready.

## Version Format

Use this format:

```text
MAJOR.MINOR.PATCH
```

Examples:

- `0.1.0`
- `0.2.0`
- `0.2.1`
- `1.0.0`

## Early Development Rule

While DawnDesk is before `1.0.0`:

- Bump **minor** for meaningful new features, new sub-apps, storage changes, or workflow changes.
- Bump **patch** for bug fixes, copy updates, documentation updates, tests, and small UI improvements.
- Move to `1.0.0` only when the app has a stable core workflow, release notes, and tested install/update behavior.

## When to Bump

Patch bump:

```text
0.1.0 -> 0.1.1
```

Use for:

- Bug fixes
- Documentation improvements
- Test additions
- Small UI copy changes
- Internal refactors with no user-facing behavior change

Minor bump:

```text
0.1.0 -> 0.2.0
```

Use for:

- New sub-app
- Major new feature in an existing sub-app
- New persistent storage shape
- New native command group
- New shared sync behavior
- Significant user workflow change

Major bump:

```text
0.9.0 -> 1.0.0
```

Use for:

- First stable public release
- Breaking changes after `1.0.0`
- Migration requirements that older app versions cannot safely read

## Required Release Checklist

Copy this checklist for every version bump:

```text
New version:
Reason for bump:
package.json updated:
package-lock.json updated:
src-tauri/Cargo.toml updated:
src-tauri/tauri.conf.json updated:
README badge updated:
docs/VERSIONING.md current version updated:
docs/FEATURES.md updated if behavior changed:
docs/ARCHITECTURE.md updated if structure changed:
docs/ARCHITECTURE_DIAGRAMS.md updated if data flow changed:
docs/TESTING.md updated if test strategy changed:
Tests run:
Build run:
Release notes added if needed:
```

## Recommended Version Bump Flow

1. Decide whether the change is patch, minor, or major.
2. Update all version sources in the same commit.
3. Run tests and build.
4. Update docs affected by the change.
5. If shipping a user-facing build, add release notes.

## Command Reference

If npm is available, this updates `package.json` and `package-lock.json`:

```bash
npm version patch --no-git-tag-version
```

or:

```bash
npm version minor --no-git-tag-version
```

Then manually update:

- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `README.md`
- `docs/VERSIONING.md`

## Auto-Update Releases

DawnDesk uses the Tauri updater plugin for desktop auto-updates. The app checks this release asset:

```text
https://github.com/AdeelTahir-SE/DawnDesk/releases/latest/download/latest.json
```

Before shipping auto-updates:

1. Keep the Tauri updater private key outside git.
2. Confirm the generated public key in `src-tauri/tauri.conf.json` matches that private key.
3. Build release bundles with `TAURI_SIGNING_PRIVATE_KEY` and, if used, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` set in the release environment.
4. Upload the generated installer, signature, and `latest.json` updater manifest to the GitHub release.

The update button appears in the top navigation only when the updater reports a newer signed version.

## Do Not Do This

- Do not leave Tauri and package versions different.
- Do not update only the README badge.
- Do not keep every release at `0.1.0`.
- Do not use date-only versions for the app version.
- Do not bump version for unfinished local experiments.

## Version History

| Version | Status | Notes |
| --- | --- | --- |
| `0.1.0` | Early development | Initial DawnDesk app baseline. |
| `0.2.0` | Superseded | Structured multi-sub-app baseline with documentation, testing, asset cleanup, auth flow updates, and versioning rules. |
| `0.9.3` | Current | Desktop updater wiring, signed updater configuration, and release documentation. |

## Planned Version Milestones

These versions are targets for future work. Update them when scope changes or implementation lands.

| Target Version | Planned Scope | Notes |
| --- | --- | --- |
| `0.3.0` | Shared AI model settings and AI client foundation | Adds provider configuration, secret-safe runtime setup, usage logging, and failure handling. |
| `0.4.0` | RAG Knowledge Base | Adds user-approved indexing, retrieval, source display, and vector-store management. |
| `0.5.0` | Photo Editor AI | Adds AI-assisted photo edit proposals with preview-before-apply behavior. |
| `0.6.0` | Video Editor AI | Adds transcript, scene, caption, and timeline proposal workflows with user review. |
| `0.7.0` | AI Workspace Assistant | Adds cross-app assistant behavior after the AI and RAG foundations are stable. |
