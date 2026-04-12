import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useMemo, useState } from "react";

type RecommendedModel = {
    model_name: string;
    file_url: string;
    note: string;
};

type ChatThread = {
    id: number;
    title: string;
    model_name: string;
    updated_at: string;
};

type ChatMessage = {
    id: number;
    chat_id: number;
    role: string;
    content: string;
    created_at: string;
};

type DownloadProgress = {
    model_name: string;
    downloaded_bytes: number;
    total_bytes?: number;
    percent?: number;
};

export default function AI() {
    const isTauri = "__TAURI_INTERNALS__" in window;
    const [models, setModels] = useState<string[]>([]);
    const [recommended, setRecommended] = useState<RecommendedModel[]>([]);
    const [selectedModel, setSelectedModel] = useState("");

    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
    const [downloadPercent, setDownloadPercent] = useState<number>(0);

    const activeThread = useMemo(
        () => threads.find((t) => t.id === activeChatId) ?? null,
        [threads, activeChatId]
    );

    async function loadModelsAndRecommended() {
        const [available, curated] = await Promise.all([
            invoke<string[]>("ai_list_models"),
            invoke<RecommendedModel[]>("ai_recommended_models"),
        ]);

        const merged = Array.from(new Set([...(available ?? []), ...(curated ?? []).map((m) => m.model_name)]));
        setModels(merged);
        setRecommended(curated ?? []);
        if (!selectedModel && merged.length > 0) {
            setSelectedModel(merged[0]);
        }
    }

    async function loadThreads() {
        const rows = await invoke<ChatThread[]>("ai_list_chats");
        setThreads(rows ?? []);
        if ((rows ?? []).length > 0 && activeChatId === null) {
            setActiveChatId(rows[0].id);
        }
    }

    async function loadMessages(chatId: number) {
        const rows = await invoke<ChatMessage[]>("ai_get_chat_messages", { chatId: chatId });
        setMessages(rows ?? []);
    }

    useEffect(() => {
        if (!isTauri) {
            return;
        }

        let unlistenProgress: (() => void) | undefined;
        let unlistenComplete: (() => void) | undefined;

        (async () => {
            try {
                await loadModelsAndRecommended();
                await loadThreads();

                unlistenProgress = await listen<DownloadProgress>("ai://download-progress", (event) => {
                    const payload = event.payload;
                    setDownloadingModel(payload.model_name);
                    setDownloadPercent(payload.percent ?? 0);
                });

                unlistenComplete = await listen<DownloadProgress>("ai://download-complete", () => {
                    setDownloadingModel(null);
                    setDownloadPercent(100);
                    void loadModelsAndRecommended();
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            }
        })();

        return () => {
            if (unlistenProgress) {
                unlistenProgress();
            }
            if (unlistenComplete) {
                unlistenComplete();
            }
        };
    }, []);

    useEffect(() => {
        if (activeChatId !== null && isTauri) {
            void loadMessages(activeChatId);
        }
    }, [activeChatId]);

    async function createChat() {
        if (!selectedModel.trim()) {
            setError("Select a model first.");
            return;
        }

        const id = await invoke<number>("ai_create_chat", {
            input: {
                title: `Chat ${new Date().toLocaleTimeString()}`,
                modelName: selectedModel,
            },
        });
        await loadThreads();
        setActiveChatId(id);
    }

    async function sendMessage() {
        const prompt = input.trim();
        if (!prompt || busy) {
            return;
        }
        if (activeChatId === null) {
            await createChat();
        }

        const targetChatId = activeChatId ?? (await invoke<number>("ai_create_chat", {
            input: { title: `Chat ${new Date().toLocaleTimeString()}`, modelName: selectedModel },
        }));
        if (activeChatId === null) {
            setActiveChatId(targetChatId);
        }

        setBusy(true);
        setError(null);
        const optimistic: ChatMessage = {
            id: Date.now(),
            chat_id: targetChatId,
            role: "user",
            content: prompt,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setInput("");

        try {
            const response = await invoke<string>("ai_send_chat_message", {
                chatId: targetChatId,
                modelName: selectedModel,
                prompt,
            });
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    chat_id: targetChatId,
                    role: "assistant",
                    content: response,
                    created_at: new Date().toISOString(),
                },
            ]);
            await loadThreads();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }

    async function downloadRecommended(item: RecommendedModel) {
        try {
            setError(null);
            setDownloadingModel(item.model_name);
            await invoke<string>("ai_download_model", {
                modelLink: item.file_url,
                modelName: item.model_name,
            });
            setSelectedModel(item.model_name);
            await loadModelsAndRecommended();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setDownloadingModel(null);
        }
    }

    if (!isTauri) {
        return <div className="p-8 text-white">Run this page in Tauri: npm run tauri dev</div>;
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden text-white">
            <aside className="w-80 shrink-0 border-r border-neutral-800 bg-neutral-950 p-4">
                <button
                    type="button"
                    onClick={createChat}
                    className="w-full rounded-lg bg-yellow-400 px-3 py-2 text-sm font-semibold text-black"
                >
                    + New Chat
                </button>

                <div className="mt-4">
                    <label className="mb-2 block text-xs text-white/60">Model</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                    >
                        {models.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-4 space-y-2">
                    <p className="text-xs text-white/60">Download models</p>
                    {recommended.map((item) => (
                        <button
                            key={item.model_name}
                            type="button"
                            onClick={() => downloadRecommended(item)}
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-left text-sm hover:bg-neutral-800"
                        >
                            <div className="font-medium">{item.model_name}</div>
                            <div className="text-xs text-white/60">{item.note}</div>
                        </button>
                    ))}
                </div>

                {downloadingModel && (
                    <div className="mt-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3">
                        <p className="text-xs text-yellow-300">Downloading {downloadingModel}</p>
                        <div className="mt-2 h-2 w-full rounded bg-neutral-800">
                            <div className="h-2 rounded bg-yellow-400" style={{ width: `${Math.max(0, Math.min(100, downloadPercent))}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-white/70">{downloadPercent.toFixed(1)}%</p>
                    </div>
                )}

                <div className="mt-4 space-y-2 overflow-y-auto">
                    {threads.map((chat) => (
                        <button
                            key={chat.id}
                            type="button"
                            onClick={() => setActiveChatId(chat.id)}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                                activeChatId === chat.id
                                    ? "border-yellow-400/60 bg-yellow-400/10"
                                    : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                            }`}
                        >
                            <div className="font-medium text-white/90">{chat.title}</div>
                            <div className="text-xs text-white/60">{chat.model_name}</div>
                        </button>
                    ))}
                </div>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col bg-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-3">
                    <h1 className="text-lg font-semibold">{activeThread?.title ?? "AI Chat"}</h1>
                    <span className="text-xs text-white/60">Model: {selectedModel || "none"}</span>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                                    message.role === "user"
                                        ? "self-end bg-yellow-400 text-black"
                                        : "self-start border border-neutral-700 bg-neutral-950 text-white"
                                }`}
                            >
                                {message.content}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-neutral-800 px-6 py-4">
                    <div className="mx-auto flex w-full max-w-3xl items-end gap-3">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    void sendMessage();
                                }
                            }}
                            placeholder="Message AI..."
                            className="max-h-32 min-h-12 flex-1 resize-y rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-yellow-400"
                        />
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void sendMessage()}
                            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                        >
                            {busy ? "Sending..." : "Send"}
                        </button>
                    </div>
                    {error && <p className="mx-auto mt-2 w-full max-w-3xl text-xs text-red-300">{error}</p>}
                </div>
            </main>
        </div>
    );
}