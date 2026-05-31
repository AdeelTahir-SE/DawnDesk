# Contributing to DawnDesk

Thanks for helping improve DawnDesk. Keep contributions focused, documented, and tested.

## Before You Start

1. Read [docs/README.md](docs/README.md).
2. For new features or sub-apps, follow [docs/FEATURE_AND_SUB_APP_FORMAT.md](docs/FEATURE_AND_SUB_APP_FORMAT.md).
3. For tests, follow [docs/TESTING.md](docs/TESTING.md).

## Development

Install dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev
```

Run the desktop app:

```bash
npm run tauri dev
```

Build:

```bash
npm run build
```

Run Rust tests:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

## Pull Request Checklist

```text
Feature or fix:
User-facing behavior changed:
Tests added or updated:
docs/FEATURES.md updated if needed:
docs/ARCHITECTURE.md updated if needed:
docs/DEVELOPMENT.md updated if needed:
docs/TESTING.md updated if needed:
docs/ASSETS.md updated if assets changed:
Build/checks run:
```

## Documentation Rule

Do not create one-off docs for every feature. Update the existing living docs unless a topic is large and long-lived enough to deserve its own file.

## Asset Rule

Before adding or deleting assets, update [docs/ASSETS.md](docs/ASSETS.md) and search for references:

```bash
rg "asset-name.ext|/asset-name.ext|assets/asset-name.ext"
```
