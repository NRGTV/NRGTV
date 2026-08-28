import { useEffect, useMemo, useRef, useState } from "react";
import { X, ExternalLink, Tv, Loader2, ChevronLeft, ChevronRight, Maximize } from "lucide-react";
import { Media } from "@/data/movies";
import { saveProgress } from "@/data/watchlist";
import { useCloudSync } from "@/hooks/useCloudSync";
import { lockLandscape, lockPortrait } from "@/lib/orientation";

interface PlayerModalProps {
  media:           Media;
  onClose:         () => void;
  initialSeason?:  number;
  initialEpisode?: number;
}

interface Source {
  id:    string;
  label: string;
  build: (opts: { id: number; isTV: boolean; season: number; episode: number }) => string;
}

// Six embeddable sources, keyed by TMDB id. Most mirror the same handful of
// public embed APIs that accept a TMDB id directly, so no extra lookups are needed.
const SOURCES: Source[] = [
  {
    id: "vidlink",
    label: "Vidlink",
    build: ({ id, isTV, season, episode }) =>
      isTV
        ? `https://vidlink.pro/embed/tv/${id}/${season}/${episode}`
        : `https://vidlink.pro/movie/${id}`,
  },
  {
    id: "vidsrc.cc",
    label: "Vidsrc",
    build: ({ id, isTV, season, episode }) =>
      isTV
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.cc/v2/embed/movie/${id}`,
  },
  {
    id: "vidsrc.to",
    label: "Vidsrc.to",
    build: ({ id, isTV, season, episode }) =>
      isTV
        ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    id: "embed.su",
    label: "Embed.su",
    build: ({ id, isTV, season, episode }) =>
      isTV
        ? `https://embed.su/embed/tv/${id}/${season}/${episode}`
        : `https://embed.su/embed/movie/${id}`,
  },
  {
    id: "moviesapi",
    label: "MoviesAPI",
    build: ({ id, isTV, season, episode }) =>
      isTV
        ? `https://moviesapi.club/tv/${id}-${season}-${episode}`
        : `https://moviesapi.club/movie/${id}`,
  },
  {
    id: "111movies",
    label: "111Movies",
    build: ({ id, isTV, season, episode }) =>
      isTV
        ? `https://111movies.com/tv/${id}/${season}/${episode}`
        : `https://111movies.com/movie/${id}`,
  },
];

type SourceStatus = "untried" | "checking" | "ok" | "failed";

// How long a source gets to prove it actually loaded before we treat it as
// dead and hop to the next one. Cross-origin embeds can't be inspected for
// real errors, so a load timeout is the only reliable signal we have.
const SOURCE_TIMEOUT_MS = 9000;

function sourceStorageKey(tmdbId: number, isTV: boolean) {
  return `energytv:lastSource:${isTV ? "tv" : "movie"}:${tmdbId}`;
}

// Figures out which source to try first: whatever last worked for this exact
// title, falling back to whatever last worked for anything, falling back to
// source 0.
function getPreferredSourceIdx(tmdbId: number, isTV: boolean): number {
  try {
    const preferredId =
      localStorage.getItem(sourceStorageKey(tmdbId, isTV)) ||
      localStorage.getItem("energytv:lastSource:global");
    if (preferredId) {
      const idx = SOURCES.findIndex((s) => s.id === preferredId);
      if (idx !== -1) return idx;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.) — just use default order
  }
  return 0;
}

function rememberWorkingSource(tmdbId: number, isTV: boolean, sourceId: string) {
  try {
    localStorage.setItem(sourceStorageKey(tmdbId, isTV), sourceId);
    localStorage.setItem("energytv:lastSource:global", sourceId);
  } catch {
    // ignore write failures, this is just a nice-to-have
  }
}

export default function PlayerModal({
  media,
  onClose,
  initialSeason,
  initialEpisode,
}: PlayerModalProps) {
  const isTV = media.type === "tv";
  const { push: pushToCloud } = useCloudSync();

  const [season, setSeason] = useState(initialSeason ?? 1);
  const [episode, setEpisode] = useState(initialEpisode ?? 1);
  const [needsPicker, setNeedsPicker] = useState(isTV && initialEpisode === undefined);

  const tmdbId = media.tmdbId || media.id;
  const totalSeasons = media.seasons ?? 1;

  const [sourceIdx, setSourceIdx] = useState(() => getPreferredSourceIdx(tmdbId, isTV));
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [sourceStatusMap, setSourceStatusMap] = useState<Record<number, SourceStatus>>({});
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);
  const [allSourcesFailed, setAllSourcesFailed] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const failedIndicesRef = useRef<Set<number>>(new Set());

  const activeSource = SOURCES[sourceIdx];
  const embedUrl = useMemo(
    () => activeSource.build({ id: tmdbId, isTV, season, episode }),
    [activeSource, tmdbId, isTV, season, episode]
  );

  // Mark progress + sync once the player actually starts playing.
  const markedRef = useRef(false);
  useEffect(() => {
    if (needsPicker || markedRef.current) return;
    markedRef.current = true;
    saveProgress(media.id, 100, {
      season: isTV ? season : undefined,
      episode: isTV ? episode : undefined,
    });
    pushToCloud();
  }, [needsPicker]);

  // Manually pick a source: gives it a clean slate (clears any prior "failed"
  // mark) and re-enables auto-switching in case every source had previously
  // timed out.
  const switchSource = (idx: number) => {
    failedIndicesRef.current.delete(idx);
    setAllSourcesFailed(false);
    setAutoSwitchEnabled(true);
    setSourceIdx(idx);
    setIframeKey((k) => k + 1);
  };

  // Walks forward from the source that just failed, wrapping around, and
  // jumps to the next one we haven't already ruled out. Stops (and surfaces
  // the "nothing worked" state) once every source has failed.
  const advanceToNextSource = (fromIdx: number) => {
    failedIndicesRef.current.add(fromIdx);
    if (failedIndicesRef.current.size >= SOURCES.length) {
      setAutoSwitchEnabled(false);
      setAllSourcesFailed(true);
      return;
    }
    for (let step = 1; step <= SOURCES.length; step++) {
      const candidate = (fromIdx + step) % SOURCES.length;
      if (!failedIndicesRef.current.has(candidate)) {
        setSourceIdx(candidate);
        setIframeKey((k) => k + 1);
        return;
      }
    }
  };

  // Every time the embed URL changes (new source, new episode, etc.) this
  // both resets the loading state and arms a timeout: if the iframe hasn't
  // fired onLoad by then, the source is presumed dead and we auto-advance.
  useEffect(() => {
    setLoading(true);
    setSourceStatusMap((prev) => ({ ...prev, [sourceIdx]: "checking" }));

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (autoSwitchEnabled) {
      timeoutRef.current = setTimeout(() => {
        setSourceStatusMap((prev) => ({ ...prev, [sourceIdx]: "failed" }));
        advanceToNextSource(sourceIdx);
      }, SOURCE_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedUrl]);

  const startPlayback = (s?: number, e?: number) => {
    if (s !== undefined) setSeason(s);
    if (e !== undefined) setEpisode(e);
    setNeedsPicker(false);
  };

  const openInNewTab = () => {
    window.open(embedUrl, "_blank", "noopener,noreferrer");
  };

  const requestPlayerFullscreen = () => {
    iframeRef.current?.requestFullscreen?.();
  };

  // Landscape-lock the screen for as long as the player is in fullscreen,
  // and re-lock portrait the moment it exits (browser fullscreen button,
  // Esc key, back gesture, etc. all fire fullscreenchange, not just our
  // own button) — portrait is the app-wide default everywhere else.
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        lockLandscape();
      } else {
        lockPortrait();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      lockPortrait();
    };
  }, []);

  // ─── Season / episode picker (TV shows opened without a specific episode) ───
  if (needsPicker) {
    const episodeCount = media.episodes?.filter((e) => e.season === season).length ?? 12;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
        <div className="bg-zinc-950 rounded-3xl p-8 max-w-md w-full text-center" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <Tv className="w-16 h-16 mx-auto mb-6" style={{ color: "hsl(112,100%,54%)" }} />
          <h2 className="text-2xl font-bold mb-2 text-white">{media.title}</h2>
          <p className="text-zinc-400 mb-6">Pick a season & episode to start watching</p>

          {totalSeasons > 1 && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-xs text-zinc-500 font-semibold w-16 text-right">Season</span>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="bg-zinc-900 text-white rounded-xl px-3 py-2 text-sm font-semibold outline-none"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-xs text-zinc-500 font-semibold w-16 text-right">Episode</span>
            <select
              value={episode}
              onChange={(e) => setEpisode(Number(e.target.value))}
              className="bg-zinc-900 text-white rounded-xl px-3 py-2 text-sm font-semibold outline-none"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {Array.from({ length: Math.max(episodeCount, episode) }, (_, i) => i + 1).map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => startPlayback()}
            className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 text-black"
            style={{ background: "linear-gradient(135deg,hsl(112,100%,54%),hsl(112,100%,40%))" }}
          >
            Play S{season} · E{episode}
          </button>

          <button onClick={onClose} className="mt-4 text-zinc-500 hover:text-white text-sm">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── Embedded player ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-0 sm:p-4">
      <div
        className="relative w-full h-full sm:h-auto sm:max-w-5xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: "#040508", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 90px rgba(0,0,0,0.8)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 shrink-0"
          style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-bold text-white truncate">{media.title}</p>
            {isTV && (
              <span className="text-[11px] font-semibold text-white/45 shrink-0">
                S{season} · E{episode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={requestPlayerFullscreen}
              title="Fullscreen"
              className="p-2 rounded-xl text-white/60 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Maximize className="w-4 h-4" />
            </button>
            <button
              onClick={openInNewTab}
              title="Open in new tab"
              className="p-2 rounded-xl text-white/60 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 rounded-xl text-white/60 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source switcher */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto hide-scrollbar shrink-0"
          style={{ background: "rgba(255,255,255,0.015)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-white/35 shrink-0 mr-1">Source</span>
          {SOURCES.map((s, idx) => {
            const status = sourceStatusMap[idx] ?? "untried";
            const dotColor =
              status === "ok" ? "#39ff14" : status === "failed" ? "#ff4444" : status === "checking" ? "#ffcc00" : "rgba(255,255,255,0.25)";
            return (
              <button
                key={s.id}
                onClick={() => switchSource(idx)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0"
                style={
                  idx === sourceIdx
                    ? {
                        background: "linear-gradient(135deg,hsl(112,100%,54%),hsl(112,100%,40%))",
                        color: "#000",
                        boxShadow: "0 0 10px rgba(57,255,20,0.35)",
                      }
                    : {
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.55)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === "checking" ? "animate-pulse" : ""}`}
                  style={{
                    background: dotColor,
                    boxShadow: status === "checking" ? "0 0 6px #ffcc00" : "none",
                  }}
                />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Episode nav (TV only) */}
        {isTV && (
          <div
            className="flex items-center justify-between px-4 py-2 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => episode > 1 && startPlayback(undefined, episode - 1)}
              disabled={episode <= 1}
              className="flex items-center gap-1 text-xs font-semibold text-white/50 hover:text-white disabled:opacity-25 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => setNeedsPicker(true)}
              className="text-xs font-semibold text-white/70 hover:text-white transition-all"
            >
              Change episode
            </button>
            <button
              onClick={() => startPlayback(undefined, episode + 1)}
              className="flex items-center gap-1 text-xs font-semibold text-white/50 hover:text-white transition-all"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Player */}
        <div className="relative flex-1" style={{ aspectRatio: "16/9" }}>
          {loading && !allSourcesFailed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10" style={{ background: "#040508" }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "hsl(112,100%,54%)" }} />
              <p className="text-xs text-white/40">
                {autoSwitchEnabled ? `Trying ${activeSource.label}…` : `Loading ${activeSource.label}…`}
              </p>
            </div>
          )}
          {allSourcesFailed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 px-6 text-center" style={{ background: "#040508" }}>
              <p className="text-sm text-white/60">None of the sources loaded in time.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => switchSource(sourceIdx)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black"
                  style={{ background: "linear-gradient(135deg,hsl(112,100%,54%),hsl(112,100%,40%))" }}
                >
                  Retry all sources
                </button>
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/70"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Open in new tab
                </button>
              </div>
            </div>
          )}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full"
            style={{ border: "none" }}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="origin"
            // allow-popups is required — these embeds detect blocked popups
            // and refuse to play ("please disable sandbox") otherwise. What
            // actually matters is that allow-top-navigation is NOT granted:
            // that's what stops the embed from hijacking this tab/app and
            // redirecting it to a random site. allow-popups-to-escape-sandbox
            // is deliberately omitted too, so any popup that does open is
            // itself still sandboxed (can't chain-redirect or spawn more).
            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
            onLoad={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setLoading(false);
              setSourceStatusMap((prev) => ({ ...prev, [sourceIdx]: "ok" }));
              rememberWorkingSource(tmdbId, isTV, activeSource.id);
            }}
            title={`${media.title} player — ${activeSource.label}`}
          />
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 text-center shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] text-white/30">
            Player not loading? It'll auto-switch sources in {SOURCE_TIMEOUT_MS / 1000}s, or{" "}
            <button onClick={openInNewTab} className="underline hover:text-white/60">open in a new tab</button> now.
          </p>
        </div>
      </div>
    </div>
  );
    }
    
