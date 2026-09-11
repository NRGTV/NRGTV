import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Plus,
  Volume2,
  VolumeX,
  Music,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchRhymes, fetchNearRhymes, type RhymeResult } from "@/lib/rhymes";
import {
  useStudioProjects,
  useCreateStudioProject,
  useUpdateStudioProject,
  useDeleteStudioProject,
  useStudioTracks,
  useAddStudioTrack,
  useUpdateStudioTrack,
  useDeleteStudioTrack,
  type StudioProject,
} from "@/hooks/useStudio";

const NEON = "hsl(112,100%,54%)";
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

// ─── Metronome ──────────────────────────────────────────────

function useMetronome(bpm: number) {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const click = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  useEffect(() => {
    if (!on) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    click();
    timerRef.current = window.setInterval(click, 60000 / bpm);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [on, bpm, click]);

  useEffect(() => () => ctxRef.current?.close(), []);

  return { on, toggle: () => setOn((v) => !v) };
}

// ─── Recorder ───────────────────────────────────────────────

function useRecorder(onDone: (blob: Blob) => void) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onDone(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      setError("Couldn't access your microphone — check browser/site permissions.");
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return { recording, start, stop, error };
}

// ─── Rhyme panel ────────────────────────────────────────────

function RhymePanel({ onInsert }: { onInsert: (word: string) => void }) {
  const [word, setWord] = useState("");
  const [mode, setMode] = useState<"perfect" | "slant">("perfect");
  const [results, setResults] = useState<RhymeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!word.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await (mode === "perfect" ? fetchRhymes(word) : fetchNearRhymes(word));
      setResults(r);
    } catch {
      setError("Rhyme lookup failed — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-4" style={card}>
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-3">
        <Music className="w-4 h-4" style={{ color: NEON }} />
        Rhyme finder
      </h3>

      <div className="flex gap-2 mb-2">
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Type a word..."
          className="flex-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        />
        <button
          onClick={search}
          disabled={loading || !word.trim()}
          className="px-3 py-2 rounded-xl text-xs font-bold text-black disabled:opacity-40"
          style={{ background: NEON }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
        </button>
      </div>

      <div className="flex gap-1.5 mb-3">
        {(["perfect", "slant"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors"
            style={{
              background: mode === m ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.04)",
              color: mode === m ? NEON : "rgba(255,255,255,0.5)",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
        {results.map((r) => (
          <button
            key={r.word}
            onClick={() => onInsert(r.word)}
            className="px-2.5 py-1 rounded-lg text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
            title="Insert into lyrics"
          >
            {r.word}
          </button>
        ))}
        {!loading && results.length === 0 && (
          <p className="text-xs text-muted-foreground/40">Search a word to see rhymes here.</p>
        )}
      </div>
    </div>
  );
}

// ─── Track row ──────────────────────────────────────────────

function TrackRow({
  track,
  audioRef,
  onUpdate,
  onDelete,
}: {
  track: { id: string; name: string; url: string; volume: number; muted: boolean };
  audioRef: (el: HTMLAudioElement | null) => void;
  onUpdate: (fields: { volume?: number; muted?: boolean }) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={card}>
      <button onClick={() => onUpdate({ muted: !track.muted })} className="shrink-0">
        {track.muted ? (
          <VolumeX className="w-4 h-4 text-muted-foreground/50" />
        ) : (
          <Volume2 className="w-4 h-4" style={{ color: NEON }} />
        )}
      </button>

      <span className="text-sm text-foreground/90 truncate w-24 shrink-0">{track.name}</span>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={track.volume}
        onChange={(e) => onUpdate({ volume: parseFloat(e.target.value) })}
        className="flex-1"
        style={{ accentColor: NEON }}
      />

      <audio ref={audioRef} src={track.url} preload="auto" className="hidden" />

      <button onClick={onDelete} className="shrink-0 text-muted-foreground/40 hover:text-red-400 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────

export default function Studio() {
  const { user, loading: authLoading } = useAuth();

  const { data: projects } = useStudioProjects();
  const createProject = useCreateStudioProject();
  const updateProject = useUpdateStudioProject();
  const deleteProject = useDeleteStudioProject();

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = projects?.find((p) => p.id === activeId) ?? projects?.[0] ?? null;

  useEffect(() => {
    if (!activeId && projects && projects.length > 0) setActiveId(projects[0].id);
  }, [projects, activeId]);

  const { data: tracks } = useStudioTracks(active?.id);
  const addTrack = useAddStudioTrack(active?.id ?? "");
  const updateTrack = useUpdateStudioTrack(active?.id ?? "");
  const deleteTrack = useDeleteStudioTrack(active?.id ?? "");

  const [lyricsDraft, setLyricsDraft] = useState("");
  const [bpmDraft, setBpmDraft] = useState(90);
  const saveTimer = useRef<number | null>(null);
  const lyricsRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLyricsDraft(active?.lyrics ?? "");
    setBpmDraft(active?.bpm ?? 90);
  }, [active?.id]);

  const scheduleSave = (fields: Partial<Pick<StudioProject, "lyrics" | "bpm">>) => {
    if (!active) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      updateProject.mutate({ id: active.id, ...fields });
    }, 800);
  };

  const metronome = useMetronome(bpmDraft);
  const recorder = useRecorder(async (blob) => {
    if (!active) return;
    await addTrack.mutateAsync({ blob, name: `Take ${(tracks?.length ?? 0) + 1}` });
  });

  const audioEls = useRef<Record<string, HTMLAudioElement | null>>({});
  const [playing, setPlaying] = useState(false);

  const playAll = () => {
    Object.values(audioEls.current).forEach((el) => el?.play());
    setPlaying(true);
  };
  const stopAll = () => {
    Object.values(audioEls.current).forEach((el) => {
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
    });
    setPlaying(false);
  };

  useEffect(() => {
    if (!tracks) return;
    tracks.forEach((t) => {
      const el = audioEls.current[t.id];
      if (el) {
        el.volume = t.muted ? 0 : t.volume;
      }
    });
  }, [tracks]);

  const insertAtCursor = (word: string) => {
    const el = lyricsRef.current;
    if (!el) {
      setLyricsDraft((prev) => `${prev}${word} `);
      return;
    }
    const start = el.selectionStart ?? lyricsDraft.length;
    const end = el.selectionEnd ?? lyricsDraft.length;
    const next = lyricsDraft.slice(0, start) + word + lyricsDraft.slice(end);
    setLyricsDraft(next);
    scheduleSave({ lyrics: next });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + word.length;
    });
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background pt-14" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-14 pb-10 flex items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Sign in to use the studio.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14 pb-16">
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
        {/* Project bar */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {projects?.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors"
              style={{
                background: p.id === active?.id ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.04)",
                color: p.id === active?.id ? NEON : "rgba(255,255,255,0.6)",
              }}
            >
              {p.title}
            </button>
          ))}
          <button
            onClick={async () => {
              const p = await createProject.mutateAsync("Untitled");
              setActiveId(p.id);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold text-muted-foreground/70 hover:text-foreground transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {!active ? (
          <p className="text-sm text-muted-foreground">Create a project to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: lyrics + rhymes */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl p-4" style={card}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <input
                    value={active.title}
                    onChange={(e) => updateProject.mutate({ id: active.id, title: e.target.value })}
                    className="text-sm font-bold text-foreground bg-transparent outline-none flex-1"
                  />
                  <button
                    onClick={() => deleteProject.mutate(active.id)}
                    className="text-muted-foreground/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  ref={lyricsRef}
                  value={lyricsDraft}
                  onChange={(e) => {
                    setLyricsDraft(e.target.value);
                    scheduleSave({ lyrics: e.target.value });
                  }}
                  placeholder="Write your bars..."
                  rows={14}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                />

                <div className="flex items-center gap-3 mt-3">
                  <label className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                    BPM
                    <input
                      type="number"
                      min={40}
                      max={220}
                      value={bpmDraft}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10) || 90;
                        setBpmDraft(v);
                        scheduleSave({ bpm: v });
                      }}
                      className="w-16 rounded-lg px-2 py-1 text-xs text-foreground outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </label>

                  <button
                    onClick={metronome.toggle}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                    style={{
                      background: metronome.on ? "rgba(57,255,20,0.15)" : "rgba(255,255,255,0.05)",
                      color: metronome.on ? NEON : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {metronome.on ? "Stop click" : "Start click"}
                  </button>
                </div>
              </div>

              <RhymePanel onInsert={insertAtCursor} />
            </div>

            {/* Right: recorder + mixer */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl p-4 flex flex-col items-center gap-3" style={card}>
                <button
                  onClick={recorder.recording ? recorder.stop : recorder.start}
                  disabled={addTrack.isPending}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: recorder.recording
                      ? "rgba(239,68,68,0.15)"
                      : "linear-gradient(135deg, hsl(112,100%,54%), hsl(112,100%,36%))",
                    boxShadow: recorder.recording ? "0 0 0 4px rgba(239,68,68,0.15)" : "0 0 20px rgba(57,255,20,0.3)",
                  }}
                >
                  {addTrack.isPending ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : recorder.recording ? (
                    <Square className="w-6 h-6 text-red-400" fill="currentColor" />
                  ) : (
                    <Mic className="w-6 h-6 text-black" />
                  )}
                </button>
                <p className="text-xs text-muted-foreground/60">
                  {recorder.recording ? "Recording..." : "Tap to record a take"}
                </p>
                {recorder.error && <p className="text-xs text-red-400">{recorder.error}</p>}
              </div>

              <div className="rounded-2xl p-4" style={card}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Tracks</h3>
                  <button
                    onClick={playing ? stopAll : playAll}
                    disabled={!tracks || tracks.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-black disabled:opacity-30"
                    style={{ background: NEON }}
                  >
                    {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {playing ? "Stop" : "Play all"}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {tracks?.map((t) => (
                    <TrackRow
                      key={t.id}
                      track={t}
                      audioRef={(el) => {
                        audioEls.current[t.id] = el;
                      }}
                      onUpdate={(fields) => updateTrack.mutate({ id: t.id, ...fields })}
                      onDelete={() => deleteTrack.mutate({ id: t.id, audio_path: t.audio_path })}
                    />
                  ))}
                  {(!tracks || tracks.length === 0) && (
                    <p className="text-xs text-muted-foreground/40">No takes recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
