import type { ToolType } from '../../engine/photo-editor/types';
import { ToolIcon } from './ToolIcons';

interface ToolButtonProps {
  type: ToolType;
  name: string;
  shortcut: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}

export default function ToolButton({ type, name, shortcut, description, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      className={`pe-tool-btn ${isActive ? 'pe-tool-btn--active' : ''}`}
      onClick={onClick}
      title={`${name} (${shortcut}) - ${description}`}
      data-tooltip={`${name} (${shortcut}): ${description}`}
    >
      <span className="pe-tool-btn__icon">
        <ToolIcon type={type} />
      </span>
      <span className="pe-tool-btn__label">{name}</span>
    </button>
  );
}
