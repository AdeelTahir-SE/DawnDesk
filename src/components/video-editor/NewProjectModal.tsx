import React, { useState } from 'react';
import { useVideoEditor } from '../../engine/video-editor/VideoEditorContext';
import { X } from 'lucide-react';
import { ProjectSettings } from '../../engine/video-editor/types';

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
      <div className="dd-modal" style={{ maxWidth: 450 }}>
        <div className="dd-modal-header">
          <h3 style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 700 }}>Create New Project</h3>
          <button className="dd-icon-btn" onClick={() => dispatch({ type: 'TOGGLE_NEW_PROJECT_MODAL' })}>
            <X size={16} />
          </button>
        </div>
        
        <div className="dd-modal-body" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <div style={{ marginBottom: 20 }}>
            <label className="dd-form-label">Project Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              autoFocus 
              className="dd-input"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="dd-form-label">Resolution</label>
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

          <div style={{ marginBottom: 20 }}>
            <label className="dd-form-label">Frame Rate (FPS)</label>
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

          <div style={{ marginBottom: 10 }}>
            <label className="dd-form-label">Audio Sample Rate</label>
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

        <div className="dd-modal-footer">
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
