# DawnDesk Documentation

This folder is the source of truth for DawnDesk documentation. Keep it small and current. When the app changes, update the existing file that owns that topic.

## Docs Map

- [Architecture](ARCHITECTURE.md): App structure, routing, native commands, storage, and integration boundaries.
- [Features](FEATURES.md): Current product areas and what each one does.
- [Development](DEVELOPMENT.md): Setup, commands, builds, checks, and troubleshooting.
- [Assets](ASSETS.md): Active image and media assets, where they live, and how to clean them up safely.
- [Documentation Guide](DOCUMENTATION_GUIDE.md): How to keep docs maintained without creating messy duplicate files.
- [Feature and Sub-App Format](FEATURE_AND_SUB_APP_FORMAT.md): Required format for adding new sub-apps and features.

## Update Checklist

When adding or changing a feature:

1. Update the code.
2. Update the matching section in `FEATURES.md`.
3. Update `ARCHITECTURE.md` if routes, state flow, native commands, data models, or storage changed.
4. Update `DEVELOPMENT.md` if setup, scripts, environment variables, or troubleshooting changed.
5. Update `ASSETS.md` if any public or bundled asset changed.
6. Follow `FEATURE_AND_SUB_APP_FORMAT.md` for naming, routing, folder layout, docs, and release checklist.

## Ownership Rule

Each topic should have one home. If a new idea does not fit any existing doc, add a section to the nearest existing doc first. Create a new doc only when the topic will be maintained over time and would make an existing doc too large.
