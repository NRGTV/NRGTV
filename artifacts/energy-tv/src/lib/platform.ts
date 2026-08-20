import { Capacitor } from "@capacitor/core";

/**
 * True when running inside a packaged app — the Capacitor-wrapped Android
 * build, or the Electron desktop build — as opposed to the plain web/PWA
 * build in a regular browser tab.
 *
 * Electron has no equivalent to Capacitor.isNativePlatform(), so it's
 * detected via the renderer's user agent, which Electron sets to include
 * "Electron" by default unless the app overrides it (ours doesn't).
 */
export function isNativeApp(): boolean {
  if (Capacitor.isNativePlatform()) return true; // Android
  if (typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent)) return true; // Desktop
  return false;
}

/**
 * True on Android or iOS specifically — covers the Android app AND a
 * regular/PWA-installed browser tab on either OS (there's no native iOS
 * app, so UA-sniffing is the only signal available there).
 */
export function isMobileOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || "";

  if (/android/i.test(ua)) return true;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS 13+ reports as "MacIntel" but exposes multi-touch
  if (/mac/i.test(platform) && navigator.maxTouchPoints > 1) return true;
  return false;
}
