import { Link } from "react-router-dom";
export default function Sidebar() {


    return (
        <aside className="fixed top-16 left-0 bottom-0 w-64 bg-neutral-900 border-r border-neutral-800 p-4 z-20">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40 mb-4">Workspace</div>
            <nav className="space-y-2">
                <SidebarLink icon="/sidebar/dashboard.svg" label="Dashboard" to="/dashboard" />
                <SidebarLink icon="/sidebar/photo_editor.svg" label="Photo Editor" to="/photo-editor" />
                <SidebarLink icon="/sidebar/video_editor.svg" label="Video Editor" to="/video-editor" />
                <SidebarLink icon="/sidebar/ai.svg" label="AI" to="/ai" />
                <SidebarLink icon="/sidebar/storage.svg" label="Storage" to="/storage" />
                <SidebarLink icon="/sidebar/settings.svg" label="Settings" to="/settings" />
            </nav>
        </aside>
    );
}

function SidebarLink({icon,label,to}:{icon:string,label:string,to:string}){
    return(
        <Link className="flex flex-row items-center justify-center gap-2 " to={to}>
            <img src={icon} alt={`${label} icon`} className="w-5 h-5" />
            <span className="text-sm font-medium">{label}</span>
        </Link>
    )}