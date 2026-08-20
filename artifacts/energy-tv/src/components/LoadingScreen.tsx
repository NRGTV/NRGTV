import { useEffect, useState } from "react";

// How long the splash stays visible before fading out. This is independent
// of the ambient boot sound now — see AmbientBootSound.tsx — so the sound
// can keep playing softly in the background even after this fades away.
const DISPLAY_MS = 2600;
const FADE_MS = 350;

export default function LoadingScreen({ onFinish }: { onFinish: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), DISPLAY_MS);
    const finishTimer = setTimeout(() => onFinish(), DISPLAY_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
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
