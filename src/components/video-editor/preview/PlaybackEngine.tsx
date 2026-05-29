import { useEffect, useRef } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';

export default function PlaybackEngine() {
  const { state, dispatch } = useVideoEditor();
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastPublishRef = useRef(0);
  const lastDispatchedTimeRef = useRef(state.playheadTime);
  const isPlayingRef = useRef(state.isPlaying);
  const playheadRef = useRef(state.playheadTime);
  const playbackSpeedRef = useRef(state.playbackSpeed);
  const isLoopingRef = useRef(state.isLooping);
  const inPointRef = useRef(state.inPoint);
  const outPointRef = useRef(state.outPoint);
  const durationRef = useRef(state.project?.duration ?? 0);
  
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
    playbackSpeedRef.current = state.playbackSpeed;
    isLoopingRef.current = state.isLooping;
    inPointRef.current = state.inPoint;
    outPointRef.current = state.outPoint;
    durationRef.current = state.project?.duration ?? 0;
  }, [state.playbackSpeed, state.isLooping, state.inPoint, state.outPoint, state.project?.duration]);

  useEffect(() => {
    const animate = (time: number) => {
      if (isPlayingRef.current) {
        if (lastTimeRef.current != null) {
          const deltaTime = ((time - lastTimeRef.current) / 1000) * playbackSpeedRef.current;
          const endTime = outPointRef.current ?? durationRef.current ?? Number.POSITIVE_INFINITY;
          let newTime = playheadRef.current + deltaTime;
          if (newTime >= endTime) {
            if (isLoopingRef.current) {
              newTime = inPointRef.current ?? 0;
            } else {
              newTime = endTime;
              dispatch({ type: 'TOGGLE_PLAY' });
            }
          }
          playheadRef.current = newTime;
          const publishInterval = 1000 / 12;
          const movedEnough = Math.abs(newTime - lastDispatchedTimeRef.current) >= 0.05;
          if ((time - lastPublishRef.current >= publishInterval && movedEnough) || newTime >= endTime) {
            lastPublishRef.current = time;
            lastDispatchedTimeRef.current = newTime;
            dispatch({ type: 'SET_PLAYHEAD', payload: newTime });
          }
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
  }, [state.isPlaying, dispatch]);

  return null; // Headless component
}
