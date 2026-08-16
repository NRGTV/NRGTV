/**
 * Home.tsx  (updated — uses real progress %, refreshes after cloud sync)
 */

import { useMemo, useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";
import HeroBanner   from "@/components/HeroBanner";
import CategoryRow  from "@/components/CategoryRow";
import MediaCard    from "@/components/MediaCard";
import { SkeletonRow } from "@/components/SkeletonCard";
import {
  useTrending, usePopularMovies, useTopRatedMovies,
  useNowPlaying, usePopularTV, useTopRatedTV, useAiringTV,
} from "@/hooks/useMedia";
import { getHistory, getProgress } from "@/data/watchlist";
import { getMediaById }            from "@/data/movies";
import { useCloudSync }            from "@/hooks/useCloudSync";

export default function Home() {
  const trending      = useTrending();
  const popularMovies = usePopularMovies();
  const topMovies     = useTopRatedMovies();
  const nowPlaying    = useNowPlaying();
  const popularTV     = usePopularTV();
  const topTV         = useTopRatedTV();
  const airingTV      = useAiringTV();

  // Re-render trigger for after cloud sync updates localStorage
  const [tick, setTick] = useState(0);
  const { syncing, lastSynced } = useCloudSync();

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("energytv:synced",  handler);
    window.addEventListener("energytv:changed", handler);
    return () => {
      window.removeEventListener("energytv:synced",  handler);
      window.removeEventListener("energytv:changed", handler);
    };
  }, []);

  const continueWatching = useMemo(() => {
    return getHistory()
      .map((id) => getMediaById(id))
      .filter(Boolean)
      .slice(0, 8) as NonNullable<ReturnType<typeof getMediaById>>[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner overrideItems={trending.data} loading={trending.isLoading} />

      <div className="pt-5 sm:pt-6">
        {continueWatching.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-2.5 sm:mb-3 px-3 sm:px-4 md:px-6">
              <Clock className="w-3.5 h-3.5" style={{ color: "hsl(112,100%,54%)" }} />
              <h2
                className="text-xs font-black uppercase tracking-widest text-foreground/90"
                style={{ letterSpacing: "0.08em" }}
              >
                Continue Watching
              </h2>
              {syncing && (
                <span className="ml-auto text-[10px] text-muted-foreground/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  Syncing…
                </span>
              )}
              {!syncing && lastSynced && (
                <span className="ml-auto text-[10px] text-muted-foreground/30">
                  Synced {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto px-3 sm:px-4 md:px-6 pb-2 hide-scrollbar">
              {continueWatching.map((item) => {
                const prog = getProgress(item.id);
                const pct  = prog?.percent ?? 0;
                return (
                  <div key={item.id} className="relative">
                    <MediaCard media={item} size="md" />
                    {/* Real progress bar */}
                    {pct > 0 && (
                      <div
                        className="absolute left-0 right-0 h-1 rounded-full overflow-hidden"
                        style={{ bottom: "36px", margin: "0 2px", background: "rgba(255,255,255,0.06)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width:      `${pct}%`,
                            background: "linear-gradient(90deg, hsl(112,100%,54%), hsl(112,100%,44%))",
                            boxShadow:  "0 0 6px rgba(57,255,20,0.5)",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {trending.isLoading     ? <SkeletonRow count={6} /> : <CategoryRow title="Trending Now"             items={trending.data ?? []} />}
        {nowPlaying.isLoading   ? <SkeletonRow count={6} /> : <CategoryRow title="Now Playing in Theaters"  items={nowPlaying.data ?? []} />}
        {popularMovies.isLoading? <SkeletonRow count={6} /> : <CategoryRow title="Popular Movies"           items={popularMovies.data ?? []} />}
        {topMovies.isLoading    ? <SkeletonRow count={6} /> : <CategoryRow title="Top Rated Movies"         items={topMovies.data ?? []} />}
        {airingTV.isLoading     ? <SkeletonRow count={6} /> : <CategoryRow title="Airing Now"               items={airingTV.data ?? []} />}
        {popularTV.isLoading    ? <SkeletonRow count={6} /> : <CategoryRow title="Popular TV Shows"         items={popularTV.data ?? []} />}
        {topTV.isLoading        ? <SkeletonRow count={6} /> : <CategoryRow title="Top Rated Series"         items={topTV.data ?? []} />}

        {!import.meta.env.VITE_TMDB_API_KEY && (
          <div
            className="mx-3 sm:mx-4 md:mx-6 mb-8 p-4 rounded-2xl sm:rounded-3xl"
            style={{
              background:          "rgba(57,255,20,0.04)",
              backdropFilter:      "blur(16px)",
              WebkitBackdropFilter:"blur(16px)",
              border:              "1px solid rgba(57,255,20,0.12)",
              boxShadow:           "inset 0 1px 0 rgba(57,255,20,0.08), 0 4px 24px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Zap className="w-4 h-4 shrink-0" style={{ color: "hsl(112,100%,54%)" }} />
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "hsl(112,100%,54%)" }}>
                  Add a TMDB API key to unlock live data
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get a free key at themoviedb.org → add{" "}
                  <code className="text-foreground/70 text-[11px]">VITE_TMDB_API_KEY</code> in Secrets
                </p>
              </div>
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-neon shrink-0 px-3.5 py-1.5 rounded-xl text-xs"
              >Get API Key</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
