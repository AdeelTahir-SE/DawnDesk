# DawnDesk — Photo Editor
### Product Feature Specification

> DawnDesk consolidates the apps people juggle every day into a single unified workspace. The Photo Editor is a built-in DawnDesk app that lets users edit, retouch, and export images without leaving the platform — eliminating the context-switch to Photoshop, Lightroom, or GIMP.

---

## 1. Overview

This document lists all 100 planned features, grouped by functional area, and assigns each one to a release version so the engineering team can ship a lean MVP and iterate toward a full professional suite.

---

## 2. Version Roadmap

| Version | Milestone |
|---------|-----------|
| `v0.1` | **Minimum Viable** — launch day essentials only |
| `v1.0` | **Core Stable** — solid everyday editing suite |
| `v2.0` | **Advanced** — power tools and AI features |
| `v3.0` | **Pro / Power-User** — full professional toolkit |

---

## 3. Expected UI Layout

The Photo Editor follows DawnDesk's **black-and-dark-yellow** design language with a three-panel layout:

```
 src_tauri/sub_apps/photo_editor/documentation/expected_ui.png

```

---

## 4. Feature Table — All 100 Features

### 🟢 Core Canvas & Workspace

| # | Feature | Description | Version |
|---|---------|-------------|---------|
| 1 | Open / Import Image | Open JPG, PNG, WebP, TIFF from disk or DawnDesk file manager | `v0.1` |
| 2 | Canvas Zoom & Pan | Mouse-wheel zoom and drag-to-pan for navigating large images | `v0.1` |
| 3 | Undo / Redo Stack | 30-step undo/redo for all destructive edits | `v0.1` |
| 4 | Save & Export (PNG/JPG) | One-click save back to DawnDesk storage or download locally | `v0.1` |
| 5 | Dark Canvas Theme | Editor chrome matches DawnDesk black/yellow design system | `v0.1` |
| 6 | Crop & Straighten | Freeform and aspect-ratio crop with auto-straighten slider | `v0.1` |
| 7 | Rotate & Flip | 90° rotate, arbitrary angle rotate, horizontal/vertical flip | `v0.1` |
| 8 | Image Resize | Resize by pixel dimensions or percentage with aspect-lock | `v0.1` |
| 9 | Full-Screen Focus Mode | Hides DawnDesk sidebar for distraction-free editing | `v1.0` |
| 10 | Multi-Tab Images | Open multiple images as tabs inside the Photo Editor app | `v1.0` |

---

### 🟢 Selections

| # | Feature | Description | Version |
|---|---------|-------------|---------|
| 11 | Rectangular Marquee | Click-drag to select rectangular regions for isolated edits | `v0.1` |
| 12 | Elliptical Marquee | Oval/circle selections for round objects or circular crops | `v0.1` |
| 13 | Lasso Tool | Freehand click-drag selection for irregular shapes | `v1.0` |
| 14 | Polygonal Lasso | Straight-edge freeform selection via anchor-point clicks | `v1.0` |
| 15 | Magic Wand | One-click same-color area selection with adjustable tolerance | `v1.0` |
| 16 | Quick Selection Brush | Paint-to-select with auto-edge detection for fast masking | `v2.0` |
| 17 | Select Subject (AI) | One-click AI isolation of the main subject from background | `v2.0` |
| 18 | Select & Mask Refinement | Fine-tune selection edges around hair, fur, and complex edges | `v2.0` |
| 19 | Color Range Select | Select all pixels matching a sampled color across the image | `v3.0` |
| 20 | Object-Aware Selection | Segment and select individual objects by hovering over them | `v3.0` |

---

### 🟢 Painting & Drawing

| # | Feature | Description | Version |
|---|---------|-------------|---------|
| 21 | Basic Brush Tool | Round/soft brush strokes on any layer with opacity control | `v0.1` |
| 22 | Eraser Tool | Erase pixels to transparency; hard/soft edge toggle | `v0.1` |
| 23 | Fill / Paint Bucket | Flood-fill a contiguous region with the chosen foreground color | `v0.1` |
| 24 | Color Picker (Eyedropper) | Sample any pixel on canvas as the active foreground color | `v0.1` |
| 25 | Pencil Tool | Hard pixel-level drawing for precise line work | `v1.0` |
| 26 | Gradient Fill Tool | Linear, radial, and conical gradients between two colors | `v1.0` |
| 27 | Clone Stamp | Paint over flaws by sampling from another part of the image | `v2.0` |
| 28 | Healing Brush | Blend-based repair of blemishes using surrounding texture | `v2.0` |
| 29 | Spot Heal | One-click auto-removal of small imperfections | `v2.0` |
| 30 | Mixer Brush | Wet-paint mixing simulation for digital painting workflows | `v3.0` |

---

### 🟢 Color Adjustments

| # | Feature | Description | Version |
|---|---------|-------------|---------|
| 31 | Brightness & Contrast | Simple sliders to lift/lower overall brightness and contrast | `v0.1` |
| 32 | Hue / Saturation | Shift global hue, boost or drain saturation, adjust lightness | `v0.1` |
| 33 | Exposure | Simulate camera exposure change; affects highlights most | `v0.1` |
| 34 | Levels | Set black, grey, and white points on a live histogram | `v1.0` |
| 35 | Curves | Free-point adjustment curve for tone and per-channel color | `v1.0` |
| 36 | Color Balance | Adjust shadow/midtone/highlight color bias independently | `v1.0` |
| 37 | Vibrance | Boost muted colors while protecting skin-tone saturation | `v2.0` |
| 38 | Selective Color | Tweak CMYK components inside individual color ranges | `v2.0` |
| 39 | Channel Mixer | Blend RGB source channels for custom grayscale or toning | `v3.0` |
| 40 | LUT / Color Lookup | Apply cinematic 3D LUT files for instant color grading | `v3.0` |

---

### 🟢 Filters & Effects

| # | Feature | Description | Version |
|---|---------|-------------|---------|
| 41 | Grayscale / Desaturate | Convert image to black-and-white with luminance weighting | `v0.1` |
| 42 | Gaussian Blur | Smooth, even blur; strength controlled by radius slider | `v0.1` |
| 43 | Sharpen | Edge-enhancement sharpening with amount and radius controls | `v0.1` |
| 44 | Invert Colors | Flip all color values to their opposites for negative effect | `v0.1` |
| 45 | Sepia Tone | Apply classic warm brownish sepia colour-wash to photos | `v1.0` |
| 46 | Vignette | Darkened or lightened border fade for focus and mood | `v1.0` |
| 47 | Motion Blur | Directional blur along a user-defined angle and distance | `v1.0` |
| 48 | Noise Add / Reduce | Add grain for film look or denoise for clean output | `v2.0` |
| 49 | Smart Sharpen | Intelligent edge sharpening with noise-aware processing | `v2.0` |
| 50 | Liquify Warp | Warp, push, pucker, and bloat regions for retouching | `v3.0` |

---

### 🟢 Layers

| # | Feature | Description | Version |
|---|---------|-------------|---------|
| 51 | Single Flat Layer | All edits on one merged canvas layer; exported as flat file | `v0.1` |
| 52 | Add / Delete Layer | Stack multiple independent pixel layers in the editor | `v1.0` |
| 53 | Layer Visibility Toggle | Show/hide individual layers with the eye icon | `v1.0` |
| 54 | Layer Opacity | Set 0–100% transparency per layer for blending | `v1.0` |
| 55 | Blend Modes | Normal, Multiply, Screen, Overlay and 10+ blend algorithms | `v2.0` |
| 56 | Layer Masks | Non-destructive hide/reveal using grayscale mask painting | `v2.0` |
| 57 | Adjustment Layers | Non-destructive color corrections as dedicated layer types | `v2.0` |
| 58 | Smart Objects | Embed images as protected smart layers for lossless transforms | `v3.0` |
| 59 | Layer Groups / Folders | Organize layers into collapsible groups for complex composites | `v3.0` |
| 60 | Clipping Masks | Clip one layer's pixels to the shape of the layer beneath it | `v3.0` |

---

### 🟢 Text & Typography

| # | Feature | Description | Version |
|---|---------|-------------|---------|
| 61 | Basic Text Overlay | Place a single-line text label on the image | `v0.1` |
| 62 | Font & Size Selector | Pick from system fonts and set point size | `v0.1` |
| 63 | Text Color | Choose fill color for text runs | `v0.1` |
| 64 | Text Alignment | Left, center, and right alignment for text blocks | `v1.0` |
| 65 | Multi-line Text Box | Drag a bounding box for flowing paragraph text | `v1.0` |
| 66 | Bold / Italic / Underline | Core inline text style toggles | `v1.0` |
| 67 | Letter Spacing (Tracking) | Adjust spacing between all characters globally | `v2.0` |
| 68 | Line Height (Leading) | Control vertical spacing between lines of text | `v2.0` |
| 69 | Warp Text | Bend text along arcs, waves, flags, and bulge shapes | `v3.0` |
| 70 | Text on Vector Path | Flow text along a custom drawn path or shape edge | `v3.0` |

---

### 🟢 Shapes & Vectors

| # | Feature | Description | Version |
|---|---------|-------------|---------|
| 71 | Rectangle Shape | Draw filled or stroked rectangles with corner-radius option | `v0.1` |
| 72 | Ellipse Shape | Draw circles and ovals as vector shapes on the canvas | `v0.1` |
| 73 | Line Tool | Draw straight lines with color and stroke-width control | `v1.0` |
| 74 | Basic Pen Path | Create simple Bezier vector paths for custom shapes | `v2.0` |
| 75 | Shape Fill & Stroke | Set fill color, stroke color, and stroke width on shapes | `v1.0` |
| 76 | Polygon Tool | Regular polygons and stars with N-sides slider | `v2.0` |
| 77 | Boolean Operations | Add, subtract, intersect, and exclude overlapping shapes | `v3.0` |
| 78 | Custom Shape Library | Built-in library of arrow, badge, frame, and icon shapes | `v2.0` |
| 79 | Vector Export (SVG) | Export shape layers as clean SVG for use in other DawnDesk apps | `v3.0` |
| 80 | Path Direct Select | Move individual anchor points to reshape vector paths | `v3.0` |

---

### 🟢 AI & Smart Tools

| # | Feature | Description | Version |
|---|---------|-------------|---------|
| 81 | Auto Enhance | One-tap AI boost of exposure, contrast, and color balance | `v1.0` |
| 82 | Background Remove (AI) | Instantly remove or replace the background using AI segmentation | `v1.0` |
| 83 | Object Erase (AI) | Select any object and AI fills the gap with scene-aware content | `v2.0` |
| 84 | Sky Replacement (AI) | Detect and swap the sky region with a chosen backdrop | `v2.0` |
| 85 | Skin Smooth (Neural) | AI-powered portrait retouching for blemish and pore reduction | `v2.0` |
| 86 | Super Resolution (AI) | Upscale images 2x–4x without pixelation using ML upsampling | `v3.0` |
| 87 | Colorize B&W (AI) | Automatically colorize black-and-white photographs | `v3.0` |
| 88 | Style Transfer | Apply the visual style of famous artworks to photos | `v3.0` |
| 89 | Smart Crop Suggest | AI recommends best crop compositions based on subject | `v2.0` |
| 90 | Noise Reduction (AI) | ML denoising that preserves sharpness while removing grain | `v3.0` |

---

### 🟢 Export, Sharing & DawnDesk Integration

| # | Feature | Description | Version |
|---|---------|-------------|---------|
| 91 | Export PNG / JPG | Save flat image in PNG or JPG with quality slider | `v0.1` |
| 92 | Export WebP | Save in WebP for smaller file size on the web | `v1.0` |
| 93 | Copy to Clipboard | Copy canvas to system clipboard for pasting in other apps | `v0.1` |
| 94 | Send to DawnDesk Notes | Insert the current image directly into a Notes document | `v1.0` |
| 95 | Send to DawnDesk Email | Attach edited photo to a compose window in DawnDesk Mail | `v1.0` |
| 96 | Batch Export | Export multiple open images at once with shared settings | `v2.0` |
| 97 | Export Layers as Files | Each visible layer exported as a separate PNG/JPG file | `v3.0` |
| 98 | Version History | DawnDesk cloud saves edit snapshots; restore any prior version | `v2.0` |
| 99 | Collaboration Annotations | Team members annotate the image with pins and comments | `v3.0` |
| 100 | Custom Export Presets | Save export configurations (format, size, quality) as presets | `v3.0` |

---

## 5. Feature Count by Version

| Version | Label | Features |
|---------|-------|----------|
| `v0.1` | Minimum Viable | 28 |
| `v1.0` | Core Stable | 24 |
| `v2.0` | Advanced | 26 |
| `v3.0` | Pro / Power-User | 22 |
| **Total** | | **100** |

---

*DawnDesk — Photo Editor Feature Spec | Confidential*