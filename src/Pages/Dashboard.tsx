import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useState,useEffect } from "react";
import { ListTodo, Image as ImageIcon, Video, Terminal, FolderKanban, Wrench, Workflow } from "lucide-react";
import { TodoItem } from "../utils/types";
import { readTextFile, BaseDirectory, exists } from '@tauri-apps/plugin-fs';
import { useAppLogger, LogEntry } from "../utils/LoggerContext";

type KPI = {
    label: string;
    value: string;
    change: string;
};

const kpis: KPI[] = [
    { label: "Active Tasks", value: "12", change: "5 high priority" },
    { label: "Projects Completed", value: "24", change: "+3 this week" },
    { label: "AI Requests Today", value: "48", change: "100% success rate" },
    { label: "Active Tools", value: "6", change: "All online" },
];

const weeklyUsage = [52, 66, 61, 74, 69, 84, 72];


    

export default function Dashboard() {

    const [pendingTodos, setPendingTodos] = useState<TodoItem[]>([]);
    const { logs } = useAppLogger();
    const [activities, setActivities] = useState<LogEntry[]>([]);

    async function loadLogs() {
        try {
            const hasLog = await exists('dawndesk_activity.log', { baseDir: BaseDirectory.AppLocalData });
            if (!hasLog) return;
            const content = await readTextFile('dawndesk_activity.log', { baseDir: BaseDirectory.AppLocalData });
            const lines = content.trim().split('\n').filter(l => l.trim() !== '' && l.startsWith('['));
            const parsed = lines.map(line => {
                const timestampMatch = line.match(/^\[(.*?)\]/);
                const levelMatch = line.match(/^\[.*?\] \[(.*?)\]/);
                
                const time = timestampMatch ? new Date(timestampMatch[1]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time';
                const level = levelMatch ? levelMatch[1].toLowerCase() as any : 'info';
                
                const rest = line.replace(/^\[.*?\] \[(.*?)\] /, '');
                const [action, ...msgParts] = rest.split(' - ');
                const message = msgParts.join(' - ');

                return { timestamp: timestampMatch ? timestampMatch[1] : '', action, level, message, time };
            }).reverse().slice(0, 50);
            
            // Merge with state logs, avoiding duplicates based on timestamp
            const fileLogs = parsed as any[];
            setActivities(fileLogs);
        } catch (err) {
            console.error('Failed to load logs in dashboard', err);
        }
    }

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
    loadLogs();
}, []);

    return (
        <div className="p-8 mx-auto w-full max-w-7xl space-y-6">
            <section className="dd-hero">
                <p className="dd-label">Dashboard</p>
                <h1 className="mt-2 dd-page-title">Welcome back to DawnDesk</h1>
                <p className="mt-2 max-w-2xl dd-body-lg">
                    Monitor your workflow, jump into tools quickly, and keep track of current activity from one place.
                </p>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((item) => (
                    <article key={item.label} className="dd-card">
                        <p className="dd-body">{item.label}</p>
                        <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                        <p className="mt-2 text-xs font-semibold text-yellow-300">{item.change}</p>
                    </article>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="xl:col-span-8 space-y-4">

                            <article className="dd-card">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <h2 className="dd-section-title">Latest Pending Tasks</h2>
                                                        <p className="mt-1 dd-subtext">Track your newest todo items at a glance</p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="dd-badge">
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
                                                                        <p className="mt-1 dd-subtext">Task #{item.id}</p>
                                                                    </div>

                                                                    <span
                                                                        className={`shrink-0 ${
                                                                            item.completed
                                                                                ? "dd-chip-success"
                                                                                : "dd-chip-warning"
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
                    <article className="dd-card">
                        <div className="flex items-center justify-between">
                            <h2 className="dd-section-title">Productivity (7 Days)</h2>
                            <span className="dd-subtext">Sessions completed</span>
                        </div>

                        <div className="mt-5 flex h-40 items-end justify-between gap-2">
                            {weeklyUsage.map((value, index) => (
                                <div key={index} className="flex w-full flex-col items-center gap-2">
                                    <div
                                        className="w-full rounded-t-md bg-yellow-400/90"
                                        style={{ height: `${value}%` }}
                                    />
                                    <span className="dd-subtext">D{index + 1}</span>
                                </div>
                            ))}
                        </div>
                    </article>

                    
                </div>

                <div className="xl:col-span-4 space-y-4">
                    

                    <article className="dd-card">
                        <h2 className="dd-section-title">Quick Tools</h2>
                        <p className="mt-1 dd-subtext">Jump straight into your active tools</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <Link to="/todo" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <ListTodo className="h-6 w-6 text-white/75 group-hover:text-white transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">Tasks</span>
                            </Link>
                            <Link to="/photo-editor" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <ImageIcon className="h-6 w-6 text-white/75 group-hover:text-white transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">Photo Editor</span>
                            </Link>
                            <Link to="/video-editor" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <Video className="h-6 w-6 text-white/75 group-hover:text-white transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">Video Editor</span>
                            </Link>
                            <Link to="/prompts" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <Terminal className="h-6 w-6 text-white/75 group-hover:text-white transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">Prompts</span>
                            </Link>
                            <Link to="/project-manager" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <FolderKanban className="h-6 w-6 text-white/75 group-hover:text-white transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">Projects</span>
                            </Link>
                            <Link to="/dev-tools" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <Wrench className="h-6 w-6 text-white/75 group-hover:text-white transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">Dev Tools</span>
                            </Link>
                            <Link to="/workflow" className="flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-800/50 transition-colors text-center group">
                                <Workflow className="h-6 w-6 text-white/75 group-hover:text-white transition-all" />
                                <span className="mt-2 text-xs font-semibold text-white/80 group-hover:text-yellow-300">Workflow</span>
                            </Link>
                        </div>
                    </article>
                    <article className="dd-card">
                        <div className="flex items-center justify-between">
                            <h2 className="dd-section-title">Recent Activity</h2>
                            <button 
                                onClick={loadLogs}
                                className="text-xs text-yellow-300 hover:text-yellow-400"
                            >
                                Refresh
                            </button>
                        </div>
                        <ul className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {[...logs, ...activities].filter((v,i,a) => a.findIndex(t=>(t.timestamp === v.timestamp)) === i).length > 0 ? 
                                [...logs, ...activities].filter((v,i,a) => a.findIndex(t=>(t.timestamp === v.timestamp)) === i).slice(0,50).map((item, index) => (
                                <li key={index} className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/85 truncate font-medium">{item.action}</span>
                                        <span className="dd-subtext shrink-0 text-[10px] uppercase text-yellow-500/70">{item.level}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-white/60 truncate">{item.message}</span>
                                        <span className="dd-subtext shrink-0 ml-2">
                                            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                        </span>
                                    </div>
                                </li>
                            )) : (
                                <div className="text-sm text-white/50 text-center py-4">No recent activity</div>
                            )}
                        </ul>
                    </article>  

                   
                </div>
            </section>
        </div>
    );
}
