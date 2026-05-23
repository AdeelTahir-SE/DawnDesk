import type { ToolType } from '../../engine/photo-editor/types';

// SVG icon components for each tool — matching Photoshop-style icons
export function ToolIcon({ type }: { type: ToolType }) {
  switch (type) {
    case 'move':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 9l-3 3 3 3" /><path d="M9 5l3-3 3 3" /><path d="M15 19l-3 3-3-3" /><path d="M19 9l3 3-3 3" />
          <line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" />
        </svg>
      );
    case 'marquee-rect':
    case 'marquee-ellipse':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
          <rect x="3" y="3" width="18" height="18" rx="1" />
        </svg>
      );
    case 'lasso':
    case 'polygon-lasso':
    case 'quick-selection':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {type === 'polygon-lasso' ? (
            <path d="m5 6 7-3 7 5-2 9-8 4-5-6 1-9Z" />
          ) : type === 'quick-selection' ? (
            <>
              <path d="M5 18c4-9 9-13 14-12-1 5-4 10-13 14" />
              <path d="M8 17l-4 4" />
              <path d="M16 4v4M14 6h4" />
            </>
          ) : (
            <>
              <path d="M7 19c-2.2 0-4-1.8-4-4 0-3.3 4-8 9-13 5 5 9 9.7 9 13 0 2.2-1.8 4-4 4" />
              <circle cx="7" cy="19" r="2" fill="currentColor" />
            </>
          )}
        </svg>
      );
    case 'magic-wand':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M15 4l-1.5 3L10 8.5l3 1.5L14.5 13l1.5-3 3-1.5-3-1.5z" />
          <line x1="2" y1="22" x2="13" y2="11" />
          <path d="M5 5l1 1" /><path d="M19 19l1 1" /><path d="M3 13l1-1" /><path d="M21 7l-1 1" />
        </svg>
      );
    case 'crop':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 2v4H2" /><path d="M18 22v-4h4" />
          <rect x="6" y="6" width="12" height="12" />
        </svg>
      );
    case 'eyedropper':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 22l4-2 12-12-2-2L4 18z" />
          <path d="M16 6l2-2c.8-.8 2-.8 2.8 0 .8.8.8 2 0 2.8L18 8" />
          <path d="M6 18l-2 4" />
        </svg>
      );
    case 'brush':
    case 'pencil':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {type === 'pencil' ? (
            <>
              <path d="M16 3l5 5L8 21H3v-5L16 3Z" />
              <path d="M14 5l5 5" />
            </>
          ) : (
            <>
              <path d="M18 3L8 13H5v3h3l10-10z" />
              <path d="M5 16c-2 2-3 4-3 6 2 0 4-1 6-3" />
            </>
          )}
        </svg>
      );
    case 'eraser':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 20H7L3 16l10-10 8 8-4 4" />
          <path d="M6.5 13.5l5 5" />
        </svg>
      );
    case 'paint-bucket':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 13 8-8 7 7-8 8-7-7Z" />
          <path d="M7 10h10" />
          <path d="M19 16s2 2.1 2 3.5a2 2 0 0 1-4 0c0-1.4 2-3.5 2-3.5Z" />
        </svg>
      );
    case 'gradient':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <defs><linearGradient id="gfill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient></defs>
          <rect x="5" y="5" width="14" height="14" fill="url(#gfill)" stroke="none" />
        </svg>
      );
    case 'clone-stamp':
    case 'healing-brush':
    case 'spot-heal':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {type === 'clone-stamp' ? (
            <>
              <circle cx="12" cy="10" r="6" />
              <path d="M12 16v4" />
              <path d="M8 22h8" />
              <circle cx="12" cy="10" r="2" />
            </>
          ) : (
            <>
              <path d="M12 21s7-4.4 7-11a4 4 0 0 0-7-2.6A4 4 0 0 0 5 10c0 6.6 7 11 7 11Z" />
              <path d="M12 8v6M9 11h6" />
            </>
          )}
        </svg>
      );
    case 'text':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 4v3h5.5v12h3V7H19V4z" />
        </svg>
      );
    case 'shape-rect':
    case 'shape-ellipse':
    case 'line':
    case 'pen-path':
    case 'polygon':
    case 'custom-shape':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {type === 'line' ? <path d="M4 20 20 4" /> : type === 'polygon' || type === 'custom-shape' ? <path d="m12 3 9 7-3.5 11h-11L3 10l9-7Z" /> : type === 'pen-path' ? <path d="m12 19 7-7-7-7-7 7 7 7Z" /> : type === 'shape-rect' ? <rect x="4" y="5" width="16" height="14" rx="2" /> : <circle cx="12" cy="12" r="9" />}
        </svg>
      );
    case 'hand':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 11V6a2 2 0 00-4 0v4" />
          <path d="M14 10V4a2 2 0 00-4 0v6" />
          <path d="M10 10.5V6a2 2 0 00-4 0v8" />
          <path d="M18 11a2 2 0 014 0v3a8 8 0 01-8 8h-2a8 8 0 01-6-2.7" />
        </svg>
      );
    case 'zoom':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="16" y1="16" x2="21" y2="21" />
          <line x1="8" y1="11" x2="14" y2="11" />
          <line x1="11" y1="8" x2="11" y2="14" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
  }
}

// Helper for toolbar (returns JSX element)
export function getToolIcon(type: ToolType) {
  return <ToolIcon type={type} />;
}
