import { useState } from 'react';
import { useVideoEditor } from '../../engine/video-editor/VideoEditorContext';
import { Film, Monitor, Music2, Timer, X } from 'lucide-react';
import type { ProjectSettings } from '../../engine/video-editor/types';

const RESOLUTIONS = [
  { label: 'HD (1280x720)', width: 1280, height: 720 },
  { label: 'Full HD (1920x1080)', width: 1920, height: 1080 },
  { label: '2K (2560x1440)', width: 2560, height: 1440 },
  { label: '4K (3840x2160)', width: 3840, height: 2160 },
  { label: 'Vertical HD (1080x1920)', width: 1080, height: 1920 },
  { label: 'Square (1080x1080)', width: 1080, height: 1080 },
];

const FRAME_RATES = [24, 25, 30, 50, 60];

const SAMPLE_RATES = [44100, 48000, 96000];

export default function NewProjectModal() {
  const { state, dispatch } = useVideoEditor();
  const [name, setName] = useState('Untitled Project');
  const [resolutionIdx, setResolutionIdx] = useState(1); // 1920x1080
  const [frameRate, setFrameRate] = useState(30);
  const [sampleRate, setSampleRate] = useState(48000);

  if (!state.showNewProjectModal) return null;

  const handleCreate = () => {
    const res = RESOLUTIONS[resolutionIdx];
    const settings: ProjectSettings = {
      name,
      width: res.width,
      height: res.height,
      frameRate,
      sampleRate,
      backgroundColor: '#000000',
    };
    dispatch({ type: 'NEW_PROJECT', payload: settings });
  };

  return (
    <div className="dd-modal-overlay">
      <div className="dd-modal ve-new-project-modal">
        <div className="dd-modal-header ve-new-project-header">
          <div className="ve-new-project-title-row">
            <div className="ve-new-project-badge"><Film size={18} /></div>
            <div>
              <p className="ve-new-project-kicker">DawnDesk Video Editor</p>
              <h3>Create Project</h3>
            </div>
          </div>
          <button className="dd-icon-btn" onClick={() => dispatch({ type: 'TOGGLE_NEW_PROJECT_MODAL' })}>
            <X size={16} />
          </button>
        </div>
        
        <div className="dd-modal-body ve-new-project-body">
          <div className="ve-new-project-field ve-new-project-field-wide">
            <label className="dd-form-label">Project Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              autoFocus 
              className="dd-input"
            />
          </div>

          <div className="ve-new-project-field ve-new-project-field-wide">
            <label className="dd-form-label"><Monitor size={13} /> Resolution</label>
            <select 
              value={resolutionIdx} 
              onChange={e => setResolutionIdx(Number(e.target.value))}
              className="dd-select"
            >
              {RESOLUTIONS.map((res, i) => (
                <option key={i} value={i}>{res.label}</option>
              ))}
            </select>
          </div>

          <div className="ve-new-project-field">
            <label className="dd-form-label"><Timer size={13} /> Frame Rate</label>
            <select 
              value={frameRate} 
              onChange={e => setFrameRate(Number(e.target.value))}
              className="dd-select"
            >
              {FRAME_RATES.map((fps) => (
                <option key={fps} value={fps}>{fps} fps</option>
              ))}
            </select>
          </div>

          <div className="ve-new-project-field">
            <label className="dd-form-label"><Music2 size={13} /> Audio</label>
            <select 
              value={sampleRate} 
              onChange={e => setSampleRate(Number(e.target.value))}
              className="dd-select"
            >
              {SAMPLE_RATES.map((rate) => (
                <option key={rate} value={rate}>{rate / 1000} kHz</option>
              ))}
            </select>
          </div>
        </div>

        <div className="dd-modal-footer ve-new-project-footer">
          <button 
            className="dd-btn-secondary" 
            onClick={() => dispatch({ type: 'TOGGLE_NEW_PROJECT_MODAL' })}
          >
            Cancel
          </button>
          <button 
            className="dd-btn-primary" 
            onClick={handleCreate}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
