import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProjectRegistry,
  deleteProject,
  importProjectFromFile,
  type ProjectEntry,
} from '../engine/photo-editor/projectFile';
import { Image as ImageIcon, ExternalLink, Trash2, LayoutGrid, Search, Download, Plus, AlertCircle, FileQuestion, FolderPlus, X } from 'lucide-react';
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
          <button className="pe-modal__close" onClick={onClose}><X className="w-4 h-4" strokeWidth={2} /></button>
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
            <ImageIcon className="text-white/50" size={32} strokeWidth={1.5} />
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
          <ExternalLink size={14} strokeWidth={2} />
        </button>
        {!confirmDelete ? (
          <button
            className="pm-card__btn pm-card__btn--danger"
            title="Delete project"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={14} strokeWidth={2} />
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
            <LayoutGrid size={20} fill="#F7C948" className="text-yellow-400" />
            <span className="pm-header__title">Photo Editor</span>
          </div>
          <div className="pm-header__subtitle">Projects</div>
        </div>
        <div className="pm-header__actions">
          <div className="pm-search">
            <Search size={14} strokeWidth={2} />
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
            <Download size={14} strokeWidth={2} />
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
            <Plus size={14} strokeWidth={2.5} />
            New Project
          </button>
        </div>
      </div>

      <div className="pm-content">
        {error && (
          <div className="pm-error">
            <AlertCircle size={16} strokeWidth={2} />
            {error}
            <button onClick={() => setError(null)}><X className="w-4 h-4" strokeWidth={2} /></button>
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
                <FileQuestion size={48} strokeWidth={1.5} />
                <p>No projects match "{search}"</p>
              </>
            ) : (
              <>
                <FolderPlus size={48} strokeWidth={1.5} className="text-white/30" />
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
