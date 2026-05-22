import { useNavigate } from 'react-router-dom';
import '../components/photo-editor/photo-editor.css';

const sections = [
  {
    title: 'Opening, Tabs, Zoom, And Navigation',
    body: [
      'Use File > Open Image or Ctrl+O to import a JPG, PNG, WebP, or browser-supported image. Every imported image opens as its own editor tab, so you can switch between jobs without leaving the Photo Editor.',
      'Use the mouse wheel or Ctrl+plus and Ctrl+minus to zoom. Hold or select the Hand tool to pan around large images. Ctrl+0 fits the active image back into the available canvas area.',
      'The tab bar and filmstrip both help you move between open files. Close tabs from the tab bar when you are finished with an image.',
    ],
  },
  {
    title: 'Undo, Redo, And History',
    body: [
      'The editor keeps a 30-step destructive edit history. Use Ctrl+Z to undo and Ctrl+Y or Ctrl+Shift+Z to redo.',
      'Brush strokes, erasing, fills, filters, crop, rotate, flip, resize, text, and shape commits are added to history. Live adjustment sliders preview first; click Apply Adjustments to bake them into the image and add a history step.',
    ],
  },
  {
    title: 'Selections',
    body: [
      'The rectangular and elliptical marquee tools create selection outlines by dragging on the canvas. These are useful as visual boundaries while preparing local edits.',
      'The Lasso tool lets you draw an irregular freehand selection. Magic Wand selects a same-color area from the clicked pixel using tolerance. Quick Selection paints a selection path as you drag.',
      'Escape clears the active selection. Selection edges use marching ants so the selected region stays visible while you work.',
    ],
  },
  {
    title: 'Crop, Rotate, Flip, And Resize',
    body: [
      'Choose the Crop tool, drag a crop box, optionally pick an aspect ratio, then click Apply Crop in the options bar. The crop is committed to the active document.',
      'Use Image > Rotate or Image > Flip for 90 degree, 180 degree, horizontal, and vertical transforms.',
      'Resize controls are available from the options bar on general tools. Enter new pixel dimensions and click Resize. Export scale is separate and changes only the saved copy, not the open document.',
    ],
  },
  {
    title: 'Brush, Pencil, Eraser, Fill, And Repair',
    body: [
      'Brush paints with the foreground color using size, hardness, and opacity from the options bar. Pencil is a crisp one-pixel hard brush for pixel-level work.',
      'Eraser removes pixels to transparency with the same brush controls. Gradient fills the image with a foreground-to-background gradient from your drag direction.',
      'Clone Stamp and Healing Brush use Alt-click to sample a source point, then paint copied or blended pixels elsewhere. Spot Heal works with a single click and blends a small blemish using nearby color.',
      'Eyedropper samples the clicked pixel and sets it as the foreground color.',
    ],
  },
  {
    title: 'Adjustments',
    body: [
      'The right panel includes Exposure, Contrast, Highlights, Shadows, Whites, Blacks, Hue, Saturation, Brightness, Vibrance, Levels, Curves, Color Balance, and Selective Color.',
      'Sliders preview live on the canvas. Click Apply Adjustments when you like the result. Reset from the section menu if you want to return the pending sliders to their defaults.',
      'Levels remap black, gamma, and white points. Curves adds an S-curve style tonal change. Color Balance shifts color bias, and Vibrance boosts muted colors more gently than Saturation.',
    ],
  },
  {
    title: 'Filters And Effects',
    body: [
      'Use Filters for Grayscale, Sepia, Invert, Vignette, Blur, Motion Blur, Sharpen, Smart Sharpen, Add Noise, Reduce Noise, and v3 experimental effects such as Liquify Warp.',
      'Filters are destructive and commit immediately to the image history. Use Undo if a filter is too strong.',
    ],
  },
  {
    title: 'Text And Typography',
    body: [
      'Select the Text tool, click on the canvas, type your text, and press Enter or click away to commit it.',
      'The options bar controls font family, weight, italic style, alignment, size, and color. While you are typing, letter keys are reserved for text entry and will not switch tools.',
      'Multi-line text can be entered by composing text before commit and using alignment settings for placement behavior.',
    ],
  },
  {
    title: 'Shapes, Lines, And Vector-Oriented Tools',
    body: [
      'Shape tools draw rectangles, ellipses, lines, simple paths, polygons, and custom polygon-style shapes. Set fill color, stroke color, stroke width, and polygon sides in the options bar.',
      'Shape drawing is committed to the flat image canvas in this version. The layer panel tracks editor layer state, but exported raster images are flattened.',
    ],
  },
  {
    title: 'Layers',
    body: [
      'The Layers panel shows the current flat image background plus any editor layers you add. You can create, select, hide, delete unlocked layers, set opacity, and choose blend-mode metadata.',
      'Layer masks, adjustment layers, groups, and clipping controls are being built into the v3 surface. In the current canvas engine, these controls are partially stateful and are used to prepare the editor for a fuller compositor.',
    ],
  },
  {
    title: 'Export, Clipboard, And Sharing',
    body: [
      'Click Export or choose File > Export to pick PNG, JPG, or WebP. The quality slider affects JPG and WebP. The scale slider exports a resized copy without resizing the open image.',
      'On supported systems, the editor asks where to save using the browser/native save picker. If that is not available, it falls back to DawnDesk native export and then a browser download link.',
      'Batch Export Open Tabs exports every open document with the same settings. Copy Image places the active canvas on the clipboard where supported. Send to Notes and Send to Email are prepared for DawnDesk handoff APIs.',
    ],
  },
  {
    title: 'Keyboard Shortcuts',
    body: [
      'Ctrl+O opens, Ctrl+S quick exports, Ctrl+Shift+S opens export options, Ctrl+C copies the image, Ctrl+Z undoes, Ctrl+Y redoes, Ctrl+0 fits to screen, and Escape clears selection.',
      'Tool shortcuts include V Move, M Marquee, L Lasso, W Magic Wand, Q Quick Select, C Crop, I Eyedropper, B Brush, N Pencil, E Eraser, G Gradient, S Clone Stamp, J Healing Brush, K Spot Heal, T Text, U Shape, H Hand, and Z Zoom.',
    ],
  },
];

export default function PhotoEditorHelp() {
  const navigate = useNavigate();

  return (
    <div className="pe-help-page">
      <div className="pe-help-page__topbar">
        <button className="pe-action-button pe-action-button--primary" onClick={() => navigate('/photo-editor')}>
          Back to Editor
        </button>
        <div>
          <h1>DawnDesk Photo Editor Help</h1>
          <p>Complete guide to the editor workspace, tools, adjustments, filters, layers, and export flow.</p>
        </div>
      </div>

      <div className="pe-help-page__content">
        {sections.map((section) => (
          <section key={section.title} className="pe-help-section">
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
