# DawnDesk

DawnDesk is a local-first desktop productivity workspace built with React, TypeScript, Tailwind CSS, and Tauri. It brings multiple work tools into one shell: dashboard, project management, finance, notes, prompt management, photo editing, video editing, workflow building, developer tools, and settings.

## Quick Start

```bash
npm install
npm run dev
```

For the desktop app:

```bash
npm run tauri dev
```

For a production build:

```bash
npm run build
npm run tauri build
```

## Documentation

The documentation is kept in a small set of living files. When a feature changes, update the relevant existing doc instead of creating a new one.

- [Documentation index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Features](docs/FEATURES.md)
- [Development guide](docs/DEVELOPMENT.md)
- [Asset inventory](docs/ASSETS.md)
- [Documentation maintenance](docs/DOCUMENTATION_GUIDE.md)

## Tech Stack

- React 19 and TypeScript
- Vite
- Tailwind CSS
- Tauri 2 and Rust
- Supabase for cloud-backed feature areas
- FFmpeg and FFprobe sidecars for video tooling

## Current App Areas

- Dashboard
- Project Manager
- Finance Manager
- Notes
- Prompt Manager
- Photo Editor
- Video Editor
- Workflow Builder
- Developer Tools
- Settings

## Repository Layout

```text
src/                  React app, pages, components, frontend engines
src/assets/           Bundled frontend image assets imported by code
public/               Static public assets referenced by URL
src-tauri/            Tauri desktop shell, Rust commands, sidecars
supabase/migrations/  Database schema migrations
scripts/              Local helper scripts
docs/                 Living project documentation
```

## Documentation Rule

Do not create one-off documentation files for every feature. Update the existing docs:

- Add user-facing capability changes to `docs/FEATURES.md`.
- Add structure, data flow, or native-command changes to `docs/ARCHITECTURE.md`.
- Add setup, commands, troubleshooting, or environment changes to `docs/DEVELOPMENT.md`.
- Add new images, videos, icons, and cleanup notes to `docs/ASSETS.md`.
- Add documentation process changes to `docs/DOCUMENTATION_GUIDE.md`.
