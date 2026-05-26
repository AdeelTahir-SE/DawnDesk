import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { FolderOpen, Sparkles, ArrowRightLeft } from 'lucide-react';
import MediaBin from './MediaBin';
import EffectsBrowser from './EffectsBrowser';
import TransitionBrowser from './TransitionBrowser';
import type { LeftPanelTab } from '../../../engine/video-editor/types';

const tabs: { id: LeftPanelTab; label: string; icon: React.ElementType }[] = [
  { id: 'media', label: 'Media', icon: FolderOpen },
  { id: 'effects', label: 'Effects', icon: Sparkles },
  { id: 'transitions', label: 'Transitions', icon: ArrowRightLeft },
];

export default function LeftPanel() {
  const { state, dispatch } = useVideoEditor();

  return (
    <div className="ve-left-panel">
      <div className="ve-panel">
        <div className="ve-panel-tabs">
          {tabs.map(tab => (
            <button key={tab.id}
              className={`ve-panel-tab ${state.leftPanelTab === tab.id ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_LEFT_PANEL_TAB', payload: tab.id })}>
              <tab.icon size={13} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="ve-panel-body">
          {state.leftPanelTab === 'media' && <MediaBin />}
          {state.leftPanelTab === 'effects' && <EffectsBrowser />}
          {state.leftPanelTab === 'transitions' && <TransitionBrowser />}
        </div>
      </div>
    </div>
  );
}
