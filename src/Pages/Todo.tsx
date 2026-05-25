import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { TodoItem } from "../utils/types";
import OnboardingWrapper from "../components/OnboardingWrapper";

export default function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function getTodo() {
    if (!("__TAURI_INTERNALS__" in window)) {
      console.warn("Tauri internals not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await invoke<TodoItem[]>("get_todo");
      console.log("Todo from Rust:", result);
      setTodos(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching todo:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getTodo();
  }, []);

  async function createTodo() {
    const title = newTitle.trim();
    if (!title) {
      setError("Title cannot be empty");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await invoke<string>("create_todo", { input: { title } });
      setNewTitle("");
      await getTodo();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : String(createError));
    } finally {
      setCreating(false);
    }
  }

  async function toggleTodo(id: number, completed?: boolean) {
    try {
      setError(null);
      await invoke<string>("update_todo", {
        id,
        updated: { completed: !completed },
      });
      await getTodo();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : String(updateError));
    }
  }

  async function renameTodo(id: number, currentTitle: string) {
    const nextTitle = window.prompt("Update todo title", currentTitle);
    if (nextTitle === null) {
      return;
    }

    const trimmed = nextTitle.trim();
    if (!trimmed) {
      setError("Title cannot be empty");
      return;
    }

    try {
      setError(null);
      await invoke<string>("update_todo", {
        id,
        updated: { title: trimmed },
      });
      await getTodo();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : String(updateError));
    }
  }


 async function deleteTodo(id: number) {
    if (!window.confirm("Are you sure you want to delete this todo?")) {
      return;
    }
    const result= await invoke<string>("delete_todo", { id })
    alert(result);
    await getTodo();
  }

  return (
    <OnboardingWrapper appKey="todo" title="Welcome to Todo" description="Get your tasks done efficiently.">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full  flex-col gap-4 p-8 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Todo</h1>
          <button
            className="rounded-lg border border-neutral-600 px-3 py-2 text-sm hover:bg-neutral-800"
            onClick={getTodo}
            type="button"
          >
            Refresh
          </button>
        </div>

        <div className="flex gap-2">
          <input
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Create a new todo"
            value={newTitle}
          />
          <button
            className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={creating}
            onClick={createTodo}
            type="button"
          >
            {creating ? "Creating..." : "Create Todo"}
          </button>
        </div>

        {loading && (
          <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-4 text-sm text-white/70">
            Loading todos...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && todos.length === 0 && (
          <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-6 text-center text-white/70">
            No todos yet.
          </div>
        )}

        {!loading && !error && todos.length > 0 && (
          <div className="flex flex-col gap-3">
            {todos.map((todo, index) => (
              <TodoCard
                key={`${todo.id}-${index}`}
                id={todo.id}
                title={todo.title}
                completed={todo.completed}
                onToggle={toggleTodo}
                onRename={renameTodo}
                onDelete={deleteTodo}
              />
            ))}
          </div>
        )}
      </div>
    </OnboardingWrapper>
  );
}

function TodoCard({
  id,
  title,
  completed,
  onToggle,
  onRename,
  onDelete,
}: {
  id: number;
  title: string;
  completed?: boolean;
  onToggle?: (id: number, completed?: boolean) => void;
  onRename?: (id: number, title: string) => void;
  onDelete?: (id:number) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-neutral-700 bg-neutral-900/50 p-4">
      <div className="min-w-0 flex-1 pr-1">
        <h3 className="text-base font-semibold text-white whitespace-normal [overflow-wrap:anywhere]">{title}</h3>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          className="rounded-md border border-neutral-600 px-2 py-1 text-xs hover:bg-neutral-800"
          onClick={() => onRename?.(id, title)}
          type="button"
        >
          Edit
        </button>
        <button
          className={`rounded-md px-2 py-1 text-xs ${
            completed
              ? "bg-green-500/20 text-green-300"
              : "bg-yellow-500/20 text-yellow-300"
          }`}
          onClick={() => onToggle?.(id, completed)}
          type="button"
        >
          {completed ? "Done" : "Pending"}
        </button>
        <button onClick={() => onDelete?.(id)} type="button" className="text-white/50 hover:text-white transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
