import type { ToolType } from '../../engine/photo-editor/types';
import { 
  Move, BoxSelect, LassoSelect, Wand2, Crop, Pipette, 
  Paintbrush, Pencil, Eraser, PaintBucket, Blend, 
  Stamp, Type, Square, Circle, Minus, PenTool, 
  Hexagon, Shapes, Hand, Search, MousePointer2 
} from 'lucide-react';

export function ToolIcon({ type }: { type: ToolType }) {
  const size = 20;

  switch (type) {
    case 'move':
      return <Move size={size} />;
    case 'marquee-rect':
    case 'marquee-ellipse':
      return <BoxSelect size={size} />;
    case 'lasso':
    case 'polygon-lasso':
    case 'quick-selection':
      return <LassoSelect size={size} />;
    case 'magic-wand':
      return <Wand2 size={size} />;
    case 'crop':
      return <Crop size={size} />;
    case 'eyedropper':
      return <Pipette size={size} />;
    case 'brush':
      return <Paintbrush size={size} />;
    case 'pencil':
      return <Pencil size={size} />;
    case 'eraser':
      return <Eraser size={size} />;
    case 'paint-bucket':
      return <PaintBucket size={size} />;
    case 'gradient':
      return <Blend size={size} />;
    case 'clone-stamp':
    case 'healing-brush':
    case 'spot-heal':
      return <Stamp size={size} />;
    case 'text':
      return <Type size={size} />;
    case 'shape-rect':
      return <Square size={size} />;
    case 'shape-ellipse':
      return <Circle size={size} />;
    case 'line':
      return <Minus size={size} />;
    case 'pen-path':
      return <PenTool size={size} />;
    case 'polygon':
      return <Hexagon size={size} />;
    case 'custom-shape':
      return <Shapes size={size} />;
    case 'hand':
      return <Hand size={size} />;
    case 'zoom':
      return <Search size={size} />;
    default:
      return <MousePointer2 size={size} />;
  }
}

// Helper for toolbar (returns JSX element)
export function getToolIcon(type: ToolType) {
  return <ToolIcon type={type} />;
}

