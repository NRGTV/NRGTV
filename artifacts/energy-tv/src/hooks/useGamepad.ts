import { useEffect, useRef } from "react";

type ButtonEvent = {
  index: number;
  pressed: boolean;
  value: number;
  gamepadIndex: number;
};

function dispatch(name: string, detail: any) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export default function useGamepad() {
  const rafRef = useRef<number | null>(null);
  const prevButtons = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!("getGamepads" in navigator)) return;

    let mounted = true;

    function poll() {
      if (!mounted) return;
      const gps = (navigator as any).getGamepads ? (navigator as any).getGamepads() : [];
      for (let i = 0; i < gps.length; i++) {
        const gp = gps[i];
        if (!gp) continue;
        gp.buttons.forEach((b: any, idx: number) => {
          const key = `${i}:${idx}`;
          const pressed = !!b.pressed;
          const prev = !!prevButtons.current[key];
          if (pressed !== prev) {
            prevButtons.current[key] = pressed;
            const ev: ButtonEvent = { index: idx, pressed, value: b.value, gamepadIndex: i };
            dispatch("gamepad-button", ev);

            if (pressed) {
              if (idx === 0) dispatch("gamepad-action", { action: "confirm", raw: ev });
              else if (idx === 1) dispatch("gamepad-action", { action: "back", raw: ev });
              else if (idx === 9) dispatch("gamepad-action", { action: "menu", raw: ev });
              else if (idx === 12) dispatch("gamepad-action", { action: "navigate-up", raw: ev });
              else if (idx === 13) dispatch("gamepad-action", { action: "navigate-down", raw: ev });
              else if (idx === 14) dispatch("gamepad-action", { action: "navigate-left", raw: ev });
              else if (idx === 15) dispatch("gamepad-action", { action: "navigate-right", raw: ev });
              else if (idx === 2) dispatch("gamepad-action", { action: "playpause", raw: ev });
            }
          }
        });

        gp.axes.forEach((a: number, axisIdx: number) => {
          const threshold = 0.7;
          if (axisIdx === 0) {
            if (a > threshold) dispatch("gamepad-action", { action: "navigate-right", raw: { axisIdx, value: a } });
            else if (a < -threshold) dispatch("gamepad-action", { action: "navigate-left", raw: { axisIdx, value: a } });
          } else if (axisIdx === 1) {
            if (a > threshold) dispatch("gamepad-action", { action: "navigate-down", raw: { axisIdx, value: a } });
            else if (a < -threshold) dispatch("gamepad-action", { action: "navigate-up", raw: { axisIdx, value: a } });
          }
        });
      }
      rafRef.current = requestAnimationFrame(poll);
    }

    rafRef.current = requestAnimationFrame(poll);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
