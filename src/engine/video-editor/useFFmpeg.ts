import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { MediaItem, MediaProbeResult, ExportSettings } from './types';
import { useVideoEditor } from './VideoEditorContext';
import { useRef } from 'react';
import { useAppLogger } from '../../utils/LoggerContext';

export function useFFmpeg() {
  const { state, dispatch } = useVideoEditor();
  const { logSuccess, logError, logInfo } = useAppLogger();

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

  const importMediaPaths = async (filePaths: string[]) => {
    if (!filePaths || filePaths.length === 0) return;
    dispatch({ type: 'SET_IMPORTING', payload: true });
  
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
        logError('Import Media', `Failed to probe media: ${path}`);
      }
    }
    if (newItems.length > 0) {
      dispatch({ type: 'ADD_MEDIA_BATCH', payload: newItems });
    }
    dispatch({ type: 'SET_IMPORTING', payload: false });
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
      
      const filePaths = Array.isArray(files) ? files : [files];
      await importMediaPaths(filePaths);
      logSuccess('Import Media', 'Media files imported successfully');
    } catch (e) {
      logError('Import Media', `Import failed: ${String(e)}`);
      dispatch({ type: 'SET_IMPORTING', payload: false });
    }
  };

  const unlistenRef = useRef<UnlistenFn | null>(null);

  const exportProject = async (settings: ExportSettings) => {
    try {
      let finalOutputPath = settings.outputPath;
      if (!finalOutputPath) {
        const path = await save({
          defaultPath: settings.name || 'export',
          filters: [{ name: 'Video', extensions: ['mp4', 'mov', 'mkv', 'webm'] }]
        });
        if (!path) return; // User cancelled
        finalOutputPath = path;
      }

      const jobId = `render-${Date.now()}`;
      dispatch({
        type: 'ADD_RENDER_JOB',
        payload: {
          id: jobId,
          name: settings.name || 'Export',
          settings: { ...settings, outputPath: finalOutputPath },
          status: 'rendering',
          progress: 0,
          startTime: Date.now(),
          endTime: null,
          error: null,
          outputPath: finalOutputPath,
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
        dispatch({ type: 'SET_EXPORT_SETTINGS', payload: { ...state.exportSettings, outputPath: undefined } }); // reset
        logSuccess('Export', `Export complete: ${event.payload}`);
      });

      unlistenRef.current = () => {
        unlistenProgress();
        unlistenComplete();
      };

      await invoke('ve_export_project', { settings: { ...settings, outputPath: finalOutputPath }, project: state.project });
    } catch (e) {
      logError('Export', `Export failed: ${String(e)}`);
      dispatch({ type: 'EXPORT_ERROR', payload: String(e) });
      const jobId = state.renderQueue.length > 0 ? state.renderQueue[state.renderQueue.length - 1].id : `render-${Date.now()}`;
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
      logInfo('Export', 'Export cancelled');
    } catch (e) {
      logError('Export', 'Cancel export failed');
    }
  };

  const getWaveform = async (path: string): Promise<number[]> => {
    try {
      return await invoke<number[]>('ve_generate_waveform', { path });
    } catch (e) {
      logError('Waveform', `Waveform generation failed: ${path}`);
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
        logSuccess('Project', 'Project saved successfully!');
      }
    } catch (e) {
      logError('Project', 'Failed to save project');
    }
  };

  const saveProject = async () => {
    if (!state.projectPath) {
      return saveProjectAs();
    }
    try {
      await invoke('ve_save_project', { path: state.projectPath, projectData: JSON.stringify(state.project) });
      dispatch({ type: 'SET_DIRTY', payload: false });
      logSuccess('Project', 'Project saved');
    } catch (e) {
      logError('Project', 'Failed to save project');
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
        logSuccess('Project', 'Project loaded');
      }
    } catch (e) {
      logError('Project', 'Failed to load project');
    }
  };

  return {
    checkFFmpeg,
    importMedia,
    importMediaPaths,
    exportProject,
    cancelExport,
    getWaveform,
    saveProject,
    saveProjectAs,
    loadProject,
  };
}
