import { useEffect, useRef } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import TransportControls from './TransportControls';
import { Maximize } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { Effect } from '../../../engine/video-editor/types';

function paramNumber(effect: Effect, key: string, fallback: number): number {
  const value = effect.params.find(param => param.key === key)?.value;
  return typeof value === 'number' ? value : Number(value ?? fallback) || fallback;
}

function paramString(effect: Effect, key: string, fallback: string): string {
  const value = effect.params.find(param => param.key === key)?.value;
  return typeof value === 'string' ? value : fallback;
}

export default function PreviewCanvas() {
  const { state, dispatch } = useVideoEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestStateRef = useRef(state);
  const frameRef = useRef<number | null>(null);
  const renderFrameRef = useRef<(() => void) | null>(null);
  const clockRef = useRef({
    playheadTime: state.playheadTime,
    wallTime: performance.now(),
    isPlaying: state.isPlaying,
    playbackSpeed: state.playbackSpeed,
  });
  const lastRenderTimeRef = useRef(0);
  
  const projectW = state.project?.settings.width ?? 1920;
  const projectH = state.project?.settings.height ?? 1080;
  const previewScale = Math.min(1, 960 / projectW, 540 / projectH);
  const w = Math.max(1, Math.round(projectW * previewScale));
  const h = Math.max(1, Math.round(projectH * previewScale));
  const aspect = projectW / projectH;

  // Cache elements to avoid reloading them on every frame
  const mediaCache = useRef<Record<string, HTMLVideoElement | HTMLImageElement | HTMLAudioElement>>({});

  useEffect(() => {
    latestStateRef.current = state;
    if (renderFrameRef.current && frameRef.current == null) {
      frameRef.current = requestAnimationFrame(renderFrameRef.current);
    } else if (!state.isPlaying && renderFrameRef.current) {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(renderFrameRef.current);
    }
  }, [state]);

  useEffect(() => {
    clockRef.current = {
      playheadTime: state.playheadTime,
      wallTime: performance.now(),
      isPlaying: state.isPlaying,
      playbackSpeed: state.playbackSpeed,
    };
  }, [state.playheadTime, state.isPlaying, state.playbackSpeed]);

  useEffect(() => {
    if (!state.project) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Offscreen canvas for global color grading
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d', { alpha: false });
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

    const getRenderTime = (now: number) => {
      const clock = clockRef.current;
      if (!clock.isPlaying) return clock.playheadTime;
      const elapsed = ((now - clock.wallTime) / 1000) * clock.playbackSpeed;
      const duration = latestStateRef.current.project?.duration ?? Number.POSITIVE_INFINITY;
      return Math.max(0, Math.min(clock.playheadTime + elapsed, duration));
    };

    const renderFrame = (now = performance.now()) => {
      frameRef.current = null;
      if (!isActive) return;
      const latestState = latestStateRef.current;
      const project = latestState.project;
      if (!project) return;
      const targetFrameInterval = latestState.isPlaying ? 1000 / Math.min(30, Math.max(12, project.settings.frameRate || 30)) : 0;
      if (targetFrameInterval > 0 && now - lastRenderTimeRef.current < targetFrameInterval) {
        frameRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      lastRenderTimeRef.current = now;

      // Clear canvases
      offCtx.fillStyle = project.settings.backgroundColor || '#000000';
      offCtx.fillRect(0, 0, w, h);
      
      ctx.clearRect(0, 0, w, h);

      const time = getRenderTime(now);
      const tracks = project.tracks;
      
      const activeClipIdsThisFrame = new Set<string>();

      // Render bottom to top
      for (const track of tracks) {
        if (track.type === 'video' && !track.visible) continue;
        if (track.muted) continue;

        for (const clip of track.clips) {
          if (time < clip.startTime || time >= clip.startTime + clip.duration) continue;
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
          
          const volume = Math.max(0, Math.min(1, clip.volume * track.volume * latestState.masterVolume));

          if (clip.mediaType === 'audio') {
            let aud = mediaCache.current[clip.id] as HTMLAudioElement;
            if (!aud) {
              aud = new Audio(src);
              mediaCache.current[clip.id] = aud;
            }
            aud.volume = volume;
            aud.playbackRate = Math.max(0.0625, Math.min(16, latestState.playbackSpeed * clip.speed));
            
            const audioDriftLimit = latestState.isPlaying ? 0.65 : 0.03;
            if (!aud.seeking && Math.abs(aud.currentTime - clipTime) > audioDriftLimit) {
              aud.currentTime = clipTime;
            }
            if (latestState.isPlaying && aud.paused) {
              aud.play().catch(() => {});
            } else if (!latestState.isPlaying && !aud.paused) {
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
          let mirrorX = 1;
          let mirrorY = 1;
          let lensScale = 1;
          let needsGrain = false;
          let grainAmount = 0;
          let needsVignette = false;
          let vignetteAmount = 0;
          let pixelateSize = 0;

          for (const fx of clip.effects) {
             if (!fx.enabled) continue;
             if (fx.type === 'gaussian-blur') {
                 const blurParam = paramNumber(fx, 'radius', 0);
                 filterStr += `blur(${blurParam}px) `;
             } else if (fx.type === 'radial-blur') {
                 const amount = paramNumber(fx, 'amount', 0);
                 filterStr += `blur(${amount / 3}px) brightness(${100 + amount * 0.15}%) `;
             } else if (fx.type === 'directional-blur') {
                 const amount = paramNumber(fx, 'amount', 0);
                 filterStr += `blur(${amount / 4}px) `;
             } else if (fx.type === 'sharpen') {
                 const amount = paramNumber(fx, 'amount', 50);
                 filterStr += `contrast(${100 + amount * 0.55}%) saturate(${100 + amount * 0.12}%) `;
             } else if (fx.type === 'unsharp-mask') {
                 const amount = paramNumber(fx, 'amount', 80);
                 filterStr += `contrast(${100 + amount * 0.35}%) saturate(${100 + amount * 0.08}%) `;
             } else if (fx.type === 'brightness-contrast') {
                 const b = paramNumber(fx, 'brightness', 0);
                 const c = paramNumber(fx, 'contrast', 0);
                 filterStr += `brightness(${100 + b}%) contrast(${100 + c}%) `;
             } else if (fx.type === 'grayscale') {
                 const amount = paramNumber(fx, 'amount', 0);
                 filterStr += `grayscale(${amount}%) `;
             } else if (fx.type === 'sepia') {
                 const amount = paramNumber(fx, 'amount', 0);
                 filterStr += `sepia(${amount}%) `;
             } else if (fx.type === 'invert') {
                 const amount = paramNumber(fx, 'amount', 0);
                 filterStr += `invert(${amount}%) `;
             } else if (fx.type === 'chromatic-aberration') {
                 const amount = paramNumber(fx, 'amount', 5);
                 filterStr += `drop-shadow(${amount}px 0 rgba(255,0,0,0.35)) drop-shadow(${-amount}px 0 rgba(0,128,255,0.35)) `;
             } else if (fx.type === 'lens-distortion') {
                 const distortion = paramNumber(fx, 'distortion', 0);
                 lensScale *= 1 + Math.abs(distortion) / 350;
             } else if (fx.type === 'mirror') {
                 const axis = paramString(fx, 'axis', 'horizontal');
                 if (axis === 'horizontal' || axis === 'both') mirrorX *= -1;
                 if (axis === 'vertical' || axis === 'both') mirrorY *= -1;
             } else if (fx.type === 'vignette') {
                 needsVignette = true;
                 vignetteAmount = Math.max(vignetteAmount, paramNumber(fx, 'amount', 50));
             } else if (fx.type === 'film-grain') {
                 needsGrain = true;
                 grainAmount = Math.max(grainAmount, paramNumber(fx, 'amount', 30));
             } else if (fx.type === 'glow') {
                 const intensity = paramNumber(fx, 'intensity', 50);
                 const radius = paramNumber(fx, 'radius', 10);
                 filterStr += `brightness(${100 + intensity * 0.35}%) saturate(${100 + intensity * 0.18}%) drop-shadow(0 0 ${radius}px rgba(255,255,255,0.24)) `;
             } else if (fx.type === 'pixelate') {
                 pixelateSize = Math.max(pixelateSize, paramNumber(fx, 'size', 10));
             } else if (fx.type === 'emboss') {
                 const strength = paramNumber(fx, 'strength', 50);
                 filterStr += `grayscale(${strength}%) contrast(${100 + strength}%) brightness(${100 + strength * 0.1}%) `;
             } else if (fx.type === 'edge-detect') {
                 const threshold = paramNumber(fx, 'threshold', 50);
                 filterStr += `grayscale(100%) contrast(${160 + threshold}%) brightness(${80 + threshold * 0.3}%) `;
             }
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
            offCtx.scale(mirrorX * lensScale, mirrorY * lensScale);
            const previousSmoothing = offCtx.imageSmoothingEnabled;
            if (pixelateSize > 0) offCtx.imageSmoothingEnabled = false;
            draw();
            offCtx.imageSmoothingEnabled = previousSmoothing;
            if (needsVignette) {
              const gradient = offCtx.createRadialGradient(0, 0, Math.min(drawW, drawH) * 0.18, 0, 0, Math.max(drawW, drawH) * 0.62);
              gradient.addColorStop(0, 'rgba(0,0,0,0)');
              gradient.addColorStop(1, `rgba(0,0,0,${Math.min(0.8, vignetteAmount / 100)})`);
              offCtx.fillStyle = gradient;
              offCtx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
            }
            if (needsGrain) {
              offCtx.globalAlpha = Math.min(0.18, grainAmount / 450);
              offCtx.fillStyle = 'rgba(255,255,255,0.55)';
              const step = Math.max(3, Math.round(12 - grainAmount / 12));
              for (let gy = -drawH / 2; gy < drawH / 2; gy += step) {
                for (let gx = -drawW / 2; gx < drawW / 2; gx += step) {
                  if (Math.random() > 0.55) offCtx.fillRect(gx, gy, 1, 1);
                }
              }
            }
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
            vid.playbackRate = Math.max(0.0625, Math.min(16, latestState.playbackSpeed * clip.speed));

            const videoDriftLimit = latestState.isPlaying ? 0.65 : 0.03;
            if (!vid.seeking && Math.abs(vid.currentTime - clipTime) > videoDriftLimit) {
              vid.currentTime = clipTime;
            }
            
            if (latestState.isPlaying && vid.paused) {
              vid.play().catch(() => {});
            } else if (!latestState.isPlaying && !vid.paused) {
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
      if (latestState.activeTextOverlay) {
          const text = latestState.activeTextOverlay;
          offCtx.save();
          offCtx.globalAlpha = text.opacity;
          
          offCtx.font = `${text.fontWeight} ${Math.max(1, text.fontSize * previewScale)}px ${text.fontFamily}`;
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
              const bgWidth = Math.max(text.width * previewScale, metrics.width + 40 * previewScale);
              const bgHeight = text.fontSize * previewScale * 1.5;
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
      const cg = latestState.colorGrading;
      let cgFilter = `brightness(${100 + cg.exposure * 10}%) ` +
                     `contrast(${100 + cg.contrast}%) ` +
                     `saturate(${100 + cg.saturation}%) ` +
                     `hue-rotate(${cg.hue}deg) `;
                     
      if (cg.temperature > 0) cgFilter += `sepia(${cg.temperature}%) `;
      
      ctx.save();
      ctx.filter = cgFilter.trim();
      ctx.drawImage(offscreen, 0, 0);
      ctx.restore();

      if (latestState.isPlaying) {
        frameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    renderFrameRef.current = renderFrame;

    // Initial render or scrub render
    renderFrame();

    return () => {
      isActive = false;
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [state.project, w, h, previewScale]);

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
