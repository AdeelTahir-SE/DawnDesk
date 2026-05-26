import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';

interface Props {
  height: number;
}

export default function Playhead({ height }: Props) {
  const { state, dispatch } = useVideoEditor();
  const left = state.playheadTime * state.timelineZoom;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startTime = state.playheadTime;
    const handleMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dt = dx / state.timelineZoom;
      dispatch({ type: 'SET_PLAYHEAD', payload: Math.max(0, startTime + dt) });
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div className={`ve-playhead ${state.isPlaying ? 'playing' : ''}`}
      style={{ left, height: height + 28 }}>
      <div className="ve-playhead-head" onMouseDown={handleMouseDown} />
      <div className="ve-playhead-line" />
    </div>
  );
}
