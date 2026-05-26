import { useState, useRef, useCallback } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  priority?: "high" | "medium" | "low";
  dueDate?: string;
  indent?: number;
}

interface ChecklistBlockProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

const priorityConfig = {
  high: { color: "bg-red-400", label: "High" },
  medium: { color: "bg-yellow-400", label: "Medium" },
  low: { color: "bg-green-400", label: "Low" },
};

export default function ChecklistBlock({ items, onChange }: ChecklistBlockProps) {
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const completedCount = items.filter((i) => i.checked).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const toggleItem = useCallback(
    (id: string) => {
      onChange(
        items.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
    },
    [items, onChange]
  );

  const updateText = useCallback(
    (id: string, text: string) => {
      onChange(
        items.map((item) =>
          item.id === id ? { ...item, text } : item
        )
      );
    },
    [items, onChange]
  );

  const deleteItem = useCallback(
    (id: string) => {
      onChange(items.filter((item) => item.id !== id));
    },
    [items, onChange]
  );

  const addItem = useCallback(() => {
    if (!newText.trim()) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newText.trim(),
      checked: false,
      indent: 0,
    };
    onChange([...items, newItem]);
    setNewText("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [newText, items, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  const indentItem = useCallback(
    (id: string, direction: 1 | -1) => {
      onChange(
        items.map((item) => {
          if (item.id !== id) return item;
          const current = item.indent ?? 0;
          const next = Math.max(0, Math.min(3, current + direction));
          return { ...item, indent: next };
        })
      );
    },
    [items, onChange]
  );

  return (
    <div className="my-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
            <span>
              {completedCount} of {items.length} completed
            </span>
            <span className="font-semibold text-yellow-400">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {items.map((item) => {
          const indent = item.indent ?? 0;
          return (
            <div
              key={item.id}
              className="group flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-800/40"
              style={{ paddingLeft: `${indent * 24 + 8}px` }}
            >
              {/* Drag handle */}
              <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-white/10 opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Checkbox */}
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  item.checked
                    ? "border-yellow-400 bg-yellow-400"
                    : "border-neutral-600 hover:border-yellow-400/50"
                }`}
              >
                {item.checked && (
                  <svg className="h-3 w-3 text-neutral-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Text */}
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateText(item.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    indentItem(item.id, e.shiftKey ? -1 : 1);
                  }
                }}
                className={`flex-1 bg-transparent text-sm outline-none transition-colors ${
                  item.checked
                    ? "text-white/30 line-through"
                    : "text-white/90"
                }`}
              />

              {/* Priority dot */}
              {item.priority && (
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityConfig[item.priority].color}`}
                  title={priorityConfig[item.priority].label}
                />
              )}

              {/* Due date */}
              {item.dueDate && (
                <span className="shrink-0 rounded-md bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-white/40">
                  {item.dueDate}
                </span>
              )}

              {/* Delete */}
              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                className="mt-0.5 shrink-0 text-white/10 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                title="Delete item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add new item */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={addItem}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-neutral-800 hover:text-yellow-400"
          title="Add item"
        >
          <Plus className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new item…"
          className="flex-1 bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20"
        />
      </div>
    </div>
  );
}
