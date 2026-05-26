# Video Editor — Complete Implementation Plan

Build a professional video editor sub-app within DawnDesk, implementing all 13 feature categories from the [README.md](file:///E:/codingfolder/tauri/DawnDesk/src-tauri/src/sub_apps/video_editor/documentation/README.md).

## User Review Required

> [!IMPORTANT]
> **Scope**: The README describes features matching Adobe Premiere Pro / DaVinci Resolve. This plan implements a **fully functional, professional-grade video editor** with a complete UI and real editing logic. The editor will use HTML5 `<video>`, `<canvas>`, and Web Audio APIs for real-time preview, with FFmpeg (via Tauri backend) for media import/export.

> [!WARNING]
> **FFmpeg Dependency**: Media import (metadata extraction, thumbnails, waveform) and export (rendering) require FFmpeg. The backend will invoke FFmpeg as a child process.

## Open Questions

> [!IMPORTANT]
> 1. **FFmpeg**: Should it be bundled with the app, or assumed available on PATH?
> 2. **Priority**: Implement all 6 phases sequentially, or focus on specific phases?

---

## Architecture

Following the established **photo-editor** pattern exactly:

```
┌─ AppShell (Navbar + Sidebar + <Outlet />) ────────────────┐
│                                                            │
│  VideoEditor Page                                          │
│  └─ VideoEditorOnboarding (EXISTING — 451 lines)           │
│     └─ VideoEditorProvider (Context + useReducer)           │
│        └─ VideoEditorInner (CSS Grid layout)               │
│           ┌─────────────────────────────────────┐          │
│           │ ve-menu-bar     (top menu)          │          │
│           │ ve-toolbar      (tool strip)        │          │
│           ├──────┬──────────────┬───────────────┤          │
│           │ ve-  │ ve-canvas    │ ve-right-     │          │
│           │ left │ (preview)    │ panel         │          │
│           │ panel│              │ (properties)  │          │
│           ├──────┴──────────────┴───────────────┤          │
│           │ ve-timeline   (bottom, multi-track) │          │
│           │ ve-status-bar (bottom info)         │          │
│           └─────────────────────────────────────┘          │
│                                                            │
│  Engine: src/engine/video-editor/                          │
│  ├─ types.ts (Project, Timeline, Track, Clip, Effect...)   │
│  ├─ VideoEditorContext.tsx (state + dispatch)               │
│  ├─ timelineOps.ts, mediaOps.ts, exportOps.ts              │
│                                                            │
│  Backend: src-tauri/src/sub_apps/video_editor/             │
│  ├─ commands.rs, models.rs, project.rs, render.rs          │
└────────────────────────────────────────────────────────────┘
```

**Key conventions** (matching existing codebase):
- **CSS**: Tailwind `dd-*` classes for standard UI + custom `ve-*` CSS for editor layout
- **State**: React Context + `useReducer` (same as photo-editor)
- **Colors**: `#0A0A0A` bg, `#FACC15` (yellow-400) accent, neutral-800 borders
- **Fonts**: Sora (headings), Manrope (body), JetBrains Mono (timecodes)
- **Icons**: `lucide-react`
- **Height**: `calc(100vh - 4rem)` (AppShell navbar is 4rem)
- **Prefix**: All video editor CSS classes use `ve-` (matching photo-editor's `pe-`)

---

## Proposed Changes

### Phase 1: Engine Layer & Core Types

Foundation types and state management — everything else builds on this.

---

#### [NEW] [types.ts](file:///E:/codingfolder/tauri/DawnDesk/src/engine/video-editor/types.ts)

Core TypeScript types:

```ts
// Tool types
type VideoToolType = 'select' | 'razor' | 'slip' | 'slide' | 'hand' | 'zoom' | 'text' | 'shape' | 'crop';

// Core data structures
interface Project { id, name, resolution, frameRate, tracks[], mediaPool[], markers[] }
interface Track { id, name, type: 'video'|'audio', clips[], muted, solo, locked, volume, height }
interface Clip { id, trackId, mediaId, startTime, duration, inPoint, outPoint, effects[], transitions, speed, reversed }
interface MediaItem { id, name, path, type: 'video'|'audio'|'image', duration, resolution, codec, thumbnail, waveformData }
interface Effect { id, type, params: Record<string,any>, keyframes[], enabled }
interface Transition { id, type, duration, easing }
interface Keyframe { time, value, easing }
interface Marker { time, label, color }
interface HistoryEntry { description, state snapshot }

// Editor state
interface VideoEditorState {
  project: Project | null;
  activeTool: VideoToolType;
  selectedClipIds: string[];
  selectedTrackId: string | null;
  playheadTime: number;
  isPlaying: boolean;
  zoom: number;
  snapEnabled: boolean;
  history: HistoryEntry[];
  historyIndex: number;
  // panels
  activeRightPanel: 'properties' | 'effects' | 'color' | 'text' | 'audio';
  leftPanelTab: 'media' | 'effects' | 'transitions';
  // export
  exportSettings: ExportSettings;
  isExporting: boolean;
  exportProgress: number;
}

// Actions
type VideoEditorAction = 
  | { type: 'NEW_PROJECT'; payload: ProjectSettings }
  | { type: 'SET_TOOL'; payload: VideoToolType }
  | { type: 'ADD_TRACK'; payload: Track }
  | { type: 'ADD_CLIP'; payload: { trackId, clip } }
  | { type: 'MOVE_CLIP'; payload: { clipId, trackId, startTime } }
  | { type: 'TRIM_CLIP'; payload: { clipId, edge: 'start'|'end', newTime } }
  | { type: 'SPLIT_CLIP'; payload: { clipId, time } }
  | { type: 'DELETE_CLIPS'; payload: string[] }
  | { type: 'SET_PLAYHEAD'; payload: number }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'ADD_EFFECT'; payload: { clipId, effect } }
  | { type: 'ADD_TRANSITION'; payload: { clipId, edge, transition } }
  | { type: 'ADD_MEDIA'; payload: MediaItem }
  | { type: 'UNDO' } | { type: 'REDO' }
  // ... 40+ action types total
```

#### [NEW] [VideoEditorContext.tsx](file:///E:/codingfolder/tauri/DawnDesk/src/engine/video-editor/VideoEditorContext.tsx)

State management with ~800-line reducer covering:
- Project CRUD operations
- Timeline manipulation (add/move/trim/split/delete clips)
- Track operations (add/remove/mute/solo/lock)
- Playback control
- Tool selection
- Effect/transition management
- Undo/redo with deep history stack
- Selection management
- Zoom/snap control

Exports `VideoEditorProvider`, `useVideoEditor()` hook.

#### [NEW] [constants.ts](file:///E:/codingfolder/tauri/DawnDesk/src/engine/video-editor/constants.ts)

Default values, effect definitions, transition presets, export presets, keyboard shortcuts.

---

### Phase 2: Core Layout, Timeline & Preview

The backbone editor UI — CSS Grid layout with multi-track timeline.

---

#### [NEW] [video-editor.css](file:///E:/codingfolder/tauri/DawnDesk/src/components/video-editor/video-editor.css)

Custom CSS for the editor layout (following `pe-` pattern with `ve-` prefix):

```css
.ve-app {
  display: grid;
  grid-template-rows: auto auto 1fr auto auto;           /* menu, toolbar, main, timeline, status */
  grid-template-columns: auto 1fr auto;                   /* left-panel, canvas, right-panel */
  height: calc(100vh - 4rem);
  overflow: hidden;
  background: #0A0A0A;
}
.ve-menu-bar    { grid-column: 1 / -1; }
.ve-toolbar     { grid-column: 1 / -1; }
.ve-left-panel  { grid-row: 3; grid-column: 1; width: 280px; }
.ve-canvas-area { grid-row: 3; grid-column: 2; }
.ve-right-panel { grid-row: 3; grid-column: 3; width: 300px; }
.ve-timeline    { grid-column: 1 / -1; grid-row: 4; height: 280px; }
.ve-status-bar  { grid-column: 1 / -1; }
```

Plus 500+ lines for:
- Timeline tracks, clips, ruler, playhead
- Preview canvas and transport controls
- Panel headers, tabs, scrollbars
- Clip waveforms and thumbnails
- Transition handles on timeline
- Keyframe diamonds
- Color grading wheels and curves
- Audio meters and mixers
- All hover/active/selected states
- Resize handles between panels

#### [NEW] [VideoEditorInner.tsx](file:///E:/codingfolder/tauri/DawnDesk/src/components/video-editor/VideoEditorInner.tsx)

Main layout component using CSS Grid:

```tsx
function VideoEditorInner() {
  const { state, dispatch } = useVideoEditor();
  return (
    <div className="ve-app">
      <MenuBar />
      <EditorToolbar />
      <LeftPanel />
      <PreviewCanvas />
      <RightPanel />
      <Timeline />
      <StatusBar />
    </div>
  );
}
```

#### [NEW] Timeline Components
```
src/components/video-editor/timeline/
├── Timeline.tsx          — Container with ruler, tracks area, scrolling
├── TimelineRuler.tsx     — Time ruler with frame/timecode markings
├── TimelineTrack.tsx     — Single track row with clips
├── TimelineClip.tsx      — Draggable/resizable clip block (with waveform for audio)
├── Playhead.tsx          — Draggable playhead line
├── TimelineControls.tsx  — Add track, zoom slider, snap toggle
```

**Timeline features (Phase 2):**
- Multi-track with unlimited video/audio tracks
- Drag-and-drop clip placement
- Clip trimming (drag start/end edges)
- Razor tool (click to split clips)
- Ripple edit (trim + close gap)
- Roll edit (adjust cut point between adjacent clips)
- Slip edit (shift content without moving position)
- Slide edit (move clip, trimming neighbors)
- Playhead scrubbing with frame accuracy
- Snap-to-grid / magnetic timeline
- Zoom in/out (scroll wheel + slider)
- Track headers: name, mute, solo, lock, height resize
- Waveform display on audio clips
- Thumbnail strip on video clips
- Clip markers and sequence markers
- Undo/redo with deep history

#### [NEW] Preview Components
```
src/components/video-editor/preview/
├── PreviewCanvas.tsx     — Video element + canvas overlay + transport controls
├── TransportControls.tsx — Play/pause/stop/step/loop/speed controls
```

**Preview features:**
- HTML5 `<video>` for playback with `<canvas>` overlay
- Transport: play, pause, stop, step forward/back, loop
- Playback speed control (0.25x – 4x)
- Timecode display (HH:MM:SS:FF)
- Full-screen preview toggle
- Safe zone overlays (title safe, action safe)
- Canvas overlay renders: text, shapes, masks in real-time

#### [NEW] Toolbar & Menu
```
src/components/video-editor/toolbar/
├── EditorToolbar.tsx     — Horizontal tool strip
├── MenuBar.tsx           — File/Edit/View/Clip/Effects/Export menu
```

**Tools:** Select, Razor, Slip, Slide, Hand, Zoom, Text, Shape, Crop

---

### Phase 3: Media Management, Transitions & Effects

---

#### [NEW] Left Panel Components
```
src/components/video-editor/panels/
├── LeftPanel.tsx          — Tabbed panel (Media / Effects / Transitions)
├── MediaBin.tsx           — Media library with thumbnails
├── MediaItem.tsx          — Single media item (thumbnail + metadata)
├── EffectsBrowser.tsx     — Effect library organized by category
├── TransitionBrowser.tsx  — Transition library with visual previews
├── MediaImportDialog.tsx  — Import dialog with progress
```

**Media Management features:**
- Project media bin with thumbnail grid/list views
- Folder organization with drag-and-drop
- Import via Tauri file dialog
- Metadata display (codec, resolution, duration, FPS)
- Clip rating (1-5 stars) and color flagging
- Search and filter by name, type, duration
- Drag from media bin → timeline
- Batch rename
- Subclip creation from longer source media
- Right-click context menu

**Transitions (drag onto cut points):**
- Cross dissolve, dip to black/white
- Wipe (left/right/up/down/diagonal)
- Zoom in/out, spin/rotate
- Slide (push/pull/cover/reveal)
- Glitch, light leak, film burn
- Custom duration and easing controls
- Audio crossfade (independent of video)
- Batch apply to multiple cuts

**Effects (drag onto clips):**
- Blur (gaussian, radial, directional), sharpen
- Chromatic aberration, lens distortion, vignette
- Film grain, glow/bloom, pixelate/mosaic
- Mirror/flip, emboss, edge detection
- Effect stacking with drag-to-reorder
- Enable/disable per effect
- Keyframeable parameters with timeline keyframe track

---

### Phase 4: Right Panel — Properties, Color Grading, Text, Audio

---

#### [NEW] Right Panel Components
```
src/components/video-editor/panels/
├── RightPanel.tsx         — Tabbed panel switching between sub-panels
├── PropertiesPanel.tsx    — Clip properties (position, scale, rotation, opacity)
├── ColorGradingPanel.tsx  — Full color grading suite
├── ColorWheels.tsx        — Lift/Gamma/Gain interactive wheels (canvas-rendered)
├── CurvesEditor.tsx       — RGB curves with bezier handles (canvas)
├── Scopes.tsx             — Waveform/vectorscope/histogram (canvas)
├── TextPanel.tsx          — Text/titles properties and presets
├── AudioPanel.tsx         — Audio mixer, EQ, effects
├── AudioMeter.tsx         — VU meter with peak indicators (canvas)
├── KeyframeEditor.tsx     — Keyframe track for animated properties
```

**Color Grading features:**
- Color wheels: lift (shadows), gamma (midtones), gain (highlights) — interactive canvas widgets
- RGB curves with bezier control points
- Basic corrections: exposure, contrast, highlights, shadows, whites, blacks
- Saturation, vibrance, hue shift
- HSL secondary selection (isolate by hue range)
- White balance (temperature + tint sliders)
- Scopes: waveform, vectorscope, histogram — rendered via Canvas 2D
- LUT import and application
- Color grading presets gallery
- Match color between clips

**Text & Titles features:**
- Font picker with preview (system fonts + Google Fonts)
- Font size, color, alignment, line spacing
- Title presets: lower thirds, full screen, end credits, scrolling roll
- Text animation: fade, slide, typewriter, bounce
- Text background box, drop shadow, outline
- Keyframeable position, scale, rotation
- Import SRT/VTT subtitles
- Subtitle track on timeline
- Auto-generate captions (UI scaffolded)

**Audio features:**
- Volume slider per clip with dB readout
- Audio keyframing (volume envelope on timeline)
- Mute/solo per track
- Fade in/out handles
- Audio normalization (peak/LUFS)
- EQ panel with multi-band sliders
- Compressor/limiter controls
- Reverb/echo controls
- Audio meters with peak indicators
- Waveform zoom view

---

### Phase 5: Masking, VFX & Motion Graphics

---

#### [NEW] Masking & Compositing Components
```
src/components/video-editor/panels/
├── MaskPanel.tsx          — Mask creation and editing controls
├── BlendModeSelector.tsx  — Blend mode dropdown with preview
├── ChromaKeyPanel.tsx     — Green screen removal controls
```

**Masking features:**
- Rectangle, ellipse, freehand pen mask tools
- Mask feathering and opacity controls
- Mask invert
- Blend modes: multiply, screen, overlay, add, difference, etc.
- Chroma key (green screen) with color picker and tolerance
- Luma key
- Opacity per clip/layer
- Picture-in-picture layout presets
- Split-screen multi-panel presets

**Motion Graphics:**
- Keyframe animation on position, scale, rotation, opacity
- Bezier easing curves for smooth motion
- Shape layer creation (rectangle, ellipse, polygon)
- Animated masks and reveals
- Particle effects (snow, rain, confetti) — canvas-rendered

**VFX (UI panels scaffolded):**
- Stabilization controls
- Speed ramp with optical flow interpolation (UI)
- Motion tracking panel
- AI background removal (UI scaffolded)
- Lens correction
- Face/object blur

---

### Phase 6: Export, Project Management & Backend

---

#### [NEW] Export Components
```
src/components/video-editor/export/
├── ExportDialog.tsx       — Full export settings modal
├── ExportPresets.tsx       — Platform presets (YouTube, TikTok, Instagram, etc.)
├── RenderQueue.tsx        — Batch render queue panel
├── RenderProgress.tsx     — Progress bar with ETA
```

**Export features:**
- Codec: H.264, H.265, ProRes, AV1
- Resolution presets: 4K, 1080p, 720p, 9:16, 1:1
- Frame rate: 24, 25, 29.97, 30, 60 fps
- Bitrate: CBR, VBR 1-pass, VBR 2-pass
- Platform presets: YouTube, Vimeo, Instagram, TikTok, Twitter
- Audio codec: AAC, MP3, WAV
- Render queue for batch exports
- Progress indicator with ETA and preview frame
- Subtitle burn-in option
- Chapter markers export

#### [NEW] Backend Rust Module
```
src-tauri/src/sub_apps/video_editor/
├── mod.rs         — Module declarations + re-exports
├── commands.rs    — Tauri #[command] functions
├── models.rs      — Serde data structures
├── project.rs     — Project file save/load (JSON)
├── render.rs      — FFmpeg rendering pipeline
```

**Tauri commands:**
- `ve_import_media` — Import file, extract metadata via FFprobe
- `ve_get_media_metadata` — Codec, duration, resolution, fps
- `ve_generate_thumbnail` — FFmpeg thumbnail at timestamp
- `ve_extract_waveform` — Audio waveform peak data
- `ve_save_project` / `ve_load_project` — JSON project file I/O
- `ve_render_export` — Kick off FFmpeg render
- `ve_get_render_progress` — Poll render progress
- `ve_list_fonts` — List system fonts

#### [NEW] Project Management Features
- New project (name, resolution, frame rate)
- Open project from file
- Save / Save As
- Auto-save (periodic)
- Project notes / annotations
- Sequence versioning (duplicate sequence)
- Keyboard shortcut customization (stored in localStorage)
- Dark mode (built-in, matches DawnDesk)

---

### Integration Changes

#### [MODIFY] [VideoEditor.tsx](file:///E:/codingfolder/tauri/DawnDesk/src/Pages/VideoEditor.tsx)

Update to wrap content with `VideoEditorProvider`:
```tsx
import VideoEditorOnboarding from "../components/video-editor/VideoEditorOnboarding";
import { VideoEditorProvider } from "../engine/video-editor/VideoEditorContext";
import VideoEditorInner from "../components/video-editor/VideoEditorInner";

export default function VideoEditor() {
  return (
    <VideoEditorOnboarding>
      <VideoEditorProvider>
        <VideoEditorInner />
      </VideoEditorProvider>
    </VideoEditorOnboarding>
  );
}
```

#### [MODIFY] [lib.rs](file:///E:/codingfolder/tauri/DawnDesk/src-tauri/src/lib.rs)

Register new video editor commands in `invoke_handler`.

#### [MODIFY] [Dashboard.tsx](file:///E:/codingfolder/tauri/DawnDesk/src/Pages/Dashboard.tsx)

Update Video Editor card status from `'Coming Soon'` to `'Active'` (if applicable).

---

## File Summary

| Category | New Files | Modified |
|----------|-----------|----------|
| Engine (types, context, ops) | 4 | 0 |
| Core Layout (CSS, inner, menu, toolbar) | 4 | 0 |
| Timeline | 6 | 0 |
| Preview | 2 | 0 |
| Left Panel (media, effects, transitions) | 6 | 0 |
| Right Panel (properties, color, text, audio) | 10 | 0 |
| Masking & VFX | 3 | 0 |
| Export | 4 | 0 |
| Backend (Rust) | 5 | 0 |
| Integration | 0 | 3 |
| **Total** | **~44** | **3** |

---

## Verification Plan

### Build Verification
- `npx tsc --noEmit` — TypeScript compilation
- `npm run build` — Vite production build
- `cargo build` — Rust backend compilation

### Functional Verification
- Navigate to Video Editor via sidebar → onboarding displays → complete → editor loads
- Import media files → thumbnails appear in media bin
- Drag clips to timeline → clips render on tracks
- Razor tool splits clips at playhead position
- Play/pause preview → video plays from playhead
- Apply transition between clips → visual indicator on timeline
- Apply effects to clips → effect stack in properties panel
- Color grading controls → sliders/wheels respond
- Text tool → text overlay appears on preview canvas
- Audio controls → volume/mute/solo work
- Export dialog → settings configure correctly
- Undo/redo → state rolls back/forward
- All panels resize correctly
