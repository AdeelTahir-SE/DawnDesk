# DawnDesk Photo Editor — ARCHITECTURE.md

> Architecture document for the Photo Editor sub-app.  
> Scope: **v0.1 MVP (28 features)** — the minimum viable photo editor shipping on launch day.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TAURI WINDOW (WebView)                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                  REACT FRONTEND (TypeScript)                     │  │
│  │                                                                   │  │
│  │  ┌──────────┐  ┌───────────────────────┐  ┌──────────────────┐   │  │
│  │  │ Toolbar  │  │   HTML5 Canvas (Main)  │  │  Right Panel     │   │  │
│  │  │  Panel   │  │   ┌───────────────┐    │  │  ┌────────────┐  │   │  │
│  │  │          │  │   │ Render Layer  │    │  │  │Adjustments │  │   │  │
│  │  │ Tools    │  │   │ (OffScreen)   │    │  │  │  Panel     │  │   │  │
│  │  │ Colors   │  │   └───────────────┘    │  │  ├────────────┤  │   │  │
│  │  │          │  │   ┌───────────────┐    │  │  │  Layers    │  │   │  │
│  │  │          │  │   │  UI Overlay   │    │  │  │  Panel     │  │   │  │
│  │  │          │  │   │  (Selection,  │    │  │  ├────────────┤  │   │  │
│  │  │          │  │   │   Guides)     │    │  │  │ Histogram  │  │   │  │
│  │  │          │  │   └───────────────┘    │  │  └────────────┘  │   │  │
│  │  └──────────┘  └───────────────────────┘  └──────────────────┘   │  │
│  │  ┌───────────────────────────────────────────────────────────┐    │  │
│  │  │              Status Bar + Filmstrip                       │    │  │
│  │  └───────────────────────────────────────────────────────────┘    │  │
│  │                                                                   │  │
│  │  ┌───────────────────────────────────────────────────────────┐    │  │
│  │  │         EditorEngine (Core State Manager)                 │    │  │
│  │  │  • ImageDocument model   • Tool state machine             │    │  │
│  │  │  • Undo/Redo history     • Selection state                │    │  │
│  │  │  • Viewport transform    • Active adjustments             │    │  │
│  │  └──────────────────────────┬────────────────────────────────┘    │  │
│  └─────────────────────────────┼────────────────────────────────────┘  │
│                                │  Tauri invoke() IPC                   │
│  ┌─────────────────────────────┼────────────────────────────────────┐  │
│  │              RUST BACKEND   │  (src-tauri)                       │  │
│  │  ┌──────────────────────────▼───────────────────────────────┐    │  │
│  │  │              photo_editor module                          │    │  │
│  │  │  • Image decode/encode (PNG, JPG, WebP, TIFF)            │    │  │
│  │  │  • Convolution filters (blur, sharpen)                   │    │  │
│  │  │  • Image resize (Lanczos resampling)                     │    │  │
│  │  │  • File dialogs (open/save)                              │    │  │
│  │  │  • Clipboard write                                       │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Design Principle: Frontend-Heavy, Backend for Heavy Lifting

| Responsibility | Where | Why |
|---|---|---|
| All UI rendering, interactions, tool handling | **React (Frontend)** | Instant feedback, no IPC latency |
| Canvas drawing (brush, eraser, shapes, text) | **React (Frontend)** | Canvas2D API is native to browser |
| Simple pixel ops (invert, grayscale, brightness) | **React (Frontend)** | ImageData manipulation is fast for small/medium images |
| Zoom, pan, crop UI, rotate/flip | **React (Frontend)** | Pure CSS/Canvas transforms |
| Undo/Redo stack | **React (Frontend)** | Keeps history in-memory, no IPC needed |
| Import (file → canvas) | **React (Frontend)** | FileReader API + Canvas drawImage |
| Export (canvas → file download) | **React (Frontend)** | Canvas toBlob + download link |
| Gaussian blur / Sharpen (convolution) | **Rust (Backend)** | O(n²) per pixel — Rust is 10-50x faster |
| Image resize (Lanczos) | **Rust (Backend)** | Quality resampling needs native perf |
| HSL color space conversion at scale | **Rust (Backend)** | Per-pixel math on large images |
| File open/save dialogs | **Rust (Backend)** | Tauri native dialog API |
| Clipboard write (image) | **Rust (Backend)** | OS-level clipboard access |
| TIFF / WebP decode/encode | **Rust (Backend)** | Browser doesn't support TIFF; WebP encode control |

---

## 2. Frontend Component Hierarchy

Based on the [expected UI mockup](file:///E:/codingfolder/tauri/DawnDesk/src-tauri/src/sub_apps/photo_editor/documentation/expected_ui.png):

```
PhotoEditor (page root)
├── PhotoEditorMenuBar              ← "Photo Editor | File | Edit | View | Image | Filters | Help"
├── PhotoEditorToolbar              ← Left vertical tool strip
│   ├── ToolButton × N             ← Move, Marquee, Lasso, Crop, Eyedropper, Brush, Eraser, etc.
│   └── ColorSwatchPicker           ← Foreground/background color squares + swap button
├── PhotoEditorOptionsBar           ← Top horizontal context bar (changes per active tool)
├── PhotoEditorCanvas               ← Central editing area
│   ├── CanvasViewport              ← Handles zoom/pan transforms
│   │   ├── RenderCanvas            ← Offscreen canvas composited to screen
│   │   └── OverlayCanvas           ← Selection marching ants, guides, crop handles
│   ├── RulerHorizontal             ← Top pixel ruler
│   └── RulerVertical               ← Left pixel ruler
├── TabBar                          ← Image tabs (mountain_lake.jpg × ...)
├── PhotoEditorRightPanel
│   ├── AdjustmentsPanel            ← Exposure, Contrast, Highlights, Shadows, Whites, Blacks
│   ├── PropertiesPanel             ← (tab sibling of Adjustments)
│   ├── LayersPanel                 ← Layer list + blend mode + opacity
│   └── HistogramPanel              ← Live RGB histogram
├── StatusBar                       ← "100% | 2400×1600 px (72 ppi) | RGB/8"
└── FilmStrip                       ← Bottom thumbnail carousel
```

### File Structure (Frontend)

```
src/
├── Pages/
│   └── PhotoEditor.tsx                    ← Page entry, wires everything together
├── components/
│   └── photo-editor/
│       ├── PhotoEditorMenuBar.tsx          ← Top menu bar (File, Edit, View, etc.)
│       ├── PhotoEditorToolbar.tsx          ← Left tool panel
│       ├── PhotoEditorOptionsBar.tsx       ← Context-sensitive top options
│       ├── PhotoEditorCanvas.tsx           ← Canvas viewport + rulers
│       ├── PhotoEditorRightPanel.tsx       ← Adjustments + Layers + Histogram
│       ├── AdjustmentsPanel.tsx            ← Light/Color adjustment sliders
│       ├── LayersPanel.tsx                 ← Layer list UI
│       ├── HistogramPanel.tsx              ← RGB histogram display
│       ├── TabBar.tsx                      ← Multi-image tabs
│       ├── StatusBar.tsx                   ← Bottom status info
│       ├── FilmStrip.tsx                   ← Bottom thumbnail carousel
│       ├── ColorSwatchPicker.tsx           ← FG/BG color swatches
│       └── ToolButton.tsx                  ← Individual tool button
├── engine/
│   └── photo-editor/
│       ├── EditorEngine.ts                ← Core state manager (singleton per document)
│       ├── ImageDocument.ts               ← Image data model (pixels, dimensions, metadata)
│       ├── ToolStateMachine.ts            ← Active tool + tool-specific state
│       ├── HistoryManager.ts              ← Undo/Redo stack (snapshot-based)
│       ├── SelectionManager.ts            ← Selection mask state + marching ants
│       ├── ViewportTransform.ts           ← Zoom, pan, fit-to-screen math
│       ├── tools/
│       │   ├── MoveTool.ts
│       │   ├── BrushTool.ts
│       │   ├── EraserTool.ts
│       │   ├── MarqueeTool.ts             ← Rect + Elliptical
│       │   ├── CropTool.ts
│       │   ├── EyedropperTool.ts
│       │   ├── FillTool.ts
│       │   ├── TextTool.ts
│       │   ├── ShapeTool.ts               ← Rectangle + Ellipse shapes
│       │   ├── HandTool.ts                ← Pan
│       │   └── ZoomTool.ts
│       ├── filters/
│       │   ├── adjustments.ts             ← Brightness, contrast, exposure (frontend-fast)
│       │   ├── colorOps.ts                ← Invert, grayscale, hue/saturation
│       │   └── filterBridge.ts            ← Calls Rust backend for heavy filters
│       ├── io/
│       │   ├── importImage.ts             ← File → ImageDocument
│       │   ├── exportImage.ts             ← Canvas → PNG/JPG blob → download
│       │   └── clipboard.ts              ← Copy to clipboard via Tauri
│       └── rendering/
│           ├── CanvasRenderer.ts          ← Composites layers → display canvas
│           └── HistogramCalculator.ts     ← Compute RGB histogram from ImageData
```

---

## 3. Backend Structure (Rust)

### File Structure

```
src-tauri/src/sub_apps/photo_editor/
├── mod.rs                  ← Module root, re-exports commands
├── commands.rs             ← All #[tauri::command] functions
├── processing/
│   ├── mod.rs
│   ├── blur.rs             ← Gaussian blur (separable convolution)
│   ├── sharpen.rs          ← Unsharp mask / kernel sharpen
│   ├── resize.rs           ← Lanczos / bilinear resize
│   └── color.rs            ← HSL conversion, color adjustments at scale
├── io/
│   ├── mod.rs
│   ├── decode.rs           ← Decode TIFF, WebP, PNG, JPG → raw RGBA
│   ├── encode.rs           ← Encode raw RGBA → PNG/JPG bytes
│   └── clipboard.rs        ← Write image to OS clipboard
└── types.rs                ← Shared structs (ImageBuffer, FilterParams, etc.)
```

### Rust Dependencies to Add

```toml
# In Cargo.toml [dependencies]
image = "0.25"              # Image decode/encode (PNG, JPG, WebP, TIFF, BMP)
imageproc = "0.25"          # Convolution, geometric transforms
base64 = "0.22"             # Transfer pixel data over IPC as base64
tauri-plugin-dialog = "2"   # Native open/save file dialogs
tauri-plugin-clipboard-manager = "2"  # Clipboard access
```

### Tauri IPC Commands

| Command | Input | Output | Description |
|---|---|---|---|
| `photo_open_file_dialog` | — | `Option<String>` (file path) | Show native open dialog, return selected path |
| `photo_save_file_dialog` | `default_name: String` | `Option<String>` (file path) | Show native save dialog |
| `photo_read_image` | `path: String` | `{ width, height, data: base64 }` | Decode image file → raw RGBA pixels |
| `photo_write_image` | `{ path, format, quality, data: base64, width, height }` | `Result<()>` | Encode + write to disk |
| `photo_apply_blur` | `{ data: base64, width, height, radius: f32 }` | `{ data: base64 }` | Gaussian blur |
| `photo_apply_sharpen` | `{ data: base64, width, height, amount: f32, radius: f32 }` | `{ data: base64 }` | Sharpen filter |
| `photo_resize_image` | `{ data: base64, width, height, new_w, new_h, algorithm }` | `{ data: base64, width, height }` | High-quality resize |
| `photo_copy_to_clipboard` | `{ data: base64, width, height }` | `Result<()>` | Copy image to OS clipboard |

> [!IMPORTANT]
> **IPC Data Transfer Strategy**: Raw pixel data is sent as **base64-encoded RGBA** over Tauri's `invoke()`. For a 2400×1600 image that's ~15MB base64. This is acceptable for single operations but we must avoid sending data back and forth on every slider drag. Instead:
> - **Preview**: Apply lightweight adjustments directly on frontend Canvas (CSS filters or ImageData manipulation)
> - **Commit**: Send to Rust only on "apply" / mouse-up for heavy filters

---

## 4. Core Data Model

### ImageDocument

```typescript
interface ImageDocument {
  id: string;
  fileName: string;
  filePath: string | null;       // null if unsaved/new
  width: number;
  height: number;
  dpi: number;
  colorMode: 'RGB';             // v0.1: RGB only
  bitDepth: 8;                  // v0.1: 8-bit only
  
  // Pixel data — the "truth"
  imageData: ImageData;          // RGBA pixel buffer (from Canvas API)
  
  // State
  isDirty: boolean;              // Has unsaved changes
  zoom: number;                  // Current zoom level (0.1 to 32)
  panOffset: { x: number; y: number };
  
  // Active adjustments (non-destructive preview, applied on commit)
  pendingAdjustments: AdjustmentState;
}

interface AdjustmentState {
  brightness: number;   // -100 to +100
  contrast: number;     // -100 to +100  
  exposure: number;     // -5.0 to +5.0
  hue: number;          // -180 to +180
  saturation: number;   // -100 to +100
  highlights: number;   // -100 to +100
  shadows: number;      // -100 to +100
  whites: number;       // -100 to +100
  blacks: number;       // -100 to +100
}
```

### Tool State Machine

```
┌─────────┐   select tool   ┌──────────────┐
│  IDLE   │ ──────────────→ │ TOOL_ACTIVE  │
│         │ ←────────────── │              │
└─────────┘    deselect     └──────┬───────┘
                                    │ mousedown on canvas
                                    ▼
                             ┌──────────────┐
                             │ TOOL_ENGAGED │  (drawing, selecting, cropping...)
                             │              │──→ updates canvas in real-time
                             └──────┬───────┘
                                    │ mouseup
                                    ▼
                             ┌──────────────┐
                             │   COMMIT     │  → push to undo stack
                             │              │  → update ImageDocument
                             └──────────────┘
```

Each tool implements a common interface:

```typescript
interface EditorTool {
  name: string;
  icon: string;
  cursor: string;
  
  onActivate(): void;              // Tool selected
  onDeactivate(): void;            // Tool deselected
  
  onPointerDown(e: CanvasPointerEvent): void;
  onPointerMove(e: CanvasPointerEvent): void;
  onPointerUp(e: CanvasPointerEvent): void;
  
  onKeyDown?(e: KeyboardEvent): void;
  
  renderOverlay?(ctx: CanvasRenderingContext2D): void;  // Draw guides, handles, etc.
  getOptionsBarConfig(): ToolOption[];                   // What to show in options bar
}
```

---

## 5. Undo/Redo Strategy

**Approach: Snapshot-based with diffing for memory efficiency**

```
History Stack (max 30 entries):

  [Snapshot_0] ← [Snapshot_1] ← [Snapshot_2] ← ... ← [Current]
       ▲                                                  │
       │              undo ←──────────────────────── redo  │
       └──────────────────────────────────────────────────┘

Each snapshot = {
  imageData: ImageData (full pixel copy)    // ~15MB per 2400×1600
  selection: SelectionMask | null
  adjustments: AdjustmentState
  label: string                             // "Brush Stroke", "Crop", etc.
}
```

> [!NOTE]
> At 30 snapshots × 15MB ≈ 450MB for a large image. For v0.1 this is acceptable. In v1.0+ we can optimize with:
> - Delta/diff compression (store only changed regions)
> - Offloading old snapshots to disk via Rust
> - Command-pattern redo (store operations instead of pixels)

---

## 6. Rendering Pipeline

```
┌─────────────────────────────────┐
│  ImageDocument.imageData        │  ← Source of truth (raw pixels)
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Apply pendingAdjustments       │  ← Frontend: brightness, contrast, etc.
│  (on a temp canvas, NOT mutate) │     via ImageData pixel manipulation
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Apply viewport transform       │  ← zoom + pan offset
│  (CSS transform or drawImage    │
│   with scale/translate)         │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Composite to Display Canvas    │  ← What the user sees
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Draw UI Overlay Canvas         │  ← Selection ants, crop handles,
│  (on top, separate canvas)      │     brush preview circle, rulers
└─────────────────────────────────┘
```

### Canvas Architecture (Dual-Canvas)

```html
<div class="canvas-viewport" style="overflow: hidden; position: relative;">
  <!-- Canvas 1: Rendered image (transformed by zoom/pan) -->
  <canvas id="render-canvas" />
  
  <!-- Canvas 2: UI overlay (selection, guides, tool previews) -->
  <canvas id="overlay-canvas" style="pointer-events: none;" />
</div>
```

- **render-canvas**: Draws the image with adjustments applied. Re-renders on adjustment change, tool commit, or viewport change.
- **overlay-canvas**: Draws selection outlines (marching ants animation), crop handles, brush cursor, text insertion point. Animates independently at 60fps when needed.

---

## 7. v0.1 Feature → Implementation Mapping

### 🟢 Core Canvas & Workspace

| # | Feature | Frontend | Backend | Notes |
|---|---------|----------|---------|-------|
| 1 | Open/Import Image | `importImage.ts` — FileReader → Canvas → ImageData | `photo_open_file_dialog`, `photo_read_image` | Frontend decodes PNG/JPG natively; Rust needed for TIFF |
| 2 | Canvas Zoom & Pan | `ViewportTransform.ts` — wheel→zoom, drag→pan | — | Pure math + CSS transform |
| 3 | Undo/Redo Stack | `HistoryManager.ts` — snapshot array | — | Ctrl+Z / Ctrl+Y bindings |
| 4 | Save & Export | `exportImage.ts` — Canvas.toBlob() | `photo_save_file_dialog`, `photo_write_image` | Frontend creates blob, Rust writes to disk |
| 5 | Dark Canvas Theme | CSS/Tailwind classes | — | Matches DawnDesk black/yellow design |
| 6 | Crop & Straighten | `CropTool.ts` — draggable crop rect overlay | — | Frontend only; applies via Canvas drawImage clip |
| 7 | Rotate & Flip | UI buttons + Canvas transform | — | 90° = simple; arbitrary = rotate canvas + expand bounds |
| 8 | Image Resize | Resize dialog → new dimensions | `photo_resize_image` | Rust Lanczos for quality; frontend for preview |

### 🟢 Selections

| # | Feature | Frontend | Backend |
|---|---------|----------|---------|
| 11 | Rectangular Marquee | `MarqueeTool.ts` — drag rect, store as `{x,y,w,h}` | — |
| 12 | Elliptical Marquee | `MarqueeTool.ts` — drag ellipse, store as `{cx,cy,rx,ry}` | — |

### 🟢 Painting & Drawing

| # | Feature | Frontend | Backend |
|---|---------|----------|---------|
| 21 | Basic Brush | `BrushTool.ts` — bresenham interpolation + soft brush stamp | — |
| 22 | Eraser | `EraserTool.ts` — brush with `globalCompositeOperation: 'destination-out'` | — |
| 23 | Fill / Paint Bucket | `FillTool.ts` — flood-fill algorithm on ImageData | — |
| 24 | Eyedropper | `EyedropperTool.ts` — getImageData at pixel → set fg color | — |

### 🟢 Color Adjustments

| # | Feature | Frontend | Backend |
|---|---------|----------|---------|
| 31 | Brightness & Contrast | `adjustments.ts` — per-pixel ImageData loop | — |
| 32 | Hue / Saturation | `colorOps.ts` — RGB→HSL→modify→RGB per pixel | Rust fallback for large images |
| 33 | Exposure | `adjustments.ts` — multiply RGB channels by exposure factor | — |

### 🟢 Filters & Effects

| # | Feature | Frontend | Backend |
|---|---------|----------|---------|
| 41 | Grayscale | `colorOps.ts` — luminance weighted desaturation | — |
| 42 | Gaussian Blur | Preview: CSS `filter: blur()` | `photo_apply_blur` — separable convolution |
| 43 | Sharpen | — | `photo_apply_sharpen` — unsharp mask kernel |
| 44 | Invert Colors | `colorOps.ts` — `255 - channel` per pixel | — |

### 🟢 Layers / Text / Shapes / Export

| # | Feature | Frontend | Backend |
|---|---------|----------|---------|
| 51 | Single Flat Layer | Default — all on one ImageData | — |
| 61-63 | Text Overlay | `TextTool.ts` — Canvas `fillText` + font picker UI | — |
| 71-72 | Rect/Ellipse Shape | `ShapeTool.ts` — Canvas `strokeRect` / `arc` | — |
| 91 | Export PNG/JPG | `exportImage.ts` — `canvas.toBlob('image/png'\|'image/jpeg', quality)` | `photo_write_image` (save-to-path) |
| 93 | Copy to Clipboard | — | `photo_copy_to_clipboard` |

---

## 8. UI Layout Specification

Matching the mockup exactly, the Photo Editor replaces the normal AppShell content area with a full-bleed editor layout:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ DawnDesk (Navbar)       ← undo → redo    43% ▾     [ Save ] [ Export ]     │
├────────┬─────────────────────────────────────────────────────────────────────┤
│SIDEBAR │ Photo Editor │ File │ Edit │ View │ Image │ Filters │ Help        │
│        ├──────┬───────────────────────────────────────┬──────────────────────┤
│        │TOOLS │  [Options Bar: Auto-Select, etc.]     │ Adjustments│Props   │
│        │      ├───┬───────────────────────────────┬───┤  Layers             │
│        │ Move │   │                               │   │────────────────────│
│        │Marq. │ R │                               │   │ Exposure    +0.35  │
│        │Lasso │ U │       CANVAS VIEWPORT         │   │ Contrast      +18  │
│        │Wand  │ L │                               │   │ Highlights    -25  │
│        │Crop  │ E │     (image + selection +      │   │ Shadows       +32  │
│        │Eye.  │ R │      guides overlay)          │   │ Whites        +12  │
│        │Brush │   │                               │   │ Blacks        -18  │
│        │Erase │   │                               │   │────────────────────│
│        │Grad. │   │                               │   │ Layers        ▾    │
│        │Clone │   │                               │   │ [👁] Layer 1       │
│        │Text  │   │                               │   │ [👁] Background 🔒 │
│        │Shape │   │                               │   │────────────────────│
│        │Hand  │   │                               │   │ Histogram          │
│        │Zoom  │   │                               │   │ ▓▓▓▒░░▓▓▒░        │
│        │──────│   │                               │   │                    │
│        │[█][□]│   └───────────────────────────────┘   │                    │
│        │  ⇄   ├───────────────────────────────────────┴──────────────────── │
│        │      │ 100% │ 2400×1600 px (72 ppi) │ RGB/8                       │
│        │      ├────────────────────────────────────────────────────────────│
│        │      │ [thumb1] [thumb2] [thumb3] [thumb4]  [+]   ◀ ▶            │
├────────┴──────┴────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> The Photo Editor takes over the **entire content area** within the AppShell. The DawnDesk sidebar and navbar remain visible, but the editor uses every remaining pixel. No padding on the `<Outlet>` wrapper when the Photo Editor is active.

---

## 9. State Management

No external state library. The editor uses a **React Context + useReducer** pattern:

```
PhotoEditorProvider (Context)
│
├── state: {
│     documents: ImageDocument[]       // All open images
│     activeDocumentId: string         // Which tab is active
│     activeTool: ToolType             // Current tool enum
│     toolOptions: Record<ToolType, ToolOptions>
│     foregroundColor: string          // Hex color
│     backgroundColor: string          // Hex color
│     history: HistoryManager          // Undo/redo per document
│     selection: SelectionState | null
│   }
│
├── dispatch: (action: EditorAction) => void
│
└── Derived (useMemo):
      activeDocument, canUndo, canRedo, zoomPercent, ...
```

### Action Types (key examples):

```typescript
type EditorAction =
  | { type: 'OPEN_DOCUMENT'; payload: ImageDocument }
  | { type: 'CLOSE_DOCUMENT'; payload: string }
  | { type: 'SET_ACTIVE_DOCUMENT'; payload: string }
  | { type: 'SET_TOOL'; payload: ToolType }
  | { type: 'SET_FOREGROUND_COLOR'; payload: string }
  | { type: 'UPDATE_ADJUSTMENT'; payload: Partial<AdjustmentState> }
  | { type: 'COMMIT_ADJUSTMENT' }
  | { type: 'APPLY_TOOL_RESULT'; payload: { imageData: ImageData; label: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'SET_SELECTION'; payload: SelectionState | null }
  | { type: 'ROTATE'; payload: 90 | -90 | 180 }
  | { type: 'FLIP'; payload: 'horizontal' | 'vertical' };
```

---

## 10. Keyboard Shortcuts (v0.1)

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open image |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save As / Export |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+C` | Copy to clipboard |
| `Ctrl++` / `Ctrl+-` | Zoom in/out |
| `Ctrl+0` | Fit to screen |
| `V` | Move tool |
| `M` | Marquee tool |
| `B` | Brush tool |
| `E` | Eraser tool |
| `G` | Fill/Gradient tool |
| `I` | Eyedropper |
| `C` | Crop tool |
| `T` | Text tool |
| `U` | Shape tool |
| `H` | Hand (pan) tool |
| `Z` | Zoom tool |
| `Space` (hold) | Temporary hand tool |
| `[` / `]` | Decrease/increase brush size |
| `Escape` | Deselect / cancel current tool action |
| `Delete` | Clear selection to background color |

---

## 11. Implementation Phases

We build the **complete UI shell first** (all panels, all buttons, all sliders — even if they don't work yet), then activate features one by one.

### Phase 1: UI Shell (Non-Functional)
Build all visual components matching the mockup. Wire up layout, theming, and navigation. Nothing edits pixels yet.

**Components to build:**
- `PhotoEditor.tsx` — full-bleed layout within AppShell
- `PhotoEditorMenuBar.tsx` — all menus (dropdowns non-functional)
- `PhotoEditorToolbar.tsx` — all tool icons + color swatches
- `PhotoEditorOptionsBar.tsx` — static placeholder per tool
- `PhotoEditorCanvas.tsx` — gray checkerboard empty canvas
- `TabBar.tsx` — static tab
- Right panel: `AdjustmentsPanel`, `LayersPanel`, `HistogramPanel`
- `StatusBar.tsx` — static info
- `FilmStrip.tsx` — empty carousel
- Dark theme CSS matching DawnDesk black/yellow

### Phase 2: Canvas Foundation
- Open/import image (Feature #1)
- Display image on canvas
- Zoom & pan (Feature #2)
- Rulers + status bar updates
- Fit-to-screen on open

### Phase 3: Core Editing
- Undo/Redo stack (Feature #3)
- Crop & Straighten (Feature #6)
- Rotate & Flip (Feature #7)
- Image Resize (Feature #8) — requires Rust backend

### Phase 4: Drawing Tools
- Brush tool (Feature #21)
- Eraser tool (Feature #22)
- Fill / Paint Bucket (Feature #23)
- Eyedropper (Feature #24)
- Color swatch picker wired up

### Phase 5: Selections
- Rectangular Marquee (Feature #11)
- Elliptical Marquee (Feature #12)
- Marching ants animation on overlay canvas

### Phase 6: Color Adjustments
- Brightness & Contrast (Feature #31)
- Hue / Saturation (Feature #32)
- Exposure (Feature #33)
- Live histogram updates

### Phase 7: Filters
- Grayscale / Desaturate (Feature #41)
- Gaussian Blur (Feature #42) — Rust backend
- Sharpen (Feature #43) — Rust backend
- Invert Colors (Feature #44)

### Phase 8: Text & Shapes
- Basic Text Overlay (Feature #61)
- Font & Size Selector (Feature #62)
- Text Color (Feature #63)
- Rectangle Shape (Feature #71)
- Ellipse Shape (Feature #72)

### Phase 9: Export & Finish
- Save & Export PNG/JPG (Feature #4, #91)
- Copy to Clipboard (Feature #93)
- Keyboard shortcuts
- Polish & bug fixes

---

## 12. Open Questions

> [!IMPORTANT]
> **Q1: Large image performance threshold** — At what image size should we automatically offload pixel operations from frontend JS to Rust backend? Proposed: images > 4000×4000 (64MB RGBA) always route through Rust. Below that, frontend Canvas handles it.

> [!IMPORTANT]  
> **Q2: AppShell padding override** — The Photo Editor needs zero padding in the `<Outlet>` container. Should we add a `noPadding` prop to AppShell, or should the Photo Editor use a completely separate route outside AppShell (with its own sidebar)?

> [!WARNING]
> **Q3: Tauri plugin additions** — We need `tauri-plugin-dialog` and `tauri-plugin-clipboard-manager`. These require adding to `Cargo.toml`, `tauri.conf.json` capabilities, and JS-side `@tauri-apps/plugin-dialog` / `@tauri-apps/plugin-clipboard-manager` npm packages. Confirm these are acceptable additions.

> [!NOTE]
> **Q4: Tailwind vs Vanilla CSS** — The project uses Tailwind. The Photo Editor has very specific pixel-level layout needs (rulers, canvas, panels). Recommend using Tailwind for the panel layouts but a dedicated `photo-editor.css` for canvas-specific styles (cursor overrides, marching ants animation keyframes, ruler tick marks). Acceptable?

---

*DawnDesk Photo Editor — Architecture Document v0.1*
