/**
 * ForumThread.tsx
 * -------------------------------------------------------
 * Single-thread view — original post, replies, reply box.
 * Reads/writes through useForum.ts (Supabase-backed).
 */

import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  MessagesSquare,
  ArrowLeft,
  ThumbsUp,
  Send,
} from "lucide-react";
import { useForumThread, useCreateReply, type ForumPost } from "@/hooks/useForum";
import { useAuth } from "@/context/AuthContext";

const NEON = "hsl(112,100%,54%)";

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PostCard({ post }: { post: ForumPost }) {
  const initial = post.author_name[0]?.toUpperCase() ?? "?";
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        ...glassCard,
        border: post.is_original ? "1px solid rgba(57,255,20,0.15)" : glassCard.border,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-black text-black"
          style={{
            background: "linear-gradient(135deg, hsl(112,100%,54%), hsl(112,100%,38%))",
            border: "1.5px solid rgba(57,255,20,0.5)",
          }}
        >
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-foreground">{post.author_name}</span>
            {post.is_original && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: "rgba(57,255,20,0.1)", color: NEON }}
              >
                OP
              </span>
            )}
            <span className="text-[11px] text-muted-foreground/40">{timeAgo(post.created_at)}</span>
          </div>

          <p className="text-sm text-muted-foreground/80 leading-relaxed whitespace-pre-wrap">
            {post.body}
          </p>

          <button
            className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-[hsl(112,100%,54%)] transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            {post.likes}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForumThread() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { thread, posts } = useForumThread(id);
  const createReply = useCreateReply(id ?? "");
  const [reply, setReply] = useState("");

  const handleSubmit = async () => {
    if (!reply.trim()) return;
    await createReply.mutateAsync(reply);
    setReply("");
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-4 md:px-6 pt-6 pb-10 max-w-3xl mx-auto">
        {/* Back link */}
        <Link href="/forum">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Forum
          </div>
        </Link>

        {/* Thread header */}
        {thread.isLoading && (
          <p className="text-xs text-muted-foreground/40 mb-6">Loading thread...</p>
        )}
        {thread.data && (
          <>
            <div className="flex items-start gap-2 mb-1">
              <MessagesSquare className="w-4 h-4 mt-0.5 shrink-0" style={{ color: NEON }} />
              <h1 className="text-lg font-black text-foreground leading-tight">
                {thread.data.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground/50">
              <span>{thread.data.category_id}</span>
              <span>·</span>
              <span>started by {thread.data.author_name}</span>
            </div>
          </>
        )}

        {/* Posts */}
        <div className="flex flex-col gap-3 mb-6">
          {posts.isLoading && (
            <p className="text-xs text-muted-foreground/40">Loading posts...</p>
          )}
          {posts.data?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Reply box */}
        {thread.data?.locked ? (
          <p className="text-xs text-muted-foreground/50 text-center py-4">
            This thread is locked — no new replies.
          </p>
        ) : (
          <div className="rounded-2xl p-4" style={glassCard}>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 block">
              Reply
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={user ? "Write a reply..." : "Sign in to reply"}
              rows={3}
              disabled={!user}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            />
            {createReply.isError && (
              <p className="text-xs text-red-400 mt-2">
                {(createReply.error as Error)?.message ?? "Failed to post reply"}
              </p>
            )}
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSubmit}
                disabled={!user || !reply.trim() || createReply.isPending}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, hsl(112,100%,54%) 0%, hsl(112,100%,36%) 100%)",
                  color: "#000",
                  boxShadow: "0 0 16px rgba(57,255,20,0.3)",
                }}
              >
                <Send className="w-4 h-4" />
                {createReply.isPending ? "Posting..." : "Post Reply"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
