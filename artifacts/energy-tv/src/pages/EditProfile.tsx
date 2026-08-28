import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { uploadAvatar, uploadBanner } from "@/lib/uploads";
import { useAuth } from "@/context/AuthContext";
import { Camera, Loader2 } from "lucide-react";

export default function EditProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [, navigate] = useLocation();

  const [username, setUsername] = useState(profile?.username ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile?.banner_url ?? "");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-14 pb-10">
        <div className="max-w-xl mx-auto px-6 text-sm text-muted-foreground">
          Sign in to edit your profile.
        </div>
      </div>
    );
  }

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      setAvatarUrl(url);
    } catch (err) {
      setError((err as Error).message ?? "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleBannerPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBannerUploading(true);
    try {
      const url = await uploadBanner(user.id, file);
      setBannerUrl(url);
    } catch (err) {
      setError((err as Error).message ?? "Banner upload failed");
    } finally {
      setBannerUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError("Username can't be empty");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setError("Username must be 3-20 characters: lowercase letters, numbers, underscores only");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username: cleanUsername,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        banner_url: bannerUrl || null,
      })
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      setError(
        updateError.code === "23505" ? "That username is already taken" : updateError.message
      );
      return;
    }

    await refreshProfile();
    navigate(`/u/${cleanUsername}`);
  };

  return (
    <div className="min-h-screen bg-background pt-14 pb-10">
      <div className="max-w-xl mx-auto px-4 md:px-6 pt-6">
        <h1 className="text-lg font-black text-foreground mb-6">Edit Profile</h1>

        {/* Banner */}
        <div className="relative">
          <div
            className="w-full h-32 rounded-xl bg-cover bg-center"
            style={{
              backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
              background: bannerUrl
                ? undefined
                : "linear-gradient(145deg, hsl(112,100%,20%), hsl(112,100%,10%))",
            }}
          />
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerUploading}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            {bannerUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            Change banner
          </button>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerPick} />
        </div>

        {/* Avatar */}
        <div className="-mt-10 px-2 flex items-end gap-3">
          <div className="relative">
            <img
              src={avatarUrl || "/default-avatar.png"}
              alt="avatar"
              className="w-20 h-20 rounded-full border-4 border-background object-cover"
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "hsl(112,100%,54%)", border: "2px solid #0a0c12" }}
            >
              {avatarUploading ? (
                <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-black" />
              )}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4 mt-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-1.5 block">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-1.5 block">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How your name appears"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-1.5 block">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself"
              rows={4}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => navigate(profile?.username ? `/u/${profile.username}` : "/")}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground/70"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || avatarUploading || bannerUploading}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, hsl(112,100%,54%) 0%, hsl(112,100%,36%) 100%)",
                color: "#000",
                boxShadow: "0 0 16px rgba(57,255,20,0.3)",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
