# Testing Guide

This file defines how DawnDesk should be tested. Keep test strategy here so every new feature and sub-app follows the same pattern.

## Test Layers

DawnDesk uses layered testing:

| Layer | Purpose | Location | Examples |
| --- | --- | --- | --- |
| Type and build checks | Catch TypeScript, bundling, and import errors | Project root commands | `npm run build` |
| Frontend unit tests | Test utilities, hooks, engines, and small components | Near source or `src/test/` | photo filters, workflow helpers, formatters |
| Frontend integration tests | Test feature UI behavior with mocked services | Near feature source | notes editor, prompt search, settings toggles |
| Route smoke tests | Make sure app routes render without crashing | `tests/e2e/` or frontend tests | dashboard, notes, video editor, workflow |
| End-to-end tests | Test real browser user journeys | `tests/e2e/` | navigation, welcome screens, create/edit flows |
| Rust/native tests | Test Tauri command behavior and native modules | `src-tauri/tests/` | notes commands, video probing, photo export |

## Required Commands

Use these commands as the project testing baseline:

```bash
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

When frontend and E2E test tooling is installed, use:

```bash
npm run test
npm run test:coverage
npm run test:e2e
```

Recommended package scripts:

```json
{
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:coverage": "vitest --coverage",
  "test:e2e": "playwright test",
  "check": "npm run build && npm run test"
}
```

## Recommended Tooling

Frontend:

- Vitest
- React Testing Library
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- jsdom

End-to-end:

- Playwright

Native:

- Rust `cargo test`
- Tauri command tests under `src-tauri/tests/`

## Test File Naming

Use consistent test names:

| Test type | File pattern | Example |
| --- | --- | --- |
| Component test | `ComponentName.test.tsx` | `NotesList.test.tsx` |
| Hook test | `useThing.test.ts` | `useFFmpeg.test.ts` |
| Utility test | `utilityName.test.ts` | `exportFile.test.ts` |
| Engine test | `featureEngine.test.ts` | `filters.test.ts` |
| E2E test | `flow-name.spec.ts` | `navigation.spec.ts` |
| Rust test | `feature_name.rs` or module test | `notes_taking.rs` |

Prefer colocating frontend tests near the code they test unless a feature already has a test folder.

## Folder Pattern

Use this structure as the project grows:

```text
src/
  test/
    setup.ts
    mocks/
    fixtures/
  components/
    ComponentName.test.tsx
  engine/
    feature-name/
      featureLogic.test.ts

tests/
  e2e/
    navigation.spec.ts
    feature-name.spec.ts

src-tauri/
  tests/
    feature_name.rs
```

## Minimum Tests for a New Feature

Every new feature or sub-app must include:

1. A route or render smoke test.
2. A test for the most important user action.
3. A test for one failure or empty state.
4. A native test if the feature adds or changes Tauri commands.
5. An E2E test if the feature is part of a critical user journey.

If a feature is UI-only and small, one render test plus one interaction test is enough.

## Minimum Tests for a Bug Fix

Every bug fix should include a regression test when practical.

Use this format:

```text
Bug:
Expected behavior:
Previous failing case:
Regression test added:
Test file:
```

If a regression test is not practical, explain why in the PR or commit notes.

## New Test Template

Use this checklist when adding tests:

```text
Feature or bug:
Test layer: unit, integration, route smoke, e2e, rust/native
Test file:
What behavior is protected:
Mocked dependencies:
Fixtures added:
Failure or empty state covered:
Command run:
Result:
```

## Feature Test Matrix Template

Add this matrix to feature planning notes when a feature is larger than one screen:

```markdown
| Behavior | Test layer | File | Status |
| --- | --- | --- | --- |
| Route renders | Smoke | `tests/e2e/feature-name.spec.ts` | Planned |
| Primary action works | Integration | `src/components/FeatureName/FeatureName.test.tsx` | Planned |
| Empty state is shown | Integration | `src/components/FeatureName/FeatureName.test.tsx` | Planned |
| Invalid input is handled | Unit or integration | `src/engine/feature-name/validation.test.ts` | Planned |
| Native command works | Rust/native | `src-tauri/tests/feature_name.rs` | Planned |
```

## What to Test by Area

Dashboard:

- Route renders.
- Summary cards handle empty data.

Project Manager:

- Auth guard behavior.
- Project list empty and populated states.
- Board interactions.
- Comments and mention behavior.
- Supabase error handling.

Finance Manager:

- Auth guard behavior.
- View navigation.
- Account, transaction, budget, and report states.
- Supabase error handling.

Notes:

- Create, edit, delete, search.
- Notebook and tag behavior.
- Backlinks and graph state.
- Native notes commands.

Prompt Manager:

- Create, edit, search, copy.
- Empty state.
- Supabase save/load behavior.

Photo Editor:

- Canvas loads.
- Tool selection changes state.
- Filters and adjustments apply to editor state.
- Import/export behavior.
- Native export command.

Video Editor:

- Media import states.
- Timeline interactions.
- Playback controls.
- Export dialog validation.
- FFmpeg availability and native media commands.

Workflow Builder:

- Node creation.
- Compatible and incompatible connections.
- Save/load behavior.
- Empty and invalid workflow states.

Developer Tools:

- Each utility handles valid input.
- Each utility handles invalid or empty input.
- Download/export actions produce expected output.

Settings:

- Theme changes.
- Auto-launch setting.
- Hardware acceleration setting.
- Native settings commands.

## Mocking Rules

- Mock Supabase at the boundary, not deep inside UI components.
- Mock Tauri APIs in frontend tests.
- Keep fixtures small and readable.
- Avoid snapshots for large UI trees.
- Prefer explicit assertions about text, roles, state, and user-visible behavior.

## E2E Rules

E2E tests should cover real user paths, not every component detail.

Good E2E coverage:

- App opens.
- Sidebar navigation works.
- Each major route renders.
- Welcome screen can be dismissed.
- One critical create/edit/search flow per major sub-app.

Avoid E2E tests for tiny visual details that belong in component tests.

## Done Definition

A feature is test-ready when:

- Required tests were added or intentionally documented as not practical.
- `npm run build` passes.
- Relevant frontend tests pass.
- Relevant E2E tests pass when the feature affects navigation or user journeys.
- Relevant Rust tests pass when native behavior changed.
- `docs/TESTING.md` is updated if the testing approach changed.
