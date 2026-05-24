
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useState,useEffect } from "react";
import { TodoItem } from "../utils/types";
type KPI = {
    label: string;
    value: string;
    change: string;
};

type Activity = {
    title: string;
    time: string;
};

const kpis: KPI[] = [
    { label: "Active Tasks", value: "12", change: "5 high priority" },
    { label: "Projects Completed", value: "24", change: "+3 this week" },
    { label: "AI Requests Today", value: "48", change: "100% success rate" },
    { label: "Active Tools", value: "4", change: "All online" },
];



const activities: Activity[] = [
    { title: "Exported " + "Campaign Reel.mp4", time: "12 min ago" },
    { title: "Cleaned up system workspace", time: "43 min ago" },
    { title: "Updated " + "Landing Draft.png", time: "1 hr ago" },
    { title: "Ran AI summary for notes", time: "2 hr ago" },
    { title: "Archived " + "Q1 Assets.zip", time: "Today" },
];

const weeklyUsage = [52, 66, 61, 74, 69, 84, 72];


    

export default function Dashboard() {

    const [pendingTodos, setPendingTodos] = useState<TodoItem[]>([]);
    async function getPendingTodos(){
    try {
        const result = await invoke<TodoItem[]>("get_pending_todos");
        console.log("Pending todos from Rust:", result);
        setPendingTodos(result);
    } catch (error) {
        console.error("Error fetching pending todos:", error);
    }
}
useEffect(() => {
    getPendingTodos();
}, []);

    return (
        <div className="p-8 mx-auto w-full max-w-7xl space-y-6">
            <section className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-950 p-5 sm:p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-yellow-400">Dashboard</p>
                <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Welcome back to DawnDesk</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/60 sm:text-base">
                    Monitor your workflow, jump into tools quickly, and keep track of current activity from one place.
                </p>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((item) => (
                    <article key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                        <p className="text-sm text-white/60">{item.label}</p>
                        <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                        <p className="mt-2 text-xs font-semibold text-yellow-300">{item.change}</p>
                    </article>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="xl:col-span-8 space-y-4">

                            <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <h2 className="text-lg font-semibold text-white">Latest Pending Tasks</h2>
                                                        <p className="mt-1 text-xs text-white/50">Track your newest todo items at a glance</p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                                                            {pendingTodos.length} items
                                                        </span>
                                                        <Link
                                                            to="/todo"
                                                            className="rounded-full border border-neutral-700 px-3 py-1 text-xs font-semibold text-white/80 transition-colors hover:bg-neutral-800 hover:text-white"
                                                        >
                                                            Open Todo
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950/60">
                                                    {pendingTodos && pendingTodos.length > 0 ? (
                                                        <ul className="divide-y divide-neutral-800">
                                                            {pendingTodos.map((item) => (
                                                                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm font-medium text-white/90">{item.title}</p>
                                                                        <p className="mt-1 text-xs text-white/45">Task #{item.id}</p>
                                                                    </div>

                                                                    <span
                                                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                            item.completed
                                                                                ? "bg-green-500/10 text-green-300"
                                                                                : "bg-yellow-500/10 text-yellow-300"
                                                                        }`}
                                                                    >
                                                                        {item.completed ? "Completed" : "Pending"}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div className="px-4 py-6 text-sm text-white/60">
                                                            No pending tasks right now. Create one from the Todo page to keep track of it here.
                                                        </div>
                                                    )}
                                                </div>
                                        </article>
                    <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Productivity (7 Days)</h2>
                            <span className="text-xs text-white/50">Sessions completed</span>
                        </div>

                        <div className="mt-5 flex h-40 items-end justify-between gap-2">
                            {weeklyUsage.map((value, index) => (
                                <div key={index} className="flex w-full flex-col items-center gap-2">
                                    <div
                                        className="w-full rounded-t-md bg-yellow-400/90"
                                        style={{ height: `${value}%` }}
                                    />
                                    <span className="text-xs text-white/50">D{index + 1}</span>
                                </div>
                            ))}
                        </div>
                    </article>

                    
                </div>

                <div className="xl:col-span-4 space-y-4">
                    

                    <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
                        <h2 className="text-lg font-semibold text-white">Quick Tools</h2>
                        <p className="mt-1 text-xs text-white/50">Jump straight into your active tools</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <Link to="/todo" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <img src="/sidebar/todo.svg" alt="Todo" className="h-6 w-6 filter invert brightness-75 group-hover:brightness-100 transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">Tasks</span>
                            </Link>
                            <Link to="/photo-editor" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <img src="/sidebar/photo-editor.svg" alt="Photo" className="h-6 w-6 filter invert brightness-75 group-hover:brightness-100 transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">Photo Editor</span>
                            </Link>
                            <Link to="/video-editor" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <img src="/sidebar/video-editor.svg" alt="Video" className="h-6 w-6 filter invert brightness-75 group-hover:brightness-100 transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">Video Editor</span>
                            </Link>
                            <Link to="/ai" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <img src="/sidebar/ai.svg" alt="AI" className="h-6 w-6 filter invert brightness-75 group-hover:brightness-100 transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">AI Assistant</span>
                            </Link>
                        </div>
                    </article>
                                  <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
                        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                        <ul className="mt-4 space-y-3">
                            {activities.map((item) => (
                                <li key={item.title} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
                                    <span className="text-sm text-white/85">{item.title}</span>
                                    <span className="text-xs text-white/50">{item.time}</span>
                                </li>
                            ))}
                        </ul>
                    </article>  

                   
                </div>
            </section>
        </div>
    );
}