import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { VerifiedBadge } from "@/components/VerifiedBadge";

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
    return <div className="w-full max-w-2xl mx-auto p-6 text-muted-foreground">Loading…</div>;
  }

  if (notFound || !profile) {
    return <div className="w-full max-w-2xl mx-auto p-6 text-muted-foreground">Profile not found.</div>;
  }

  return (
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
    </div>
  );
}
