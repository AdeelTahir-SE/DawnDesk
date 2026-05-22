import { useState, useRef, useEffect } from 'react';
import { applyGrayscale, applyInvert, applyBlurFast, applySharpen } from '../../engine/photo-editor/filters';

interface MenuBarProps {
  onOpenImage: () => void;
  onExport: () => void;
  onRotate: (deg: 90 | -90 | 180) => void;
  onFlip: (dir: 'horizontal' | 'vertical') => void;
  onApplyFilter: (name: string, fn: (data: ImageData) => ImageData) => void;
  onUndo: () => void;
  onRedo: () => void;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  separator?: boolean;
}

interface MenuDef {
  label: string;
  items: MenuItem[];
}

export default function PhotoEditorMenuBar({
  onOpenImage, onExport, onRotate, onFlip, onApplyFilter, onUndo, onRedo,
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
        { label: 'Open Image...', shortcut: 'Ctrl+O', action: () => { onOpenImage(); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Export As PNG/JPG', shortcut: 'Ctrl+S', action: () => { onExport(); setOpenMenu(null); } },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => { onUndo(); setOpenMenu(null); } },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: () => { onRedo(); setOpenMenu(null); } },
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
        { label: 'Flip Horizontal', action: () => { onFlip('horizontal'); setOpenMenu(null); } },
        { label: 'Flip Vertical', action: () => { onFlip('vertical'); setOpenMenu(null); } },
      ],
    },
    {
      label: 'Filters',
      items: [
        { label: 'Grayscale', action: () => { onApplyFilter('Grayscale', applyGrayscale); setOpenMenu(null); } },
        { label: 'Invert Colors', action: () => { onApplyFilter('Invert', applyInvert); setOpenMenu(null); } },
        { separator: true, label: '' },
        { label: 'Blur (Radius 3)', action: () => { onApplyFilter('Blur', (d) => applyBlurFast(d, 3)); setOpenMenu(null); } },
        { label: 'Blur (Radius 8)', action: () => { onApplyFilter('Blur', (d) => applyBlurFast(d, 8)); setOpenMenu(null); } },
        { label: 'Sharpen', action: () => { onApplyFilter('Sharpen', (d) => applySharpen(d, 50)); setOpenMenu(null); } },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'Keyboard Shortcuts', action: () => setOpenMenu(null) },
        { label: 'About Photo Editor', action: () => setOpenMenu(null) },
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
                    <span>{item.label}</span>
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
      <button
        className="pe-menu-bar__item"
        onClick={onOpenImage}
        title="Open Image (Ctrl+O)"
        style={{ color: 'var(--pe-text-primary)' }}
      >
        📂 Open
      </button>
      <button
        className="pe-menu-bar__item"
        onClick={onExport}
        title="Export (Ctrl+S)"
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
