import { useMemo, useState } from "react";
import {
  BookTemplate,
  Bug,
  Calendar,
  ClipboardList,
  Code2,
  FolderKanban,
  LayoutTemplate,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

interface NoteTemplateItem {
  id: number;
  name: string;
  category: string;
  content: string;
  icon: string;
  created_at: string;
}

interface Props {
  templates: NoteTemplateItem[];
  onApplyTemplate: (content: string) => void;
  onDeleteTemplate: (templateId: number) => void;
}

const CATEGORIES = ["All", "Meeting", "Project", "Daily", "Technical", "Custom"];

const BUILT_IN_TEMPLATES: Omit<NoteTemplateItem, "id" | "created_at">[] = [
  {
    name: "Meeting Notes",
    category: "Meeting",
    icon: "users",
    content:
      "## Meeting: {{title}}\n\n**Date:** {{date}}\n**Attendees:**\n\n---\n\n## Agenda\n\n## Discussion\n\n## Action Items\n\n- [ ] \n",
  },
  {
    name: "Project Brief",
    category: "Project",
    icon: "folder",
    content:
      "## Project: {{title}}\n\n**Status:** Draft\n**Owner:**\n\n---\n\n## Objective\n\n## Scope\n\n## Timeline\n\n## Resources\n",
  },
  {
    name: "Daily Log",
    category: "Daily",
    icon: "calendar",
    content:
      "## {{date}} — Daily Log\n\n### Morning\n\n### Afternoon\n\n### Evening\n\n### Reflections\n\n",
  },
  {
    name: "Weekly Review",
    category: "Daily",
    icon: "clipboard",
    content:
      "## Week of {{date}}\n\n### Accomplishments\n\n### Challenges\n\n### Next Week Goals\n\n### Notes\n",
  },
  {
    name: "Technical Spec",
    category: "Technical",
    icon: "code",
    content:
      "## RFC: {{title}}\n\n**Author:**\n**Status:** Draft\n\n---\n\n## Summary\n\n## Motivation\n\n## Design\n\n## Alternatives Considered\n\n## Implementation Plan\n",
  },
  {
    name: "Bug Report",
    category: "Technical",
    icon: "bug",
    content:
      "## Bug: {{title}}\n\n**Severity:**\n**Environment:**\n\n---\n\n## Steps to Reproduce\n\n1. \n\n## Expected Behavior\n\n## Actual Behavior\n\n## Screenshots\n",
  },
];

function getIconForTemplate(iconName: string) {
  const size = "h-6 w-6";
  switch (iconName) {
    case "users":
      return <Users className={size} />;
    case "folder":
      return <FolderKanban className={size} />;
    case "calendar":
      return <Calendar className={size} />;
    case "clipboard":
      return <ClipboardList className={size} />;
    case "code":
      return <Code2 className={size} />;
    case "bug":
      return <Bug className={size} />;
    default:
      return <BookTemplate className={size} />;
  }
}

function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case "meeting":
      return "bg-blue-400/10 text-blue-400";
    case "project":
      return "bg-green-400/10 text-green-400";
    case "daily":
      return "bg-orange-400/10 text-orange-400";
    case "technical":
      return "bg-purple-400/10 text-purple-400";
    case "custom":
      return "bg-yellow-400/10 text-yellow-400";
    default:
      return "bg-neutral-700/30 text-white/50";
  }
}

export default function TemplatesView({
  templates,
  onApplyTemplate,
  onDeleteTemplate,
}: Props) {
  const [activeCategory, setActiveCategory] = useState("All");

  // Merge built-in + user templates
  const allTemplates = useMemo(() => {
    const builtIn = BUILT_IN_TEMPLATES.map((t, i) => ({
      ...t,
      id: -(i + 1), // negative ids for built-in
      created_at: "",
      isBuiltIn: true,
    }));

    const user = templates.map((t) => ({
      ...t,
      isBuiltIn: false,
    }));

    return [...builtIn, ...user];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === "All") return allTemplates;
    return allTemplates.filter(
      (t) => t.category.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [allTemplates, activeCategory]);

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">
            Templates
          </p>
          <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white">
            Note Templates
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Start with a structure. Customize to fit your needs.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors
              ${
                activeCategory === cat
                  ? "bg-yellow-400/10 text-yellow-400 shadow-[inset_3px_0_0_#F7C948]"
                  : "text-white/50 hover:bg-neutral-800/50 hover:text-white/70"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 py-16">
          <LayoutTemplate className="mb-4 h-12 w-12 text-white/20" />
          <h3 className="text-lg font-bold text-white">No templates found</h3>
          <p className="mt-2 text-sm text-white/40">
            No templates match this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group relative flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700 hover:shadow-xl"
            >
              {/* Top row: icon + badges */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 text-yellow-400">
                  {getIconForTemplate(template.icon)}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(template.category)}`}
                  >
                    {template.category}
                  </span>
                  {template.isBuiltIn && (
                    <span className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-white/40">
                      <Sparkles className="h-3 w-3" />
                      Built-in
                    </span>
                  )}
                </div>
              </div>

              {/* Name */}
              <h3 className="mb-2 text-base font-bold text-white">{template.name}</h3>

              {/* Content preview */}
              <p className="mb-6 flex-1 text-xs leading-relaxed text-white/40">
                {template.content.slice(0, 100)}
                {template.content.length > 100 && "…"}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onApplyTemplate(template.content)}
                  className="flex-1 rounded-xl bg-yellow-400/10 py-2.5 text-sm font-bold text-yellow-400 transition-colors hover:bg-yellow-400/20"
                >
                  Use Template
                </button>
                {!template.isBuiltIn && (
                  <button
                    onClick={() => onDeleteTemplate(template.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 text-white/30 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
