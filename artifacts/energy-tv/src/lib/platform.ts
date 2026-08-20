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
