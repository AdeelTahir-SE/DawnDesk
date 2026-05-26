import { useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";

interface TableBlockProps {
  data: string[][];
  onChange: (data: string[][]) => void;
}

export default function TableBlock({ data, onChange }: TableBlockProps) {
  const rows = data.length;
  const cols = data[0]?.length ?? 0;

  const updateCell = useCallback(
    (row: number, col: number, value: string) => {
      const next = data.map((r) => [...r]);
      next[row][col] = value;
      onChange(next);
    },
    [data, onChange]
  );

  const addRow = useCallback(() => {
    const newRow = Array(cols).fill("");
    onChange([...data, newRow]);
  }, [data, cols, onChange]);

  const addColumn = useCallback(() => {
    const next = data.map((row) => [...row, ""]);
    onChange(next);
  }, [data, onChange]);

  const deleteRow = useCallback(
    (index: number) => {
      if (rows <= 1) return;
      const next = data.filter((_, i) => i !== index);
      onChange(next);
    },
    [data, rows, onChange]
  );

  const deleteColumn = useCallback(
    (index: number) => {
      if (cols <= 1) return;
      const next = data.map((row) => row.filter((_, i) => i !== index));
      onChange(next);
    },
    [data, cols, onChange]
  );

  if (cols === 0) return null;

  return (
    <div className="group/table my-3 overflow-x-auto rounded-xl border border-neutral-800">
      <table className="w-full border-collapse">
        {/* Column delete buttons (visible on hover) */}
        <thead>
          {/* Delete column row */}
          <tr className="opacity-0 transition-opacity group-hover/table:opacity-100">
            <th className="w-8" />
            {Array.from({ length: cols }).map((_, colIdx) => (
              <th key={colIdx} className="px-1 py-1">
                {cols > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteColumn(colIdx)}
                    className="mx-auto flex h-5 w-5 items-center justify-center rounded text-white/20 transition-colors hover:bg-red-400/10 hover:text-red-400"
                    title="Delete column"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </th>
            ))}
            <th className="w-8" />
          </tr>

          {/* Header row */}
          <tr className="border-b border-neutral-800 bg-neutral-900/60">
            <td className="w-8" />
            {data[0]?.map((cell, colIdx) => (
              <td
                key={colIdx}
                className="border-r border-neutral-800 last:border-r-0"
              >
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateCell(0, colIdx, e.currentTarget.textContent ?? "")
                  }
                  className="min-w-[80px] px-3 py-2 text-sm font-bold text-white outline-none focus:bg-yellow-400/5"
                >
                  {cell}
                </div>
              </td>
            ))}
            {/* Add column button */}
            <td className="w-8 opacity-0 transition-opacity group-hover/table:opacity-100">
              <button
                type="button"
                onClick={addColumn}
                className="flex h-full w-8 items-center justify-center text-white/20 transition-colors hover:text-yellow-400"
                title="Add column"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>
        </thead>

        <tbody>
          {data.slice(1).map((row, rowIdx) => {
            const actualRowIdx = rowIdx + 1;
            return (
              <tr
                key={actualRowIdx}
                className={`group/row border-b border-neutral-800 last:border-b-0 transition-colors ${
                  rowIdx % 2 === 0 ? "bg-neutral-950/40" : "bg-neutral-950/20"
                }`}
              >
                {/* Delete row button */}
                <td className="w-8 opacity-0 transition-opacity group-hover/row:opacity-100">
                  {rows > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteRow(actualRowIdx)}
                      className="flex h-full w-8 items-center justify-center text-white/20 transition-colors hover:text-red-400"
                      title="Delete row"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </td>

                {row.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className="border-r border-neutral-800 last:border-r-0"
                  >
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        updateCell(
                          actualRowIdx,
                          colIdx,
                          e.currentTarget.textContent ?? ""
                        )
                      }
                      className="min-w-[80px] px-3 py-2 text-sm text-white/80 outline-none focus:bg-yellow-400/5"
                    >
                      {cell}
                    </div>
                  </td>
                ))}

                <td className="w-8" />
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Add row button */}
      <div className="flex opacity-0 transition-opacity group-hover/table:opacity-100">
        <button
          type="button"
          onClick={addRow}
          className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-white/20 transition-colors hover:bg-neutral-900/60 hover:text-yellow-400"
          title="Add row"
        >
          <Plus className="h-3.5 w-3.5" />
          Add row
        </button>
      </div>
    </div>
  );
}
