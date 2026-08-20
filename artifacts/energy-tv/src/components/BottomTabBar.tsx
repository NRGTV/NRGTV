import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Film, Tv, Bookmark, Gamepad2, Search } from "lucide-react";
import { isMobileOS } from "@/lib/platform";

const TABS = [
  { href: "/",          label: "Home",   icon: Home },
  { href: "/movies",    label: "Movies", icon: Film },
  { href: "/tv",        label: "TV",     icon: Tv },
  { href: "/watchlist", label: "Saved",  icon: Bookmark },
  { href: "/games",     label: "Games",  icon: Gamepad2 },
  { href: "/search",    label: "Search", icon: Search },
];

export default function BottomTabBar() {
  const [location] = useLocation();
  const [show] = useState(() => isMobileOS());

  // Pages size themselves against the fixed top bar with a hardcoded
  // pt-14; there's no shared layout wrapper to add matching bottom
  // clearance to, so it's done globally here instead (see the
  // .has-bottom-nav rule in index.css) rather than touching every page.
  useEffect(() => {
    if (!show) return;
    document.body.classList.add("has-bottom-nav");
    return () => document.body.classList.remove("has-bottom-nav");
  }, [show]);

  if (!show) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        height: "58px",
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "rgba(4, 5, 9, 0.85)",
        backdropFilter: "blur(28px) saturate(180%) brightness(0.98)",
        WebkitBackdropFilter: "blur(28px) saturate(180%) brightness(0.98)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 -1px 0 rgba(57,255,20,0.05)",
      }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = location === href;
        return (
          <Link key={href} href={href}>
            <div
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full cursor-pointer select-none"
              style={{ color: active ? "hsl(112,100%,54%)" : "rgba(255,255,255,0.55)" }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
