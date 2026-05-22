interface MenuBarProps {
  onOpenImage: () => void;
  onExport: () => void;
}

const MENU_ITEMS = [
  { label: 'File', action: 'file' },
  { label: 'Edit', action: 'edit' },
  { label: 'View', action: 'view' },
  { label: 'Image', action: 'image' },
  { label: 'Filters', action: 'filters' },
  { label: 'Help', action: 'help' },
];

export default function PhotoEditorMenuBar({ onOpenImage, onExport }: MenuBarProps) {
  const handleMenuClick = (action: string) => {
    // For now, only File menu actions are wired
    if (action === 'file') {
      // TODO: implement dropdown. For now, directly open
      onOpenImage();
    }
  };

  return (
    <div className="pe-menu-bar">
      <span className="pe-menu-bar__title">Photo Editor</span>
      {MENU_ITEMS.map((item) => (
        <button
          key={item.label}
          className="pe-menu-bar__item"
          onClick={() => handleMenuClick(item.action)}
        >
          {item.label}
        </button>
      ))}

      {/* Right side: spacer + Save + Export */}
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
