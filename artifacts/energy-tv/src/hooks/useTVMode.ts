import { useEffect, useRef } from "react";

function isXbox() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Xbox|Xbox One|Xbox Series/.test(ua);
}

function tryRequestFullscreen(el: Element) {
  const docEl: any = el;
  if (docEl.requestFullscreen) return docEl.requestFullscreen();
  if (docEl.webkitRequestFullscreen) return docEl.webkitRequestFullscreen();
  if (docEl.msRequestFullscreen) return docEl.msRequestFullscreen();
  if (docEl.mozRequestFullScreen) return docEl.mozRequestFullScreen();
  return Promise.reject(new Error("Fullscreen API not available"));
}

export default function useTVMode() {
  const interactedRef = useRef(false);

  useEffect(() => {
    // Determine TV mode from path (/tv-site) or ?tv=1 query param
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const tvParam = url.searchParams.get("tv");
    const tvPath = url.pathname.startsWith("/tv") || url.pathname === "/tv-site";
    const enabled = tvParam === "1" || tvPath;
    if (!enabled) return;

    // Add class for CSS rules
    document.documentElement.classList.add("tv-mode");

    // On Xbox Edge, try to enter fullscreen on first user gesture
    const shouldAutoFullscreen = isXbox() || /Edg\//.test(navigator.userAgent || "");

    function onFirstInteraction() {
      if (interactedRef.current) return;
      interactedRef.current = true;

      // Attempt fullscreen (must be user-initiated)
      tryRequestFullscreen(document.documentElement).catch(() => {
        // ignore failures
      });

      // Hide mouse cursor after inactivity for TV UX
      let timeout: any;
      function hideCursor() {
        document.documentElement.classList.add("tv-hide-cursor");
      }
      function showCursor() {
        document.documentElement.classList.remove("tv-hide-cursor");
        clearTimeout(timeout);
        timeout = setTimeout(hideCursor, 3000);
      }
      document.addEventListener("mousemove", showCursor);
      document.addEventListener("keydown", showCursor);
      document.addEventListener("gamepad-action", showCursor as any);
      // initial schedule
      timeout = setTimeout(hideCursor, 3000);

      // cleanup for listeners on unmount
      const cleanup = () => {
        clearTimeout(timeout);
        document.removeEventListener("mousemove", showCursor);
        document.removeEventListener("keydown", showCursor);
        document.removeEventListener("gamepad-action", showCursor as any);
      };

      // store cleanup on ref for later removal
      (onFirstInteraction as any)._cleanup = cleanup;
    }

    // Attach gesture listeners
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    window.addEventListener("click", onFirstInteraction, { once: true });
    window.addEventListener("gamepad-action", onFirstInteraction as any, { once: true });

    // If already in a user-gesture context (very rare), try immediately
    // (e.g., invoked from a click handler already)

    return () => {
      // remove class and any cleanup
      document.documentElement.classList.remove("tv-mode");
      try {
        const cleanup = (onFirstInteraction as any)._cleanup;
        if (cleanup) cleanup();
      } catch (_) {}
    };
  }, []);
}
