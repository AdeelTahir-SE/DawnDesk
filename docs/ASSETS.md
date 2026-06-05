# Asset Inventory

Use this file to keep image, video, and icon usage understandable. When adding or removing assets, update this inventory in the same change.

## Active Public Assets

Public assets are served by URL from the app root.

| Asset | Used by | Notes |
| --- | --- | --- |
| `public/realistic_logo.png` | Home, auth, prompt manager, README | Main DawnDesk logo. |
| `public/sunflower_field_with_lake.mp4` | Home, auth | Background video for public entry screens. Large file; keep only if still used. |

## Active Bundled Assets

Bundled assets are imported by source files and included by Vite.

| Asset | Used by | Notes |
| --- | --- | --- |
| `src/assets/bg-night-sky.png` | Photo editor onboarding, video editor onboarding | Shared onboarding background option. |
| `src/assets/bg-ocean.png` | Photo editor onboarding, video editor onboarding | Shared onboarding background option. |
| `src/assets/bg-forest.png` | Photo editor onboarding, video editor onboarding | Shared onboarding background option. |

## Active Desktop Icon Assets

Tauri uses these assets for desktop builds and installers.

| Asset | Used by | Notes |
| --- | --- | --- |
| `src-tauri/icons/icon-8192.png` | Source image for icon regeneration | DawnDesk desktop icon source artwork. |
| `src-tauri/icons/icon.png` | Tauri icon source | 512px PNG generated from the desktop icon source. |
| `src-tauri/icons/icon.ico` | Windows desktop icon | Multi-size ICO generated from the desktop icon source. |
| `src-tauri/icons/icon.icns` | macOS desktop icon | ICNS generated from the desktop icon source. |
| `src-tauri/icons/32x32.png`, `src-tauri/icons/128x128.png`, `src-tauri/icons/128x128@2x.png` | Tauri bundle config | PNG sizes referenced by `src-tauri/tauri.conf.json`. |
| `src-tauri/icons/Square*.png`, `src-tauri/icons/StoreLogo.png` | Windows tile and store assets | Generated from the desktop icon source. |

## Cleanup Completed

Unused legacy public assets were removed:

- `public/delete.svg`
- `public/file.svg`
- `public/logo.png`
- `public/logo.svg`
- `public/onboarding-ultra.png`
- `public/sidebar/`

Unused legacy bundled welcome images were removed:

- `src/assets/devtools-welcome-bg.png`
- `src/assets/finance-welcome-clean.png`
- `src/assets/finance-welcome-ultra.png`
- `src/assets/finance-welcome.png`
- `src/assets/notes-welcome-bg.png`
- `src/assets/notes_welcome_bg_v2.png`
- `src/assets/photo-editor-bg.png`
- `src/assets/project-welcome-clean.png`
- `src/assets/project-welcome-ultra.png`
- `src/assets/project-welcome.png`
- `src/assets/prompts-welcome-bg.png`
- `src/assets/prompts-welcome-ultra.png`

## Asset Rules

- Put files in `public/` only when code references them by URL, such as `/realistic_logo.png`.
- Put files in `src/assets/` when they are imported from React or TypeScript.
- Do not keep alternate generated versions unless the app exposes them or a design doc names them as active source material.
- Before deleting an asset, search for the filename and likely URL path:

```bash
rg "filename.ext|/filename.ext|assets/filename.ext"
```

- After deleting assets, run `npm run build` to catch broken imports.
