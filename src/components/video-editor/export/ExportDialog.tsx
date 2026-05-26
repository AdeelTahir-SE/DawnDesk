import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { RESOLUTION_PRESETS, FRAME_RATE_PRESETS } from '../../../engine/video-editor/constants';
import { X, Download } from 'lucide-react';
import { useFFmpeg } from '../../../engine/video-editor/useFFmpeg';
import ExportPresets from './ExportPresets';

export default function ExportDialog() {
  const { state, dispatch } = useVideoEditor();
  const es = state.exportSettings;
  const { exportProject, cancelExport } = useFFmpeg();

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

  return (
    <div className="dd-modal-overlay" onClick={() => dispatch({ type: 'TOGGLE_EXPORT_DIALOG' })}>
      <div className="dd-modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="dd-modal-header">
          <h3 style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 700 }}>Export Settings</h3>
          <button className="dd-icon-btn" onClick={() => dispatch({ type: 'TOGGLE_EXPORT_DIALOG' })}><X size={16} /></button>
        </div>

        <div className="dd-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {state.isExporting ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <h3 style={{ marginBottom: 20 }}>Exporting... {state.exportProgress}%</h3>
              <div style={{ width: '100%', height: 8, background: 'var(--ve-bg-surface)', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ width: `${state.exportProgress}%`, height: '100%', background: '#FACC15', transition: 'width 0.2s' }} />
              </div>
              {state.exportError && <div style={{ color: '#ef4444', marginBottom: 20 }}>Error: {state.exportError}</div>}
              <button className="dd-btn-secondary" onClick={() => cancelExport()}>Cancel Export</button>
            </div>
          ) : (
            <>
              <div className="ve-export-grid">
            {/* Left: Video */}
            <div>
              <div className="ve-panel-section-title" style={{ marginBottom: 10 }}>Video</div>

              <div style={{ marginBottom: 8 }}>
                <label className="dd-form-label">Output Name</label>
                <input className="dd-input" value={es.name} onChange={e => update({ name: e.target.value })} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label className="dd-form-label">Codec</label>
                <select className="dd-select" value={es.videoCodec}
                  onChange={e => update({ videoCodec: e.target.value })}>
                  {['h264', 'h265', 'prores', 'av1', 'dnxhd', 'vp9'].map(c => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 8 }}>
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

              <div style={{ marginBottom: 8 }}>
                <label className="dd-form-label">Frame Rate</label>
                <select className="dd-select" value={es.frameRate}
                  onChange={e => update({ frameRate: Number(e.target.value) })}>
                  {FRAME_RATE_PRESETS.map(f => (
                    <option key={f} value={f}>{f} fps</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label className="dd-form-label">Video Bitrate (kbps)</label>
                <input type="number" className="dd-input" value={es.videoBitrate}
                  onChange={e => update({ videoBitrate: Number(e.target.value) })} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label className="dd-form-label">Quality</label>
                <div className="ve-slider-row">
                  <input type="range" className="ve-slider" min={1} max={100} value={es.quality}
                    onChange={e => update({ quality: Number(e.target.value) })} />
                  <span className="ve-slider-value">{es.quality}</span>
                </div>
              </div>
            </div>

            {/* Right: Audio + Options */}
            <div>
              <div className="ve-panel-section-title" style={{ marginBottom: 10 }}>Audio</div>

              <div style={{ marginBottom: 8 }}>
                <label className="dd-form-label">Audio Codec</label>
                <select className="dd-select" value={es.audioCodec}
                  onChange={e => update({ audioCodec: e.target.value })}>
                  {['aac', 'mp3', 'wav', 'flac', 'opus'].map(c => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label className="dd-form-label">Audio Bitrate (kbps)</label>
                <input type="number" className="dd-input" value={es.audioBitrate}
                  onChange={e => update({ audioBitrate: Number(e.target.value) })} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label className="dd-form-label">Sample Rate</label>
                <select className="dd-select" value={es.audioSampleRate}
                  onChange={e => update({ audioSampleRate: Number(e.target.value) })}>
                  <option value={44100}>44,100 Hz</option>
                  <option value={48000}>48,000 Hz</option>
                  <option value={96000}>96,000 Hz</option>
                </select>
              </div>

              <div className="ve-panel-section-title" style={{ marginBottom: 10, marginTop: 20 }}>Options</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <button className={`ve-toggle ${es.burnSubtitles ? 'active' : ''}`}
                  onClick={() => update({ burnSubtitles: !es.burnSubtitles })} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Burn Subtitles</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <button className={`ve-toggle ${es.includeChapters ? 'active' : ''}`}
                  onClick={() => update({ includeChapters: !es.includeChapters })} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Include Chapters</span>
              </div>

              <div style={{
                padding: 12, borderRadius: 8, background: 'var(--ve-bg-surface)', border: '1px solid var(--ve-border)',
              }}>
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

        <div className="dd-modal-footer">
          <button className="dd-btn-secondary" onClick={() => dispatch({ type: 'TOGGLE_EXPORT_DIALOG' })} disabled={state.isExporting}>Close</button>
          <button className="dd-btn-primary" onClick={() => exportProject(es)} disabled={state.isExporting}>
            <Download size={14} style={{ marginRight: 6 }} /> Export
          </button>
        </div>
      </div>
    </div>
  );
}
