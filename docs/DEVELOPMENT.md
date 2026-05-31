# Development Guide

## Prerequisites

- Node.js 18 or newer
- npm
- Rust toolchain
- Tauri prerequisites for your operating system

## Install

```bash
npm install
```

## Web Development

```bash
npm run dev
```

Vite serves the frontend for browser-based development.

## Desktop Development

```bash
npm run tauri dev
```

Tauri starts the Vite dev server through `beforeDevCommand` and opens the desktop shell at `http://localhost:1420`.

## Production Build

```bash
npm run build
npm run tauri build
```

`npm run build` runs TypeScript checking and Vite bundling. Tauri then packages the desktop app from `dist/`.

## Sidecars

The video editor expects FFmpeg and FFprobe sidecars under `src-tauri/binaries/`.

Current configured sidecars:

- `ffmpeg`
- `ffprobe`

The Windows binaries are present as:

- `src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe`
- `src-tauri/binaries/ffprobe-x86_64-pc-windows-msvc.exe`

Use `scripts/download-ffmpeg.ps1` when refreshing local FFmpeg binaries.

## Supabase

Database migrations live in `supabase/migrations/`. Keep schema changes additive and timestamped. When a feature depends on a migration, document the user-facing behavior in `FEATURES.md` and any data-flow implications in `ARCHITECTURE.md`.

## Checks

Run these before shipping a change when possible:

```bash
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

## Troubleshooting

- If the frontend builds but the desktop app fails, check `src-tauri/tauri.conf.json`, sidecar paths, and Tauri permissions.
- If video features fail, confirm FFmpeg and FFprobe are available through the configured sidecars.
- If authenticated modules do not open, check the Supabase client setup and Google auth requirements.
- If assets do not appear, check whether the code expects a public URL from `public/` or an imported module from `src/assets/`.
