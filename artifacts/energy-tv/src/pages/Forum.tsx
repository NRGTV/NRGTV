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

// ─── Types ──────────────────────────────────────────────────────

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  threadCount: number;
  postCount: number;
  icon?: string;
}

interface ForumThreadSummary {
  id: string;
  title: string;
  category: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
  pinned?: boolean;
  locked?: boolean;
}

// ─── Mock data — replace with real fetch/query ────────────────

const MOCK_CATEGORIES: ForumCategory[] = [
  { id: "announcements", name: "Announcements", description: "Official updates, changelogs, and downtime notices.", threadCount: 12, postCount: 84 },
  { id: "general", name: "General Discussion", description: "Anything NRGTV related that doesn't fit elsewhere.", threadCount: 143, postCount: 1820 },
  { id: "requests", name: "Content Requests", description: "Ask for a movie, show, or game to be added.", threadCount: 96, postCount: 512 },
  { id: "bugs", name: "Bug Reports", description: "Found something broken? Report it here.", threadCount: 58, postCount: 301 },
  { id: "off-topic", name: "Off Topic", description: "Everything else — music, gaming, life.", threadCount: 74, postCount: 960 },
];

const MOCK_THREADS: ForumThreadSummary[] = [
  { id: "t1", title: "Server maintenance — Aug 20th, 2am AEST", category: "Announcements", author: "admin", replies: 4, views: 210, lastActivity: "2h ago", pinned: true },
  { id: "t2", title: "New adblock layer rolling out this week", category: "Announcements", author: "admin", replies: 11, views: 480, lastActivity: "5h ago", pinned: true },
  { id: "t3", title: "Anyone else getting buffering on the TV app?", category: "Bug Reports", author: "reeve92", replies: 7, views: 96, lastActivity: "18m ago" },
  { id: "t4", title: "Request: add Terraria to the Android games list", category: "Content Requests", author: "goatlord", replies: 2, views: 40, lastActivity: "44m ago" },
  { id: "t5", title: "What are you all watching this week?", category: "General Discussion", author: "nightowl", replies: 23, views: 340, lastActivity: "1h ago" },
  { id: "t6", title: "Locked: duplicate of #482", category: "Bug Reports", author: "mod_kai", replies: 1, views: 12, lastActivity: "3d ago", locked: true },
];

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
            <p className="text-sm font-bold text-foreground">{category.threadCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Threads</p>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{category.postCount}</p>
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
          <p className="text-xs text-muted-foreground/50">
            {thread.category} · started by <span className="text-muted-foreground/70">{thread.author}</span>
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <MessagesSquare className="w-3.5 h-3.5" /> {thread.replies}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {thread.views}
          </span>
          <span className="flex items-center gap-1 w-16 justify-end">
            <Clock className="w-3.5 h-3.5" /> {thread.lastActivity}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ───────────────────────────────────────────────────────

export default function Forum() {
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, hsl(112,100%,54%) 0%, hsl(112,100%,36%) 100%)",
              color: "#000",
              boxShadow: "0 0 16px rgba(57,255,20,0.3)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(57,255,20,0.55)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 16px rgba(57,255,20,0.3)"; }}
          >
            <Plus className="w-4 h-4" />
            New Thread
          </button>
        </div>
        <p className="text-xs text-muted-foreground/50 mb-6">
          Discuss NRGTV, request content, report bugs, or just hang out.
        </p>

        {/* Categories */}
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">
            Categories
          </h2>
        </div>
        <div className="flex flex-col gap-2.5 mb-8">
          {MOCK_CATEGORIES.map((c) => (
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
          {MOCK_THREADS.map((t) => (
            <ThreadRow key={t.id} thread={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
