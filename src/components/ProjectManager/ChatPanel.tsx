import React, { useState, useEffect, useRef } from "react";
import { pmGateway, DbMessage, DbUser, DbProjectMember } from "../../utils/supabase";
import { Trash2, Send } from "lucide-react";

interface ChatPanelProps {
  projectId: string;
  currentUser: DbUser;
}

export default function ChatPanel({ projectId, currentUser }: ChatPanelProps) {
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [members, setMembers] = useState<(DbProjectMember & { user?: DbUser })[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    const [msgs, mems, allUsers] = await Promise.all([
      pmGateway.getMessages(projectId),
      pmGateway.getProjectMembers(projectId),
      pmGateway.getRegisteredUsers()
    ]);
    setMessages(msgs);
    setMembers(mems.map(m => ({ ...m, user: allUsers.find(u => u.id === m.userId) })));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    await pmGateway.sendMessage(projectId, currentUser.id, chatInput.trim());
    setChatInput("");
    loadData();
  };

  const handleDelete = async (msgId: string) => {
    await pmGateway.deleteMessage(msgId);
    loadData();
  };

  const renderText = (text: string) => {
    if (!text) return <span className="italic text-white/30">Message deleted</span>;
    let parts: (string | React.ReactNode)[] = [text];
    
    members.forEach(m => {
      if (!m.user) return;
      const mentionStr = `@${m.user.name}`;
      const newParts: (string | React.ReactNode)[] = [];
      
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(mentionStr);
          if (split.length > 1) {
            split.forEach((subPart, idx) => {
              newParts.push(subPart);
              if (idx < split.length - 1) {
                newParts.push(
                  <span key={`${m.userId}-${idx}`} className="px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-bold mx-0.5">
                    {mentionStr}
                  </span>
                );
              }
            });
          } else {
            newParts.push(part);
          }
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });
    
    return <span className="whitespace-pre-wrap break-words">{parts}</span>;
  };

  return (
    <div className="flex flex-col h-[600px] border border-neutral-800 rounded-2xl bg-neutral-900/60 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-white/40 italic">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const sender = members.find(m => m.userId === msg.senderId)?.user;
            const isMe = msg.senderId === currentUser.id;
            
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start group`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-md bg-gradient-to-tr ${sender?.avatarColor || 'from-neutral-600 to-neutral-700'}`}>
                  {sender?.name.charAt(0) || '?'}
                </div>
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-white/60">{isMe ? 'You' : sender?.name}</span>
                    <span className="text-[9px] text-white/30">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="relative">
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.isDeleted ? 'bg-neutral-800/50 border border-neutral-800/80 text-white/30' :
                      isMe ? 'bg-yellow-400 text-black rounded-tr-sm shadow-md font-medium' : 'bg-neutral-800 text-white rounded-tl-sm border border-neutral-700/50 shadow-md'
                    }`}>
                      {renderText(msg.text)}
                    </div>
                    {isMe && !msg.isDeleted && (
                      <button 
                        onClick={() => handleDelete(msg.id)}
                        className="absolute top-1/2 -translate-y-1/2 -left-8 p-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-white/40 hover:text-red-400 hover:border-red-400/50 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-neutral-950/60 border-t border-neutral-800">
        <div className="flex items-end gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2 focus-within:border-yellow-400/50 transition-colors">
          <textarea
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message... (Use @ to mention)"
            className="flex-1 bg-transparent border-none text-xs text-white placeholder-white/30 resize-none outline-none py-2 px-2 min-h-[40px] max-h-[120px]"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!chatInput.trim()}
            className="p-2.5 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
