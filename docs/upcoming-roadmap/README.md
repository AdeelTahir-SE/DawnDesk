# Upcoming Roadmap

This folder tracks planned DawnDesk sub-apps and features before they are implemented. Use it for ideas that are important enough to design, but not ready to become active product documentation in `docs/FEATURES.md`.

## Files

- [Sub-Apps Backlog](SUB_APPS_BACKLOG.md): Planned sub-apps and major feature areas.
- [AI Models and RAG](AI_MODELS_AND_RAG.md): Planned AI runtime, provider, prompt, retrieval, and safety architecture.
- [Photo Editor AI](PHOTO_EDITOR_AI.md): Planned AI-assisted editing features for the Photo Editor.
- [Video Editor AI](VIDEO_EDITOR_AI.md): Planned AI-assisted editing features for the Video Editor.
- [Upcoming Feature Template](UPCOMING_FEATURE_TEMPLATE.md): Copy this format for every new planned sub-app or feature.

## Lifecycle

1. Add planned work here first.
2. Keep the plan short, clear, and linked to the app area it affects.
3. When implementation starts, move stable details into the normal docs:
   - `docs/FEATURES.md`
   - `docs/ARCHITECTURE.md`
   - `docs/ARCHITECTURE_DIAGRAMS.md`
   - `docs/TESTING.md`
   - `docs/DEVELOPMENT.md`
4. When the feature ships, keep only future-facing notes here or remove the completed plan.

## API Key Rule

Do not commit API keys, access tokens, provider secrets, model credentials, or local `.env` values. Planned AI work should reference environment variable names only.

Recommended names:

```text
DAWNDESK_AI_PROVIDER=
DAWNDESK_AI_MODEL=
DAWNDESK_EMBEDDING_MODEL=
DAWNDESK_AI_API_KEY=
DAWNDESK_VECTOR_STORE_PATH=
```

