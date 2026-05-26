import { useMemo } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';

interface Props {
  width: number;
  duration: number;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

function formatRulerTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(seconds % 1 === 0 ? 0 : 1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TimelineRuler({ width, duration, onClick }: Props) {
  const { state } = useVideoEditor();
  const zoom = state.timelineZoom;

  const ticks = useMemo(() => {
    const result: { x: number; label: string | null; major: boolean }[] = [];
    let interval: number;
    if (zoom > 200) interval = 0.5;
    else if (zoom > 100) interval = 1;
    else if (zoom > 50) interval = 2;
    else if (zoom > 25) interval = 5;
    else if (zoom > 12) interval = 10;
    else interval = 30;

    const minorInterval = interval / 4;

    for (let t = 0; t <= duration; t += minorInterval) {
      const isMajor = Math.abs(t % interval) < 0.001 || Math.abs(t % interval - interval) < 0.001;
      result.push({
        x: t * zoom,
        label: isMajor ? formatRulerTime(t) : null,
        major: isMajor,
      });
    }
    return result;
  }, [zoom, duration]);

  const markers = state.project?.markers ?? [];

  return (
    <div className="ve-timeline-ruler" style={{ width }} onClick={onClick}>
      {ticks.map((tick, i) => (
        <div key={i}>
          <div className={`ve-ruler-tick ${tick.major ? 'major' : ''}`}
            style={{ left: tick.x, height: tick.major ? 14 : 7 }} />
          {tick.label && (
            <span className="ve-ruler-label" style={{ left: tick.x }}>{tick.label}</span>
          )}
        </div>
      ))}
      {markers.map(marker => (
        <div key={marker.id} className="ve-marker"
          style={{ left: marker.time * zoom, backgroundColor: markerColorMap[marker.color] || '#FACC15' }}
          title={marker.label} />
      ))}
    </div>
  );
}

const markerColorMap: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', yellow: '#FACC15',
  green: '#22c55e', blue: '#3b82f6', purple: '#a855f7', white: '#ffffff',
};
