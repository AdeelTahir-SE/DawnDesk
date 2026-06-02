import { useState, useRef, useEffect } from 'react';
import {
  applyDenoise,
  applyGrayscale,
  applyInvert,
  applyBlurFast,
  applyMotionBlur,
  applyLiquifyWarp,
  applyNoise,
  applySepia,
  applySharpen,
  applySmartSharpen,
  applyVignette,
} from '../../engine/photo-editor/filters';
import { Bot, FolderOpen, Save, Folder, Library } from 'lucide-react';

interface MenuBarProps {
  onOpenImage: () => void;
  onResizeImage?: () => void;
  onExport: () => void;
  onExportDialog?: () => void;
  onBatchExport?: () => void;
  onCopyToClipboard?: () => void;
  onSendToNotes?: () => void;
  onSendToEmail?: () => void;
  onOpenHelp?: () => void;
  onOpenAiPanel?: () => void;
  onRotate: (deg: 90 | -90 | 180) => void;
  onFlip: (dir: 'horizontal' | 'vertical') => void;
  onApplyFilter: (name: string, fn: (data: ImageData) => ImageData) => void;
  onUndo: () => void;
  onRedo: () => void;
  // Project actions
  onSaveProject?: () => void;
  onSaveProjectAs?: () => void;
  onExportProjectFile?: () => void;
  onOpenProjects?: () => void;
  currentProjectName?: string | null;
}

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  description?: string;
  action?: () => void;
  separator?: boolean;
}

interface MenuDef {
  label: string;
  items: MenuItem[];
}

const ENABLE_PHOTO_EDITOR_AI_MENU = false;

export default function PhotoEditorMenuBar({
  onOpenImage, onResizeImage, onExport, onExportDialog, onBatchExport, onCopyToClipboard, onSendToNotes, onSendToEmail, onOpenHelp, onRotate, onFlip, onApplyFilter, onUndo, onRedo,
  onSaveProject, onSaveProjectAs, onExportProjectFile, onOpenProjects, onOpenAiPanel, currentProjectName,
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  const menus: MenuDef[] = [
    {
      label: 'File',
      items: [
        { label: 'Projects…', icon: <Library size={14} />, description: 'Go to the project manager.', action: () => { onOpenProjects?.(); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Open Image...', shortcut: 'Ctrl+O', description: 'Import an image into a new editor tab.', action: () => { onOpenImage(); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Save Project', shortcut: 'Ctrl+Shift+S', description: 'Save current layers and settings as a project.', action: () => { onSaveProject?.(); setOpenMenu(null); } },
        { label: 'Save Project As…', description: 'Save as a new project with a different name.', action: () => { onSaveProjectAs?.(); setOpenMenu(null); } },
        { label: 'Export Project File…', description: 'Download project as .dawndesk file.', action: () => { onExportProjectFile?.(); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Quick Export', shortcut: 'Ctrl+S', description: 'Save the active image using current export settings.', action: () => { onExport(); setOpenMenu(null); } },
        { label: 'Export...', description: 'Choose format, quality, and scale before exporting.', action: () => { onExportDialog?.(); setOpenMenu(null); } },
        { label: 'Batch Export Open Tabs...', description: 'Export every open image tab with shared settings.', action: () => { onBatchExport?.(); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Copy Image', shortcut: 'Ctrl+C', description: 'Copy the active image to the system clipboard.', action: () => { onCopyToClipboard?.(); setOpenMenu(null); } },
        { label: 'Send to Notes', description: 'Prepare the active image for DawnDesk Notes.', action: () => { onSendToNotes?.(); setOpenMenu(null); } },
        { label: 'Send to Email', description: 'Prepare the active image for a DawnDesk Mail attachment.', action: () => { onSendToEmail?.(); setOpenMenu(null); } },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', description: 'Step back through recent edits.', action: () => { onUndo(); setOpenMenu(null); } },
        { label: 'Redo', shortcut: 'Ctrl+Y', description: 'Restore the next undone edit.', action: () => { onRedo(); setOpenMenu(null); } },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Zoom In', shortcut: 'Ctrl++', action: () => setOpenMenu(null) },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => setOpenMenu(null) },
        { label: 'Fit to Screen', shortcut: 'Ctrl+0', action: () => setOpenMenu(null) },
      ],
    },
    {
      label: 'Image',
      items: [
        { label: 'Rotate 90° CW', action: () => { onRotate(90); setOpenMenu(null); } },
        { label: 'Rotate 90° CCW', action: () => { onRotate(-90); setOpenMenu(null); } },
        { label: 'Rotate 180°', action: () => { onRotate(180); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Resize Image...', description: 'Change canvas and layer dimensions.', action: () => { onResizeImage?.(); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Flip Horizontal', action: () => { onFlip('horizontal'); setOpenMenu(null); } },
        { label: 'Flip Vertical', action: () => { onFlip('vertical'); setOpenMenu(null); } },
      ],
    },
    {
      label: 'Filters',
      items: [
        { label: 'Grayscale', description: 'Convert the image to black and white.', action: () => { onApplyFilter('Grayscale', applyGrayscale); setOpenMenu(null); } },
        { label: 'Sepia Tone', description: 'Apply a warm vintage brown tone.', action: () => { onApplyFilter('Sepia', applySepia); setOpenMenu(null); } },
        { label: 'Invert Colors', description: 'Flip all colors to their opposite values.', action: () => { onApplyFilter('Invert', applyInvert); setOpenMenu(null); } },
        { label: 'Vignette', description: 'Darken the edges to pull attention inward.', action: () => { onApplyFilter('Vignette', (d) => applyVignette(d, 45)); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Blur (Radius 3)', action: () => { onApplyFilter('Blur', (d) => applyBlurFast(d, 3)); setOpenMenu(null); } },
        { label: 'Blur (Radius 8)', action: () => { onApplyFilter('Blur', (d) => applyBlurFast(d, 8)); setOpenMenu(null); } },
        { label: 'Motion Blur', action: () => { onApplyFilter('Motion Blur', (d) => applyMotionBlur(d, 12, 0)); setOpenMenu(null); } },
        { label: 'Sharpen', action: () => { onApplyFilter('Sharpen', (d) => applySharpen(d, 50)); setOpenMenu(null); } },
        { label: 'Smart Sharpen', action: () => { onApplyFilter('Smart Sharpen', (d) => applySmartSharpen(d, 65)); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Add Noise', action: () => { onApplyFilter('Add Noise', (d) => applyNoise(d, 18)); setOpenMenu(null); } },
        { label: 'Reduce Noise', action: () => { onApplyFilter('Reduce Noise', applyDenoise); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Liquify Warp', description: 'Apply an experimental v3 center warp effect.', action: () => { onApplyFilter('Liquify Warp', (d) => applyLiquifyWarp(d, 18)); setOpenMenu(null); } },
      ],
    },
    ...(ENABLE_PHOTO_EDITOR_AI_MENU ? [{
      label: 'AI',
      items: [
        { label: 'AI Image Studio', icon: <Bot size={14} />, description: 'Open AI tools for generating images as layers or updating the active layer.', action: () => { onOpenAiPanel?.(); setOpenMenu(null); } },
        { label: 'Generate Images as Layers', description: 'Create multiple AI images and insert each result as a separate layer.', action: () => { onOpenAiPanel?.(); setOpenMenu(null); } },
        { label: 'Update Active Layer with AI', description: 'Use the AI panel to replace the selected unlocked layer.', action: () => { onOpenAiPanel?.(); setOpenMenu(null); } },
      ],
    }] : []),
    {
      label: 'Help',
      items: [
        { label: 'How to Use Photo Editor', description: 'Open the full user guide for every editor feature.', action: () => { onOpenHelp?.(); setOpenMenu(null); } },
        { label: 'Keyboard Shortcuts', description: 'Shortcut reference is included in the How to Use guide.', action: () => { onOpenHelp?.(); setOpenMenu(null); } },
        { label: 'About Photo Editor', description: 'Learn what this built-in DawnDesk editor is for.', action: () => { onOpenHelp?.(); setOpenMenu(null); } },
      ],
    },
  ];

  return (
    <div className="pe-menu-bar" ref={menuRef}>
      <span className="pe-menu-bar__title">Photo Editor</span>

      {menus.map((menu) => (
        <div key={menu.label} style={{ position: 'relative' }}>
          <button
            className="pe-menu-bar__item"
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
            onMouseEnter={() => openMenu && setOpenMenu(menu.label)}
            data-tooltip={`Open ${menu.label} commands.`}
            style={openMenu === menu.label ? { background: 'var(--pe-bg-active)', color: 'var(--pe-text-primary)' } : undefined}
          >
            {menu.label}
          </button>

          {openMenu === menu.label && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                minWidth: 200,
                background: 'var(--pe-bg-panel-alt)',
                border: '1px solid var(--pe-border)',
                borderRadius: 6,
                padding: '4px 0',
                zIndex: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {menu.items.map((item, idx) =>
                item.separator ? (
                  <div
                    key={idx}
                    style={{
                      height: 1,
                      background: 'var(--pe-border-subtle)',
                      margin: '4px 8px',
                    }}
                  />
                ) : (
                  <button
                    key={idx}
                    onClick={item.action}
                    title={item.description ? `${item.label}: ${item.description}` : item.label}
                    data-tooltip={item.description ? `${item.label}: ${item.description}` : item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '6px 14px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--pe-text-primary)',
                      fontSize: 12,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = 'var(--pe-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.shortcut && (
                      <span style={{ color: 'var(--pe-text-muted)', fontSize: 11, marginLeft: 24 }}>
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}

      {/* Right side spacer + action buttons */}
      <div style={{ flex: 1 }} />
      {currentProjectName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--pe-text-muted)', paddingRight: 12 }}>
          <Folder size={12} />
          <span>{currentProjectName}</span>
        </div>
      )}
      <button
        className="pe-menu-bar__item"
        onClick={() => onOpenProjects?.()}
        title="Projects manager"
        data-tooltip="Go to the project manager."
        style={{ color: 'var(--pe-text-secondary)' }}
      >
        Projects
      </button>
      <button
        className="pe-menu-bar__item"
        onClick={onOpenImage}
        title="Open Image (Ctrl+O)"
        data-tooltip="Open or import an image into the editor."
        style={{ color: 'var(--pe-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <FolderOpen size={14} /> Open
      </button>
      <button
        className="pe-menu-bar__item"
        onClick={() => onSaveProject?.()}
        title="Save Project (Ctrl+Shift+S)"
        data-tooltip="Save current layers and settings as a DawnDesk project."
        style={{ color: 'var(--pe-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <Save size={14} /> Save
      </button>
      <button
        className="pe-menu-bar__item"
        onClick={() => onSaveProjectAs?.()}
        title="Save Project As"
        data-tooltip="Save this edit as a separate DawnDesk project."
        style={{ color: 'var(--pe-text-primary)' }}
      >
        Save As
      </button>
      <button
        className="pe-menu-bar__item"
        onClick={onExportDialog ?? onExport}
        title="Export (Ctrl+S)"
        data-tooltip="Export the active image with format and quality options."
        style={{
          background: 'var(--pe-accent)',
          color: '#000',
          fontWeight: 700,
          borderRadius: 6,
          padding: '4px 12px',
        }}
      >
        Export
      </button>
    </div>
  );
}
