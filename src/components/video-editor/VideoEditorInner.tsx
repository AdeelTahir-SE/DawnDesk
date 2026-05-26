import './video-editor.css';
import { useEffect } from 'react';
import { useVideoEditor } from '../../engine/video-editor/VideoEditorContext';
import { DEFAULT_PROJECT_SETTINGS } from '../../engine/video-editor/constants';
import MenuBar from './toolbar/MenuBar';
import EditorToolbar from './toolbar/EditorToolbar';
import LeftPanel from './panels/LeftPanel';
import PreviewCanvas from './preview/PreviewCanvas';
import RightPanel from './panels/RightPanel';
import Timeline from './timeline/Timeline';
import StatusBar from './StatusBar';
import ExportDialog from './export/ExportDialog';

export default function VideoEditorInner() {
  const { state, dispatch } = useVideoEditor();

  // Auto-create project if none exists
  useEffect(() => {
    if (!state.project) {
      dispatch({ type: 'NEW_PROJECT', payload: DEFAULT_PROJECT_SETTINGS });
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      const key = e.code;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (key === 'Space') { e.preventDefault(); dispatch({ type: 'TOGGLE_PLAY' }); }
      else if (key === 'KeyV' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'select' });
      else if (key === 'KeyC' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'razor' });
      else if (key === 'KeyB' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'ripple' });
      else if (key === 'KeyN' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'roll' });
      else if (key === 'KeyH' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'hand' });
      else if (key === 'KeyT' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'text' });
      else if (key === 'KeyP' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'pen' });
      else if (key === 'Delete' || key === 'Backspace') {
        if (state.selectedClipIds.length > 0) {
          e.preventDefault();
          dispatch({ type: 'REMOVE_CLIPS', payload: state.selectedClipIds });
        }
      }
      else if (ctrl && !shift && key === 'KeyZ') { e.preventDefault(); dispatch({ type: 'UNDO' }); }
      else if (ctrl && shift && key === 'KeyZ') { e.preventDefault(); dispatch({ type: 'REDO' }); }
      else if (key === 'KeyS' && !ctrl) dispatch({ type: 'TOGGLE_SNAP' });
      else if (key === 'Equal' && !ctrl) dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom * 1.2 });
      else if (key === 'Minus' && !ctrl) dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom / 1.2 });
      else if (key === 'KeyI' && !ctrl) dispatch({ type: 'SET_IN_POINT', payload: state.playheadTime });
      else if (key === 'KeyO' && !ctrl) dispatch({ type: 'SET_OUT_POINT', payload: state.playheadTime });
      else if (key === 'KeyJ' && !ctrl) dispatch({ type: 'STEP_BACKWARD' });
      else if (key === 'KeyL' && !ctrl) dispatch({ type: 'STEP_FORWARD' });
      else if (ctrl && shift && key === 'KeyE') { e.preventDefault(); dispatch({ type: 'TOGGLE_EXPORT_DIALOG' }); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, state.selectedClipIds, state.timelineZoom, state.playheadTime]);

  if (!state.project) return null;

  return (
    <div className="ve-layout">
      <MenuBar />
      <EditorToolbar />
      {state.leftPanelOpen && <LeftPanel />}
      <PreviewCanvas />
      {state.rightPanelOpen && <RightPanel />}
      <Timeline />
      <StatusBar />
      {state.showExportDialog && <ExportDialog />}
      {state.contextMenu && (
        <div className="ve-context-menu" style={{ left: state.contextMenu.x, top: state.contextMenu.y }}
          onClick={() => dispatch({ type: 'CLOSE_CONTEXT_MENU' })}>
          {state.contextMenu.items.map((item, i) => (
            item.separator ? <div key={i} className="ve-context-separator" /> :
            <button key={i} className="ve-context-item" disabled={item.disabled}>
              <span>{item.label}</span>
              {item.shortcut && <span className="ve-context-shortcut">{item.shortcut}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
