import { useState } from "react";
import { Bookmark, Clock } from "lucide-react";
import MediaCard from "@/components/MediaCard";
import { getWatchlist, getHistory } from "@/data/watchlist";
import { getMediaById } from "@/data/movies";

export default function Watchlist() {
  const [tab, setTab] = useState<"watchlist" | "history">("watchlist");
  const [refresh, setRefresh] = useState(0);

  const watchlistIds = getWatchlist();
  const historyIds = getHistory();

  const watchlistItems = watchlistIds.map((id) => getMediaById(id)).filter(Boolean) as NonNullable<ReturnType<typeof getMediaById>>[];
  const historyItems = historyIds.map((id) => getMediaById(id)).filter(Boolean) as NonNullable<ReturnType<typeof getMediaById>>[];

  const currentItems = tab === "watchlist" ? watchlistItems : historyItems;

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-3 sm:px-4 md:px-6 pt-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-foreground">My Library</h1>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("watchlist")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={tab === "watchlist" ? {
              background: "hsl(112,100%,54%)",
              color: "black",
              boxShadow: "0 0 10px hsl(112 100% 54% / 0.35)",
            } : { background: "hsl(220,14%,15%)", color: "hsl(0,0%,55%)" }}
          >
            <Bookmark className="w-4 h-4" />
            Watchlist
            {watchlistIds.length > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                style={tab === "watchlist" ? {
                  background: "rgba(0,0,0,0.2)",
                  color: "black",
                } : { background: "hsl(220,14%,20%)", color: "hsl(0,0%,55%)" }}
              >
                {watchlistIds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("history")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={tab === "history" ? {
              background: "hsl(112,100%,54%)",
              color: "black",
              boxShadow: "0 0 10px hsl(112 100% 54% / 0.35)",
            } : { background: "hsl(220,14%,15%)", color: "hsl(0,0%,55%)" }}
          >
            <Clock className="w-4 h-4" />
            History
          </button>
        </div>

        {currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            {tab === "watchlist" ? (
              <>
                <Bookmark className="w-14 h-14 mb-4 opacity-20" />
                <p className="text-base font-medium text-foreground/50">Your watchlist is empty</p>
                <p className="text-sm mt-1">Save movies and shows to watch later</p>
              </>
            ) : (
              <>
                <Clock className="w-14 h-14 mb-4 opacity-20" />
                <p className="text-base font-medium text-foreground/50">No history yet</p>
                <p className="text-sm mt-1">Content you've viewed will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="media-grid">
            {currentItems.map((media) => (
              <div key={media.id} className="flex justify-center">
                <MediaCard
                  media={media}
                  size="lg"
                  onWatchlistChange={() => setRefresh((r) => r + 1)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
