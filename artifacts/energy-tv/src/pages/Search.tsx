import { useState, useMemo } from "react";
import { Search as SearchIcon, X, Film, Tv, TrendingUp } from "lucide-react";
import MediaCard from "@/components/MediaCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useSearch, hasKey } from "@/hooks/useMedia";
import { allMedia, searchMedia } from "@/data/movies";

type FilterType = "all" | "movie" | "tv";

const GLASS_CHIP = (active: boolean): React.CSSProperties => active ? {
  background: "linear-gradient(135deg, hsl(112,100%,54%) 0%, hsl(112,100%,40%) 100%)",
  color: "#000", boxShadow: "0 0 8px rgba(57,255,20,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
  border: "none",
} : {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  color: "rgba(255,255,255,0.45)",
  border: "1px solid rgba(255,255,255,0.08)",
};

export default function Search() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const tmdbResults = useSearch(query, filter);

  const localResults = useMemo(() => {
    if (!query.trim()) return allMedia.filter((m) => filter === "all" || m.type === filter);
    return searchMedia(query).filter((m) => filter === "all" || m.type === filter);
  }, [query, filter]);

  const usingTmdb = hasKey() && query.trim().length >= 2;
  const isLoading = usingTmdb && tmdbResults.isLoading;
  const results   = usingTmdb && tmdbResults.data ? tmdbResults.data : localResults;

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-3 sm:px-4 md:px-6 pt-6 pb-10">
        {/* Search input — glass */}
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
          <input
            type="search"
            placeholder={hasKey() ? "Search millions of movies & TV shows…" : "Search library…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none transition-all rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(57,255,20,0.35)";
              e.target.style.boxShadow = "inset 0 1px 0 rgba(57,255,20,0.08), 0 0 0 1px rgba(57,255,20,0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.08)";
              e.target.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.06)";
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 mb-6">
          {([["all","All",TrendingUp],["movie","Movies",Film],["tv","TV Shows",Tv]] as const).map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={GLASS_CHIP(filter === val)}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground/35 shrink-0">
            {!isLoading && results.length > 0 && `${results.length} result${results.length!==1?"s":""}`}
            {usingTmdb && !isLoading && results.length > 0 && <span className="opacity-40 ml-1">· TMDB</span>}
          </span>
        </div>

        {isLoading ? (
          <div className="media-grid">
            {Array.from({length:12}).map((_,i)=><div key={i} className="flex justify-center"><SkeletonCard size="md"/></div>)}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)" }}
            >
              <SearchIcon className="w-7 h-7 text-muted-foreground/25" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground/50">{query ? `No results for "${query}"` : "Start typing to search"}</p>
          </div>
        ) : (
          <div className="media-grid">
            {results.map((m)=><div key={m.id} className="flex justify-center"><MediaCard media={m} size="md"/></div>)}
          </div>
        )}
      </div>
    </div>
  );
}
