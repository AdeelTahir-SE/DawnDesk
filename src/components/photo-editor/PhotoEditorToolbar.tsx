import { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../engine/photo-editor/EditorContext';
import type { ToolType } from '../../engine/photo-editor/types';
import { getToolIcon } from './ToolIcons';
import ColorSwatchPicker from './ColorSwatchPicker';

// ─── Tool Groups ──────────────────────────────────────────────────────────────

interface ToolDef {
  type: ToolType;
  name: string;
  shortcut: string;
}

interface ToolGroup {
  tools: ToolDef[];
  label: string;
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    label: 'Move & Transform',
    tools: [
      { type: 'move', name: 'Move', shortcut: 'V' },
    ],
  },
  {
    label: 'Selection',
    tools: [
      { type: 'marquee-rect', name: 'Marquee Rect', shortcut: 'M' },
      { type: 'marquee-ellipse', name: 'Marquee Ellipse', shortcut: 'M' },
      { type: 'lasso', name: 'Lasso', shortcut: 'L' },
      { type: 'polygon-lasso', name: 'Polygon Lasso', shortcut: 'L' },
      { type: 'magic-wand', name: 'Magic Wand', shortcut: 'W' },
      { type: 'quick-selection', name: 'Quick Select', shortcut: 'Q' },
    ],
  },
  {
    label: 'Crop',
    tools: [
      { type: 'crop', name: 'Crop', shortcut: 'C' },
    ],
  },
  {
    label: 'Eyedropper',
    tools: [
      { type: 'eyedropper', name: 'Eyedropper', shortcut: 'I' },
    ],
  },
  {
    label: 'Paint',
    tools: [
      { type: 'brush', name: 'Brush', shortcut: 'B' },
      { type: 'pencil', name: 'Pencil', shortcut: 'N' },
      { type: 'eraser', name: 'Eraser', shortcut: 'E' },
      { type: 'paint-bucket', name: 'Paint Bucket', shortcut: 'G' },
      { type: 'gradient', name: 'Gradient', shortcut: 'G' },
    ],
  },
  {
    label: 'Retouch',
    tools: [
      { type: 'clone-stamp', name: 'Clone Stamp', shortcut: 'S' },
      { type: 'healing-brush', name: 'Healing Brush', shortcut: 'J' },
      { type: 'spot-heal', name: 'Spot Heal', shortcut: 'K' },
    ],
  },
  {
    label: 'Text',
    tools: [
      { type: 'text', name: 'Text', shortcut: 'T' },
    ],
  },
  {
    label: 'Shape',
    tools: [
      { type: 'shape-rect', name: 'Rectangle', shortcut: 'U' },
      { type: 'shape-ellipse', name: 'Ellipse', shortcut: 'U' },
      { type: 'line', name: 'Line', shortcut: '\\' },
      { type: 'polygon', name: 'Polygon', shortcut: 'Y' },
      { type: 'pen-path', name: 'Pen Path', shortcut: 'P' },
    ],
  },
  {
    label: 'View',
    tools: [
      { type: 'hand', name: 'Hand', shortcut: 'H' },
      { type: 'zoom', name: 'Zoom', shortcut: 'Z' },
    ],
  },
];

// ─── Tool Group Button ────────────────────────────────────────────────────────

interface ToolGroupButtonProps {
  group: ToolGroup;
  activeTool: ToolType;
  selectedInGroup: ToolType;
  onSelectTool: (t: ToolType) => void;
}

function ToolGroupButton({ group, activeTool, selectedInGroup, onSelectTool }: ToolGroupButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasMultiple = group.tools.length > 1;
  const isActive = group.tools.some((t) => t.type === activeTool);

  // Display the active tool if it is in this group, otherwise the last selected/default tool
  const activeInGroup = group.tools.find((t) => t.type === activeTool);
  const displayTool = activeInGroup ?? group.tools.find((t) => t.type === selectedInGroup) ?? group.tools[0];

  // Close flyout on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!hasMultiple) {
    const tool = group.tools[0];
    return (
      <button
        className={`pe-tool-btn ${activeTool === tool.type ? 'pe-tool-btn--active' : ''}`}
        onClick={() => onSelectTool(tool.type)}
        title={`${tool.name} (${tool.shortcut})`}
      >
        <span className="pe-tool-btn__icon">
          {getToolIcon(tool.type)}
        </span>
        <span className="pe-tool-btn__label">{tool.name}</span>
      </button>
    );
  }

  return (
    <div
      ref={ref}
      style={{ position: 'relative' }}
      onContextMenu={(e) => {
        e.preventDefault();
        setOpen(true);
      }}
    >
      <div
        className={`pe-tool-btn ${isActive ? 'pe-tool-btn--active' : ''}`}
        style={{ display: 'flex', alignItems: 'center', cursor: 'default' }}
      >
        {/* Primary tool button */}
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            flex: 1, background: 'none', border: 'none',
            color: 'inherit', font: 'inherit', cursor: 'pointer',
            padding: 0, textAlign: 'left',
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectTool(group.tools[0].type);
            setOpen(true);
          }}
          title={`${displayTool.name} (${displayTool.shortcut})`}
        >
          <span className="pe-tool-btn__icon">
            {getToolIcon(displayTool.type)}
          </span>
          <span className="pe-tool-btn__label">{displayTool.name}</span>
        </button>

        {/* Expand arrow */}
        <button
          className="pe-tool-btn__more"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--pe-text-muted)', padding: '0 4px',
            fontSize: 9, lineHeight: 1, display: 'flex', alignItems: 'center',
            flexShrink: 0,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          title="More tools"
        >
          <span aria-hidden="true">▾</span>
        </button>
      </div>

      {/* Flyout */}
      {open && (
        <div className="pe-tool-flyout" style={{
          position: 'absolute',
          left: '100%',
          top: 0,
          zIndex: 200,
          background: 'var(--pe-bg-panel)',
          border: '1px solid var(--pe-border)',
          borderRadius: 8,
          padding: '4px',
          minWidth: 180,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          marginLeft: 4,
        }}>
          <div style={{ fontSize: 10, color: 'var(--pe-text-muted)', padding: '4px 8px 6px', borderBottom: '1px solid var(--pe-border-subtle)', marginBottom: 4 }}>
            {group.label}
          </div>
          {group.tools.map((tool) => (
            <button
              key={tool.type}
              className={`pe-tool-btn ${activeTool === tool.type ? 'pe-tool-btn--active' : ''}`}
              style={{ width: '100%' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectTool(tool.type);
                setOpen(false);
              }}
            >
              <span className="pe-tool-btn__icon">{getToolIcon(tool.type)}</span>
              <span className="pe-tool-btn__label">{tool.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--pe-text-muted)', paddingLeft: 8 }}>{tool.shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

export default function PhotoEditorToolbar() {
  const { state, dispatch } = useEditor();
  // Track which tool is "remembered" per group (so flyout shows last picked)
  const [selectedPerGroup, setSelectedPerGroup] = useState<Record<number, ToolType>>({});

  const handleSelectTool = (groupIdx: number, toolType: ToolType) => {
    dispatch({ type: 'SET_TOOL', payload: toolType });
    setSelectedPerGroup((prev) => ({ ...prev, [groupIdx]: toolType }));
  };

  return (
    <div className="pe-toolbar">
      <div className="pe-toolbar__title">Tools</div>
      <div className="pe-toolbar__tools">
        {TOOL_GROUPS.map((group, i) => (
          <ToolGroupButton
            key={i}
            group={group}
            activeTool={state.activeTool}
            selectedInGroup={selectedPerGroup[i] ?? group.tools[0].type}
            onSelectTool={(t) => handleSelectTool(i, t)}
          />
        ))}
      </div>
      <ColorSwatchPicker />
    </div>
  );
}
