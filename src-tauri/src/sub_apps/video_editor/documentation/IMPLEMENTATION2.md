# Fix DawnDesk Video Editor — All Broken Features

Complete the DawnDesk video editor by fixing all identified broken/stub features across the frontend components, preview engine, audio system, effects pipeline, export backend, and UI interactions.

## User Review Required

> [!IMPORTANT]
> **Scope**: This plan covers ~20 bugs/stubs across 15+ files. The changes are all frontend TypeScript/React + Rust backend. No new dependencies are needed.

> [!WARNING]
> **Export**: The Rust backend `ve_export_project` is currently a simulated fake (just emits 0-100 progress, writes no file). Making this a **real** FFmpeg export requires building the full `filter_complex` command chain from the timeline state. This is the most complex single change and I will implement a working version that handles single-track multi-clip concatenation with trim, speed, effects, and transitions.

> [!CAUTION]
> **Waveform**: Real waveform extraction from FFmpeg is computationally expensive. I will implement a real FFmpeg-based waveform extractor that runs asynchronously so it doesn't block the UI.

## Open Questions

> [!IMPORTANT]
> **Audio Processing (EQ, Compressor, Reverb, Noise Reduction)**: These audio effects in `AudioPanel.tsx` currently have `onChange={() => {}}` stubs. Full Web Audio API integration for real-time audio processing during preview is extremely complex. **I plan to wire up the UI controls to state so values are stored and can be used during FFmpeg export, but not add real-time audio processing in the preview.** Is that acceptable, or do you want real-time Web Audio preview too?

> [!IMPORTANT]
> **Masks & Chroma Key**: The MaskPanel has stub controls. I will wire the chroma key controls to state so they're stored for export, but canvas-based mask rendering (freehand drawing, pen tool paths) is a very large feature. **I plan to wire up all controls to state but not build a full interactive mask drawing system on the canvas.** Is that acceptable?

---

## Proposed Changes

### Phase 1: Critical Bugs & Quick Fixes

#### [MODIFY] [VideoEditorOnboarding.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/VideoEditorOnboarding.tsx)
- **Fix forced onboarding**: Replace the `FORCE ONBOARDING FOR TESTING` code with proper `localStorage` check so the onboarding only shows for first-time users.

#### [MODIFY] [VideoEditorContext.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/engine/video-editor/VideoEditorContext.tsx)
- **Remove duplicate UNDO handler**: Delete the dead `UNDO` case from `baseReducer` (lines 989-993) since `videoEditorReducer` already handles it.
- **Add REDO to baseReducer comment**: (Already handled by wrapper, just clean up)

---

### Phase 2: Preview Canvas — Video Compositing & Effects

#### [MODIFY] [PreviewCanvas.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/preview/PreviewCanvas.tsx)
The preview canvas currently ignores effects, transitions, text overlays, opacity blending, color grading, and track mute/visibility. Major changes:

- **Apply CSS-style effects to canvas**: After drawing each clip frame, apply `clip.effects` using Canvas 2D filters (brightness, contrast, saturate, hue-rotate, blur, grayscale, sepia, invert) and manual pixel manipulation for more complex effects.
- **Apply color grading**: After compositing all clips, apply global color grading (exposure, contrast, saturation, temperature, tint, vignette) using canvas filter strings and/or pixel-level manipulation.
- **Render text overlays**: If `state.activeTextOverlay` is set, draw it on the canvas using `ctx.fillText()` with proper font, size, color, alignment, shadow, outline, and position.
- **Apply clip opacity**: Already partially done via `ctx.globalAlpha`, ensure it's working for all clip types including images.
- **Respect track mute/visibility**: Skip rendering clips from invisible tracks (already done), but also handle `muted` for audio tracks.
- **Handle blend modes**: Apply `ctx.globalCompositeOperation` based on clip's blend mode if set.
- **Add transition rendering between clips**: For adjacent clips with transitions, render a cross-fade/dissolve effect using canvas alpha blending. For simple transitions (fade, dissolve), this is achievable with canvas.
- **Media cache cleanup**: Clear cache entries when media is removed from the project.

---

### Phase 3: Audio Playback System

#### [MODIFY] [PreviewCanvas.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/preview/PreviewCanvas.tsx)
- **Unmute video elements**: Remove `vid.muted = true` and instead set `vid.volume` based on `clip.volume * trackVolume * masterVolume`.
- **Only play audio from the active/visible clip** to avoid cacophony.
- **Play/pause video elements in sync with playback state**.

#### [MODIFY] [AudioPanel.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/panels/AudioPanel.tsx)
- **Wire up all audio controls to state**: Replace all `onChange={() => {}}` stubs with actual state dispatches.
- **Add audio state to types**: Add EQ, Compressor, Reverb, Noise Reduction state to the clip or global state.
- **Connect AudioMeter to actual playback levels**: Use Web Audio API `AnalyserNode` to get real audio levels when playing.

#### [MODIFY] [types.ts](file:///e:/codingfolder/tauri/DawnDesk/src/engine/video-editor/types.ts)
- **Add audio effects state**: `AudioEffects` type already exists but needs to be connected to the state tree. Add `audioEffects` to `VideoEditorState`.

#### [MODIFY] [VideoEditorContext.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/engine/video-editor/VideoEditorContext.tsx)
- **Add audio effects reducer actions**: `SET_AUDIO_EFFECTS` for EQ, compressor, reverb, noise reduction.

---

### Phase 4: Effects & Transitions — UI Wiring

#### [MODIFY] [EffectsBrowser.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/panels/EffectsBrowser.tsx)
- **Add `onDragStart` handler**: Set drag data with effect type so effects can be dragged onto timeline clips.
- **Add double-click to apply**: Double-clicking an effect applies it to the currently selected clip.

#### [MODIFY] [TransitionBrowser.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/panels/TransitionBrowser.tsx)
- **Add `onDragStart` handler**: Set drag data with transition type.
- **Add double-click to apply**: Double-clicking a transition applies it to the currently selected clip's incoming edge.

#### [MODIFY] [TimelineClip.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/timeline/TimelineClip.tsx)
- **Add drop handler for effects and transitions**: Accept drops from EffectsBrowser and TransitionBrowser, dispatch `ADD_EFFECT` or `ADD_TRANSITION`.

#### [MODIFY] [PropertiesPanel.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/panels/PropertiesPanel.tsx)
- **Wire Blend Mode select**: Add `value` binding to `clip.blendMode` state and `onChange` handler that dispatches update.

#### [MODIFY] [ColorGradingPanel.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/panels/ColorGradingPanel.tsx)
- **Add color wheel mouse interaction**: Add `onMouseDown` handler to color wheel canvases that calculates the clicked position relative to center, converts to r/g values, and dispatches `SET_COLOR_WHEEL`.
- **Wire LUT load button**: Add `onClick` handler that opens a file dialog to select a .cube/.3dl LUT file, reads it, and stores the path in state.

#### [MODIFY] [MaskPanel.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/panels/MaskPanel.tsx)
- **Wire Chroma Key controls**: Add state for chroma key (enabled, keyColor, tolerance, edgeSoft, spillSuppression) and dispatch on change.
- **Wire toggle button**: Add `onClick` and active state binding.
- **Wire color picker**: Add `onChange` handler.

---

### Phase 5: Export Pipeline — Real FFmpeg Export

#### [MODIFY] [mod.rs](file:///e:/codingfolder/tauri/DawnDesk/src-tauri/src/sub_apps/video_editor/mod.rs)
Replace the simulated `ve_export_project` with a **real FFmpeg export** that:
1. Accepts the full project state (tracks, clips, effects, transitions) as serialized JSON.
2. Builds a proper FFmpeg command with:
   - `-i` inputs for each unique media file
   - `-filter_complex` with trim, setpts, speed changes, effect filters, transition (xfade) filters, and concat
   - Output codec/format/bitrate settings from export settings
3. Spawns FFmpeg as a sidecar process.
4. Parses stderr for `time=` progress patterns and emits `export-progress` events.
5. Emits `export-complete` with the output path when done.
6. Supports cancellation by killing the child process.

Also fix:
- **`ve_generate_waveform`**: Replace simulated data with actual FFmpeg waveform extraction using `ffmpeg -i input -filter:a "aformat=channel_layouts=mono,showwavespic=s=800x100:colors=white" -frames:v 1 -f image2pipe pipe:1` or by parsing audio peaks with `astats`.
- **`ve_cancel_export`**: Store the child process handle and kill it on cancel.

#### [MODIFY] [ExportDialog.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/export/ExportDialog.tsx)
- **Add output path selection**: Add a "Choose Output Location" button that uses Tauri's `save` dialog to let the user pick where to save the exported file, and store the path in export settings.

#### [MODIFY] [useFFmpeg.ts](file:///e:/codingfolder/tauri/DawnDesk/src/engine/video-editor/useFFmpeg.ts)
- **Pass full project state to export**: Send the complete project state (tracks, clips, media paths) to the backend export command so it can build the FFmpeg filter chain.
- **Replace `alert()` calls with toast notifications**: Use the existing `sonner` dependency for proper toast notifications instead of blocking `alert()`.

---

### Phase 6: UI Polish & Missing Interactions

#### [MODIFY] [TimelineClip.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/components/video-editor/timeline/TimelineClip.tsx)
- **Use real waveform data**: When `clip.mediaType === 'audio'`, use the media item's `waveformData` (fetched from backend) instead of `Math.sin() + Math.random()`.
- **Respect snap setting**: When dragging clips, use `snapTime()` from context for magnetic snapping (already handled by `MOVE_CLIP` reducer action).

#### [MODIFY] [VideoEditorContext.tsx](file:///e:/codingfolder/tauri/DawnDesk/src/engine/video-editor/VideoEditorContext.tsx)
- **Add `blendMode` to Clip type**: Ensure the Clip type includes an optional `blendMode` field.
- **Add chroma key state**: Add chroma key fields to state or the Mask type.
- **Add audio effects state and actions**: Wire up audio processing parameters.

#### [MODIFY] [types.ts](file:///e:/codingfolder/tauri/DawnDesk/src/engine/video-editor/types.ts)
- **Add `blendMode` to Clip** type if not already present.
- **Add `chromaKey` to Mask** type with enable, color, tolerance, edgeSoft, spillSuppression fields.
- **Add `audioEffects` to VideoEditorState**.

---

## Verification Plan

### Automated Tests
```bash
# Build the Tauri app to check for compilation errors
cd e:\codingfolder\tauri\DawnDesk
npm run build

# Run Rust tests
cd src-tauri
cargo test
```

### Manual Verification
- **Open the video editor** — should skip onboarding if previously completed
- **Import media files** — should probe duration, generate thumbnails
- **Add clips to timeline** — should render in preview canvas
- **Apply effects** — drag or double-click effects onto clips
- **Adjust color grading** — preview should update in real-time
- **Add text overlay** — should render on preview canvas
- **Play/pause** — video and audio should play in sync
- **Audio controls** — master volume, clip volume should affect playback
- **Export** — should produce a real video file with all effects applied
- **Undo/Redo** — should work for all timeline operations
- **Keyboard shortcuts** — all defined shortcuts should function
- **Save/Load project** — project state should persist correctly
