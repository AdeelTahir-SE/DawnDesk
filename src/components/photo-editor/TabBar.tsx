import { useEditor } from '../../engine/photo-editor/EditorContext';

export default function TabBar() {
  const { state, dispatch } = useEditor();

  if (state.documents.length === 0) return null;

  return (
    <div className="pe-tab-bar">
      {state.documents.map((doc) => (
        <button
          key={doc.id}
          className={`pe-tab ${doc.id === state.activeDocumentId ? 'pe-tab--active' : ''}`}
          onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: doc.id })}
        >
          <span>{doc.fileName}{doc.isDirty ? ' •' : ''}</span>
          <span
            className="pe-tab__close"
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'CLOSE_DOCUMENT', payload: doc.id });
            }}
            title="Close"
          >
            ×
          </span>
        </button>
      ))}
    </div>
  );
}
