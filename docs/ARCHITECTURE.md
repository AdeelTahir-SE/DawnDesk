# Architecture

DawnDesk is a Tauri desktop application with a React frontend and a Rust native layer.

## Runtime Shape

- `src/main.tsx` mounts the React app inside `BrowserRouter` and wraps it with `LoggerProvider`.
- `src/App.tsx` defines routes and app-level bridges for theme bootstrapping, navigation logging, and connection-error logging.
- `src/components/AppShell.tsx` hosts the authenticated workspace layout and sidebar navigation.
- `src-tauri/src/lib.rs` registers native Tauri commands and plugins.
- `src-tauri/src/sub_apps.rs` exposes native modules for supported sub-apps.

## Frontend Routing

Public routes:

- `/`: Home landing screen.
- `/auth`: Authentication choice screen.

Workspace routes:

- `/dashboard`
- `/photo-editor`
- `/video-editor`
- `/settings`
- `/prompts`
- `/project-manager`
- `/dev-tools`
- `/finance`
- `/notes`
- `/workflow`

`/project-manager` and `/finance` are wrapped in `RequireGoogleAuth`.

## Frontend Organization

- `src/Pages/`: Route-level screens.
- `src/components/`: Shared UI and feature-specific components.
- `src/components/backgrounds/`: SVG-based welcome backgrounds.
- `src/engine/photo-editor/`: Photo editor state, import/export, filters, drawing tools, and project file logic.
- `src/engine/video-editor/`: Video editor context, FFmpeg hook, constants, and types.
- `src/lib/`: Shared service helpers such as Supabase, workspace sync, and connection errors.
- `src/utils/`: Shared types, logging, and export helpers.

## Native Layer

The Rust layer currently provides:

- App startup integration for Windows auto-launch.
- Hardware acceleration settings persisted in `native-settings.json`.
- Video editor commands for media probing, thumbnails, waveform generation, import, export, progress, cancellation, save/load, and FFmpeg checks.
- Photo editor export command.
- Notes commands for notes, notebooks, tags, links, backlinks, versions, and templates.

Registered Tauri plugins:

- `tauri-plugin-opener`
- `tauri-plugin-shell`
- `tauri-plugin-dialog`
- `tauri-plugin-fs`

## Data and Storage

- Supabase migrations live in `supabase/migrations/`.
- Some feature state is local to the browser runtime through React state and local storage.
- Native settings are stored under a DawnDesk config directory resolved from platform environment variables.
- Video export uses bundled FFmpeg and FFprobe sidecars configured in `src-tauri/tauri.conf.json`.

## Integration Boundaries

- UI code should call shared helpers from `src/lib/` or feature engines instead of invoking low-level behavior from route components.
- Tauri commands should stay grouped by feature module under `src-tauri/src/sub_apps/`.
- Public URL assets belong in `public/`; imported bundled assets belong in `src/assets/`.
