import './video-editor.css';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useVideoEditor } from '../../engine/video-editor/VideoEditorContext';
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
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function VideoEditorInner() {
  const { state, dispatch } = useVideoEditor();
  const { checkFFmpeg, loadProject, saveProject, saveProjectAs, importMedia, importMediaPaths } = useFFmpeg();
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [timelineHeight, setTimelineHeight] = useState(260);

  const layoutVars = {
    '--ve-left-panel-width': state.leftPanelOpen ? `${leftPanelWidth}px` : '0px',
    '--ve-right-panel-width': state.rightPanelOpen ? `${rightPanelWidth}px` : '0px',
    '--ve-timeline-height': `${timelineHeight}px`,
  } as CSSProperties;

  const startResize = useCallback((
    axis: 'left' | 'right' | 'timeline',
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const initialLeft = leftPanelWidth;
    const initialRight = rightPanelWidth;
    const initialTimeline = timelineHeight;
    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;

    document.body.style.cursor = axis === 'timeline' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMove = (moveEvent: MouseEvent) => {
      if (axis === 'left') {
        setLeftPanelWidth(clamp(initialLeft + moveEvent.clientX - startX, 220, 440));
      } else if (axis === 'right') {
        setRightPanelWidth(clamp(initialRight - (moveEvent.clientX - startX), 240, 480));
      } else {
        setTimelineHeight(clamp(initialTimeline - (moveEvent.clientY - startY), 170, 500));
      }
    };

    const handleUp = () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [leftPanelWidth, rightPanelWidth, timelineHeight]);

  // Auto-check FFmpeg and show modal if no project
  useEffect(() => {
    checkFFmpeg();
    if (!state.project && !state.showNewProjectModal) {
      dispatch({ type: 'TOGGLE_NEW_PROJECT_MODAL' });
    }
    
    // Listen for native OS file drops
    const setupDragDrop = async () => {
      try {
        const unlisten = await getCurrentWebviewWindow().onDragDropEvent((event) => {
          if (event.payload.type === 'drop') {
            importMediaPaths(event.payload.paths);
          }
        });
        return unlisten;
      } catch (e) {
        console.error('Failed to setup native drag and drop', e);
        return () => {};
      }
    };
    
    let unlistenFn: (() => void) | undefined;
    setupDragDrop().then(fn => { unlistenFn = fn; });
    
    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      const key = e.code;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (key === 'Space') { e.preventDefault(); dispatch({ type: 'TOGGLE_PLAY' }); }
      else if (ctrl && !shift && key === 'KeyN') { e.preventDefault(); dispatch({ type: 'TOGGLE_NEW_PROJECT_MODAL' }); }
      else if (ctrl && !shift && key === 'KeyO') { e.preventDefault(); loadProject(); }
      else if (ctrl && !shift && key === 'KeyS') { e.preventDefault(); saveProject(); }
      else if (ctrl && shift && key === 'KeyS') { e.preventDefault(); saveProjectAs(); }
      else if (ctrl && !shift && key === 'KeyI') { e.preventDefault(); importMedia(); }
      else if (ctrl && !shift && key === 'KeyC') { e.preventDefault(); dispatch({ type: 'COPY' }); }
      else if (ctrl && !shift && key === 'KeyV') { e.preventDefault(); dispatch({ type: 'PASTE' }); }
      else if (ctrl && !shift && key === 'KeyX') { e.preventDefault(); dispatch({ type: 'COPY' }); dispatch({ type: 'REMOVE_CLIPS', payload: state.selectedClipIds }); }
      else if (ctrl && !shift && key === 'KeyG') { e.preventDefault(); dispatch({ type: 'GROUP_SELECTED_CLIPS' }); }
      else if (ctrl && shift && key === 'KeyG') { e.preventDefault(); dispatch({ type: 'UNGROUP_SELECTED_CLIPS' }); }
      else if (ctrl && shift && key === 'KeyI') { e.preventDefault(); dispatch({ type: 'INSERT_TIMELINE_GAP', payload: { time: state.playheadTime, duration: 1 } }); }
      else if (ctrl && shift && key === 'Backspace') { e.preventDefault(); dispatch({ type: 'DELETE_TIMELINE_GAPS', payload: state.selectedTrackId ? { trackId: state.selectedTrackId } : undefined }); }
      else if (ctrl && !shift && key === 'KeyA') { e.preventDefault(); dispatch({ type: 'SELECT_CLIPS', payload: state.project?.tracks.flatMap(t => t.clips.map(c => c.id)) || [] }); }
      else if (key === 'KeyV' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'select' });
      else if (key === 'KeyC' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'razor' });
      else if (key === 'KeyB' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'ripple' });
      else if (key === 'KeyN' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'roll' });
      else if (key === 'KeyY' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'slip' });
      else if (key === 'KeyU' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'slide' });
      else if (key === 'KeyH' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'hand' });
      else if (key === 'KeyT' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'text' });
      else if (key === 'KeyP' && !ctrl) dispatch({ type: 'SET_TOOL', payload: 'pen' });
      else if (key === 'Delete' || key === 'Backspace') {
        const selectedEffectClipId = state.selectedEffectId
          ? state.project?.tracks
              .flatMap(track => track.clips)
              .find(clip => clip.effects.some(effect => effect.id === state.selectedEffectId))?.id
          : null;
        if (state.selectedTimelineEffectId) {
          e.preventDefault();
          dispatch({ type: 'REMOVE_TIMELINE_EFFECT', payload: state.selectedTimelineEffectId });
        } else if (state.selectedEffectId && selectedEffectClipId) {
          e.preventDefault();
          dispatch({
            type: 'REMOVE_EFFECT',
            payload: { clipId: selectedEffectClipId, effectId: state.selectedEffectId },
          });
        } else if (state.selectedClipIds.length > 0) {
          e.preventDefault();
          dispatch({ type: shift ? 'RIPPLE_DELETE_CLIPS' : 'REMOVE_CLIPS', payload: state.selectedClipIds });
        } else if (state.selectedMediaIds.length > 0) {
          e.preventDefault();
          dispatch({ type: 'REMOVE_MEDIA', payload: state.selectedMediaIds });
        }
      }
      else if (ctrl && !shift && key === 'KeyZ') { e.preventDefault(); dispatch({ type: 'UNDO' }); }
      else if (ctrl && shift && key === 'KeyZ') { e.preventDefault(); dispatch({ type: 'REDO' }); }
      else if (key === 'KeyS' && !ctrl) dispatch({ type: 'TOGGLE_SNAP' });
      else if (key === 'Equal' && !ctrl) dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom * 1.2 });
      else if (key === 'Minus' && !ctrl) dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom / 1.2 });
      else if (key === 'KeyI' && !ctrl) dispatch({ type: 'SET_IN_POINT', payload: state.playheadTime });
      else if (key === 'KeyO' && !ctrl) dispatch({ type: 'SET_OUT_POINT', payload: state.playheadTime });
      else if (key === 'KeyM' && !ctrl) dispatch({ type: 'ADD_MARKER', payload: { id: `m-${Date.now()}`, time: state.playheadTime, label: 'Marker', color: 'yellow', duration: 0, comment: '' } });
      else if (key === 'KeyJ' && !ctrl) dispatch({ type: 'STEP_BACKWARD' });
      else if (key === 'KeyL' && !ctrl) dispatch({ type: 'STEP_FORWARD' });
      else if (ctrl && shift && key === 'KeyE') { e.preventDefault(); dispatch({ type: 'TOGGLE_EXPORT_DIALOG' }); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, importMedia, loadProject, saveProject, saveProjectAs, state.project, state.selectedClipIds, state.selectedEffectId, state.selectedMediaIds, state.selectedTimelineEffectId, state.timelineZoom, state.playheadTime, state.selectedTrackId]);

  return (
    <div className="ve-layout animate-fadeIn duration-500" style={layoutVars}>
      {state.project ? (
        <>
          <PlaybackEngine />
          <MenuBar />
          <EditorToolbar />
          {state.leftPanelOpen && <LeftPanel />}
          {state.leftPanelOpen && (
            <div
              className="ve-panel-resizer ve-panel-resizer-left"
              onMouseDown={(event) => startResize('left', event)}
              title="Resize media panel"
            />
          )}
          <PreviewCanvas />
          {state.rightPanelOpen && (
            <div
              className="ve-panel-resizer ve-panel-resizer-right"
              onMouseDown={(event) => startResize('right', event)}
              title="Resize inspector"
            />
          )}
          {state.rightPanelOpen && <RightPanel />}
          <div
            className="ve-panel-resizer ve-panel-resizer-timeline"
            onMouseDown={(event) => startResize('timeline', event)}
            title="Resize timeline"
          />
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
        <div className="ve-welcome-shell">
          <div className="ve-welcome-stage">
            <div className="ve-welcome-card">
              <div className="ve-welcome-icon">
                <Film size={40} color="#000" />
              </div>
              <p className="ve-welcome-kicker">Welcome to DawnDesk</p>
              <h1 className="ve-welcome-title">Video Editor</h1>
              <p className="ve-welcome-copy">Start a timeline with project settings that match your footage, or reopen an existing DawnDesk edit.</p>
              
              <div className="ve-welcome-actions">
                <button 
                  className="dd-btn-primary ve-welcome-action" 
                  onClick={() => dispatch({ type: 'TOGGLE_NEW_PROJECT_MODAL' })}
                >
                  <Plus size={20} /> Create Project
                </button>
                <button 
                  className="dd-btn-secondary ve-welcome-action" 
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
