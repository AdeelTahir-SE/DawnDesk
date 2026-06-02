import { useState, useMemo } from "react";
import {
  StickyNote,
  Search,
  FileText,
  Heart,
  CalendarDays,
  Inbox,
  LayoutTemplate,
  Archive,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import NotebookTree from "./NotebookTree";
import TagsList from "./TagsList";

interface NoteItem {
  id: number;
  title: string;
  content: string;
  notebook_id: number | null;
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  color: string;
  word_count: number;
  char_count: number;
  reading_time_minutes: number;
  is_daily_note: boolean;
  daily_date: string | null;
  created_at: string;
  updated_at: string;
}

interface NotebookItem {
  id: number;
  name: string;
  parent_id: number | null;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

interface TagItem {
  id: number;
  name: string;
  parent_id: number | null;
  color: string;
}

interface NotesSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  notebooks: NotebookItem[];
  tags: TagItem[];
  notes: NoteItem[];
  activeNotebookId: number | null;
  activeTagId: number | null;
  onNotebookSelect: (id: number) => void;
  onTagSelect: (id: number) => void;
  onCreateNotebook: () => void;
  onCreateTag: () => void;
  onDeleteNotebook: (id: number) => void;
  onDeleteTag: (id: number) => void;
  onRenameNotebook: (id: number, name: string) => void;
  onSearch: (query: string) => void;
}

export default function NotesSidebar({
  activeView,
  onViewChange,
  notebooks,
  tags,
  notes,
  activeNotebookId,
  activeTagId,
  onNotebookSelect,
  onTagSelect,
  onCreateNotebook,
  onCreateTag,
  onDeleteNotebook,
  onDeleteTag,
  onRenameNotebook,
  onSearch,
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [notebooksExpanded, setNotebooksExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);

  const counts = useMemo(() => {
    const allNotes = notes.filter((n) => !n.is_deleted && !n.is_archived).length;
    const favorites = notes.filter((n) => n.is_favorite && !n.is_deleted && !n.is_archived).length;
    const daily = notes.filter((n) => n.is_daily_note && !n.is_deleted && !n.is_archived).length;
    const inbox = notes.filter(
      (n) => n.notebook_id === null && !n.is_deleted && !n.is_archived
    ).length;
    const archived = notes.filter((n) => n.is_archived && !n.is_deleted).length;
    const trashed = notes.filter((n) => n.is_deleted).length;
    return { allNotes, favorites, daily, inbox, archived, trashed };
  }, [notes]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <aside className="dd-sidebar overflow-hidden">
      {/* Header */}
      <div className="dd-sidebar-header shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/10">
            <StickyNote className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="dd-sidebar-title text-base">Notes</h1>
            <p className="dd-subtext leading-none">Your Knowledge Base</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-white/30" />
          <input
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
        {/* Quick Access */}
        <div className="mb-1">
          <p className="dd-label-muted px-2 pb-1 pt-2">
            Quick Access
          </p>
          <NavItem
            icon={FileText}
            label="All Notes"
            count={counts.allNotes}
            active={activeView === "all"}
            onClick={() => onViewChange("all")}
          />
          <NavItem
            icon={Heart}
            label="Favorites"
            count={counts.favorites}
            active={activeView === "favorites"}
            onClick={() => onViewChange("favorites")}
          />
          <NavItem
            icon={CalendarDays}
            label="Daily Notes"
            count={counts.daily}
            active={activeView === "daily"}
            onClick={() => onViewChange("daily")}
          />
          <NavItem
            icon={Inbox}
            label="Inbox"
            count={counts.inbox}
            active={activeView === "inbox"}
            onClick={() => onViewChange("inbox")}
          />
        </div>

        {/* Separator */}
        <div className="dd-divider-light mx-2 my-2" />

        {/* Notebooks Section */}
        <div className="mb-1">
          <button
            className="flex w-full items-center justify-between px-2 py-1.5 group"
            onClick={() => setNotebooksExpanded(!notebooksExpanded)}
          >
            <div className="flex items-center gap-1.5">
              {notebooksExpanded ? (
                <ChevronDown className="h-3 w-3 text-white/30" />
              ) : (
                <ChevronRight className="h-3 w-3 text-white/30" />
              )}
              <span className="dd-label-muted">
                Notebooks
              </span>
            </div>
            <button
              className="p-0.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-neutral-700/50 text-white/40 hover:text-yellow-400 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onCreateNotebook();
              }}
              title="New notebook"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </button>

          {notebooksExpanded && (
            <div className="mt-0.5">
              {notebooks.length > 0 ? (
                <NotebookTree
                  notebooks={notebooks}
                  parentId={null}
                  activeNotebookId={activeNotebookId}
                  onSelect={onNotebookSelect}
                  notes={notes}
                  onDelete={onDeleteNotebook}
                  onRename={onRenameNotebook}
                />
              ) : (
                <p className="px-3 py-2 text-xs text-white/25 italic">No notebooks yet</p>
              )}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="dd-divider-light mx-2 my-2" />

        {/* Tags Section */}
        <div className="mb-1">
          <button
            className="flex w-full items-center justify-between px-2 py-1.5 group"
            onClick={() => setTagsExpanded(!tagsExpanded)}
          >
            <div className="flex items-center gap-1.5">
              {tagsExpanded ? (
                <ChevronDown className="h-3 w-3 text-white/30" />
              ) : (
                <ChevronRight className="h-3 w-3 text-white/30" />
              )}
              <span className="dd-label-muted">
                Tags
              </span>
            </div>
            <button
              className="p-0.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-neutral-700/50 text-white/40 hover:text-yellow-400 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onCreateTag();
              }}
              title="New tag"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </button>

          {tagsExpanded && (
            <div className="mt-0.5">
              {tags.length > 0 ? (
                <TagsList
                  tags={tags}
                  activeTagId={activeTagId}
                  onSelect={onTagSelect}
                  notes={notes}
                  onDelete={onDeleteTag}
                />
              ) : (
                <p className="px-3 py-2 text-xs text-white/25 italic">No tags yet</p>
              )}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="dd-divider-light mx-2 my-2" />

        {/* Bottom Section */}
        <div className="mb-1">
          <NavItem
            icon={LayoutTemplate}
            label="Templates"
            active={activeView === "templates"}
            onClick={() => onViewChange("templates")}
          />
          <NavItem
            icon={Archive}
            label="Archive"
            count={counts.archived}
            active={activeView === "archive"}
            onClick={() => onViewChange("archive")}
          />
          <NavItem
            icon={Trash2}
            label="Trash"
            count={counts.trashed}
            active={activeView === "trash"}
            onClick={() => onViewChange("trash")}
          />
        </div>
      </div>

    </aside>
  );
}

/* ─── Sidebar nav item ─── */

function NavItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${active ? "dd-nav-item-sm dd-nav-item-sm-active" : "dd-nav-item-sm"} !gap-2.5 !px-2.5 !py-2 !rounded-lg`}
      onClick={onClick}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-yellow-400" : "text-white/40"}`} />
      <span className="flex-1 text-left truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`text-xs tabular-nums ${
            active ? "text-yellow-400/70" : "text-white/30"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
