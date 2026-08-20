import { useEffect, useRef, useState } from "react";

// How long the splash stays on screen before fading out. The thunder clap
// itself runs ~9.5s (the punchy crack is all up front in the first second
// or two) — showing the full splash for that long on every single launch
// would get old fast, so this cuts it short at a snappier length and just
// lets the tail of the clip get cut off, same as the fade.
const DISPLAY_MS = 2600;
const FADE_MS = 350;

export default function LoadingScreen({ onFinish }: { onFinish: () => void }) {
  const [fading, setFading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Best-effort: browsers block autoplay-with-sound before any user
    // gesture has happened on the page, so this may silently no-op on
    // first-ever page load in a browser tab. It plays reliably in the
    // Electron build (see main.js's autoplayPolicy setting) and on any
    // repeat visit once the browser trusts the site.
    audioRef.current?.play().catch(() => {});

    const fadeTimer = setTimeout(() => setFading(true), DISPLAY_MS);
    const finishTimer = setTimeout(() => onFinish(), DISPLAY_MS + FADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      audioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6"
      style={{
        background: "radial-gradient(circle at 50% 45%, #0d130a 0%, #050506 65%)",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <audio ref={audioRef} src="/sfx/thunder-clap.mp3" preload="auto" />

      <img
        src="/pwa-512.png"
        alt="NRGTV"
        className="loading-screen-logo w-20 h-20 rounded-2xl"
      />

      <span className="text-foreground font-black text-2xl tracking-tight select-none">
        NRG<span style={{ color: "hsl(112,100%,54%)" }}>TV</span>
      </span>
    </div>
  );
}
