/**
 * Wraps the Screen Orientation API. Support is inconsistent — Chrome/Edge
 * on Android honor it, desktop Chrome/Firefox mostly ignore lock() outside
 * fullscreen, and Safari (desktop + iOS) doesn't implement lock() at all.
 * Every call is wrapped so an unsupported browser just silently no-ops
 * instead of throwing.
 */

export async function lockLandscape(): Promise<void> {
  const orientation = (screen as any).orientation;
  if (!orientation?.lock) return;
  try {
    await orientation.lock("landscape");
  } catch {
    // Unsupported / not allowed in this context (e.g. not fullscreen yet,
    // or the browser doesn't grant lock outside a native fullscreen app).
  }
}

export async function lockPortrait(): Promise<void> {
  const orientation = (screen as any).orientation;
  if (!orientation?.lock) return;
  try {
    await orientation.lock("portrait");
  } catch {
    // Same caveats as lockLandscape — silently no-op if unsupported.
  }
}

export function unlockOrientation(): void {
  const orientation = (screen as any).orientation;
  if (!orientation?.unlock) return;
  try {
    orientation.unlock();
  } catch {
    // no-op
  }
}
