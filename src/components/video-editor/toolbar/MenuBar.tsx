import { useState } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { useFFmpeg } from '../../../engine/video-editor/useFFmpeg';

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export default function MenuBar() {
  const { state, dispatch } = useVideoEditor();
  const { importMedia, saveProject, saveProjectAs, loadProject } = useFFmpeg();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleMenuClick = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled || item.separator) return;
    item.action?.();
    setOpenMenu(null);
  };

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New Project', shortcut: 'Ctrl+N', action: () => dispatch({ type: 'TOGGLE_NEW_PROJECT_MODAL' }) },
      { label: 'Open Project', shortcut: 'Ctrl+O', action: loadProject },
      { label: 'Save', shortcut: 'Ctrl+S', action: saveProject },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: saveProjectAs },
      { label: '', separator: true },
      { label: 'Import Media', shortcut: 'Ctrl+I', action: importMedia },
      { label: '', separator: true },
      { label: 'Project Settings', action: () => dispatch({ type: 'TOGGLE_PROJECT_SETTINGS' }) },
      { label: '', separator: true },
      { label: 'Close Project', action: () => dispatch({ type: 'CLOSE_PROJECT' }) },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: () => dispatch({ type: 'UNDO' }), disabled: state.historyIndex <= 0 },
      { label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: () => dispatch({ type: 'REDO' }), disabled: state.historyIndex >= state.history.length - 1 },
      { label: '', separator: true },
      { label: 'Cut', shortcut: 'Ctrl+X', disabled: state.selectedClipIds.length === 0, action: () => { dispatch({ type: 'COPY' }); dispatch({ type: 'REMOVE_CLIPS', payload: state.selectedClipIds }); } },
      { label: 'Copy', shortcut: 'Ctrl+C', disabled: state.selectedClipIds.length === 0, action: () => dispatch({ type: 'COPY' }) },
      { label: 'Paste', shortcut: 'Ctrl+V', disabled: state.clipboard.length === 0, action: () => dispatch({ type: 'PASTE' }) },
      { label: '', separator: true },
      { label: 'Select All', shortcut: 'Ctrl+A', action: () => dispatch({ type: 'SELECT_CLIPS', payload: state.project?.tracks.flatMap(t => t.clips.map(c => c.id)) || [] }) },
      { label: 'Deselect All', shortcut: 'Ctrl+D', action: () => dispatch({ type: 'DESELECT_ALL' }) },
      { label: '', separator: true },
      { label: 'Delete Selected', shortcut: 'Del', action: () => dispatch({ type: 'REMOVE_CLIPS', payload: state.selectedClipIds }), disabled: state.selectedClipIds.length === 0 },
    ],
    View: [
      { label: 'Toggle Left Panel', action: () => dispatch({ type: 'TOGGLE_LEFT_PANEL' }) },
      { label: 'Toggle Right Panel', action: () => dispatch({ type: 'TOGGLE_RIGHT_PANEL' }) },
      { label: '', separator: true },
      { label: `${state.showWaveforms ? '✓ ' : ''}Show Waveforms`, action: () => dispatch({ type: 'TOGGLE_WAVEFORMS' }) },
      { label: `${state.showThumbnails ? '✓ ' : ''}Show Thumbnails`, action: () => dispatch({ type: 'TOGGLE_THUMBNAILS' }) },
      { label: `${state.showKeyframes ? '✓ ' : ''}Show Keyframes`, action: () => dispatch({ type: 'TOGGLE_KEYFRAMES' }) },
      { label: '', separator: true },
      { label: `${state.showSafeZones ? '✓ ' : ''}Safe Zones`, action: () => dispatch({ type: 'TOGGLE_SAFE_ZONES' }) },
      { label: '', separator: true },
      { label: 'Zoom In', shortcut: '+', action: () => dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom * 1.3 }) },
      { label: 'Zoom Out', shortcut: '-', action: () => dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom / 1.3 }) },
      { label: 'Zoom to Fit', shortcut: 'Ctrl+=', action: () => dispatch({ type: 'ZOOM_TO_FIT' }) },
    ],
    Clip: [
      { label: 'Split at Playhead', shortcut: 'Ctrl+K', disabled: state.selectedClipIds.length === 0, action: () => {
        state.selectedClipIds.forEach(id => dispatch({ type: 'SPLIT_CLIP', payload: { clipId: id, time: state.playheadTime } }));
      }},
      { label: '', separator: true },
      { label: 'Speed / Duration', disabled: state.selectedClipIds.length === 0, action: () => dispatch({ type: 'SET_RIGHT_PANEL', payload: 'properties' }) },
      { label: 'Reverse', disabled: state.selectedClipIds.length === 0, action: () => {
        state.selectedClipIds.forEach(id => dispatch({ type: 'TOGGLE_CLIP_REVERSE', payload: id }));
      }},
      { label: '', separator: true },
      { label: 'Set In Point', shortcut: 'I', action: () => dispatch({ type: 'SET_IN_POINT', payload: state.playheadTime }) },
      { label: 'Set Out Point', shortcut: 'O', action: () => dispatch({ type: 'SET_OUT_POINT', payload: state.playheadTime }) },
      { label: '', separator: true },
      { label: 'Add Marker', shortcut: 'M', action: () => dispatch({ type: 'ADD_MARKER', payload: { id: `m-${Date.now()}`, time: state.playheadTime, label: 'Marker', color: 'yellow', duration: 0, comment: '' } }) },
    ],
    Export: [
      { label: 'Export Settings', shortcut: 'Ctrl+Shift+E', action: () => dispatch({ type: 'TOGGLE_EXPORT_DIALOG' }) },
      { label: '', separator: true },
      { label: 'Render Queue', action: () => dispatch({ type: 'TOGGLE_EXPORT_DIALOG' }) },
    ],
  };

  return (
    <div className="ve-menubar" onClick={(e) => { if (e.target === e.currentTarget) setOpenMenu(null); }}>
      {Object.entries(menus).map(([name, items]) => (
        <div key={name} className={`ve-menu-item ${openMenu === name ? 'active' : ''}`}
          onClick={() => handleMenuClick(name)}
          onMouseEnter={() => openMenu && setOpenMenu(name)}>
          {name}
          {openMenu === name && (
            <div className="ve-menu-dropdown" onClick={e => e.stopPropagation()}>
              {items.map((item, i) => (
                item.separator
                  ? <div key={i} className="ve-menu-separator" />
                  : <button key={i} className={`ve-menu-dropdown-item ${item.disabled ? 'disabled' : ''}`}
                      onClick={() => handleItemClick(item)}>
                      <span>{item.label}</span>
                      {item.shortcut && <span className="ve-menu-shortcut">{item.shortcut}</span>}
                    </button>
              ))}
            </div>
          )}
        </div>
      ))}
      {openMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 19 }} onClick={() => setOpenMenu(null)} />}
    </div>
  );
}
