import { useEffect, useRef } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import TransportControls from './TransportControls';
import { Maximize } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';

export default function PreviewCanvas() {
  const { state, dispatch } = useVideoEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const w = state.project?.settings.width ?? 1920;
  const h = state.project?.settings.height ?? 1080;
  const aspect = w / h;

  // Cache elements to avoid reloading them on every frame
  const mediaCache = useRef<Record<string, HTMLVideoElement | HTMLImageElement>>({});

  useEffect(() => {
    if (!state.project) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isActive = true;

    const renderFrame = () => {
      if (!isActive) return;

      // Clear canvas
      ctx.fillStyle = state.project?.settings.backgroundColor || '#000000';
      ctx.fillRect(0, 0, w, h);

      const time = state.playheadTime;
      const tracks = state.project!.tracks;

      // Render bottom to top (reverse order of tracks in the array usually, 
      // but in NLEs Video 1 is bottom, Video 2 is on top of Video 1. 
      // Tracks array usually has Video 1, Video 2... so iterate forward)
      for (const track of tracks) {
        if (track.type !== 'video' || !track.visible) continue;

        // Find clips that overlap current time
        const activeClips = track.clips.filter(
          c => time >= c.startTime && time < c.startTime + c.duration
        );

        for (const clip of activeClips) {
          if (!clip.path) continue; // Needs path to render

          const mediaId = clip.mediaId;
          const src = convertFileSrc(clip.path);
          const sourceDuration = Math.max(0.1, clip.outPoint - clip.inPoint);
          const localTime = (time - clip.startTime) * clip.speed;
          const clipTime = clip.reversed
            ? clip.outPoint - Math.min(sourceDuration, localTime)
            : clip.inPoint + Math.min(sourceDuration, localTime);
          const drawScale = clip.scale ?? 1;
          const drawW = w * drawScale;
          const drawH = h * drawScale;
          const drawX = (clip.positionX ?? 0) * (w / 2);
          const drawY = (clip.positionY ?? 0) * (h / 2);
          const rotation = ((clip.rotation ?? 0) * Math.PI) / 180;

          const drawWithTransform = (draw: () => void) => {
            ctx.save();
            ctx.globalAlpha = clip.opacity;
            ctx.translate(w / 2 + drawX, h / 2 + drawY);
            ctx.rotate(rotation);
            draw();
            ctx.restore();
          };

          if (clip.mediaType === 'image') {
            let img = mediaCache.current[mediaId] as HTMLImageElement;
            if (!img) {
              img = new Image();
              img.src = src;
              mediaCache.current[mediaId] = img;
            }
            if (img.complete) {
              drawWithTransform(() => ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH));
            }
          } else if (clip.mediaType === 'video') {
            let vid = mediaCache.current[mediaId] as HTMLVideoElement;
            if (!vid) {
              vid = document.createElement('video');
              vid.src = src;
              vid.muted = true;
              vid.preload = 'auto';
              mediaCache.current[mediaId] = vid;
            }

            // Sync video time if it drifted or we scrubbed
            if (Math.abs(vid.currentTime - clipTime) > 0.1) {
              vid.currentTime = clipTime;
            }

            if (vid.readyState >= 2) { // HAVE_CURRENT_DATA
              drawWithTransform(() => ctx.drawImage(vid, -drawW / 2, -drawH / 2, drawW, drawH));
            }
          }
        }
      }
      
      if (state.isPlaying) {
        requestAnimationFrame(renderFrame);
      }
    };

    // Initial render or scrub render
    renderFrame();

    return () => {
      isActive = false;
    };
  }, [state.playheadTime, state.project, state.isPlaying, w, h]);

  return (
    <div className="ve-canvas-area">
      <div className="ve-preview">
        <div className="ve-preview-viewport" style={{
          width: state.previewZoom === 1 ? '80%' : `${Math.min(95, 80 * state.previewZoom)}%`,
          maxWidth: state.previewZoom === 1 ? 720 : 720 * state.previewZoom,
          aspectRatio: `${aspect}`,
        }}>
          <div style={{
            width: '100%', height: '100%',
            background: '#000',
            position: 'relative',
          }}>
            <canvas 
              ref={canvasRef}
              width={w} 
              height={h} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {state.showSafeZones && (
              <>
                <div className="ve-safe-zone title" />
                <div className="ve-safe-zone action" />
              </>
            )}
          </div>
        </div>
        <div className="ve-preview-overlay">
          <span style={{ fontFamily: 'JetBrains Mono' }}>
            {state.previewZoom === 1 ? 'Fit' : `${Math.round(state.previewZoom * 100)}%`}
          </span>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            onClick={() => dispatch({ type: 'SET_PREVIEW_ZOOM', payload: state.previewZoom === 1 ? 0.5 : state.previewZoom === 0.5 ? 2 : 1 })}
            title="Cycle zoom">
            <Maximize size={12} />
          </button>
        </div>
      </div>
      <TransportControls />
    </div>
  );
}
