import { createPortal } from 'react-dom';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { RESOLUTION_PRESETS, FRAME_RATE_PRESETS } from '../../../engine/video-editor/constants';
import { X, Download } from 'lucide-react';
import { useFFmpeg } from '../../../engine/video-editor/useFFmpeg';
import ExportPresets from './ExportPresets';

export default function ExportDialog() {
  const { state, dispatch } = useVideoEditor();
  const es = state.exportSettings;
  const { exportProject, cancelExport } = useFFmpeg();
  const chapterCount = state.project?.markers.length ?? 0;
  const subtitleCount = state.project?.subtitles?.length ?? 0;

  const update = (patch: Record<string, unknown>) => {
    dispatch({ type: 'SET_EXPORT_SETTINGS', payload: patch });
  };

  const estimatedSize = () => {
    const durationSec = state.project?.duration ?? 60;
    const bitsPerSec = (es.videoBitrate + es.audioBitrate) * 1000;
    const bytes = (bitsPerSec * durationSec) / 8;
    if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    return `${(bytes / 1e6).toFixed(0)} MB`;
  };

  const closeDialog = () => {
    if (!state.isExporting) {
      dispatch({ type: 'TOGGLE_EXPORT_DIALOG' });
    }
  };

  return createPortal(
    <div className="dd-modal-overlay ve-export-overlay" onClick={closeDialog}>
      <div className="dd-modal ve-export-modal" onClick={e => e.stopPropagation()}>
        <div className="dd-modal-header">
          <h3 className={state.isExporting ? 've-export-title ve-export-title-active' : 've-export-title'}>Export Settings</h3>
          {!state.isExporting && (
            <button className="dd-icon-btn" onClick={closeDialog}><X size={16} /></button>
          )}
        </div>

        <div className="dd-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {state.isExporting ? (
            <div className="ve-export-progress-state">
              <h3>Exporting... {state.exportProgress}%</h3>
              <div className="ve-export-progress-bar">
                <div style={{ width: `${state.exportProgress}%` }} />
              </div>
              {state.exportError && <div className="ve-export-error">Error: {state.exportError}</div>}
              <button className="dd-btn-secondary" onClick={() => cancelExport()}>Cancel Export</button>
            </div>
          ) : (
            <>
              <div className="ve-export-grid">
            {/* Left: Video */}
            <div className="ve-export-section">
              <div className="ve-panel-section-title" style={{ marginBottom: 10 }}>Video</div>

              <div className="ve-export-field">
                <label className="dd-form-label">Output Name</label>
                <input className="dd-input" value={es.name} onChange={e => update({ name: e.target.value })} />
              </div>

              <div className="ve-export-field">
                <label className="dd-form-label">Codec</label>
                <select className="dd-select" value={es.videoCodec}
                  onChange={e => update({ videoCodec: e.target.value })}>
                  {['h264', 'h265', 'prores', 'av1', 'dnxhd', 'vp9'].map(c => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="ve-export-field">
                <label className="dd-form-label">Resolution</label>
                <select className="dd-select" value={`${es.width}x${es.height}`}
                  onChange={e => {
                    const rp = RESOLUTION_PRESETS.find(r => `${r.width}x${r.height}` === e.target.value);
                    if (rp) update({ width: rp.width, height: rp.height });
                  }}>
                  {RESOLUTION_PRESETS.map(r => (
                    <option key={r.label} value={`${r.width}x${r.height}`}>{r.label} ({r.width}×{r.height})</option>
                  ))}
                </select>
              </div>

              <div className="ve-export-field">
                <label className="dd-form-label">Frame Rate</label>
                <select className="dd-select" value={es.frameRate}
                  onChange={e => update({ frameRate: Number(e.target.value) })}>
                  {FRAME_RATE_PRESETS.map(f => (
                    <option key={f} value={f}>{f} fps</option>
                  ))}
                </select>
              </div>

              <div className="ve-export-field">
                <label className="dd-form-label">Video Bitrate (kbps)</label>
                <input type="number" className="dd-input" value={es.videoBitrate}
                  onChange={e => update({ videoBitrate: Number(e.target.value) })} />
              </div>

              <div className="ve-export-field">
                <label className="dd-form-label">Quality</label>
                <div className="ve-slider-row">
                  <input type="range" className="ve-slider" min={1} max={100} value={es.quality}
                    onChange={e => update({ quality: Number(e.target.value) })} />
                  <span className="ve-slider-value">{es.quality}</span>
                </div>
              </div>
            </div>

            {/* Right: Audio + Options */}
            <div className="ve-export-section">
              <div className="ve-panel-section-title" style={{ marginBottom: 10 }}>Audio</div>

              <div className="ve-export-field">
                <label className="dd-form-label">Audio Codec</label>
                <select className="dd-select" value={es.audioCodec}
                  onChange={e => update({ audioCodec: e.target.value })}>
                  {['aac', 'mp3', 'wav', 'flac', 'opus'].map(c => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="ve-export-field">
                <label className="dd-form-label">Audio Bitrate (kbps)</label>
                <input type="number" className="dd-input" value={es.audioBitrate}
                  onChange={e => update({ audioBitrate: Number(e.target.value) })} />
              </div>

              <div className="ve-export-field">
                <label className="dd-form-label">Sample Rate</label>
                <select className="dd-select" value={es.audioSampleRate}
                  onChange={e => update({ audioSampleRate: Number(e.target.value) })}>
                  <option value={44100}>44,100 Hz</option>
                  <option value={48000}>48,000 Hz</option>
                  <option value={96000}>96,000 Hz</option>
                </select>
              </div>

              <div className="ve-panel-section-title" style={{ marginBottom: 10, marginTop: 18 }}>Options</div>

              <div className="ve-export-option-row">
                <button className={`ve-toggle ${es.burnSubtitles ? 'active' : ''}`}
                  disabled={subtitleCount === 0}
                  title={subtitleCount === 0 ? 'Add subtitle cues in the Text panel first' : 'Burn subtitle cues into the exported video'}
                  onClick={() => subtitleCount > 0 && update({ burnSubtitles: !es.burnSubtitles })} />
                <span>Burn Subtitles <small>{subtitleCount} cue{subtitleCount === 1 ? '' : 's'}</small></span>
              </div>

              <div className="ve-export-option-row">
                <button className={`ve-toggle ${es.includeChapters ? 'active' : ''}`}
                  onClick={() => update({ includeChapters: !es.includeChapters })} />
                <span>Include Chapters <small>{chapterCount} marker{chapterCount === 1 ? '' : 's'}</small></span>
              </div>

              <div className="ve-export-size-card">
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Estimated File Size</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#FACC15' }}>{estimatedSize()}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
              <div className="ve-panel-section-title" style={{ marginBottom: 10 }}>Platform Presets</div>
              <ExportPresets />
            </div>
          </>)}
        </div>

        {!state.isExporting && (
          <div className="dd-modal-footer">
            <button className="dd-btn-secondary" onClick={closeDialog}>Close</button>
            <button className="dd-btn-primary" onClick={() => exportProject(es)}>
              <Download size={14} style={{ marginRight: 6 }} /> Export
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
