# Bundle FFmpeg & Make Video Editor Functional

Bundle FFmpeg as a sidecar binary with the Tauri app and create the backend Rust commands + frontend hooks to make the video editor fully operational (media import, probe, thumbnail generation, waveform extraction, and export/render).

> [!IMPORTANT]
> The existing UI will NOT be modified. All changes are backend Rust commands, frontend engine hooks, and configuration files.

## Open Questions

> [!IMPORTANT]
> **FFmpeg Binary Source**: FFmpeg needs to be downloaded manually and placed in `src-tauri/binaries/`. I will create a PowerShell script to automate this download. The binary must be named `ffmpeg-x86_64-pc-windows-msvc.exe` for Windows. Should I also include `ffprobe` for media probing? (Recommended: **Yes**, include both `ffmpeg` and `ffprobe`)

## Proposed Changes

### 1. FFmpeg Sidecar Setup

#### [NEW] `src-tauri/binaries/` directory
- Will contain `ffmpeg-x86_64-pc-windows-msvc.exe` and `ffprobe-x86_64-pc-windows-msvc.exe`
- Binaries are downloaded via a setup script (not committed to git)

#### [NEW] [download-ffmpeg.ps1](file:///E:/codingfolder/tauri/DawnDesk/scripts/download-ffmpeg.ps1)
- PowerShell script to download FFmpeg/FFprobe from gyan.dev (trusted Windows builds)
- Extracts and renames binaries to match Tauri's sidecar naming convention
- Places them in `src-tauri/binaries/`

#### [MODIFY] [tauri.conf.json](file:///E:/codingfolder/tauri/DawnDesk/src-tauri/tauri.conf.json)
- Add `"externalBin": ["binaries/ffmpeg", "binaries/ffprobe"]` to `bundle` section

#### [MODIFY] [default.json](file:///E:/codingfolder/tauri/DawnDesk/src-tauri/capabilities/default.json)
- Add `shell:allow-execute` permission for ffmpeg and ffprobe sidecars

#### [MODIFY] [Cargo.toml](file:///E:/codingfolder/tauri/DawnDesk/src-tauri/Cargo.toml)
- Add `tauri-plugin-shell` dependency
- Add `tauri-plugin-dialog` dependency (for file picker)
- Add `tauri-plugin-fs` dependency (for file system access)
- Add `base64` crate for thumbnail encoding

#### [MODIFY] [lib.rs](file:///E:/codingfolder/tauri/DawnDesk/src-tauri/src/lib.rs)
- Register `tauri_plugin_shell`, `tauri_plugin_dialog`, `tauri_plugin_fs` plugins
- Register new video_editor Tauri commands

#### [MODIFY] [package.json](file:///E:/codingfolder/tauri/DawnDesk/package.json)
- Add `@tauri-apps/plugin-shell` dependency
- Add `@tauri-apps/plugin-dialog` dependency
- Add `@tauri-apps/plugin-fs` dependency

---

### 2. Rust Backend — Video Editor Commands

#### [MODIFY] [mod.rs](file:///E:/codingfolder/tauri/DawnDesk/src-tauri/src/sub_apps/video_editor/mod.rs)

Implement the following Tauri commands:

1. **`ve_probe_media`** — Use ffprobe sidecar to get media metadata (duration, resolution, codec, fps, audio channels)
2. **`ve_generate_thumbnail`** — Use ffmpeg sidecar to extract a frame at a given timestamp and return base64 PNG
3. **`ve_generate_waveform`** — Use ffmpeg sidecar to extract audio peaks for waveform visualization
4. **`ve_import_media`** — Open file dialog, probe selected files, return MediaItem data
5. **`ve_export_project`** — Build and run ffmpeg command to render the final video with all settings
6. **`ve_get_export_progress`** — Parse ffmpeg stderr progress output for render progress
7. **`ve_cancel_export`** — Kill running ffmpeg process
8. **`ve_save_project`** — Serialize project state to JSON file
9. **`ve_load_project`** — Deserialize project state from JSON file
10. **`ve_check_ffmpeg`** — Verify ffmpeg/ffprobe sidecars are available and return version info

---

### 3. Frontend Engine — Hooks & Integration

#### [NEW] [useFFmpeg.ts](file:///E:/codingfolder/tauri/DawnDesk/src/engine/video-editor/useFFmpeg.ts)

Custom hook wrapping all Tauri invoke calls:
- `checkFFmpeg()` — Verify FFmpeg is available
- `probeMedia(path)` — Get media info
- `generateThumbnail(path, time)` — Extract frame thumbnail
- `generateWaveform(path)` — Get waveform data
- `importMedia()` — Open file picker + probe
- `exportProject(settings, tracks)` — Start render
- `cancelExport()` — Cancel render
- `saveProject(project)` — Save to file
- `loadProject()` — Load from file

#### [MODIFY] [VideoEditorContext.tsx](file:///E:/codingfolder/tauri/DawnDesk/src/engine/video-editor/VideoEditorContext.tsx)

Add new actions to the reducer:
- `IMPORT_MEDIA_START` / `IMPORT_MEDIA_SUCCESS` / `IMPORT_MEDIA_ERROR`
- `EXPORT_START` / `EXPORT_PROGRESS` / `EXPORT_COMPLETE` / `EXPORT_ERROR`
- `SET_FFMPEG_STATUS`

Add new state fields:
- `ffmpegAvailable: boolean`
- `isImporting: boolean`
- `isExporting: boolean`
- `exportProgress: number`

#### [MODIFY] [types.ts](file:///E:/codingfolder/tauri/DawnDesk/src/engine/video-editor/types.ts)

Add new types for FFmpeg integration:
- `FFmpegStatus`
- `MediaProbeResult`
- New action types for import/export

---

### 4. Frontend Components — Wire Up Backends (No UI Changes)

These are **logic-only changes** to connect existing UI buttons to backend commands. No visual changes.

#### [MODIFY] [MediaBin.tsx](file:///E:/codingfolder/tauri/DawnDesk/src/components/video-editor/panels/MediaBin.tsx)
- Wire "Import Media" button to `useFFmpeg().importMedia()`
- On import success, dispatch `ADD_MEDIA_BATCH`

#### [MODIFY] [ExportDialog.tsx](file:///E:/codingfolder/tauri/DawnDesk/src/components/video-editor/export/ExportDialog.tsx)
- Wire "Export" button to `useFFmpeg().exportProject()`
- Show progress bar during export

#### [MODIFY] [MenuBar.tsx](file:///E:/codingfolder/tauri/DawnDesk/src/components/video-editor/toolbar/MenuBar.tsx)
- Wire File > Save/Open/Import to backend commands

#### [MODIFY] [StatusBar.tsx](file:///E:/codingfolder/tauri/DawnDesk/src/components/video-editor/StatusBar.tsx)
- Show FFmpeg status indicator (available/missing)

---

## Verification Plan

### Automated Tests
1. `cargo build` — Rust backend compiles
2. `npx tsc --noEmit` — TypeScript passes
3. FFmpeg sidecar responds to `--version` flag

### Manual Verification
- Import a video file → appears in MediaBin with thumbnail and metadata
- Import an audio file → appears with waveform data
- Export project → FFmpeg renders video to Downloads folder
- Save/Load project works correctly
- FFmpeg status indicator shows green when available
