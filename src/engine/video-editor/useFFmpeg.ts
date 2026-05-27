import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { MediaItem, MediaProbeResult, ExportSettings } from './types';
import { useVideoEditor } from './VideoEditorContext';
import { useRef } from 'react';

export function useFFmpeg() {
  const { state, dispatch } = useVideoEditor();

  const checkFFmpeg = async (): Promise<boolean> => {
    try {
      const isAvailable = await invoke<boolean>('ve_check_ffmpeg');
      dispatch({ type: 'SET_FFMPEG_STATUS', payload: { available: isAvailable, error: null } });
      return isAvailable;
    } catch (e) {
      dispatch({ type: 'SET_FFMPEG_STATUS', payload: { available: false, error: String(e) } });
      return false;
    }
  };

  const importMedia = async () => {
    try {
      const files = await open({
        multiple: true,
        filters: [{
          name: 'Media',
          extensions: ['mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'png', 'jpg', 'jpeg']
        }]
      });
      if (!files) return;

      dispatch({ type: 'SET_IMPORTING', payload: true });
      const filePaths = Array.isArray(files) ? files : [files];
    
      const newItems: MediaItem[] = [];
      
      for (const path of filePaths) {
        try {
          const probe = await invoke<MediaProbeResult>('ve_probe_media', { path });
          
          let thumbnail = '';
          if (probe.has_video) {
            try {
              thumbnail = await invoke<string>('ve_generate_thumbnail', { path, time: 0.0 });
            } catch (e) {
              console.error('Thumbnail generation failed', e);
            }
          }

          const name = path.split(/[/\\]/).pop() || 'Unknown';
          const type = probe.has_video ? 'video' : (probe.has_audio ? 'audio' : 'image');
          
          newItems.push({
            id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name,
            type,
            path,
            duration: probe.duration,
            width: probe.width || 0,
            height: probe.height || 0,
            fps: probe.fps || 0,
            codec: probe.codec || '',
            fileSize: probe.file_size || 0,
            thumbnail,
            waveformData: [],
            dateAdded: Date.now(),
            rating: 0,
            flag: 'none',
            tags: [],
            inPoint: 0,
            outPoint: probe.duration,
            folderId: null,
          });
        } catch (e) {
          console.error('Failed to probe media:', path, e);
        }
      }
      if (newItems.length > 0) {
        dispatch({ type: 'ADD_MEDIA_BATCH', payload: newItems });
      }
    } catch (e) {
      console.error('Import failed', e);
    } finally {
      dispatch({ type: 'SET_IMPORTING', payload: false });
    }
  };

  const unlistenRef = useRef<UnlistenFn | null>(null);

  const exportProject = async (settings: ExportSettings) => {
    const jobId = `render-${Date.now()}`;
    try {
      dispatch({
        type: 'ADD_RENDER_JOB',
        payload: {
          id: jobId,
          name: settings.name || 'Export',
          settings,
          status: 'rendering',
          progress: 0,
          startTime: Date.now(),
          endTime: null,
          error: null,
          outputPath: settings.outputPath,
        },
      });
      dispatch({ type: 'EXPORT_START' });

      if (unlistenRef.current) {
        unlistenRef.current();
      }

      const unlistenProgress = await listen<number>('export-progress', (event) => {
        dispatch({ type: 'EXPORT_PROGRESS', payload: event.payload });
        dispatch({ type: 'UPDATE_RENDER_JOB', payload: { jobId, updates: { progress: event.payload / 100 } } });
      });
      
      const unlistenComplete = await listen<string>('export-complete', (event) => {
        dispatch({ type: 'EXPORT_COMPLETE' });
        dispatch({
          type: 'UPDATE_RENDER_JOB',
          payload: { jobId, updates: { status: 'complete', progress: 1, endTime: Date.now(), outputPath: event.payload } },
        });
        // Clean up listeners
        unlistenProgress();
        unlistenComplete();
        unlistenRef.current = null;
        alert(`Export complete: ${event.payload}`);
      });

      unlistenRef.current = () => {
        unlistenProgress();
        unlistenComplete();
      };

      await invoke('ve_export_project', { settings });
    } catch (e) {
      console.error('Export failed', e);
      dispatch({ type: 'EXPORT_ERROR', payload: String(e) });
      dispatch({
        type: 'UPDATE_RENDER_JOB',
        payload: { jobId, updates: { status: 'error', error: String(e), endTime: Date.now() } },
      });
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    }
  };

  const cancelExport = async () => {
    try {
      await invoke('ve_cancel_export');
    } catch (e) {
      console.error('Cancel export failed', e);
    }
  };

  const getWaveform = async (path: string): Promise<number[]> => {
    try {
      return await invoke<number[]>('ve_generate_waveform', { path });
    } catch (e) {
      console.error('Waveform generation failed', e);
      return [];
    }
  };

  const saveProjectAs = async () => {
    try {
      const path = await save({
        filters: [{ name: 'DawnDesk Project', extensions: ['ddvp'] }]
      });
      if (path) {
        await invoke('ve_save_project', { path, projectData: JSON.stringify(state.project) });
        dispatch({ type: 'SET_DIRTY', payload: false });
        dispatch({ type: 'SET_PROJECT_PATH', payload: path });
        alert('Project saved successfully!');
      }
    } catch (e) {
      console.error('Save As failed', e);
      alert('Failed to save project');
    }
  };

  const saveProject = async () => {
    if (!state.projectPath) {
      return saveProjectAs();
    }
    try {
      await invoke('ve_save_project', { path: state.projectPath, projectData: JSON.stringify(state.project) });
      dispatch({ type: 'SET_DIRTY', payload: false });
    } catch (e) {
      console.error('Save failed', e);
      alert('Failed to save project');
    }
  };


  const loadProject = async () => {
    try {
      const path = await open({
        multiple: false,
        filters: [{ name: 'DawnDesk Project', extensions: ['ddvp'] }]
      });
      if (path && !Array.isArray(path)) {
        const data = await invoke<string>('ve_load_project', { path });
        const project = JSON.parse(data);
        dispatch({ type: 'LOAD_PROJECT', payload: project });
        dispatch({ type: 'SET_PROJECT_PATH', payload: path });
      }
    } catch (e) {
      console.error('Load failed', e);
      alert('Failed to load project');
    }
  };

  return {
    checkFFmpeg,
    importMedia,
    exportProject,
    cancelExport,
    getWaveform,
    saveProject,
    saveProjectAs,
    loadProject,
  };
}
