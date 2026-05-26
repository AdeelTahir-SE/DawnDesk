import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { EXPORT_PRESETS } from '../../../engine/video-editor/constants';
import { Monitor, Smartphone, Tv, Globe, Film, Radio } from 'lucide-react';

const platformIcons: Record<string, React.ElementType> = {
  YouTube: Monitor, Twitter: Globe, Instagram: Smartphone,
  TikTok: Smartphone, Facebook: Globe, LinkedIn: Globe,
  Vimeo: Film, Broadcast: Tv, Cinema: Film, Archive: Radio,
};

export default function ExportPresets() {
  const { state, dispatch } = useVideoEditor();
  const es = state.exportSettings;

  return (
    <div className="ve-export-preset-grid">
      {EXPORT_PRESETS.map(preset => {
        const Icon = platformIcons[preset.name.split(' ')[0]] || Monitor;
        const isActive = es.width === preset.settings.width && es.height === preset.settings.height && es.videoBitrate === preset.settings.videoBitrate;

        return (
          <div key={preset.name}
            className={`ve-export-preset-card ${isActive ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_EXPORT_SETTINGS', payload: preset.settings })}>
            <div className="ve-export-preset-icon"><Icon size={18} /></div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{preset.name}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono' }}>
              {preset.settings.width}×{preset.settings.height}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
              {(preset.settings.videoBitrate / 1000).toFixed(0)} Mbps
            </div>
          </div>
        );
      })}
    </div>
  );
}
