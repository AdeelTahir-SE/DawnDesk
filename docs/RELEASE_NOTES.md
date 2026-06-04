# Release Notes Format

Use this file when asking AI to generate a GitHub release title and release notes for DawnDesk.

## Required Inputs

Provide these values before generating release notes:

```text
Version:
Tag:
Release type: patch | minor | major
Previous version:
Target audience:
Main changes:
Bug fixes:
Developer/internal changes:
Known limitations:
Verification run:
```

If an input is unknown, write `None` instead of inventing details.

## Release Title

Use this format:

```text
DawnDesk vVERSION - SHORT_RELEASE_THEME
```

Rules:

- Match the version exactly, including the leading `v` only in the title if the tag uses it.
- Keep `SHORT_RELEASE_THEME` under 8 words.
- Use plain language that describes the user-visible release theme.
- Do not use hype words like revolutionary, ultimate, perfect, or game-changing.

Examples:

```text
DawnDesk v0.9.4 - Desktop Auto-Update Setup
DawnDesk v0.10.0 - Workspace Sync Improvements
DawnDesk v1.0.0 - Stable Desktop Release
```

## GitHub Release Notes

Use this structure:

```markdown
## DawnDesk VERSION

SHORT_SUMMARY_PARAGRAPH

### Highlights

- USER_VISIBLE_CHANGE
- USER_VISIBLE_CHANGE
- USER_VISIBLE_CHANGE

### Fixes

- BUG_FIX
- BUG_FIX

### Developer Notes

- INTERNAL_CHANGE
- BUILD_OR_RELEASE_CHANGE

### Verification

- TEST_OR_BUILD_COMMAND: RESULT
- TEST_OR_BUILD_COMMAND: RESULT

### Update Notes

- IMPORTANT_INSTALL_OR_UPDATE_NOTE
```

## Section Rules

- Keep the summary to 1 short paragraph.
- Put the most important user-facing changes in `Highlights`.
- Put bug fixes in `Fixes`.
- Put build, dependency, CI, updater, documentation, and internal code changes in `Developer Notes`.
- Put commands that were actually run in `Verification`.
- Put release/install/update caveats in `Update Notes`.
- Omit a section only if it has no real content.
- Do not mention files changed unless the file name helps users or maintainers understand the release.
- Do not claim the release was tested unless a test/build command was actually run.
- Do not include secrets, signing keys, tokens, local private paths, or environment variable values.

## Auto-Updater Release Notes

When the release includes updater changes, include these reminders in `Update Notes` if relevant:

```markdown
- This release includes signed updater metadata for DawnDesk desktop builds.
- The update button appears only when an installed app finds a newer signed version.
- Upload `latest.json` and the generated installer artifacts to the GitHub release assets.
```

Do not include the private updater key or its local path in public release notes.

## AI Prompt Template

Use this prompt with an AI assistant:

```text
Generate a GitHub release title and release notes for DawnDesk using docs/RELEASE_NOTES.md.

Version:
Tag:
Release type:
Previous version:
Target audience:
Main changes:
Bug fixes:
Developer/internal changes:
Known limitations:
Verification run:

Return:
1. Release title
2. Release notes in Markdown
```

## Example

```markdown
Release title:
DawnDesk v0.9.4 - Desktop Auto-Update Setup

Release notes:
## DawnDesk 0.9.4

This release prepares DawnDesk desktop builds for signed auto-updates and cleans up the release process for future versions.

### Highlights

- Added the top navigation update flow for new desktop versions.
- Restored the original landing page flow to open the dashboard directly.
- Documented the signed updater release process.

### Developer Notes

- Added Tauri updater and process plugin wiring.
- Added updater signing guidance and release asset requirements.
- Synced version metadata across package, Tauri, README, and docs files.

### Verification

- `node --test tests/*.test.mjs`: passed
- `tsc --noEmit`: passed
- `cargo check --manifest-path src-tauri/Cargo.toml`: passed

### Update Notes

- Upload `latest.json` and generated installer artifacts to the GitHub release assets.
- The update button appears only for users running an older signed version.
```
