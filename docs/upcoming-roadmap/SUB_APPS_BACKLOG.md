# Sub-Apps Backlog

This file is the holding area for planned DawnDesk sub-apps and large feature groups. Keep it focused on future work. Current shipped functionality belongs in `docs/FEATURES.md`.

## Planned Sub-Apps

| Sub-App | Stage | Purpose | Notes |
| --- | --- | --- | --- |
| AI Workspace Assistant | Planned | Shared assistant that can answer questions about the workspace, summarize user data, and help navigate DawnDesk. | Should use the AI model and RAG plan before any feature-specific AI is added. |
| RAG Knowledge Base | Planned | Index selected local notes, docs, project records, and user-approved files for retrieval. | Must include source display and user-controlled indexing. |
| AI Prompt Lab | Planned | Improve Prompt Manager with model testing, prompt versioning, and evaluation notes. | Should reuse existing Prompt Manager routes and storage concepts where possible. |
| AI Media Assistant | Planned | Shared AI layer for Photo Editor and Video Editor tasks. | Should avoid duplicating provider and prompt code in each editor. |

## Planned Cross-App Features

| Feature | Stage | Affected Areas | Notes |
| --- | --- | --- | --- |
| AI model settings | Planned | Settings, AI Workspace Assistant, Photo Editor, Video Editor, Prompt Manager | Add provider, model, privacy, and usage controls in one place. |
| Local-first AI history | Planned | AI Workspace Assistant, Prompt Manager, editors | Store prompts, outputs, and user approvals locally unless cloud sync is enabled. |
| RAG indexing controls | Planned | Settings, Notes, Projects, docs | Users should choose what content is indexed. |
| AI usage logs | Planned | Settings, Dashboard | Show model calls, token estimates, failures, and user-approved actions. |
| Feature availability flags | Planned | App shell, Settings, docs | Mark experimental AI features clearly without scattering flags across the app. |

## Promotion Rule

Move an item out of this backlog when it enters implementation. At that point:

1. Add or update the feature section in `docs/FEATURES.md`.
2. Add architecture details and diagrams if data flow changes.
3. Add tests using `docs/TESTING.md`.
4. Add version notes using `docs/VERSIONING.md`.

