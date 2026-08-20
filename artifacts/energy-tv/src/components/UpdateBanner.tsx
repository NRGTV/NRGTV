import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { checkForAppUpdate, dismissUpdate, type UpdateInfo } from "@/lib/updateCheck";

export default function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkForAppUpdate().then((info) => {
      if (!cancelled) setUpdate(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!update) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        bottom: "20px",
        maxWidth: "calc(100vw - 32px)",
        background: "rgba(10,12,18,0.96)",
        border: "1px solid rgba(57,255,20,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(57,255,20,0.06)",
        backdropFilter: "blur(24px)",
      }}
    >
      <Download className="w-4 h-4 shrink-0" style={{ color: "hsl(112,100%,54%)" }} />
      <div className="min-w-0">
        <p className="text-sm text-white font-medium">Update available</p>
        <p className="text-[11px] text-muted-foreground">Build {update.latestBuild} is ready to install</p>
      </div>
      <a
        href={update.downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
        style={{ background: "hsl(112,100%,54%)", color: "#000" }}
      >
        Download
      </a>
      <button
        aria-label="Dismiss"
        className="shrink-0 p-1 text-muted-foreground hover:text-white"
        onClick={() => {
          dismissUpdate(update.latestBuild);
          setUpdate(null);
        }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
