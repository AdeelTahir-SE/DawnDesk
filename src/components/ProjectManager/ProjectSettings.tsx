import React, { useState, useEffect } from "react";
import { pmGateway, DbProject, DbUser, DbProjectMember, DbProjectInvite } from "../../utils/supabase";
import { UserMinus, UserPlus, Settings2, Trash2 } from "lucide-react";

interface ProjectSettingsProps {
  projectId: string;
  currentUser: DbUser;
  onProjectDeleted: () => void;
}

export default function ProjectSettings({ projectId, currentUser, onProjectDeleted }: ProjectSettingsProps) {
  const [project, setProject] = useState<DbProject | null>(null);
  const [members, setMembers] = useState<(DbProjectMember & { user?: DbUser })[]>([]);
  const [invites, setInvites] = useState<DbProjectInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    const [projs, mems, invs, users] = await Promise.all([
      pmGateway.getProjects(),
      pmGateway.getProjectMembers(projectId),
      pmGateway.getProjectInvites(projectId),
      pmGateway.getRegisteredUsers()
    ]);
    setProject(projs.find(p => p.id === projectId) || null);
    setMembers(mems.map(m => ({ ...m, user: users.find(u => u.id === m.userId) })));
    setInvites(invs.filter(i => i.status === 'pending'));
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  if (!project) return <div className="p-4 text-white/50">Loading settings...</div>;

  const currentMemberInfo = members.find(m => m.userId === currentUser.id);
  const isOwner = currentMemberInfo?.role === 'Owner';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!inviteEmail.trim()) return;

    if (members.length + invites.length >= 5) {
      setErrorMsg("A project can have a maximum of 5 members including pending invites.");
      return;
    }

    const email = inviteEmail.trim().toLowerCase();
    
    if (members.some(m => m.user?.email.toLowerCase() === email)) {
      setErrorMsg("User is already a member.");
      return;
    }
    
    if (invites.some(i => i.email === email)) {
      setErrorMsg("An invite is already pending for this email.");
      return;
    }

    await pmGateway.createInvite(projectId, email, currentUser.id);
    setInviteEmail("");
    loadData();
  };

  const handleRemoveMember = async (userId: string) => {
    if (userId === currentUser.id) {
      if (confirm("Are you sure you want to leave this project?")) {
        await pmGateway.removeProjectMember(projectId, userId);
        onProjectDeleted(); 
      }
    } else {
      if (confirm("Remove this member from the project?")) {
        await pmGateway.removeProjectMember(projectId, userId);
        loadData();
      }
    }
  };

  const handleRoleChange = async (userId: string, role: any) => {
    await pmGateway.updateMemberRole(projectId, userId, role);
    loadData();
  };

  const handleArchive = async () => {
    const newStatus = project.status === 'active' ? 'archived' : 'active';
    await pmGateway.updateProject(projectId, { status: newStatus });
    loadData();
  };

  const handleDelete = async () => {
    const confirmName = prompt(`Type "${project.name}" to confirm permanent deletion:`);
    if (confirmName === project.name) {
      await pmGateway.deleteProject(projectId);
      onProjectDeleted();
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto p-4 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-yellow-400" />
          Project Settings
        </h2>
        {project.status === 'archived' && (
          <span className="px-3 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
            Archived
          </span>
        )}
      </div>

      {/* Members Section */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white border-b border-neutral-800 pb-2">Team Members ({members.length}/5)</h3>
        
        <div className="flex flex-col gap-3">
          {members.map(m => {
            const isMe = m.userId === currentUser.id;
            return (
              <div key={m.userId} className="flex items-center justify-between p-3 rounded-xl border border-neutral-800/80 bg-neutral-950/40">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${m.user?.avatarColor || 'from-neutral-600 to-neutral-700'} flex items-center justify-center text-[10px] font-bold text-white shadow-md`}>
                    {m.user?.name.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      {m.user?.name} {isMe && <span className="text-[9px] bg-neutral-800 px-1.5 rounded text-white/50">You</span>}
                    </div>
                    <div className="text-[10px] text-white/40">{m.user?.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {isOwner && !isMe ? (
                    <select 
                      value={m.role} 
                      onChange={e => handleRoleChange(m.userId, e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-yellow-400/50"
                    >
                      <option value="Owner">Owner</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="text-[10px] font-bold text-yellow-400/80 px-2 py-1 rounded bg-yellow-400/10 border border-yellow-400/20">
                      {m.role}
                    </span>
                  )}

                  {(isOwner || isMe) && (
                    <button 
                      onClick={() => handleRemoveMember(m.userId)}
                      className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-white/50 hover:text-red-400 hover:border-red-400/50 transition-colors"
                      title={isMe ? "Leave Project" : "Remove Member"}
                    >
                      {isMe ? <UserMinus className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-white/60">Pending Invites</h4>
            {invites.map(i => (
              <div key={i.id} className="flex items-center justify-between p-2 rounded-lg border border-neutral-800/50 bg-neutral-950/20 text-xs">
                <span className="text-white/60 italic">{i.email}</span>
                <span className="text-[9px] text-yellow-400 px-2 py-0.5 rounded border border-yellow-400/20 bg-yellow-400/10">Pending</span>
              </div>
            ))}
          </div>
        )}

        {/* Invite Form */}
        {isOwner && members.length + invites.length < 5 && (
          <form onSubmit={handleInvite} className="mt-4 pt-4 border-t border-neutral-800 flex gap-2">
            <input 
              type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
              placeholder="Enter email address to invite..."
              className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-xs text-white outline-none focus:border-yellow-400/50"
              required
            />
            <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-black hover:bg-yellow-300">
              <UserPlus className="w-4 h-4" /> Invite
            </button>
          </form>
        )}
        {errorMsg && <p className="text-xs text-red-400 mt-2">{errorMsg}</p>}
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-red-400 border-b border-red-500/20 pb-2">Danger Zone</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Archive Project</span>
              <span className="text-[10px] text-white/50 max-w-sm mt-1">Archived projects are hidden from the main list but their data is preserved. You can restore them later.</span>
            </div>
            <button onClick={handleArchive} className="px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-xs font-bold text-white hover:bg-neutral-700 transition-colors">
              {project.status === 'active' ? 'Archive Project' : 'Restore Project'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-red-500/20">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-red-400">Delete Project</span>
              <span className="text-[10px] text-white/50 max-w-sm mt-1">Permanently delete this project and all of its tasks, columns, and chat history. This action cannot be undone.</span>
            </div>
            <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-500 text-xs font-bold text-white hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              Delete Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
