import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { MediaItem, MediaProbeResult, ExportSettings } from './types';
import { useVideoEditor } from './VideoEditorContext';
import { useRef } from 'react';
import { useAppLogger } from '../../utils/LoggerContext';

function exportExtension(settings: ExportSettings) {
  if (settings.videoCodec === 'prores') return 'mov';
  if (settings.videoCodec === 'dnxhd') return 'mov';
  if (settings.videoCodec === 'vp9' || settings.videoCodec === 'av1') return 'webm';
  return 'mp4';
}

function withExportExtension(path: string, extension: string) {
  return /\.[a-z0-9]{2,5}$/i.test(path) ? path : `${path}.${extension}`;
}

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
    if (!filePaths || filePaths.length === 0) return 0;
    dispatch({ type: 'SET_IMPORTING', payload: true });
  
    const newItems: MediaItem[] = [];
    
    for (const path of filePaths) {
      try {
        const extension = (path.split('.').pop() || '').toLowerCase();
        const isImageFile = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].includes(extension);
        const probe = await invoke<MediaProbeResult>('ve_probe_media', { path });
        
        let thumbnail = '';
        let timelineThumbnails: MediaItem['timelineThumbnails'] = [];
        let waveformData: number[] = [];
        if (isImageFile) {
          thumbnail = convertFileSrc(path);
          timelineThumbnails = [{ time: 0, src: thumbnail }];
        } else if (probe.has_video) {
          try {
            const thumbnailTime = probe.duration > 1 ? Math.min(10, Math.max(0.5, probe.duration * 0.25)) : 0;
            thumbnail = await invoke<string>('ve_generate_thumbnail', { path, time: thumbnailTime });
            const stripTimes = Array.from({ length: Math.min(6, Math.max(2, Math.ceil((probe.duration || 1) / 12))) }, (_, index, arr) => {
              if (arr.length <= 1) return 0;
              return Math.max(0, Math.min(probe.duration || 0, (index / (arr.length - 1)) * Math.max(0, probe.duration || 0)));
            });
            const strip = await Promise.all(stripTimes.map(async (time) => {
              try {
                return { time, src: await invoke<string>('ve_generate_thumbnail', { path, time }) };
              } catch {
                return { time, src: thumbnail };
              }
            }));
            timelineThumbnails = strip.length ? strip : [{ time: thumbnailTime, src: thumbnail }];
          } catch (e) {
            console.error('Thumbnail generation failed', e);
          }
        }

        if (probe.has_audio) {
          try {
            waveformData = await invoke<number[]>('ve_generate_waveform', { path });
          } catch (e) {
            console.error('Waveform generation failed', e);
          }
        }

        const name = path.split(/[/\\]/).pop() || 'Unknown';
        const type = isImageFile ? 'image' : (probe.has_video ? 'video' : (probe.has_audio ? 'audio' : 'image'));
        const duration = type === 'image' ? 5 : probe.duration;
        
        newItems.push({
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name,
          type,
          path,
          duration,
          width: probe.width || 0,
          height: probe.height || 0,
          fps: probe.fps || 0,
          codec: probe.codec || '',
          fileSize: probe.file_size || 0,
          thumbnail,
          timelineThumbnails,
          waveformData,
          dateAdded: Date.now(),
          rating: 0,
          flag: 'none',
          tags: [],
          inPoint: 0,
          outPoint: duration,
          folderId: null,
        });
      } catch (e) {
        const name = path.split(/[/\\]/).pop() || 'selected file';
        logError('Import failed', `DawnDesk could not read "${name}".`);
      }
    }
    if (newItems.length > 0) {
      dispatch({ type: 'ADD_MEDIA_BATCH', payload: newItems });
    }
    dispatch({ type: 'SET_IMPORTING', payload: false });
    return newItems.length;
  };

  const importMedia = async () => {
    try {
      const files = await open({
        multiple: true,
        filters: [{
          name: 'Media',
          extensions: ['mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif']
        }]
      });
      if (!files) return;
      
      const filePaths = Array.isArray(files) ? files : [files];
      const importedCount = await importMediaPaths(filePaths);
      if (importedCount > 0) {
        logSuccess('Media imported', `${importedCount} file${importedCount === 1 ? '' : 's'} added to the project.`);
      }
    } catch (e) {
      logError('Import failed', 'DawnDesk could not import the selected media.');
      dispatch({ type: 'SET_IMPORTING', payload: false });
    }
  };

  const unlistenRef = useRef<UnlistenFn | null>(null);

  const exportProject = async (settings: ExportSettings) => {
    try {
      if (!state.project || state.project.duration <= 0) {
        logError('Export unavailable', 'Add media to the timeline before exporting.');
        return;
      }
      const extension = exportExtension(settings);
      let finalOutputPath = settings.outputPath;
      if (!finalOutputPath) {
        const path = await save({
          defaultPath: `${settings.name || 'export'}.${extension}`,
          filters: [{ name: 'Video', extensions: ['mp4', 'mov', 'mkv', 'webm'] }]
        });
        if (!path) return; // User cancelled
        finalOutputPath = path;
      }
      finalOutputPath = withExportExtension(finalOutputPath, extension);

      const jobId = `render-${Date.now()}`;
      const exportRuntimeSettings = {
        ...settings,
        outputPath: finalOutputPath,
        masterVolume: state.masterVolume,
        audioEffects: state.audioEffects,
        colorGrading: state.colorGrading,
        activeMask: state.activeMask,
      };
      dispatch({
        type: 'ADD_RENDER_JOB',
        payload: {
          id: jobId,
          name: settings.name || 'Export',
          settings: exportRuntimeSettings as ExportSettings,
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
        logSuccess('Export complete', 'Your video was exported successfully.');
      });

      const unlistenError = await listen<string>('export-error', (event) => {
        dispatch({ type: 'EXPORT_ERROR', payload: event.payload });
        dispatch({
          type: 'UPDATE_RENDER_JOB',
          payload: { jobId, updates: { status: 'error', error: event.payload, endTime: Date.now() } },
        });
        unlistenProgress();
        unlistenComplete();
        unlistenError();
        unlistenRef.current = null;
        logError('Export failed', event.payload);
      });

      unlistenRef.current = () => {
        unlistenProgress();
        unlistenComplete();
        unlistenError();
      };

      await invoke('ve_export_project', { settings: exportRuntimeSettings, project: state.project });
    } catch (e) {
      logError('Export failed', 'DawnDesk could not export this project.');
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
      logInfo('Export cancelled', 'Video export was stopped.');
    } catch (e) {
      logError('Cancel failed', 'DawnDesk could not stop the current export.');
    }
  };

  const getWaveform = async (path: string): Promise<number[]> => {
    try {
      return await invoke<number[]>('ve_generate_waveform', { path });
    } catch (e) {
      console.warn('Waveform generation failed', path, e);
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
        logSuccess('Project saved', 'Video project saved successfully.');
      }
    } catch (e) {
      logError('Save failed', 'DawnDesk could not save this video project.');
    }
  };

  const saveProject = async () => {
    if (!state.projectPath) {
      return saveProjectAs();
    }
    try {
      await invoke('ve_save_project', { path: state.projectPath, projectData: JSON.stringify(state.project) });
      dispatch({ type: 'SET_DIRTY', payload: false });
      logSuccess('Project saved', 'Video project saved successfully.');
    } catch (e) {
      logError('Save failed', 'DawnDesk could not save this video project.');
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
        logSuccess('Project loaded', 'Video project opened successfully.');
      }
    } catch (e) {
      logError('Open failed', 'DawnDesk could not open this video project.');
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
