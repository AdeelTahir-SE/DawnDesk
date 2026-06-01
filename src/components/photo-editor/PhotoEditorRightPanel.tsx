import { useEditor } from '../../engine/photo-editor/EditorContext';
import AdjustmentsPanel from './AdjustmentsPanel';
import LayersPanel from './LayersPanel';
import HistogramPanel from './HistogramPanel';
import PhotoAiPanel from './PhotoAiPanel';

export default function PhotoEditorRightPanel() {
  const { state, dispatch } = useEditor();

  return (
    <div className="pe-right-panel">
      {/* Tab row: Adjustments / Properties */}
      <div className="pe-right-panel__tabs">
        <button
          className={`pe-right-panel__tab ${state.activeRightTab === 'adjustments' ? 'pe-right-panel__tab--active' : ''}`}
          onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: 'adjustments' })}
        >
          Adjustments
        </button>
        <button
          className={`pe-right-panel__tab ${state.activeRightTab === 'properties' ? 'pe-right-panel__tab--active' : ''}`}
          onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: 'properties' })}
        >
          Properties
        </button>
        <button
          className={`pe-right-panel__tab ${state.activeRightTab === 'ai' ? 'pe-right-panel__tab--active' : ''}`}
          onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: 'ai' })}
        >
          AI
        </button>
      </div>

      {/* Panel content based on active tab */}
      {state.activeRightTab === 'adjustments' ? (
        <AdjustmentsPanel />
      ) : state.activeRightTab === 'ai' ? (
        <PhotoAiPanel />
      ) : (
        <div style={{ padding: 16, color: 'var(--pe-text-muted)', fontSize: 12 }}>
          <p>Select a layer or object to view its properties.</p>
        </div>
      )}

      {/* Layers panel — always visible below adjustments */}
      <LayersPanel />

      {/* Histogram — always at bottom */}
      <HistogramPanel />
    </div>
  );
}
