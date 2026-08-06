import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function SignIn() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const [mode,     setMode]     = useState<"signin" | "signup">("signin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");
  const [message,  setMessage]  = useState("");

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [user, loading, navigate]);

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setBusy(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account.");
    }

    setBusy(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "11px 14px",
    color: "white",
    fontSize: "14px",
    outline: "none",
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, hsl(112,100%,54%), hsl(112,100%,38%))",
    color: "#000",
    fontWeight: 700,
    fontSize: "14px",
    cursor: busy ? "not-allowed" : "pointer",
    opacity: busy ? 0.7 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(57,255,20,0.07) 0%, transparent 70%), #040509",
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-6 text-center"
        style={{
          background: "rgba(10,12,18,0.85)",
          border: "1px solid rgba(57,255,20,0.18)",
          boxShadow:
            "0 0 60px rgba(57,255,20,0.06), 0 2px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(32px)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, hsl(112,100%,54%), hsl(112,100%,30%))",
              boxShadow: "0 0 32px rgba(57,255,20,0.45), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            <Zap className="w-8 h-8 text-black fill-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              NRG<span style={{ color: "hsl(112,100%,54%)" }}>TV</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Stream with the world's most electrifying content
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-full h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.2), transparent)",
          }}
        />

        {/* Mode toggle */}
        <div className="flex w-full gap-2">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setMessage(""); }}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
              style={
                mode === m
                  ? { background: "rgba(57,255,20,0.15)", color: "hsl(112,100%,54%)", border: "1px solid rgba(57,255,20,0.3)" }
                  : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }
              }
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3 w-full">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={inputStyle}
          />
        </div>

        {/* Error / success */}
        {error   && <p className="text-xs text-red-400 w-full text-left">{error}</p>}
        {message && <p className="text-xs w-full text-left" style={{ color: "hsl(112,100%,54%)" }}>{message}</p>}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={busy} style={btnPrimary}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "signin" ? "Sign In" : "Create Account"}
        </button>

        {/* Footer */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          By continuing you agree to our{" "}
          <span className="underline underline-offset-2 cursor-pointer" style={{ color: "hsl(112,100%,54%)" }}>Terms</span>
          {" " }and{" "}
          <span className="underline underline-offset-2 cursor-pointer" style={{ color: "hsl(112,100%,54%)" }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
