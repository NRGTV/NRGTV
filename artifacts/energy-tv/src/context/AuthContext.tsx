import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  is_verified: boolean;
  verified_type: string | null;
}

interface AuthState {
  user:    User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user:    null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(user: User) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, banner_url, bio, is_verified, verified_type")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      return;
    }

    // No profile row yet — this account predates the auto-create trigger,
    // or the trigger hasn't been run in this Supabase project. Create one
    // client-side so the app doesn't get stuck with a missing profile.
    const base = (user.email?.split("@")[0] ?? "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "") || "user";

    let username = base;
    let created = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const candidate = attempt === 0 ? base : `${base}${Math.floor(Math.random() * 10000)}`;
      const { data: inserted, error } = await supabase
        .from("profiles")
        .insert({ id: user.id, username: candidate })
        .select("id, username, display_name, avatar_url, banner_url, bio, is_verified, verified_type")
        .single();

      if (inserted) {
        created = inserted;
        username = candidate;
      } else if (error?.code !== "23505") {
        // Not a "username taken" conflict — stop retrying, something else is wrong.
        break;
      }
    }

    setProfile(created);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) loadProfile(sessionUser);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

