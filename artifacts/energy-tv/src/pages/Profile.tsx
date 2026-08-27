import { useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useUserForumPosts } from "@/hooks/useForum";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  is_verified: boolean;
  verified_type: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { data: posts, isLoading: postsLoading } = useUserForumPosts(profile?.id);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, banner_url, bio, is_verified, verified_type, created_at"
        )
        .eq("username", username)
        .single();

      if (cancelled) return;

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-14 pb-10">
        <div className="w-full max-w-2xl mx-auto p-6 text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background pt-14 pb-10">
        <div className="w-full max-w-2xl mx-auto p-6 text-muted-foreground">Profile not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14 pb-10">
      <div className="w-full max-w-2xl mx-auto">
        {/* Banner */}
        <div
          className="w-full h-40 rounded-b-xl bg-cover bg-center"
          style={{
            backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined,
            background: profile.banner_url
              ? undefined
              : "linear-gradient(145deg, hsl(112,100%,20%), hsl(112,100%,10%))",
          }}
        />

        {/* Avatar overlaps banner */}
        <div className="px-6 -mt-12 flex items-end justify-between">
          <img
            src={profile.avatar_url || "/default-avatar.png"}
            alt={`${profile.username} avatar`}
            className="w-24 h-24 rounded-full border-4 border-background object-cover"
          />
        </div>

        <div className="px-6 mt-3">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold text-foreground">
              {profile.display_name || profile.username}
            </h1>
            <VerifiedBadge isVerified={profile.is_verified} type={profile.verified_type ?? undefined} />
          </div>
          <p className="text-muted-foreground text-sm">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">{profile.bio}</p>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            Joined{" "}
            {new Date(profile.created_at).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Forum posts */}
        <div className="px-6 mt-6">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-3">
            <MessagesSquare className="w-4 h-4" style={{ color: "hsl(112,100%,54%)" }} />
            Forum activity
          </h2>

          {postsLoading && (
            <p className="text-xs text-muted-foreground">Loading posts…</p>
          )}

          {!postsLoading && (!posts || posts.length === 0) && (
            <p className="text-xs text-muted-foreground">No forum posts yet.</p>
          )}

          {!postsLoading && posts && posts.length > 0 && (
            <div className="flex flex-col gap-2">
              {posts.map((post) => (
                <Link key={post.id} href={`/forum/${post.thread_id}`}>
                  <div
                    className="rounded-xl px-4 py-3 cursor-pointer transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {post.thread?.title ?? "Deleted thread"}
                      </p>
                      {post.is_original && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: "rgba(57,255,20,0.1)", color: "hsl(112,100%,54%)" }}
                        >
                          OP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{post.body}</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-1.5">{timeAgo(post.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
