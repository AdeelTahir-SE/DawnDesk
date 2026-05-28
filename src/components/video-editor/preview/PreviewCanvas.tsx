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
  const mediaCache = useRef<Record<string, HTMLVideoElement | HTMLImageElement | HTMLAudioElement>>({});

  useEffect(() => {
    if (!state.project) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Offscreen canvas for global color grading
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    let isActive = true;

    // Cleanup unused media
    const currentClipIds = new Set(state.project.tracks.flatMap(t => t.clips.map(c => c.id)));
    for (const key in mediaCache.current) {
      if (!currentClipIds.has(key)) {
        const el = mediaCache.current[key];
        if (el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
          el.pause();
          el.removeAttribute('src');
          el.load();
        }
        delete mediaCache.current[key];
      }
    }

    const renderFrame = () => {
      if (!isActive) return;

      // Clear canvases
      offCtx.fillStyle = state.project?.settings.backgroundColor || '#000000';
      offCtx.fillRect(0, 0, w, h);
      
      ctx.clearRect(0, 0, w, h);

      const time = state.playheadTime;
      const tracks = state.project!.tracks;
      
      const activeClipIdsThisFrame = new Set<string>();

      // Render bottom to top
      for (const track of tracks) {
        if (track.type === 'video' && !track.visible) continue;
        if (track.muted) continue;

        // Find clips that overlap current time
        const activeClips = track.clips.filter(
          c => time >= c.startTime && time < c.startTime + c.duration
        );

        for (const clip of activeClips) {
          if (!clip.path) continue; // Needs path to render
          
          activeClipIdsThisFrame.add(clip.id);

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
          
          const volume = Math.max(0, Math.min(1, clip.volume * track.volume * state.masterVolume));

          if (clip.mediaType === 'audio') {
            let aud = mediaCache.current[clip.id] as HTMLAudioElement;
            if (!aud) {
              aud = new Audio(src);
              mediaCache.current[clip.id] = aud;
            }
            aud.volume = volume;
            
            if (Math.abs(aud.currentTime - clipTime) > 0.15) {
              aud.currentTime = clipTime;
            }
            if (state.isPlaying && aud.paused) {
              aud.play().catch(() => {});
            } else if (!state.isPlaying && !aud.paused) {
              aud.pause();
            }
            continue; // Nothing to draw for audio
          }

          // Transition logic (basic cross-dissolve/fade)
          let alpha = clip.opacity;
          if (clip.transition) {
             const t = clip.transition;
             if (t.edge === 'start' && time < clip.startTime + t.duration) {
                 const progress = (time - clip.startTime) / t.duration;
                 alpha = clip.opacity * progress;
             } else if (t.edge === 'end' && time > clip.startTime + clip.duration - t.duration) {
                 const progress = (clip.startTime + clip.duration - time) / t.duration;
                 alpha = clip.opacity * progress;
             }
          }

          // Build effect filter string
          let filterStr = '';
          for (const fx of clip.effects) {
             if (!fx.enabled) continue;
             if (fx.type === 'blur') {
                 const blurParam = fx.params.find(p => p.key === 'amount')?.value ?? 0;
                 filterStr += `blur(${blurParam}px) `;
             } else if (fx.type === 'brightness_contrast') {
                 const b = fx.params.find(p => p.key === 'brightness')?.value ?? 0;
                 const c = fx.params.find(p => p.key === 'contrast')?.value ?? 0;
                 filterStr += `brightness(${100 + Number(b)}%) contrast(${100 + Number(c)}%) `;
             }
             // Add more effects here as needed
          }

          const drawWithTransform = (draw: () => void) => {
            offCtx.save();
            offCtx.globalAlpha = alpha;
            if ((clip as any).blendMode && (clip as any).blendMode !== 'normal') {
                offCtx.globalCompositeOperation = (clip as any).blendMode;
            }
            if (filterStr) offCtx.filter = filterStr.trim();
            
            offCtx.translate(w / 2 + drawX, h / 2 + drawY);
            offCtx.rotate(rotation);
            draw();
            offCtx.restore();
          };

          if (clip.mediaType === 'image') {
            let img = mediaCache.current[clip.id] as HTMLImageElement;
            if (!img) {
              img = new Image();
              img.src = src;
              mediaCache.current[clip.id] = img;
            }
            if (img.complete && track.type === 'video') {
              drawWithTransform(() => offCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH));
            }
          } else if (clip.mediaType === 'video') {
            let vid = mediaCache.current[clip.id] as HTMLVideoElement;
            if (!vid) {
              vid = document.createElement('video');
              vid.crossOrigin = 'anonymous';
              vid.src = src;
              vid.preload = 'auto';
              vid.load();
              mediaCache.current[clip.id] = vid;
            }
            
            vid.muted = track.muted;
            vid.volume = volume;

            // Sync video time if it drifted or we scrubbed
            if (Math.abs(vid.currentTime - clipTime) > 0.15) {
              vid.currentTime = clipTime;
            }
            
            if (state.isPlaying && vid.paused) {
              vid.play().catch(() => {});
            } else if (!state.isPlaying && !vid.paused) {
              vid.pause();
            }

            if (vid.readyState >= 2 && track.type === 'video') { // HAVE_CURRENT_DATA
              drawWithTransform(() => offCtx.drawImage(vid, -drawW / 2, -drawH / 2, drawW, drawH));
            }
          }
        }
      }
      
      // Pause any media that is no longer active this frame
      for (const key in mediaCache.current) {
        if (!activeClipIdsThisFrame.has(key)) {
           const el = mediaCache.current[key];
           if ((el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) && !el.paused) {
               el.pause();
           }
        }
      }
      
      // Draw Text Overlay
      if (state.activeTextOverlay) {
          const text = state.activeTextOverlay;
          offCtx.save();
          offCtx.globalAlpha = text.opacity;
          
          offCtx.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`;
          offCtx.textAlign = text.alignment as CanvasTextAlign;
          offCtx.textBaseline = 'middle';
          
          if (text.shadow.enabled) {
              offCtx.shadowColor = text.shadow.color;
              offCtx.shadowBlur = text.shadow.blur;
              offCtx.shadowOffsetX = text.shadow.offsetX;
              offCtx.shadowOffsetY = text.shadow.offsetY;
          }
          
          const textX = text.x * w;
          const textY = text.y * h;
          
          offCtx.translate(textX, textY);
          offCtx.rotate(text.rotation * Math.PI / 180);
          
          if (text.backgroundColor && text.backgroundOpacity > 0) {
              const metrics = offCtx.measureText(text.text);
              const bgWidth = Math.max(text.width, metrics.width + 40);
              const bgHeight = text.fontSize * 1.5;
              offCtx.fillStyle = text.backgroundColor;
              offCtx.globalAlpha = text.opacity * text.backgroundOpacity;
              offCtx.fillRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight);
              offCtx.globalAlpha = text.opacity;
          }
          
          if (text.outline.enabled) {
              offCtx.strokeStyle = text.outline.color;
              offCtx.lineWidth = text.outline.width;
              offCtx.strokeText(text.text, 0, 0);
          }
          
          offCtx.fillStyle = text.color;
          offCtx.fillText(text.text, 0, 0);
          
          offCtx.restore();
      }

      // Apply Global Color Grading to final canvas
      const cg = state.colorGrading;
      let cgFilter = `brightness(${100 + cg.exposure * 10}%) ` +
                     `contrast(${100 + cg.contrast}%) ` +
                     `saturate(${100 + cg.saturation}%) ` +
                     `hue-rotate(${cg.hue}deg) `;
                     
      if (cg.temperature > 0) cgFilter += `sepia(${cg.temperature}%) `;
      
      ctx.save();
      ctx.filter = cgFilter.trim();
      ctx.drawImage(offscreen, 0, 0);
      ctx.restore();

      if (state.isPlaying) {
        requestAnimationFrame(renderFrame);
      }
    };

    // Initial render or scrub render
    renderFrame();

    return () => {
      isActive = false;
    };
  }, [state.playheadTime, state.project, state.isPlaying, state.colorGrading, state.activeTextOverlay, state.masterVolume, w, h]);

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
