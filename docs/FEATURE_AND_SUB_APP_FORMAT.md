# Feature and Sub-App Format

Use this guide every time a new DawnDesk feature or sub-app is added. The goal is consistency in code, routes, docs, assets, and maintenance.

## Naming

Use one clear feature name everywhere.

| Place | Format | Example |
| --- | --- | --- |
| Route | kebab-case | `/project-manager` |
| App key | kebab-case | `project-manager` |
| React page | PascalCase | `ProjectManager.tsx` |
| Component folder | PascalCase for large feature folders | `components/ProjectManager/` |
| Engine folder | kebab-case | `engine/video-editor/` |
| Rust module | snake_case | `sub_apps::video_editor` |
| Docs heading | Title Case | `Project Manager` |

Avoid abbreviations unless the abbreviation is the real product term, such as API or URL.

## Required Feature Record

Every new feature or sub-app must be added to `docs/FEATURES.md` with this format:

```markdown
## Feature Name

Feature Name is available at `/route-name`. It helps users do [primary job].

Current capabilities:

- Capability one.
- Capability two.
- Capability three.

Data and integrations:

- Local state, Supabase, Tauri command, or sidecar usage.

Status:

- Planned, active development, beta, or stable.
```

Keep this section current. Update it when behavior changes.

## Required Architecture Record

Update `docs/ARCHITECTURE.md` when the feature adds or changes any of these:

- Route
- App shell navigation
- Shared state
- Feature engine
- Tauri command
- Rust module
- Supabase table or migration
- Local storage key
- Sidecar binary
- File import/export behavior

Use this format inside the nearest relevant section:

```markdown
### Feature Name

- Route: `/route-name`
- Page: `src/Pages/FeatureName.tsx`
- Components: `src/components/FeatureName/`
- Engine: `src/engine/feature-name/`
- Native module: `src-tauri/src/sub_apps/feature_name/`
- Storage: local storage, Supabase, filesystem, or none
- External tools: sidecars, APIs, or none
```

Only include rows that exist. Do not add fake folders just to satisfy the template.

## Required Folder Pattern

Use this pattern for larger sub-apps:

```text
src/Pages/FeatureName.tsx
src/components/FeatureName/
src/engine/feature-name/
src-tauri/src/sub_apps/feature_name/
```

Use a smaller pattern for simple features:

```text
src/Pages/FeatureName.tsx
src/components/feature-name-related-component.tsx
```

Start small. Add an engine folder only when the feature has meaningful domain logic, state machines, import/export logic, or reusable operations.

## Required Route Pattern

Add route entries in `src/App.tsx`.

Standard feature:

```tsx
<Route path="feature-name" element={<FeatureName />} />
```

Authenticated feature:

```tsx
<Route
  path="feature-name"
  element={
    <RequireGoogleAuth moduleName="Feature Name">
      <FeatureName />
    </RequireGoogleAuth>
  }
/>
```

Also add sidebar navigation in `src/components/sidebar.tsx` when the feature should be user-accessible from the workspace.

## Required Welcome Screen Pattern

If the feature uses the shared welcome flow, add an `appKey` branch in `src/components/WelcomeScreen.tsx`.

Use this content shape:

```tsx
content = {
  appName: "DawnDesk Feature Name",
  appIcon: <Icon className="h-5 w-5 text-yellow-400" />,
  title: "Welcome to\n",
  titleHighlight: "Feature Name",
  subtitle: "One sentence describing the user's job.",
  features: [
    { icon: <Icon className="h-5 w-5 text-yellow-400" />, title: "Action", desc: "Short benefit." },
  ],
  buttonText: "Open Feature Name",
  BackgroundComponent: FeatureBackground,
};
```

Keep feature cards short and action-oriented.

## Required Asset Pattern

If the feature adds images, videos, icons, or generated media:

1. Put URL-referenced files in `public/`.
2. Put imported files in `src/assets/`.
3. Add the asset to `docs/ASSETS.md`.
4. Remove old generated variants that are not used.
5. Run a filename search before deleting or renaming assets.

Search command:

```bash
rg "asset-name.ext|/asset-name.ext|assets/asset-name.ext"
```

## Required Native Command Pattern

If the feature needs Tauri commands:

1. Add a Rust module under `src-tauri/src/sub_apps/feature_name/`.
2. Export it from `src-tauri/src/sub_apps.rs`.
3. Register commands in `src-tauri/src/lib.rs`.
4. Keep command names prefixed by feature area.

Command naming format:

```text
feature_action_target
```

Examples:

- `ve_probe_media`
- `photo_export_file`
- `notes_create_note`

Prefer a short stable prefix for larger feature areas.

## Required Supabase Pattern

If the feature changes the database:

1. Add a timestamped migration under `supabase/migrations/`.
2. Use clear table and column names.
3. Update `docs/FEATURES.md` with the user-facing behavior.
4. Update `docs/ARCHITECTURE.md` with the data-flow impact.

Migration filename format:

```text
YYYYMMDDHHMMSS_feature_name_change.sql
```

## Required Testing Pattern

Every new feature or sub-app needs at least one test at the right layer. Follow `docs/TESTING.md`.

Minimum expectations:

- Shared utility or engine logic gets a unit test.
- React UI gets a render or interaction test.
- Route-level features get a smoke test.
- Tauri commands get Rust tests when behavior is native.
- Critical user journeys get an end-to-end test.

Add test notes to `docs/TESTING.md` only when the feature introduces a new testing pattern, mock, fixture, or command.

## Required Completion Checklist

Copy this checklist into the PR, commit notes, or task notes:

```text
Feature/sub-app name:
Route added or updated:
Sidebar entry added if needed:
Welcome screen added if needed:
Frontend page/component pattern followed:
Engine folder added only if needed:
Tauri commands registered if needed:
Supabase migration added if needed:
Assets added to docs/ASSETS.md:
Tests added or updated:
docs/TESTING.md updated if test strategy changed:
docs/FEATURES.md updated:
docs/ARCHITECTURE.md updated if needed:
docs/DEVELOPMENT.md updated if setup changed:
Version bump considered using docs/VERSIONING.md:
Build/checks run:
Old docs/assets removed:
```

## Do Not Do This

- Do not create a new documentation file for every small feature.
- Do not keep unused generated image variants.
- Do not put imported React assets in `public/`.
- Do not put URL-only assets in `src/assets/`.
- Do not add native commands without documenting their feature boundary.
- Do not add sidebar routes without matching route entries.
