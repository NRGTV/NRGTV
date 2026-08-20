import { useEffect, useRef } from "react";

// Lower, atmospheric level rather than a full-blast sound effect.
const TARGET_VOLUME = 0.35;
const FADE_IN_MS = 500;
const FADE_OUT_MS = 900; // fades out over the tail of the clip instead of cutting off

export default function AmbientBootSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const fadeFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;

    function fadeVolumeTo(target: number, ms: number) {
      if (fadeFrameRef.current) cancelAnimationFrame(fadeFrameRef.current);
      const start = audio!.volume;
      const startTime = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / ms);
        audio!.volume = start + (target - start) * t;
        if (t < 1) fadeFrameRef.current = requestAnimationFrame(step);
      };
      fadeFrameRef.current = requestAnimationFrame(step);
    }

    const fallbackEvents = ["pointerdown", "keydown", "touchstart"] as const;

    function removeFallbackListeners() {
      fallbackEvents.forEach((evt) => window.removeEventListener(evt, attemptPlayback));
    }

    function attemptPlayback() {
      if (startedRef.current) return;
      audio!
        .play()
        .then(() => {
          startedRef.current = true;
          fadeVolumeTo(TARGET_VOLUME, FADE_IN_MS);
          removeFallbackListeners();
        })
        .catch(() => {
          // Autoplay blocked (normal on a fresh page load, before any user
          // gesture). The listeners below retry on the first interaction
          // anywhere on the page — guarantees this plays at least once per
          // session, just possibly a beat later than boot.
        });
    }

    function handleTimeUpdate() {
      if (!audio!.duration) return;
      const remaining = audio!.duration - audio!.currentTime;
      if (remaining > 0 && remaining <= FADE_OUT_MS / 1000) {
        fadeVolumeTo(0, FADE_OUT_MS);
      }
    }

    fallbackEvents.forEach((evt) => window.addEventListener(evt, attemptPlayback, { once: true }));
    audio.addEventListener("timeupdate", handleTimeUpdate);
    attemptPlayback();

    return () => {
      removeFallbackListeners();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      if (fadeFrameRef.current) cancelAnimationFrame(fadeFrameRef.current);
      audio.pause();
    };
  }, []);

  return <audio ref={audioRef} src="/sfx/thunder-clap.mp3" preload="auto" />;
}
