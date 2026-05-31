import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MessageCircle, Reply, Send, X } from "lucide-react";
import {
  createFinanceSectionComment,
  listFinanceMembers,
  listFinanceSectionComments,
  type FinanceMember,
  type FinanceSectionComment,
} from "../../lib/workspaceSync";

type FinanceSectionCommentsProps = {
  workspaceId: string | null | undefined;
  section: string;
  sectionLabel: string;
};

export default function FinanceSectionComments({
  workspaceId,
  section,
  sectionLabel,
}: FinanceSectionCommentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<FinanceSectionComment[]>([]);
  const [members, setMembers] = useState<FinanceMember[]>([]);
  const [draft, setDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === "active" && member.user_id),
    [members],
  );

  const roots = useMemo(() => comments.filter((comment) => comment.parent_id === null), [comments]);

  const repliesByParent = useMemo(() => {
    return comments.reduce<Record<string, FinanceSectionComment[]>>((acc, comment) => {
      if (!comment.parent_id) return acc;
      acc[comment.parent_id] = [...(acc[comment.parent_id] ?? []), comment];
      return acc;
    }, {});
  }, [comments]);

  const refresh = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError("");
    try {
      const [commentData, memberData] = await Promise.all([
        listFinanceSectionComments(workspaceId, section),
        listFinanceMembers(workspaceId),
      ]);
      setComments(commentData);
      setMembers(memberData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (workspaceId) {
      refresh();
    }
  }, [workspaceId, section]);

  const submitComment = async (event: FormEvent, parentId: string | null = null) => {
    event.preventDefault();
    if (!workspaceId) return;

    const actualComment = parentId ? replyDrafts[parentId]?.trim() : draft.trim();
    if (!actualComment) return;

    setSaving(true);
    setError("");
    try {
      await createFinanceSectionComment({
        workspaceId,
        section,
        actualComment,
        parentId,
        mentionedUserIds: extractMentionedUserIds(actualComment, activeMembers),
      });
      if (parentId) {
        setReplyDrafts((current) => ({ ...current, [parentId]: "" }));
        setActiveReplyId(null);
      } else {
        setDraft("");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setSaving(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-sm font-semibold text-white/70 transition-colors hover:border-yellow-400/45 hover:text-white"
      >
        <MemberStack members={activeMembers} />
        <span className="inline-flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-yellow-300" />
          Comments
          {comments.length > 0 && (
            <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black text-black">
              {comments.length}
            </span>
          )}
        </span>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm sm:p-6">
          <section className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/50 sm:max-h-[calc(100vh-3rem)]">
            <header className="flex items-start justify-between gap-4 border-b border-neutral-800 px-5 py-4">
              <div>
                <p className="dd-label">Finance comments</p>
                <h2 className="mt-1 text-xl font-bold text-white">{sectionLabel}</h2>
                <p className="mt-1 text-sm text-white/45">
                  Discuss this finance section, reply in threads, and mention teammates with @name.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-white/45 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {!workspaceId ? (
              <div className="grid flex-1 place-items-center p-6 text-center">
                <div className="max-w-md rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 p-6">
                  <MessageCircle className="mx-auto h-8 w-8 text-yellow-300" />
                  <h3 className="mt-3 text-lg font-bold text-white">Finance workspace required</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">
                    Sign in and choose a finance workspace before shared comments can be saved.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
                  {loading ? (
                    <div className="grid h-full place-items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white/35" />
                    </div>
                  ) : roots.length === 0 ? (
                    <div className="grid h-full place-items-center rounded-xl border border-dashed border-neutral-800 text-center text-sm text-white/45">
                      No comments on this finance section yet.
                    </div>
                  ) : (
                    roots.map((comment) => (
                      <CommentCard
                        key={comment.id}
                        comment={comment}
                        replies={repliesByParent[comment.id] ?? []}
                        activeMembers={activeMembers}
                        replyDraft={replyDrafts[comment.id] ?? ""}
                        isReplying={activeReplyId === comment.id}
                        saving={saving}
                        onStartReply={() => setActiveReplyId(comment.id)}
                        onCancelReply={() => setActiveReplyId(null)}
                        onReplyDraftChange={(value) =>
                          setReplyDrafts((current) => ({ ...current, [comment.id]: value }))
                        }
                        onSubmitReply={(event) => submitComment(event, comment.id)}
                      />
                    ))
                  )}
                </div>

                <form onSubmit={submitComment} className="border-t border-neutral-800 p-4">
                  {error && (
                    <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      {error}
                    </p>
                  )}
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <MentionComposer
                      value={draft}
                      onChange={setDraft}
                      members={activeMembers}
                      placeholder={`Comment on ${sectionLabel}...`}
                    />
                    <button type="submit" disabled={saving || !draft.trim()} className="dd-btn-primary self-end">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}

function CommentCard({
  comment,
  replies,
  activeMembers,
  replyDraft,
  isReplying,
  saving,
  onStartReply,
  onCancelReply,
  onReplyDraftChange,
  onSubmitReply,
}: {
  comment: FinanceSectionComment;
  replies: FinanceSectionComment[];
  activeMembers: FinanceMember[];
  replyDraft: string;
  isReplying: boolean;
  saving: boolean;
  onStartReply: () => void;
  onCancelReply: () => void;
  onReplyDraftChange: (value: string) => void;
  onSubmitReply: (event: FormEvent) => void;
}) {
  return (
    <article className="rounded-xl border border-neutral-800 bg-neutral-900/45 p-4">
      <div className="flex gap-3">
        <Avatar name={comment.author_display_name || comment.author_email || "User"} src={comment.author_avatar_url} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{comment.author_display_name || comment.author_email || "User"}</p>
            <span className="text-xs text-white/35">{formatCommentTime(comment.created_at)}</span>
          </div>
          <HighlightedComment text={comment.actual_comment} members={activeMembers} className="mt-2 text-sm leading-relaxed text-white/85" />
          <button
            type="button"
            onClick={onStartReply}
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-white/45 transition-colors hover:text-yellow-300"
          >
            <Reply className="h-3.5 w-3.5" />
            Reply
          </button>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-11 mt-4 space-y-3 border-l border-neutral-800 pl-4">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-3 rounded-lg bg-neutral-950/60 p-3">
              <Avatar name={reply.author_display_name || reply.author_email || "User"} src={reply.author_avatar_url} size="sm" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{reply.author_display_name || reply.author_email || "User"}</p>
                  <span className="text-xs text-white/35">{formatCommentTime(reply.created_at)}</span>
                </div>
                <HighlightedComment text={reply.actual_comment} members={activeMembers} className="mt-1 text-sm leading-relaxed text-white/80" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isReplying && (
        <form onSubmit={onSubmitReply} className="ml-11 mt-4 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
          <MentionComposer
            value={replyDraft}
            onChange={onReplyDraftChange}
            members={activeMembers}
            placeholder="Write a reply..."
            compact
          />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={onCancelReply} className="rounded-lg border border-neutral-800 px-3 py-2 text-xs font-bold text-white/55 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={saving || !replyDraft.trim()} className="dd-btn-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Reply
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

function MentionComposer({
  value,
  onChange,
  members,
  placeholder,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  members: FinanceMember[];
  placeholder: string;
  compact?: boolean;
}) {
  const query = getMentionQuery(value);
  const options = query === null
    ? []
    : members
      .filter((member) => {
        const haystack = `${mentionLabel(member)} ${member.display_name ?? ""} ${member.email ?? ""}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .slice(0, 8);

  const chooseMember = (member: FinanceMember) => {
    const mention = `@${mentionLabel(member)} `;
    onChange(replaceActiveMention(value, mention));
  };

  return (
    <div className="relative">
      {query !== null && (
        <div className="absolute bottom-full left-0 right-0 z-30 mb-2 max-h-52 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl shadow-black/50">
          {options.length > 0 ? (
            options.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => chooseMember(member)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-neutral-900"
              >
                <Avatar name={member.display_name || member.email || "User"} src={member.avatar_url} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-white">{member.display_name || member.email || "User"}</span>
                  <span className="block truncate text-xs text-yellow-300">@{mentionLabel(member)}</span>
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-white/40">No matching teammates.</div>
          )}
        </div>
      )}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`custom-scrollbar w-full resize-y rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-yellow-400/55 ${compact ? "mt-0 min-h-20" : "min-h-24"}`}
      />
    </div>
  );
}

function HighlightedComment({
  text,
  members,
  className,
}: {
  text: string;
  members: FinanceMember[];
  className: string;
}) {
  const knownMentions = new Set(members.map((member) => `@${mentionLabel(member).toLowerCase()}`));
  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {text.split(/(@[A-Za-z0-9_-]+)/g).map((part, index) => {
        const isMention = part.startsWith("@") && knownMentions.has(part.toLowerCase());
        return isMention ? (
          <span key={`${part}-${index}`} className="font-bold text-yellow-300">{part}</span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </p>
  );
}

function getMentionQuery(value: string) {
  const match = value.match(/(?:^|\s)@([A-Za-z0-9_-]*)$/);
  return match ? match[1] : null;
}

function replaceActiveMention(value: string, mention: string) {
  return value.replace(/(^|\s)@([A-Za-z0-9_-]*)$/, (_match, prefix) => `${prefix}${mention}`);
}

function MemberStack({ members }: { members: FinanceMember[] }) {
  const visible = members.slice(0, 3);
  const overflow = Math.max(0, members.length - visible.length);

  return (
    <span className="flex items-center">
      {visible.map((member, index) => (
        <span key={member.id} className={index > 0 ? "-ml-2" : ""}>
          <Avatar name={member.display_name || member.email || "User"} src={member.avatar_url} size="sm" />
        </span>
      ))}
      {overflow > 0 && (
        <span className="-ml-2 grid h-7 w-7 place-items-center rounded-full border-2 border-neutral-900 bg-neutral-800 text-[10px] font-black text-white/70">
          +{overflow}
        </span>
      )}
    </span>
  );
}

function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md";
}) {
  const className = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  if (src) {
    return <img src={src} alt="" className={`${className} shrink-0 rounded-full border-2 border-neutral-900 object-cover`} />;
  }

  return (
    <span className={`${className} grid shrink-0 place-items-center rounded-full border-2 border-neutral-900 bg-neutral-800 font-black text-white/70`}>
      {initials}
    </span>
  );
}

function mentionLabel(member: FinanceMember) {
  return (member.display_name || member.email || member.invited_email || "user")
    .split("@")[0]
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9_-]/g, "");
}

function extractMentionedUserIds(comment: string, members: FinanceMember[]) {
  const normalized = comment.toLowerCase();
  return members
    .filter((member) => {
      if (!member.user_id) return false;
      const labels = [
        mentionLabel(member),
        member.display_name ?? "",
        member.email?.split("@")[0] ?? "",
      ].filter(Boolean);
      return labels.some((label) => normalized.includes(`@${label.toLowerCase().replace(/\s+/g, "-")}`));
    })
    .map((member) => member.user_id!)
    .filter((id, index, ids) => ids.indexOf(id) === index);
}

function formatCommentTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
