/**
 * ForumThread.tsx
 * -------------------------------------------------------
 * Single-thread view — original post, replies, reply box.
 * Static template with mock data; route param :id is read
 * but not yet used to fetch anything real.
 *
 * Add to App.tsx:
 *   <Route path="/forum/:id" component={ForumThread} />
 */

import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  MessagesSquare,
  ArrowLeft,
  Pin,
  Lock,
  ThumbsUp,
  Send,
} from "lucide-react";

interface ForumPost {
  id: string;
  author: string;
  body: string;
  postedAt: string;
  likes: number;
  isOriginal?: boolean;
}

const NEON = "hsl(112,100%,54%)";

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
};

// Mock — replace with a fetch keyed on the :id route param
const MOCK_POSTS: ForumPost[] = [
  {
    id: "p1",
    author: "admin",
    body: "Heads up — we're rolling out the new adblock layer this week. If you notice popups slipping through on a specific source, reply here with the source name and we'll get it patched.",
    postedAt: "5h ago",
    likes: 14,
    isOriginal: true,
  },
  {
    id: "p2",
    author: "reeve92",
    body: "Nice, been getting a lot of redirect spam on a few of the backup sources lately. Will report specifics if it keeps happening.",
    postedAt: "4h ago",
    likes: 3,
  },
  {
    id: "p3",
    author: "nightowl",
    body: "Appreciate the transparency on this stuff, most streaming sites just silently break instead of explaining what changed.",
    postedAt: "2h ago",
    likes: 8,
  },
];

function PostCard({ post }: { post: ForumPost }) {
  const initial = post.author[0]?.toUpperCase() ?? "?";
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        ...glassCard,
        border: post.isOriginal ? "1px solid rgba(57,255,20,0.15)" : glassCard.border,
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
            <span className="text-sm font-bold text-foreground">{post.author}</span>
            {post.isOriginal && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: "rgba(57,255,20,0.1)", color: NEON }}
              >
                OP
              </span>
            )}
            <span className="text-[11px] text-muted-foreground/40">{post.postedAt}</span>
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
  const [reply, setReply] = useState("");

  const handleSubmit = () => {
    if (!reply.trim()) return;
    // TODO: wire up to backend — post { threadId: id, body: reply }
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
        <div className="flex items-start gap-2 mb-1">
          <MessagesSquare className="w-4 h-4 mt-0.5 shrink-0" style={{ color: NEON }} />
          <h1 className="text-lg font-black text-foreground leading-tight">
            Server maintenance — Aug 20th, 2am AEST
          </h1>
        </div>
        <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground/50">
          <span>Announcements</span>
          <span>·</span>
          <span>Thread #{id}</span>
        </div>

        {/* Posts */}
        <div className="flex flex-col gap-3 mb-6">
          {MOCK_POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Reply box */}
        <div className="rounded-2xl p-4" style={glassCard}>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 block">
            Reply
          </label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply..."
            rows={3}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmit}
              disabled={!reply.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, hsl(112,100%,54%) 0%, hsl(112,100%,36%) 100%)",
                color: "#000",
                boxShadow: "0 0 16px rgba(57,255,20,0.3)",
              }}
            >
              <Send className="w-4 h-4" />
              Post Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
