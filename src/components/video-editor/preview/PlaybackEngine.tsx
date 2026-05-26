import { useEffect, useRef } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';

export default function PlaybackEngine() {
  const { state, dispatch } = useVideoEditor();
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isPlayingRef = useRef(state.isPlaying);
  const playheadRef = useRef(state.playheadTime);
  
  useEffect(() => {
    isPlayingRef.current = state.isPlaying;
    if (!state.isPlaying) {
      lastTimeRef.current = null;
    }
  }, [state.isPlaying]);

  useEffect(() => {
    playheadRef.current = state.playheadTime;
  }, [state.playheadTime]);

  useEffect(() => {
    const animate = (time: number) => {
      if (isPlayingRef.current) {
        if (lastTimeRef.current != null) {
          const deltaTime = (time - lastTimeRef.current) / 1000;
          const newTime = playheadRef.current + deltaTime;
          playheadRef.current = newTime;
          dispatch({ type: 'SET_PLAYHEAD', payload: newTime });
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (state.isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [state.isPlaying, dispatch]); // Removed state.playheadTime dependency

  return null; // Headless component
}
