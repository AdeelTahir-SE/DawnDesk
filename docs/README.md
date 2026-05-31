# DawnDesk Documentation

This folder is the source of truth for DawnDesk documentation. Keep it small and current. When the app changes, update the existing file that owns that topic.

## Docs Map

- [Architecture](ARCHITECTURE.md): App structure, routing, native commands, storage, and integration boundaries.
- [Architecture Diagrams](ARCHITECTURE_DIAGRAMS.md): Per-sub-app diagrams for data storage, dependencies, and major flows.
- [Features](FEATURES.md): Current product areas and what each one does.
- [Development](DEVELOPMENT.md): Setup, commands, builds, checks, and troubleshooting.
- [Testing](TESTING.md): Test layers, naming rules, required coverage, and templates for new tests.
- [Versioning](VERSIONING.md): Version bump rules, source files, and release checklist.
- [Assets](ASSETS.md): Active image and media assets, where they live, and how to clean them up safely.
- [Documentation Guide](DOCUMENTATION_GUIDE.md): How to keep docs maintained without creating messy duplicate files.
- [Feature and Sub-App Format](FEATURE_AND_SUB_APP_FORMAT.md): Required format for adding new sub-apps and features.
- [Upcoming Roadmap](upcoming-roadmap/README.md): Planned sub-apps and features that are not implemented yet, including AI, RAG, Photo Editor AI, and Video Editor AI.

## Update Checklist

When adding or changing a feature:

1. Update the code.
2. Update the matching section in `FEATURES.md`.
3. Update `ARCHITECTURE.md` and `ARCHITECTURE_DIAGRAMS.md` if routes, state flow, native commands, data models, or storage changed.
4. Update `DEVELOPMENT.md` if setup, scripts, environment variables, or troubleshooting changed.
5. Update `TESTING.md` if the feature adds new test patterns, commands, mocks, or coverage rules.
6. Update `VERSIONING.md` and version fields if the change should ship as a new app version.
7. Update `ASSETS.md` if any public or bundled asset changed.
8. Follow `FEATURE_AND_SUB_APP_FORMAT.md` for naming, routing, folder layout, docs, tests, and release checklist.
9. Use `upcoming-roadmap/` only for planned work that has not shipped yet.

## Ownership Rule

Each topic should have one home. If a new idea does not fit any existing doc, add a section to the nearest existing doc first. Create a new doc only when the topic will be maintained over time and would make an existing doc too large.
