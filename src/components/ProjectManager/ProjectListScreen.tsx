import { useState, useEffect } from "react";
import { pmGateway, DbUser, DbProject, DbProjectInvite } from "../../utils/supabase";
import { Plus, Layout, Users, Bell, Check, X, LogOut, Loader2 } from "lucide-react";

interface ProjectListScreenProps {
  currentUser: DbUser;
  onProjectSelect: (projectId: string) => void;
  onLogout: () => void;
}

export default function ProjectListScreen({ currentUser, onProjectSelect, onLogout }: ProjectListScreenProps) {
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [myInvites, setMyInvites] = useState<DbProjectInvite[]>([]);
  const [showInvites, setShowInvites] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjColor, setNewProjColor] = useState("#F7C948");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const projs = await pmGateway.getProjects();
    const mems = await Promise.all(projs.map(p => pmGateway.getProjectMembers(p.id)));
    const myProjs = projs.filter((p, i) => mems[i].some(m => m.userId === currentUser.id) && p.status === 'active');
    
    setProjects(myProjs);
    const invs = await pmGateway.getAllUserInvites(currentUser.email);
    setMyInvites(invs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setCreating(true);
    const newProj = await pmGateway.createProject(newProjName.trim(), newProjDesc.trim(), currentUser.id, newProjColor);
    setCreating(false);
    setIsModalOpen(false);
    onProjectSelect(newProj.id);
  };

  const handleInviteResponse = async (inviteId: string, status: 'accepted' | 'declined') => {
    await pmGateway.respondToInvite(inviteId, status, status === 'accepted' ? currentUser.id : undefined);
    loadData();
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in">
      
      {/* Header & User Profile */}
      <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-950 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${currentUser.avatarColor} flex items-center justify-center text-xl font-bold shadow-md border-2 border-white/10`}>
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-yellow-400 font-bold">Project Hub</p>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Welcome, {currentUser.name.split(' ')[0]}</h1>
            <p className="text-xs text-white/50 mt-1">{currentUser.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowInvites(!showInvites)} 
              className={`p-2.5 rounded-xl border transition-colors relative shadow-sm ${myInvites.length > 0 ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' : 'bg-neutral-900/60 border-neutral-800 text-white/60 hover:text-white'}`}
            >
              <Bell className="w-5 h-5" />
              {myInvites.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-neutral-950 animate-pulse" />}
            </button>
            
            {showInvites && (
              <div className="absolute top-12 right-0 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-3 z-50 animate-in slide-in-from-top-2">
                <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Pending Invites ({myInvites.length})</h4>
                {myInvites.length === 0 ? <p className="text-[10px] text-white/40">No pending invites right now.</p> : (
                  <div className="flex flex-col gap-2">
                    {myInvites.map(inv => (
                      <div key={inv.id} className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800/80 flex flex-col gap-2">
                        <span className="text-[10px] font-medium text-white/80">Invite to Project: <span className="text-white font-bold">{inv.projectId.split('-').pop()}</span></span>
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => handleInviteResponse(inv.id, 'accepted')} className="flex-1 py-1.5 rounded bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/30 flex items-center justify-center gap-1 transition-colors"><Check className="w-3 h-3" /> Accept</button>
                          <button onClick={() => handleInviteResponse(inv.id, 'declined')} className="flex-1 py-1.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/30 flex items-center justify-center gap-1 transition-colors"><X className="w-3 h-3" /> Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={onLogout} className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-white/60 hover:text-red-400 hover:border-red-400/30 transition-colors shadow-sm" title="Log Out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <section className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-white/50" /> Active Projects
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            
            {/* Create New Project Card */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group rounded-2xl border-2 border-dashed border-neutral-700 bg-neutral-900/20 p-6 flex flex-col items-center justify-center gap-3 min-h-[220px] hover:border-yellow-400 hover:bg-yellow-400/5 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-yellow-400/20 transition-all">
                <Plus className="w-6 h-6 text-white/50 group-hover:text-yellow-400 transition-colors" />
              </div>
              <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">Create New Project</span>
            </button>

            {/* Existing Projects */}
            {projects.map(p => (
              <button 
                key={p.id}
                onClick={() => onProjectSelect(p.id)}
                className="group flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-left hover:border-neutral-600 hover:shadow-xl transition-all h-full min-h-[220px] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: p.colorTag }} />
                
                <div className="flex-1">
                  <div className="w-8 h-8 rounded-lg shadow-sm mb-4 border border-white/10" style={{ backgroundColor: p.colorTag }} />
                  <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-white/50 mt-2 line-clamp-2 leading-relaxed">{p.description || "No description provided."}</p>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
                    <Users className="w-3.5 h-3.5" />
                    {p.members.length} {p.members.length === 1 ? 'Member' : 'Members'}
                  </div>
                  <span className="text-[10px] text-white/30 uppercase font-bold">
                    {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </button>
            ))}

          </div>
        )}
      </section>

      {/* CREATE PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Create Workspace</h2>
            <p className="text-xs text-white/50 mb-6">Set up your project. You can invite team members later.</p>
            
            <form onSubmit={handleCreateProject} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Project Name</label>
                <input type="text" value={newProjName} onChange={e=>setNewProjName(e.target.value)} placeholder="e.g. Website Redesign" className="bg-neutral-950/60 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-colors" required />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Description (Optional)</label>
                <textarea value={newProjDesc} onChange={e=>setNewProjDesc(e.target.value)} placeholder="Brief description..." className="bg-neutral-950/60 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-colors resize-none h-20" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Accent Color</label>
                <div className="flex gap-3 mt-1">
                  {["#F7C948", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"].map(c => (
                    <button key={c} type="button" onClick={() => setNewProjColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${newProjColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:bg-neutral-800 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="px-6 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-bold hover:bg-yellow-300 transition-colors shadow-md flex items-center gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
