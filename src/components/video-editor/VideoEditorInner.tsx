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
import PlaybackEngine from './preview/PlaybackEngine';
import NewProjectModal from './NewProjectModal';
import { Film, FolderOpen, Plus } from 'lucide-react';

import { useFFmpeg } from '../../engine/video-editor/useFFmpeg';

export default function VideoEditorInner() {
  const { state, dispatch } = useVideoEditor();
  const { checkFFmpeg, loadProject } = useFFmpeg();

  // Auto-check FFmpeg and show modal if no project
  useEffect(() => {
    checkFFmpeg();
    if (!state.project && !state.showNewProjectModal) {
      dispatch({ type: 'TOGGLE_NEW_PROJECT_MODAL' });
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

  return (
    <div className="ve-layout">
      {state.project ? (
        <>
          <PlaybackEngine />
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
                <button key={i} className="ve-context-item" disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.disabled && item.action) {
                      dispatch({ type: item.action as any });
                    }
                    dispatch({ type: 'CLOSE_CONTEXT_MENU' });
                  }}>
                  <span>{item.label}</span>
                  {item.shortcut && <span className="ve-context-shortcut">{item.shortcut}</span>}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)' }}>
          <MenuBar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '50px 80px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ width: 80, height: 80, borderRadius: '20px', background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 10px 25px -5px rgba(250, 204, 21, 0.3)' }}>
                <Film size={40} color="#000" />
              </div>
              <h1 style={{ fontFamily: 'Sora', fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>DawnDesk Video Editor</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', marginBottom: '40px', textAlign: 'center' }}>Create, edit, and master your next great video.</p>
              
              <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'center' }}>
                <button 
                  className="dd-btn-primary" 
                  style={{ padding: '12px 24px', fontSize: '1rem', height: 'auto', display: 'flex', gap: '8px' }} 
                  onClick={() => dispatch({ type: 'TOGGLE_NEW_PROJECT_MODAL' })}
                >
                  <Plus size={20} /> Create New Project
                </button>
                <button 
                  className="dd-btn-secondary" 
                  style={{ padding: '12px 24px', fontSize: '1rem', height: 'auto', display: 'flex', gap: '8px' }} 
                  onClick={loadProject}
                >
                  <FolderOpen size={20} /> Open Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <NewProjectModal />
    </div>
  );
}
