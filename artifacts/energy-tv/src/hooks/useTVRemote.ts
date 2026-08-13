import { useEffect } from "react";

function dispatch(name: string, detail: any) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

const KEY_TO_ACTION: Record<string, string> = {
  ArrowLeft: "navigate-left",
  ArrowRight: "navigate-right",
  ArrowUp: "navigate-up",
  ArrowDown: "navigate-down",
  Enter: "confirm",
  " ": "confirm",
  Escape: "back",
  Backspace: "back",
  MediaPlayPause: "playpause",
  MediaPlay: "play",
  MediaPause: "pause",
  MediaStop: "stop",
};

export default function useTVRemote() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key;
      const action = KEY_TO_ACTION[k];
      if (action) {
        e.preventDefault();
        dispatch("tv-remote", { key: k, action, altKey: e.altKey, ctrlKey: e.ctrlKey });
        dispatch("gamepad-action", { action, raw: { key: k } });
        return;
      }

      const code = (e as any).keyCode;
      // Common TV platform "back" key on some devices
      if (code === 10009) {
        e.preventDefault();
        dispatch("tv-remote", { keyCode: code, action: "back" });
        dispatch("gamepad-action", { action: "back", raw: { keyCode: code } });
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
