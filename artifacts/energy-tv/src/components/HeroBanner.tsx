import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Play, Info, Star, Bookmark, BookmarkCheck } from "lucide-react";
import { trending as staticTrending, type Media } from "@/data/movies";
import { toggleWatchlist, isInWatchlist } from "@/data/watchlist";
import { SkeletonHero } from "@/components/SkeletonCard";

interface HeroBannerProps {
  overrideItems?: Media[];
  loading?: boolean;
}

export default function HeroBanner({ overrideItems, loading }: HeroBannerProps) {
  const featured = (overrideItems && overrideItems.length > 0 ? overrideItems : staticTrending)
    .filter((m) => m.backdrop)
    .slice(0, 6);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [inWatchlist, setInWatchlist] = useState(false);

  const media = featured[Math.min(currentIdx, featured.length - 1)];

  useEffect(() => { setCurrentIdx(0); }, [overrideItems]);
  useEffect(() => { if (media) setInWatchlist(isInWatchlist(media.id)); }, [currentIdx, media?.id]);
  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => setCurrentIdx((p) => (p + 1) % featured.length), 7000);
    return () => clearInterval(t);
  }, [featured.length]);

  if (loading) return <SkeletonHero />;
  if (!media) return <SkeletonHero />;

  return (
    <div className="relative w-full h-[36vh] sm:h-[45vh] min-h-[260px] sm:min-h-[320px] max-h-[420px] overflow-hidden">
      {/* Backdrop slides */}
      {featured.map((item, idx) => (
        <div
          key={item.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: idx === currentIdx ? 1 : 0 }}
        >
          <img src={item.backdrop} alt="" className="w-full h-full object-cover" />
        </div>
      ))}

      {/* Cinematic gradient overlays */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(105deg, rgba(4,5,9,0.92) 0%, rgba(4,5,9,0.45) 50%, rgba(4,5,9,0.15) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(0deg, rgba(4,5,9,1) 0%, rgba(4,5,9,0.15) 40%, transparent 70%)",
        }}
      />

      {/* Subtle neon ambient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: "linear-gradient(0deg, rgba(57,255,20,0.025) 0%, transparent 100%)" }}
      />

      {/* Content glass panel */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10">
        <div
          className="inline-flex items-center gap-2 mb-2 sm:mb-3 px-3 py-1 rounded-full"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <span
            className="text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider text-black"
            style={{
              background: "linear-gradient(135deg, hsl(112,100%,54%), hsl(112,100%,40%))",
              boxShadow: "0 0 6px rgba(57,255,20,0.4)",
            }}
          >
            {media.type === "tv" ? "Series" : "Movie"}
          </span>
          <Star className="w-3 h-3 fill-current" style={{ color: "hsl(112,100%,54%)" }} />
          <span className="text-xs font-bold neon-text" style={{ color: "hsl(112,100%,54%)" }}>{media.rating}</span>
          <span className="text-xs text-white/50">{media.year}</span>
          {media.quality && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.65)",
              }}
            >{media.quality}</span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white leading-tight max-w-xl mb-1.5 sm:mb-2" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>
          {media.title}
        </h1>

        <p className="text-xs text-white/50 max-w-md line-clamp-1 sm:hidden mb-2 leading-relaxed">
          {media.overview}
        </p>
        <p className="text-sm text-white/55 max-w-md line-clamp-2 hidden sm:block mb-3 leading-relaxed">
          {media.overview}
        </p>

        {/* Genre chips — glass pills */}
        <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-5">
          {media.genres.slice(0, 3).map((g) => (
            <span
              key={g}
              className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-medium text-white/65"
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >{g}</span>
          ))}
        </div>

        {/* CTA row — compact icon-plus-label buttons on phones so all three fit one row */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link href={`/detail/${media.type}/${media.id}`}>
            <button className="btn-neon flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all">
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> Watch Now
            </button>
          </Link>

          <button
            onClick={() => setInWatchlist(toggleWatchlist(media.id))}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-white/85 transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            {inWatchlist
              ? <><BookmarkCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: "hsl(112,100%,54%)" }} /> Saved</>
              : <><Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Save</>}
          </button>

          <Link href={`/detail/${media.type}/${media.id}`}>
            <button
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-white/75 transition-all hover:scale-105 hover:text-white/95"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Details
            </button>
          </Link>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center gap-2 mt-3 sm:mt-5">
          {featured.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className="transition-all duration-400 rounded-full"
              style={{
                width: idx === currentIdx ? "28px" : "6px",
                height: "6px",
                background: idx === currentIdx
                  ? "linear-gradient(90deg, hsl(112,100%,54%), hsl(112,100%,44%))"
                  : "rgba(255,255,255,0.2)",
                boxShadow: idx === currentIdx ? "0 0 8px rgba(57,255,20,0.6)" : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
