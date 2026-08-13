import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search, Bookmark, Home, Tv, Film, Menu, X, Settings, Zap, LogIn, LogOut, User, Gamepad2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const { user, signOut } = useAuth();

  const navItems = [
    { href: "/",          label: "Home",      icon: Home },
    { href: "/movies",    label: "Movies",    icon: Film },
    { href: "/tv",        label: "TV Shows",  icon: Tv },
    { href: "/watchlist", label: "Watchlist", icon: Bookmark },
    { href: "https://games.nrgtv.space",     label: "Games",     icon: Gamepad2 },
    { href: "/search",    label: "Search",    icon: Search },
  ];

  const isActive = (href: string) => location === href;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const navHoverIn = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.background = "rgba(255,255,255,0.05)";
    el.style.backdropFilter = "blur(8px)";
  };
  const navHoverOut = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.background = "";
    el.style.backdropFilter = "";
  };

  const AuthSection = ({ mobile = false }: { mobile?: boolean }) => {
    if (user) {
      const initial = (user.email ?? "?")[0].toUpperCase();

      return (
        <div className="relative" ref={mobile ? undefined : avatarRef}>
          <button
            onClick={() => setAvatarMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-2xl px-2 py-1.5 transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Initial avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black"
              style={{
                background: "linear-gradient(135deg, hsl(112,100%,54%), hsl(112,100%,38%))",
                border: "1.5px solid rgba(57,255,20,0.5)",
              }}
            >
              {initial}
            </div>
            {mobile && (
              <span className="text-sm font-medium text-white truncate max-w-[140px]">
                {user.email}
              </span>
            )}
          </button>

          {avatarMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden z-50"
              style={{
                background: "rgba(10,12,18,0.96)",
                border: "1px solid rgba(57,255,20,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(57,255,20,0.04)",
                backdropFilter: "blur(24px)",
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>

              <div className="py-1.5">
                <Link href="/settings">
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-white transition-colors"
                    onClick={() => setAvatarMenuOpen(false)}
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
                  >
                    <User className="w-4 h-4" /> Profile &amp; Settings
                  </button>
                </Link>

                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                  onClick={() => { signOut(); setAvatarMenuOpen(false); }}
                  style={{ color: "hsl(112,100%,54%)", background: "transparent" }}
                  onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(57,255,20,0.06)"; }}
                  onMouseLeave={(e) => { (e.currentTarget).style.background = "transparent"; }}
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <Link href="/signin">
        <button
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "linear-gradient(135deg, hsl(112,100%,54%) 0%, hsl(112,100%,36%) 100%)",
            color: "#000",
            boxShadow: "0 0 16px rgba(57,255,20,0.3)",
          }}
          onMouseEnter={(e) => { (e.currentTarget).style.boxShadow = "0 0 24px rgba(57,255,20,0.55)"; }}
          onMouseLeave={(e) => { (e.currentTarget).style.boxShadow = "0 0 16px rgba(57,255,20,0.3)"; }}
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </button>
      </Link>
    );
  };

  // Keyboard / gamepad navigation for desktop nav
  useEffect(() => {
    let lastAction = 0;
    function onAction(e: any) {
      const now = Date.now();
      if (now - lastAction < 120) return; // debounce rapid inputs
      lastAction = now;

      const action = e?.detail?.action;
      if (!action) return;

      // if mobile menu is open, ignore desktop nav moves
      if (mobileOpen) return;

      const container = navRef.current;
      if (!container) return;
      const items = Array.from(container.querySelectorAll<HTMLElement>("[data-focusable='true']"));
      if (!items.length) return;

      const active = document.activeElement as HTMLElement | null;
      let idx = items.findIndex((it) => it === active);
      if (idx === -1) {
        // try to focus the active nav item (marked by .glass-nav-active) first
        const activeByClass = container.querySelector<HTMLElement>(".glass-nav-active[data-focusable='true']");
        if (activeByClass) idx = items.indexOf(activeByClass);
      }

      if (action === "navigate-right" || action === "navigate-down") {
        const next = (idx + 1) % items.length;
        items[next].focus();
      } else if (action === "navigate-left" || action === "navigate-up") {
        const prev = (idx - 1 + items.length) % items.length;
        items[prev].focus();
      } else if (action === "confirm") {
        (document.activeElement as HTMLElement | null)?.click();
      } else if (action === "back") {
        setMobileOpen(false);
        setAvatarMenuOpen(false);
      }
    }

    window.addEventListener("gamepad-action", onAction as any);
    return () => window.removeEventListener("gamepad-action", onAction as any);
  }, [mobileOpen]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 h-14"
        style={{
          background: "rgba(4, 5, 9, 0.6)",
          backdropFilter: "blur(28px) saturate(180%) brightness(0.98)",
          WebkitBackdropFilter: "blur(28px) saturate(180%) brightness(0.98)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.04), 0 1px 0 rgba(57,255,20,0.05)",
        }}
      >
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer select-none">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg, hsl(112,100%,54%), hsl(112,100%,34%))",
                boxShadow: "0 0 12px rgba(57,255,20,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <Zap className="w-4 h-4 text-black fill-black" />
            </div>
            <span className="text-foreground font-black text-lg tracking-tight">
              NRG<span style={{ color: "hsl(112,100%,54%)" }}>TV</span>
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div ref={navRef} className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isExternal = href.startsWith("http");
            const activeClass = isActive(href) ? "glass-nav-active" : "text-muted-foreground hover:text-foreground";

            return isExternal ? (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer">
                <div
                  role="link"
                  tabIndex={0}
                  data-focusable="true"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none ${activeClass}`}
                  onMouseEnter={!isActive(href) ? navHoverIn : undefined}
                  onMouseLeave={!isActive(href) ? navHoverOut : undefined}
                  onFocus={(e) => { /* keep hover visuals for keyboard focus */ (e.currentTarget).style.background = "rgba(255,255,255,0.05)"; }}
                  onBlur={(e) => { (e.currentTarget).style.background = isActive(href) ? "" : ""; }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </a>
            ) : (
              <Link key={href} href={href}>
                <div
                  role="link"
                  tabIndex={0}
                  data-focusable="true"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer select-none ${activeClass}`}
                  onMouseEnter={!isActive(href) ? navHoverIn : undefined}
                  onMouseLeave={!isActive(href) ? navHoverOut : undefined}
                  onFocus={(e) => { /* keep hover visuals for keyboard focus */ (e.currentTarget).style.background = "rgba(255,255,255,0.05)"; }}
                  onBlur={(e) => { (e.currentTarget).style.background = isActive(href) ? "" : ""; }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {user && (
            <Link href="/settings">
              <button
                className="hidden md:flex p-2 rounded-xl transition-all text-muted-foreground hover:text-foreground"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={(e) => { (e.currentTarget).style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget).style.background = "rgba(255,255,255,0.04)"; }}
              >
                <Settings className="w-4 h-4" />
              </button>
            </Link>
          )}

          <div className="hidden md:flex">
            <AuthSection />
          </div>

          <button
            className="md:hidden p-2 rounded-xl text-muted-foreground"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{
            top: "56px",
            background: "rgba(3,4,8,0.82)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            borderTop: "1px solid rgba(255,255,255,0.055)",
          }}
        >
          <div style={{ height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(57,255,20,0.1) 60%, transparent 100%)" }} />
          <div className="flex flex-col gap-1.5 p-5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isExternal = href.startsWith("http");

              return isExternal ? (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer">
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer text-muted-foreground`}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </div>
                </a>
              ) : (
                <Link key={href} href={href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${isActive(href) ? "glass-nav-active" : "text-muted-foreground"}`}
                    style={!isActive(href) ? { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" } : {}}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </div>
                </Link>
              );
            })}

            <Link href="/settings">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-muted-foreground cursor-pointer"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                onClick={() => setMobileOpen(false)}
              >
                <Settings className="w-5 h-5" /> Settings
              </div>
            </Link>

            <div
              className="mt-2 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(57,255,20,0.1)" }}
              onClick={() => setMobileOpen(false)}
            >
              <AuthSection mobile />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
