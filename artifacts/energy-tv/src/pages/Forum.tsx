/**
 * Forum.tsx
 * -------------------------------------------------------
 * Forum landing page — category list + recent threads.
 * Static template with mock data, styled to match the rest
 * of NRGTV (glass cards, neon-green accents, GreenEnergy font).
 *
 * Wire-up notes (do these two edits yourself):
 *  1. App.tsx     — import Forum and ForumThread, add:
 *       <Route path="/forum" component={Forum} />
 *       <Route path="/forum/:id" component={ForumThread} />
 *  2. Navbar.tsx  — add a nav item to `navItems`, e.g.
 *       { href: "/forum", label: "Forum", icon: MessagesSquare }
 *     (MessagesSquare comes from lucide-react)
 *
 * Swap MOCK_CATEGORIES / MOCK_THREADS for real data (Supabase
 * table, API route, etc.) once you've got a backend for it —
 * the component shapes below are a reasonable starting schema.
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  MessagesSquare,
  Pin,
  Lock,
  Flame,
  Users,
  Clock,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  useForumCategories,
  useForumThreads,
  useCreateThread,
  type ForumCategory,
  type ForumThreadSummary,
} from "@/hooks/useForum";
import { useAuth } from "@/context/AuthContext";
import { VerifiedBadge } from "@/components/VerifiedBadge";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Shared glass card style ────────────────────────────────────

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
};

const NEON = "hsl(112,100%,54%)";

// ─── Category row ───────────────────────────────────────────────

function CategoryCard({ category }: { category: ForumCategory }) {
  return (
    <Link href={`/forum?category=${category.id}`}>
      <div
        className="group flex items-center justify-between gap-4 rounded-2xl p-4 cursor-pointer transition-all"
        style={glassCard}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = "1px solid rgba(57,255,20,0.25)";
          e.currentTarget.style.boxShadow =
            "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 20px rgba(57,255,20,0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
          e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.05)";
        }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(57,255,20,0.08)",
              border: "1px solid rgba(57,255,20,0.15)",
            }}
          >
            <MessagesSquare className="w-4 h-4" style={{ color: NEON }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight truncate">
              {category.name}
            </h3>
            <p className="text-xs text-muted-foreground/60 leading-relaxed mt-0.5">
              {category.description}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 shrink-0 text-right">
          <div>
            <p className="text-sm font-bold text-foreground">{category.threadCount ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Threads</p>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{category.postCount ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Posts</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-[hsl(112,100%,54%)] transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ─── Thread row ─────────────────────────────────────────────────

function ThreadRow({ thread }: { thread: ForumThreadSummary }) {
  return (
    <Link href={`/forum/${thread.id}`}>
      <div
        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
        style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.045)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.015)"; }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            {thread.pinned && <Pin className="w-3 h-3" style={{ color: NEON }} />}
            {thread.locked && <Lock className="w-3 h-3 text-muted-foreground/50" />}
            <h4 className="text-sm font-semibold text-foreground truncate">{thread.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground/50 flex items-center gap-1">
            {thread.category_id} · started by{" "}
            {thread.author?.username ? (
              <Link href={`/u/${thread.author.username}`} onClick={(e) => e.stopPropagation()}>
                <span className="text-muted-foreground/70 hover:text-foreground inline-flex items-center">
                  {thread.author.display_name || thread.author.username}
                  <VerifiedBadge
                    isVerified={thread.author.is_verified}
                    type={thread.author.verified_type ?? undefined}
                  />
                </span>
              </Link>
            ) : (
              <span className="text-muted-foreground/70">{thread.author_name}</span>
            )}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <MessagesSquare className="w-3.5 h-3.5" /> {thread.replies ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {thread.views}
          </span>
          <span className="flex items-center gap-1 w-16 justify-end">
            <Clock className="w-3.5 h-3.5" /> {timeAgo(thread.last_activity_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ───────────────────────────────────────────────────────

function NewThreadForm({
  categories,
  onClose,
}: {
  categories: ForumCategory[];
  onClose: () => void;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const createThread = useCreateThread();

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim() || !categoryId) return;
    await createThread.mutateAsync({ categoryId, title, body });
    onClose();
  };

  return (
    <div className="rounded-2xl p-4 mb-6" style={glassCard}>
      <div className="flex flex-col gap-3">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm text-foreground outline-none"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id} style={{ background: "#0a0c12" }}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thread title"
          className="rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className="rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        />

        {createThread.isError && (
          <p className="text-xs text-red-400">
            {(createThread.error as Error)?.message ?? "Failed to create thread"}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-muted-foreground/70"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createThread.isPending || !title.trim() || !body.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, hsl(112,100%,54%) 0%, hsl(112,100%,36%) 100%)",
              color: "#000",
              boxShadow: "0 0 16px rgba(57,255,20,0.3)",
            }}
          >
            <Plus className="w-4 h-4" />
            {createThread.isPending ? "Posting..." : "Post Thread"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Forum() {
  const { user } = useAuth();
  const { data: categories, isLoading: categoriesLoading } = useForumCategories();
  const { data: threads, isLoading: threadsLoading } = useForumThreads();
  const [showNewThread, setShowNewThread] = useState(false);

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-4 md:px-6 pt-6 pb-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MessagesSquare className="w-4 h-4" style={{ color: NEON }} />
            <h1 className="text-lg font-black text-foreground">Forum</h1>
          </div>

          <button
            onClick={() => (user ? setShowNewThread((v) => !v) : undefined)}
            disabled={!user}
            title={user ? undefined : "Sign in to post"}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, hsl(112,100%,54%) 0%, hsl(112,100%,36%) 100%)",
              color: "#000",
              boxShadow: "0 0 16px rgba(57,255,20,0.3)",
            }}
            onMouseEnter={(e) => { if (user) e.currentTarget.style.boxShadow = "0 0 24px rgba(57,255,20,0.55)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 16px rgba(57,255,20,0.3)"; }}
          >
            <Plus className="w-4 h-4" />
            New Thread
          </button>
        </div>
        <p className="text-xs text-muted-foreground/50 mb-6">
          Discuss NRGTV, request content, report bugs, or just hang out.
        </p>

        {showNewThread && categories && (
          <NewThreadForm categories={categories} onClose={() => setShowNewThread(false)} />
        )}

        {/* Categories */}
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">
            Categories
          </h2>
        </div>
        <div className="flex flex-col gap-2.5 mb-8">
          {categoriesLoading && (
            <p className="text-xs text-muted-foreground/40">Loading categories...</p>
          )}
          {categories?.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>

        {/* Recent threads */}
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-3.5 h-3.5" style={{ color: NEON }} />
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">
            Recent Threads
          </h2>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl p-2" style={glassCard}>
          {threadsLoading && (
            <p className="text-xs text-muted-foreground/40 px-2 py-1">Loading threads...</p>
          )}
          {!threadsLoading && threads?.length === 0 && (
            <p className="text-xs text-muted-foreground/40 px-2 py-1">No threads yet — start one!</p>
          )}
          {threads?.map((t) => (
            <ThreadRow key={t.id} thread={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
