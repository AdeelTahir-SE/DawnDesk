import { useState, useEffect, useCallback, useRef } from "react";
import WelcomeScreen from "../components/WelcomeScreen";
import { invoke } from "@tauri-apps/api/core";
import {
  StickyNote,
  Search,
  Plus,
  PanelRightOpen,
  PanelRightClose,
  Maximize2,
  Minimize2,
  History,
  Command,
} from "lucide-react";

import NotesSidebar from "../components/notes/NotesSidebar";
import NotesList from "../components/notes/NotesList";
import NoteEditor from "../components/notes/NoteEditor";
import SearchPanel from "../components/notes/SearchPanel";
import CommandPalette from "../components/notes/CommandPalette";
import VersionHistory from "../components/notes/VersionHistory";
import NotePropertiesPanel from "../components/notes/NotePropertiesPanel";
import BacklinksPanel from "../components/notes/BacklinksPanel";
import GraphView from "../components/notes/views/GraphView";
import DailyNotesView from "../components/notes/views/DailyNotesView";
import TemplatesView from "../components/notes/views/TemplatesView";
import TasksView from "../components/notes/views/TasksView";
import ArchiveView from "../components/notes/views/ArchiveView";
import TrashView from "../components/notes/views/TrashView";

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface NoteLinkItem {
  id: number;
  source_note_id: number;
  target_note_id: number;
  created_at: string;
}

interface NoteVersionItem {
  id: number;
  note_id: number;
  title: string;
  content: string;
  word_count: number;
  created_at: string;
}

interface NoteTemplateItem {
  id: number;
  name: string;
  category: string;
  content: string;
  icon: string;
  created_at: string;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function NotesApp() {
  // Core data
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [templates, setTemplates] = useState<NoteTemplateItem[]>([]);
  const [allLinks, setAllLinks] = useState<NoteLinkItem[]>([]);
  const [noteTags, setNoteTags] = useState<TagItem[]>([]);
  const [backlinks, setBacklinks] = useState<NoteItem[]>([]);
  const [versions, setVersions] = useState<NoteVersionItem[]>([]);

  // UI state
  const [activeView, setActiveView] = useState("all");
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [activeNotebookId, setActiveNotebookId] = useState<number | null>(null);
  const [activeTagId, setActiveTagId] = useState<number | null>(null);
  const [listViewMode, setListViewMode] = useState<"list" | "grid">("list");
  const [listSortBy, setListSortBy] = useState<"updated" | "created" | "title">("updated");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showBacklinks, setShowBacklinks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;
  const versionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchNotes = useCallback(async () => {
    try {
      const data = await invoke<NoteItem[]>("notes_get_notes");
      setNotes(data);
    } catch {
      setNotes([]);
    }
  }, []);

  const fetchNotebooks = useCallback(async () => {
    try {
      const data = await invoke<NotebookItem[]>("notes_get_notebooks");
      setNotebooks(data);
    } catch {
      setNotebooks([]);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const data = await invoke<TagItem[]>("notes_get_tags");
      setTags(data);
    } catch {
      setTags([]);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await invoke<NoteTemplateItem[]>("notes_get_templates");
      setTemplates(data);
    } catch {
      setTemplates([]);
    }
  }, []);

  const fetchAllLinks = useCallback(async () => {
    try {
      const data = await invoke<NoteLinkItem[]>("notes_get_all_links");
      setAllLinks(data);
    } catch {
      setAllLinks([]);
    }
  }, []);

  const fetchNoteTags = useCallback(async (noteId: number) => {
    try {
      const data = await invoke<TagItem[]>("notes_get_note_tags", { noteId });
      setNoteTags(data);
    } catch {
      setNoteTags([]);
    }
  }, []);

  const fetchBacklinks = useCallback(async (noteId: number) => {
    try {
      const data = await invoke<NoteItem[]>("notes_get_backlinks", { noteId });
      setBacklinks(data);
    } catch {
      setBacklinks([]);
    }
  }, []);

  const fetchVersions = useCallback(async (noteId: number) => {
    try {
      const data = await invoke<NoteVersionItem[]>("notes_get_versions", { noteId });
      setVersions(data);
    } catch {
      setVersions([]);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchNotebooks();
    fetchTags();
    fetchTemplates();
    fetchAllLinks();
  }, [fetchNotes, fetchNotebooks, fetchTags, fetchTemplates, fetchAllLinks]);

  useEffect(() => {
    if (activeNoteId) {
      fetchNoteTags(activeNoteId);
      fetchBacklinks(activeNoteId);
      fetchVersions(activeNoteId);
    } else {
      setNoteTags([]);
      setBacklinks([]);
      setVersions([]);
    }
  }, [activeNoteId, fetchNoteTags, fetchBacklinks, fetchVersions]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((p) => !p);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        handleCreateNote();
      }
      if (e.key === "Escape") {
        if (showSearch) setShowSearch(false);
        if (showCommandPalette) setShowCommandPalette(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, showCommandPalette]);

  // ─── Note Operations ──────────────────────────────────────────────────────

  const handleCreateNote = async () => {
    try {
      const note = await invoke<NoteItem>("notes_create_note", {
        input: {
          title: "Untitled",
          content: "",
          notebook_id: activeNotebookId,
          is_daily_note: false,
          daily_date: null,
        },
      });
      await fetchNotes();
      setActiveNoteId(note.id);
      setActiveView(activeView === "trash" || activeView === "archive" ? "all" : activeView);
    } catch (e) {
      console.error("Failed to create note:", e);
    }
  };

  const handleSaveNote = async (id: number, title: string, content: string) => {
    const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const readingTime = Math.max(1, Math.round(words / 200));

    try {
      await invoke("notes_update_note", {
        input: {
          id,
          title: title || "Untitled",
          content,
          word_count: words,
          char_count: chars,
          reading_time_minutes: readingTime,
        },
      });

      // Save version every 30 seconds of editing
      if (versionSaveTimer.current) clearTimeout(versionSaveTimer.current);
      versionSaveTimer.current = setTimeout(async () => {
        try {
          await invoke("notes_create_version", {
            input: { note_id: id, title: title || "Untitled", content, word_count: words },
          });
          if (activeNoteId === id) fetchVersions(id);
        } catch {}
      }, 30000);

      await fetchNotes();
    } catch (e) {
      console.error("Failed to save note:", e);
    }
  };

  const handleUpdateNote = async (id: number, updates: Partial<NoteItem>) => {
    try {
      await invoke("notes_update_note", { input: { id, ...updates } });
      await fetchNotes();
    } catch (e) {
      console.error("Failed to update note:", e);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await invoke("notes_update_note", { input: { id, is_deleted: true } });
      if (activeNoteId === id) setActiveNoteId(null);
      await fetchNotes();
    } catch (e) {
      console.error("Failed to delete note:", e);
    }
  };

  const handlePermanentDelete = async (id: number) => {
    try {
      await invoke("notes_delete_note", { id });
      if (activeNoteId === id) setActiveNoteId(null);
      await fetchNotes();
    } catch (e) {
      console.error("Failed to permanently delete note:", e);
    }
  };

  const handleRestoreNote = async (id: number) => {
    try {
      await invoke("notes_update_note", { input: { id, is_deleted: false, is_archived: false } });
      await fetchNotes();
    } catch {}
  };

  const handleEmptyTrash = async () => {
    const trashNotes = notes.filter((n) => n.is_deleted);
    for (const n of trashNotes) {
      try {
        await invoke("notes_delete_note", { id: n.id });
      } catch {}
    }
    if (activeNoteId && trashNotes.some((n) => n.id === activeNoteId)) {
      setActiveNoteId(null);
    }
    await fetchNotes();
  };

  // ─── Notebook Operations ───────────────────────────────────────────────────

  const handleCreateNotebook = async (name: string) => {
    try {
      await invoke("notes_create_notebook", { input: { name, parent_id: null, color: "", icon: "" } });
      await fetchNotebooks();
    } catch {}
  };

  const handleRenameNotebook = async (id: number, name: string) => {
    try {
      await invoke("notes_update_notebook", { input: { id, name } });
      await fetchNotebooks();
    } catch {}
  };

  const handleDeleteNotebook = async (id: number) => {
    try {
      await invoke("notes_delete_notebook", { id });
      if (activeNotebookId === id) {
        setActiveNotebookId(null);
        setActiveView("all");
      }
      await fetchNotebooks();
      await fetchNotes();
    } catch {}
  };

  // ─── Tag Operations ────────────────────────────────────────────────────────

  const handleCreateTag = async (name: string) => {
    try {
      await invoke("notes_create_tag", { input: { name, parent_id: null, color: "" } });
      await fetchTags();
    } catch {}
  };

  const handleDeleteTag = async (id: number) => {
    try {
      await invoke("notes_delete_tag", { id });
      if (activeTagId === id) {
        setActiveTagId(null);
        setActiveView("all");
      }
      await fetchTags();
    } catch {}
  };

  const handleAddTagToNote = async (noteId: number, tagId: number) => {
    try {
      await invoke("notes_add_tag_to_note", { noteId, tagId });
      fetchNoteTags(noteId);
    } catch {}
  };

  const handleRemoveTagFromNote = async (noteId: number, tagId: number) => {
    try {
      await invoke("notes_remove_tag_from_note", { noteId, tagId });
      fetchNoteTags(noteId);
    } catch {}
  };

  // ─── Template Operations ───────────────────────────────────────────────────

  const handleApplyTemplate = async (content: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const filled = content
      .replace(/\{\{date\}\}/g, dateStr)
      .replace(/\{\{title\}\}/g, "Untitled")
      .replace(/\{\{author\}\}/g, "You");

    try {
      const note = await invoke<NoteItem>("notes_create_note", {
        input: { title: "From Template", content: filled, notebook_id: activeNotebookId },
      });
      await fetchNotes();
      setActiveNoteId(note.id);
      setActiveView("all");
    } catch {}
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await invoke("notes_delete_template", { id });
      await fetchTemplates();
    } catch {}
  };

  // ─── Daily Notes ───────────────────────────────────────────────────────────

  const handleCreateDailyNote = async (date: string) => {
    const existing = notes.find((n) => n.is_daily_note && n.daily_date === date && !n.is_deleted);
    if (existing) {
      setActiveNoteId(existing.id);
      return;
    }
    try {
      const note = await invoke<NoteItem>("notes_create_note", {
        input: {
          title: `Daily Note — ${date}`,
          content: `<h2>${date} — Daily Log</h2><h3>Morning</h3><p></p><h3>Afternoon</h3><p></p><h3>Evening</h3><p></p><h3>Reflections</h3><p></p>`,
          notebook_id: null,
          is_daily_note: true,
          daily_date: date,
        },
      });
      await fetchNotes();
      setActiveNoteId(note.id);
    } catch {}
  };

  // ─── Version Restore ──────────────────────────────────────────────────────

  const handleRestoreVersion = async (version: NoteVersionItem) => {
    if (!activeNoteId) return;
    await handleSaveNote(activeNoteId, version.title, version.content);
    setShowVersions(false);
    await fetchNotes();
  };

  // ─── View Handling ─────────────────────────────────────────────────────────

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setActiveNotebookId(null);
    setActiveTagId(null);
    if (view === "graph" || view === "templates" || view === "tasks" || view === "daily") {
      setActiveNoteId(null);
    }
  };

  const handleNotebookSelect = (id: number | null) => {
    setActiveNotebookId(id);
    setActiveTagId(null);
    setActiveView("notebook");
  };

  const handleTagSelect = (id: number | null) => {
    setActiveTagId(id);
    setActiveNotebookId(null);
    setActiveView("tag");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setActiveView("search");
    } else {
      setActiveView("all");
    }
  };

  const handleCommandAction = (action: string) => {
    switch (action) {
      case "new-note":
        handleCreateNote();
        break;
      case "new-notebook":
        handleCreateNotebook("New Notebook");
        break;
      case "new-tag":
        handleCreateTag("new-tag");
        break;
      case "toggle-focus":
        setIsFocusMode((p) => !p);
        break;
      case "graph-view":
        handleViewChange("graph");
        break;
      case "daily-notes":
        handleViewChange("daily");
        break;
      case "templates":
        handleViewChange("templates");
        break;
    }
    setShowCommandPalette(false);
  };

  // ─── Filtered Notes ────────────────────────────────────────────────────────

  const getFilteredNotes = (): NoteItem[] => {
    let filtered = notes;

    switch (activeView) {
      case "all":
        filtered = notes.filter((n) => !n.is_deleted && !n.is_archived);
        break;
      case "favorites":
        filtered = notes.filter((n) => n.is_favorite && !n.is_deleted && !n.is_archived);
        break;
      case "daily":
        filtered = notes.filter((n) => n.is_daily_note && !n.is_deleted);
        break;
      case "inbox":
        filtered = notes.filter((n) => !n.notebook_id && !n.is_deleted && !n.is_archived && !n.is_daily_note);
        break;
      case "notebook":
        filtered = notes.filter((n) => n.notebook_id === activeNotebookId && !n.is_deleted && !n.is_archived);
        break;
      case "tag":
        // For tag filtering, we'd need note_tags junction data
        // For now, show all non-deleted notes (tag filtering happens via backend)
        filtered = notes.filter((n) => !n.is_deleted && !n.is_archived);
        break;
      case "archive":
        filtered = notes.filter((n) => n.is_archived && !n.is_deleted);
        break;
      case "trash":
        filtered = notes.filter((n) => n.is_deleted);
        break;
      case "search":
        filtered = notes.filter(
          (n) =>
            !n.is_deleted &&
            (n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              n.content.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        break;
      default:
        filtered = notes.filter((n) => !n.is_deleted && !n.is_archived);
    }

    // Sort
    switch (listSortBy) {
      case "updated":
        filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
      case "created":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    // Pinned on top
    const pinned = filtered.filter((n) => n.is_pinned);
    const unpinned = filtered.filter((n) => !n.is_pinned);
    return [...pinned, ...unpinned];
  };

  const getViewTitle = (): string => {
    switch (activeView) {
      case "all":
        return "All Notes";
      case "favorites":
        return "Favorites";
      case "daily":
        return "Daily Notes";
      case "inbox":
        return "Inbox";
      case "notebook": {
        const nb = notebooks.find((n) => n.id === activeNotebookId);
        return nb?.name || "Notebook";
      }
      case "tag": {
        const t = tags.find((t) => t.id === activeTagId);
        return t ? `#${t.name}` : "Tag";
      }
      case "archive":
        return "Archive";
      case "trash":
        return "Trash";
      case "search":
        return `Search: "${searchQuery}"`;
      default:
        return "Notes";
    }
  };

  const filteredNotes = getFilteredNotes();

  // ─── Special Views (full-screen) ──────────────────────────────────────────

  const renderSpecialView = () => {
    switch (activeView) {
      case "graph":
        return (
          <GraphView
            notes={notes.filter((n) => !n.is_deleted)}
            links={allLinks}
            onNoteSelect={(id) => {
              setActiveNoteId(id);
              setActiveView("all");
            }}
          />
        );
      case "daily":
        return (
          <DailyNotesView
            notes={notes}
            onNoteSelect={(id) => {
              setActiveNoteId(id);
            }}
            onCreateDailyNote={handleCreateDailyNote}
          />
        );
      case "templates":
        return (
          <TemplatesView
            templates={templates}
            onApplyTemplate={handleApplyTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        );
      case "tasks":
        return (
          <TasksView
            notes={notes.filter((n) => !n.is_deleted)}
            onNoteSelect={(id) => {
              setActiveNoteId(id);
              setActiveView("all");
            }}
          />
        );
      case "archive":
        return (
          <ArchiveView
            notes={filteredNotes}
            onRestore={handleRestoreNote}
            onDelete={handlePermanentDelete}
            onNoteSelect={setActiveNoteId}
          />
        );
      case "trash":
        return (
          <TrashView
            notes={filteredNotes}
            onRestore={handleRestoreNote}
            onPermanentDelete={handlePermanentDelete}
            onEmptyTrash={handleEmptyTrash}
          />
        );
      default:
        return null;
    }
  };

  const isSpecialView = ["graph", "templates", "tasks"].includes(activeView);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <WelcomeScreen
      appKey="notes"
      title="Notes & Knowledge Base"
      description="Capture ideas, link knowledge, and build your second brain — all offline."
    >
      <div className="dd-page">
        {/* Sidebar */}
        {!isFocusMode && (
          <NotesSidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            notebooks={notebooks}
            tags={tags}
            notes={notes}
            activeNotebookId={activeNotebookId}
            activeTagId={activeTagId}
            onNotebookSelect={handleNotebookSelect}
            onTagSelect={handleTagSelect}
            onCreateNotebook={() => { handleCreateNotebook("New Notebook"); }}
            onCreateTag={() => { handleCreateTag("new-tag"); }}
            onDeleteNotebook={handleDeleteNotebook}
            onDeleteTag={handleDeleteTag}
            onRenameNotebook={handleRenameNotebook}
            onSearch={handleSearch}
          />
        )}

        {/* Main Content */}
        <main className="relative flex flex-1 overflow-hidden">
          {/* Top Header Bar */}
          <header className="dd-topbar-compact">
            <div className="flex items-center gap-3">
              <div className="dd-icon-box-sm">
                <StickyNote className="h-4 w-4" />
              </div>
              <div>
                <p className="dd-label-muted">
                  Notes
                </p>
                <h2 className="dd-card-title">{getViewTitle()}</h2>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSearch(true)}
                className="dd-icon-btn"
                title="Search (Ctrl+F)"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowCommandPalette(true)}
                className="dd-icon-btn"
                title="Command Palette (Ctrl+K)"
              >
                <Command className="h-4 w-4" />
              </button>
              {activeNote && (
                <>
                  <button
                    onClick={() => setShowVersions((p) => !p)}
                    className="dd-icon-btn"
                    title="Version History"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowProperties((p) => !p)}
                    className={`${
                      showProperties
                        ? "grid h-8 w-8 place-items-center rounded-lg transition-colors bg-yellow-400/10 text-yellow-400"
                        : "dd-icon-btn"
                    }`}
                    title="Properties"
                  >
                    {showProperties ? (
                      <PanelRightClose className="h-4 w-4" />
                    ) : (
                      <PanelRightOpen className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => setIsFocusMode((p) => !p)}
                className={`${
                  isFocusMode
                    ? "grid h-8 w-8 place-items-center rounded-lg transition-colors bg-yellow-400/10 text-yellow-400"
                    : "dd-icon-btn"
                }`}
                title="Focus Mode"
              >
                {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={handleCreateNote}
                className="ml-2 flex h-8 items-center gap-1.5 rounded-lg bg-yellow-400 px-3 text-xs font-bold text-black transition-colors hover:bg-yellow-300"
                title="New Note (Ctrl+N)"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
            </div>
          </header>

          {/* Content area below header */}
          <div className="flex w-full pt-14" style={{ height: "100%" }}>
            {isSpecialView ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar">{renderSpecialView()}</div>
            ) : activeView === "archive" || activeView === "trash" ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar">{renderSpecialView()}</div>
            ) : (
              <>
                {/* Notes List */}
                {!isFocusMode && (
                  <NotesList
                    notes={filteredNotes}
                    activeNoteId={activeNoteId}
                    onNoteSelect={setActiveNoteId}
                    onCreateNote={handleCreateNote}
                    onDeleteNote={handleDeleteNote}
                    onTogglePin={(id) => {
                      const note = notes.find((n) => n.id === id);
                      if (note) handleUpdateNote(id, { is_pinned: !note.is_pinned } as any);
                    }}
                    onToggleFavorite={(id) => {
                      const note = notes.find((n) => n.id === id);
                      if (note) handleUpdateNote(id, { is_favorite: !note.is_favorite } as any);
                    }}
                    viewMode={listViewMode}
                    onViewModeChange={setListViewMode}
                    sortBy={listSortBy}
                    onSortChange={setListSortBy}
                    title={getViewTitle()}
                  />
                )}

                {/* Editor */}
                <div className="relative flex flex-1 flex-col overflow-hidden">
                  <NoteEditor
                    note={activeNote}
                    onSave={(data) => { if (activeNote) handleSaveNote(activeNote.id, data.title, data.content); }}
                    onToggleFocusMode={() => setIsFocusMode((p) => !p)}
                    isFocusMode={isFocusMode}
                  />
                  {activeNote && showBacklinks && (
                    <BacklinksPanel
                      backlinks={backlinks}
                      onNoteSelect={(id) => {
                        setActiveNoteId(id);
                      }}
                      isOpen={showBacklinks}
                      onToggle={() => setShowBacklinks((p) => !p)}
                    />
                  )}
                </div>

                {/* Properties Panel */}
                {showProperties && activeNote && (
                  <NotePropertiesPanel
                    note={activeNote}
                    tags={tags}
                    noteTags={noteTags}
                    notebooks={notebooks}
                    onUpdateNote={(updates) => handleUpdateNote(activeNote.id, updates)}
                    onAddTag={(tagId) => handleAddTagToNote(activeNote.id, tagId)}
                    onRemoveTag={(tagId) => handleRemoveTagFromNote(activeNote.id, tagId)}
                    isOpen={showProperties}
                    onClose={() => setShowProperties(false)}
                  />
                )}

                {/* Version History */}
                {showVersions && activeNote && (
                  <VersionHistory
                    versions={versions}
                    onRestore={handleRestoreVersion}
                    isOpen={showVersions}
                    onClose={() => setShowVersions(false)}
                  />
                )}
              </>
            )}
          </div>
        </main>

        {/* Overlays */}
        {showSearch && (
          <SearchPanel
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            notes={notes.filter((n) => !n.is_deleted)}
            onNoteSelect={(id) => {
              setActiveNoteId(id);
              setShowSearch(false);
              setActiveView("all");
            }}
          />
        )}
        {showCommandPalette && (
          <CommandPalette
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            notes={notes.filter((n) => !n.is_deleted)}
            onNoteSelect={(id) => {
              setActiveNoteId(id);
              setShowCommandPalette(false);
              setActiveView("all");
            }}
            onAction={handleCommandAction}
          />
        )}
      </div>
    </WelcomeScreen>
  );
}
