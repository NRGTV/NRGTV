import { Capacitor } from "@capacitor/core";

// This app has no Play Store / Apple review process behind it, so there's
// no channel for a truly silent, automatic install. What this DOES do:
// on the Android build, check GitHub Releases for a newer build than the
// one currently installed, and if there is one, surface it so the user can
// download + sideload-install the update in a couple of taps. Desktop
// builds get real silent auto-updates via electron-updater instead — see
// main.js.

const REPO = "NRGTV/NRGTV";

// Baked in at build time from the CI run number (see build-desktop.yml,
// VITE_APP_BUILD). 0 means "not a CI build" (e.g. local dev) — never
// treat that as out of date.
const CURRENT_BUILD = Number(import.meta.env.VITE_APP_BUILD || 0);

const DISMISSED_KEY = "nrgtv:update-dismissed-build";

export interface UpdateInfo {
  latestBuild: number;
  downloadUrl: string;
  releaseUrl: string;
}

/** Only meaningful on the sideloaded Android build. */
export function isUpdateCheckSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android" && CURRENT_BUILD > 0;
}

export async function checkForAppUpdate(): Promise<UpdateInfo | null> {
  if (!isUpdateCheckSupported()) return null;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const match = /^build-(\d+)$/.exec(data.tag_name ?? "");
    if (!match) return null;

    const latestBuild = Number(match[1]);
    if (latestBuild <= CURRENT_BUILD) return null;

    const dismissed = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    if (dismissed >= latestBuild) return null;

    const apkAsset = (data.assets ?? []).find((a: { name?: string }) => a.name?.endsWith(".apk"));

    return {
      latestBuild,
      downloadUrl: apkAsset?.browser_download_url ?? data.html_url,
      releaseUrl: data.html_url,
    };
  } catch {
    // Offline, rate-limited, GitHub down, whatever — fail silently, this
    // is a background nicety, not something worth surfacing an error for.
    return null;
  }
}

export function dismissUpdate(build: number) {
  localStorage.setItem(DISMISSED_KEY, String(build));
}
