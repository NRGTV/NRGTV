import { useState } from "react";
import { Tv, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import MediaCard from "@/components/MediaCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { usePopularTV, useTopRatedTV, hasKey } from "@/hooks/useMedia";

const genres = ["All","Action","Adventure","Animation","Comedy","Crime","Drama","Fantasy","Mystery","Reality","Romance","Sci-Fi","Thriller","War"];
const qualities = ["All","4K","HD"];
const sorts = [
  { id:"popular",     label:"Popular"   },
  { id:"top_rated",   label:"Top Rated" },
  { id:"rating_desc", label:"Rating ↓"  },
  { id:"year_desc",   label:"Newest"    },
  { id:"title_asc",   label:"A–Z"       },
];

const GLASS_CHIP = (active: boolean): React.CSSProperties => active ? {
  background: "linear-gradient(135deg, hsl(112,100%,54%) 0%, hsl(112,100%,40%) 100%)",
  color: "#000", boxShadow: "0 0 8px rgba(57,255,20,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
  border: "none",
} : {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  color: "rgba(255,255,255,0.45)",
  border: "1px solid rgba(255,255,255,0.07)",
};

export default function TVShows() {
  const [genre, setGenre] = useState("All");
  const [quality, setQuality] = useState("All");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const popularQ  = usePopularTV(page);
  const topRatedQ = useTopRatedTV(page);
  const q = sort === "top_rated" ? topRatedQ : popularQ;

  const filtered = (q.data ?? [])
    .filter((m) => genre === "All"   || m.genres.includes(genre))
    .filter((m) => quality === "All" || m.quality === quality)
    .sort((a, b) => {
      if (sort === "rating_desc") return b.rating - a.rating;
      if (sort === "year_desc")   return b.year - a.year;
      if (sort === "title_asc")   return a.title.localeCompare(b.title);
      return 0;
    });

  const handleSort = (s: string) => { setSort(s); setPage(1); };
  const clearFilters = () => { setGenre("All"); setQuality("All"); };
  const hasActiveFilters = genre !== "All" || quality !== "All";

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-3 sm:px-4 md:px-6 pt-6 pb-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4" style={{ color: "hsl(112,100%,54%)" }} />
            <h1 className="text-lg font-black text-foreground">TV Shows</h1>
            {!q.isLoading && <span className="text-sm text-muted-foreground/50">({filtered.length})</span>}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all"
            style={showFilters ? {
              background: "rgba(57,255,20,0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(57,255,20,0.2)",
              color: "hsl(112,100%,54%)",
              boxShadow: "inset 0 1px 0 rgba(57,255,20,0.12)",
            } : {
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.55)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full" style={{ background:"hsl(112,100%,54%)" }} />}
          </button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
          {sorts.map((s) => (
            <button key={s.id} onClick={() => handleSort(s.id)} className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all" style={GLASS_CHIP(sort === s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        {showFilters && (
          <div
            className="rounded-3xl p-5 mb-5 space-y-4"
            style={{
              background: "rgba(255,255,255,0.025)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.065)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <Chips label="Genre"   options={genres}   value={genre}   onChange={setGenre}   />
            <Chips label="Quality" options={qualities} value={quality} onChange={setQuality} />
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}

        {q.isLoading ? (
          <div className="media-grid">
            {Array.from({length:20}).map((_,i)=><div key={i} className="flex justify-center"><SkeletonCard size="lg"/></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Tv className="w-10 h-10 mb-3 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground/50">No shows match your filters</p>
            <button onClick={clearFilters} className="mt-2 text-xs underline" style={{ color:"hsl(112,100%,54%)" }}>Clear</button>
          </div>
        ) : (
          <>
            <div className="media-grid">
              {filtered.map((m)=><div key={m.id} className="flex justify-center"><MediaCard media={m} size="lg"/></div>)}
            </div>
            {hasKey() && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button onClick={() => setPage((p)=>Math.max(1,p-1))} disabled={page===1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30 transition-all"
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)" }}>
                  <ChevronLeft className="w-4 h-4"/>Prev
                </button>
                <span className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background:"rgba(57,255,20,0.06)", border:"1px solid rgba(57,255,20,0.12)", color:"hsl(112,100%,54%)" }}>{page}</span>
                <button onClick={() => setPage((p)=>p+1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)" }}>
                  Next<ChevronRight className="w-4 h-4"/>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Chips({ label, options, value, onChange }: { label:string; options:string[]; value:string; onChange:(v:string)=>void }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all" style={GLASS_CHIP(value===o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
