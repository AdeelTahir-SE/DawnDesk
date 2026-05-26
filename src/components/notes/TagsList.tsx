import { useState } from "react";
import { X } from "lucide-react";

interface TagItem {
  id: number;
  name: string;
  parent_id: number | null;
  color: string;
}

interface TagsListProps {
  tags: TagItem[];
  activeTagId: number | null;
  onSelect: (id: number) => void;
  notes: { id: number }[];
  onDelete: (id: number) => void;
}

export default function TagsList({
  tags,
  activeTagId,
  onSelect,
  onDelete,
}: TagsListProps) {
  return (
    <div className="flex flex-col">
      <TagLevel
        tags={tags}
        parentId={null}
        activeTagId={activeTagId}
        onSelect={onSelect}
        onDelete={onDelete}
        depth={0}
      />
    </div>
  );
}

function TagLevel({
  tags,
  parentId,
  activeTagId,
  onSelect,
  onDelete,
  depth,
}: {
  tags: TagItem[];
  parentId: number | null;
  activeTagId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  depth: number;
}) {
  const children = tags.filter((t) =>
    parentId === null ? t.parent_id === null : t.parent_id === parentId
  );

  if (children.length === 0) return null;

  return (
    <>
      {children.map((tag) => (
        <TagNode
          key={tag.id}
          tag={tag}
          tags={tags}
          activeTagId={activeTagId}
          onSelect={onSelect}
          onDelete={onDelete}
          depth={depth}
        />
      ))}
    </>
  );
}

function TagNode({
  tag,
  tags,
  activeTagId,
  onSelect,
  onDelete,
  depth,
}: {
  tag: TagItem;
  tags: TagItem[];
  activeTagId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  depth: number;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = activeTagId === tag.id;
  const dotColor = tag.color || "#737373";
  const hasChildren = tags.some((t) => t.parent_id === tag.id);

  return (
    <>
      <div
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
          isActive
            ? "bg-yellow-400/10 text-yellow-400"
            : "text-white/70 hover:bg-neutral-800/60 hover:text-white"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(tag.id)}
      >
        {/* Colored dot */}
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />

        {/* Tag name */}
        <span className={`flex-1 truncate text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
          {tag.name}
        </span>

        {/* Delete button on hover */}
        {hovered && (
          <button
            className="p-0.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tag.id);
            }}
            title="Delete tag"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Nested children */}
      {hasChildren && (
        <TagLevel
          tags={tags}
          parentId={tag.id}
          activeTagId={activeTagId}
          onSelect={onSelect}
          onDelete={onDelete}
          depth={depth + 1}
        />
      )}
    </>
  );
}
