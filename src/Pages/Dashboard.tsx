
import { Link } from "react-router-dom";

type KPI = {
    label: string;
    value: string;
    change: string;
};

type Activity = {
    title: string;
    time: string;
};

type StorageType = {
    name: string;
    percent: number;
};

const kpis: KPI[] = [
    { label: "Total Files", value: "1,248", change: "+4.2%" },
    { label: "Storage Used", value: "38.6 GB", change: "+1.1 GB" },
    { label: "Tasks Today", value: "27", change: "+8" },
    { label: "Active Tools", value: "6", change: "All healthy" },
];

const quickActions = [
    { label: "Open Photo Editor", to: "/photo-editor" },
    { label: "Open Video Editor", to: "/video-editor" },
    { label: "Open PDF Tools", to: "/pdf-tools" },
    { label: "Open AI Workspace", to: "/ai" },
];

const activities: Activity[] = [
    { title: "Exported " + "Campaign Reel.mp4", time: "12 min ago" },
    { title: "Merged 3 files in PDF Tools", time: "43 min ago" },
    { title: "Updated " + "Landing Draft.png", time: "1 hr ago" },
    { title: "Ran AI summary for notes", time: "2 hr ago" },
    { title: "Archived " + "Q1 Assets.zip", time: "Today" },
];

const storageBreakdown: StorageType[] = [
    { name: "Images", percent: 39 },
    { name: "Videos", percent: 34 },
    { name: "PDFs", percent: 18 },
    { name: "Other", percent: 9 },
];

const weeklyUsage = [52, 66, 61, 74, 69, 84, 72];

const pinnedItems = [
    "Brand Kit / 2026",
    "Launch Plan / Spring",
    "Client Notes / Aster",
    "Draft Motion Assets",
];

export default function Dashboard() {
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

                <div className="xl:col-span-4 space-y-4">
                    <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
                        <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
                        <div className="mt-4 grid grid-cols-1 gap-2">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.label}
                                    to={action.to}
                                    className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-neutral-800"
                                >
                                    {action.label}
                                </Link>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
                        <h2 className="text-lg font-semibold text-white">Storage Snapshot</h2>
                        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-neutral-800">
                            <div className="h-full w-[68%] rounded-full bg-yellow-400" />
                        </div>
                        <p className="mt-2 text-xs text-white/60">68% used of 56 GB</p>

                        <ul className="mt-4 space-y-2">
                            {storageBreakdown.map((item) => (
                                <li key={item.name} className="flex items-center justify-between text-sm">
                                    <span className="text-white/80">{item.name}</span>
                                    <span className="text-white/60">{item.percent}%</span>
                                </li>
                            ))}
                        </ul>
                    </article>

                    <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
                        <h2 className="text-lg font-semibold text-white">Pinned Items</h2>
                        <ul className="mt-4 space-y-2">
                            {pinnedItems.map((name) => (
                                <li key={name} className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white/85">
                                    {name}
                                </li>
                            ))}
                        </ul>
                    </article>
                </div>
            </section>
        </div>
    );
}