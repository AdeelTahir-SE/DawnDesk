import { useEditor } from '../../engine/photo-editor/EditorContext';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Plus } from 'lucide-react';

interface FilmStripProps {
  onOpenImage: () => void;
}

export default function FilmStrip({ onOpenImage }: FilmStripProps) {
  const { state, dispatch } = useEditor();

  return (
    <div className="pe-filmstrip">
      {/* Left arrow */}
      <button className="pe-filmstrip__nav" title="Previous">
        <ChevronLeft size={16} />
      </button>

      {/* Thumbnail track */}
      <div className="pe-filmstrip__track">
        {state.documents.map((doc) => (
          <div
            key={doc.id}
            className={`pe-filmstrip__thumb ${doc.id === state.activeDocumentId ? 'pe-filmstrip__thumb--active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: doc.id })}
            title={doc.fileName}
          >
            {doc.thumbnail ? (
              <img src={doc.thumbnail} alt={doc.fileName} />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: 'var(--pe-text-muted)',
              }}>
                <ImageIcon size={20} />
              </div>
            )}
          </div>
        ))}

        {/* Add new image button */}
        <button
          className="pe-filmstrip__add"
          title="Open another image"
          onClick={onOpenImage}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Right arrow */}
      <button className="pe-filmstrip__nav" title="Next">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
