import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProjectRegistry,
  deleteProject,
  importProjectFromFile,
  type ProjectEntry,
} from '../engine/photo-editor/projectFile';
import '../components/photo-editor/photo-editor.css';

// ─── New Project Dialog ────────────────────────────────────────────────────────

const PRESETS = [
  { name: 'Full HD', width: 1920, height: 1080 },
  { name: '4K UHD', width: 3840, height: 2160 },
  { name: 'Square 1:1', width: 1080, height: 1080 },
  { name: 'Portrait', width: 1080, height: 1350 },
  { name: 'A4 Print', width: 2480, height: 3508 },
  { name: 'Twitter Banner', width: 1500, height: 500 },
  { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { name: 'Business Card', width: 1050, height: 600 },
];

interface NewProjectDialogProps {
  onClose: () => void;
  onCreate: (name: string, width: number, height: number, dpi: number, bg: string) => void;
}

function NewProjectDialog({ onClose, onCreate }: NewProjectDialogProps) {
  const [name, setName] = useState('Untitled Project');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [dpi, setDpi] = useState(72);
  const [bg, setBg] = useState<'white' | 'black' | 'transparent'>('transparent');
  const [lockRatio, setLockRatio] = useState(false);

  const handlePreset = (p: { width: number; height: number }) => {
    setWidth(p.width);
    setHeight(p.height);
  };

  const handleWidthChange = (v: number) => {
    if (lockRatio) setHeight(Math.round(v * (height / width)));
    setWidth(v);
  };

  const handleHeightChange = (v: number) => {
    if (lockRatio) setWidth(Math.round(v * (width / height)));
    setHeight(v);
  };

  return (
    <div className="pe-modal-backdrop" onMouseDown={onClose}>
      <div
        className="pe-modal"
        style={{ width: 'min(520px, calc(100vw - 32px))', maxHeight: '90vh', overflowY: 'auto' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="pe-modal__header">
          <strong style={{ fontSize: 15 }}>New Project</strong>
          <button className="pe-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Presets */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--pe-text-muted)', marginBottom: 6 }}>Quick Presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                className="pe-action-button"
                style={{ fontSize: 10 }}
                onClick={() => handlePreset(p)}
              >
                {p.name}<br />
                <span style={{ color: 'var(--pe-text-muted)', fontSize: 9 }}>{p.width}×{p.height}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="pe-field" style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 11, color: 'var(--pe-text-muted)' }}>Project Name</span>
            <input
              className="pe-number-input pe-number-input--wide"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ fontFamily: 'inherit' }}
            />
          </label>

          <label className="pe-field">
            <span style={{ fontSize: 11, color: 'var(--pe-text-muted)' }}>Width (px)</span>
            <input
              className="pe-number-input pe-number-input--wide"
              type="number"
              min="1"
              max="20000"
              value={width}
              onChange={(e) => handleWidthChange(Math.max(1, Number(e.target.value)))}
            />
          </label>

          <label className="pe-field">
            <span style={{ fontSize: 11, color: 'var(--pe-text-muted)' }}>Height (px)</span>
            <input
              className="pe-number-input pe-number-input--wide"
              type="number"
              min="1"
              max="20000"
              value={height}
              onChange={(e) => handleHeightChange(Math.max(1, Number(e.target.value)))}
            />
          </label>

          <label className="pe-options-bar__checkbox" style={{ gridColumn: '1 / -1' }}>
            <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} />
            Lock aspect ratio
          </label>

          <label className="pe-field">
            <span style={{ fontSize: 11, color: 'var(--pe-text-muted)' }}>DPI / PPI</span>
            <select
              className="pe-options-bar__select"
              value={dpi}
              onChange={(e) => setDpi(Number(e.target.value))}
              style={{ width: '100%' }}
            >
              <option value={72}>72 (Screen)</option>
              <option value={96}>96 (Web)</option>
              <option value={150}>150 (Low Print)</option>
              <option value={300}>300 (Print)</option>
              <option value={600}>600 (High Print)</option>
            </select>
          </label>

          <label className="pe-field">
            <span style={{ fontSize: 11, color: 'var(--pe-text-muted)' }}>Background</span>
            <select
              className="pe-options-bar__select"
              value={bg}
              onChange={(e) => setBg(e.target.value as any)}
              style={{ width: '100%' }}
            >
              <option value="transparent">Transparent</option>
              <option value="white">White</option>
              <option value="black">Black</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12, padding: '8px 0', borderTop: '1px solid var(--pe-border-subtle)', display: 'flex', gap: 8, color: 'var(--pe-text-muted)', fontSize: 11 }}>
          <span>Size: {width} × {height} px</span>
          <span>·</span>
          <span>~{((width * height * 4) / (1024 * 1024)).toFixed(1)} MB</span>
        </div>

        <div className="pe-modal__actions">
          <button className="pe-action-button" onClick={onClose}>Cancel</button>
          <button
            className="pe-action-button pe-action-button--primary"
            onClick={() => {
              if (name.trim() && width > 0 && height > 0) {
                onCreate(name.trim(), width, height, dpi, bg);
              }
            }}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  entry: ProjectEntry;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

function ProjectCard({ entry, onOpen, onDelete }: ProjectCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updatedDate = new Date(entry.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="pm-card" tabIndex={0} onDoubleClick={() => onOpen(entry.id)}>
      <div className="pm-card__thumb" onClick={() => onOpen(entry.id)}>
        {entry.thumbnail ? (
          <img src={entry.thumbnail} alt={entry.name} />
        ) : (
          <div className="pm-card__thumb-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        <div className="pm-card__thumb-overlay">
          <span>Open</span>
        </div>
      </div>

      <div className="pm-card__info">
        <div className="pm-card__name" title={entry.name}>{entry.name}</div>
        <div className="pm-card__meta">
          <span>{entry.width} × {entry.height}</span>
          <span className="pm-card__dot">·</span>
          <span>{updatedDate}</span>
        </div>
      </div>

      <div className="pm-card__actions">
        <button
          className="pm-card__btn"
          title="Open project"
          onClick={() => onOpen(entry.id)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        {!confirmDelete ? (
          <button
            className="pm-card__btn pm-card__btn--danger"
            title="Delete project"
            onClick={() => setConfirmDelete(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--pe-text-muted)' }}>Sure?</span>
            <button
              className="pm-card__btn pm-card__btn--danger"
              onClick={() => {
                onDelete(entry.id);
                setConfirmDelete(false);
              }}
            >
              Yes
            </button>
            <button className="pm-card__btn" onClick={() => setConfirmDelete(false)}>No</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Projects Manager Page ────────────────────────────────────────────────────

export default function ProjectsManager() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setProjects(getProjectRegistry());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = useCallback(
    async (name: string, width: number, height: number, dpi: number, bg: string) => {
      setShowNewDialog(false);
      setLoading(true);
      setError(null);
      try {
        // Navigate to editor with new project params
        navigate('/photo-editor', {
          state: {
            newProject: true,
            name,
            width,
            height,
            dpi,
            background: bg,
          },
        });
      } catch (err) {
        setError(`Failed to create project: ${err}`);
        setLoading(false);
      }
    },
    [navigate]
  );

  const handleOpen = useCallback(
    async (projectId: string) => {
      setLoading(true);
      setError(null);
      try {
        navigate('/photo-editor', { state: { loadProjectId: projectId } });
      } catch (err) {
        setError(`Failed to open project: ${err}`);
        setLoading(false);
      }
    },
    [navigate]
  );

  const handleDelete = useCallback(
    (projectId: string) => {
      deleteProject(projectId);
      refresh();
    },
    [refresh]
  );

  const handleImport = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      setLoading(true);
      setError(null);
      try {
        const loaded = await importProjectFromFile(file);
        refresh();
        navigate('/photo-editor', { state: { loadProjectId: loaded.projectId } });
      } catch (err) {
        setError(`Failed to import project: ${err}`);
        setLoading(false);
      }
    },
    [navigate, refresh]
  );

  return (
    <div className="pm-page">
      <div className="pm-header">
        <div className="pm-header__left">
          <div className="pm-header__logo">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="#F7C948" />
              <rect x="13" y="2" width="9" height="9" rx="2" fill="#F7C948" opacity="0.5" />
              <rect x="2" y="13" width="9" height="9" rx="2" fill="#F7C948" opacity="0.5" />
              <rect x="13" y="13" width="9" height="9" rx="2" fill="#F7C948" opacity="0.3" />
            </svg>
            <span className="pm-header__title">Photo Editor</span>
          </div>
          <div className="pm-header__subtitle">Projects</div>
        </div>
        <div className="pm-header__actions">
          <div className="pm-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="pm-btn"
            onClick={() => importRef.current?.click()}
            title="Import .dawndesk project file"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".dawndesk,application/json"
            hidden
            onChange={(e) => {
              handleImport(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            className="pm-btn pm-btn--primary"
            onClick={() => setShowNewDialog(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Project
          </button>
        </div>
      </div>

      <div className="pm-content">
        {error && (
          <div className="pm-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {loading ? (
          <div className="pm-loading">
            <div className="pm-spinner" />
            <span>Loading project…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pm-empty">
            {search ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <p>No projects match "{search}"</p>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <path d="M3 3h18v18H3z" opacity="0.3" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                <p>No projects yet</p>
                <button className="pm-btn pm-btn--primary" onClick={() => setShowNewDialog(true)}>
                  Create your first project
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="pm-grid-label">
              {filtered.length} project{filtered.length !== 1 ? 's' : ''}
            </div>
            <div className="pm-grid">
              {filtered.map((entry) => (
                <ProjectCard
                  key={entry.id}
                  entry={entry}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showNewDialog && (
        <NewProjectDialog
          onClose={() => setShowNewDialog(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
