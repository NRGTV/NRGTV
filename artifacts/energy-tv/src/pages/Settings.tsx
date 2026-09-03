import { useState } from "react";
import {
  Settings as SettingsIcon, Wifi,
  ChevronRight, Trash2, Info, Zap
} from "lucide-react";

function Toggle({ label, description, defaultChecked = false }: {
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-3 px-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => setOn(!on)}
        className="relative flex-shrink-0 rounded-full transition-all duration-200"
        style={{
          width: "40px",
          height: "22px",
          background: on ? "hsl(112,100%,54%)" : "hsl(220,14%,20%)",
          boxShadow: on ? "0 0 8px hsl(112 100% 54% / 0.4)" : "none",
        }}
      >
        <span
          className="absolute top-0.5 rounded-full bg-white transition-all duration-200"
          style={{ width: "18px", height: "18px", left: on ? "20px" : "2px" }}
        />
      </button>
    </div>
  );
}

function SettingRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  return (
    <button className="flex items-center w-full px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
      <Icon className="w-4 h-4 mr-3 shrink-0" style={{ color: "hsl(112,100%,54%)" }} />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {value && <p className="text-xs text-muted-foreground mt-0.5">{value}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

export default function Settings() {
  const [quality, setQuality] = useState("Auto");
  const [subtitleLang, setSubtitleLang] = useState("English");

  return (
    <div className="min-h-screen bg-background pt-14 pb-10">
      <div className="px-4 md:px-6 pt-6">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="w-5 h-5" style={{ color: "hsl(112,100%,54%)" }} />
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>

        <div className="space-y-4">
          <Section title="Playback">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-foreground mb-2">Default Quality</p>
              <div className="flex gap-2">
                {["Auto", "4K", "HD", "SD"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={quality === q ? {
                      background: "hsl(112,100%,54%)",
                      color: "black",
                      boxShadow: "0 0 6px hsl(112 100% 54% / 0.3)",
                    } : { background: "hsl(220,14%,15%)", color: "hsl(0,0%,55%)" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <Toggle label="Auto-play next episode" defaultChecked />
            <Toggle label="Skip intro automatically" defaultChecked />
            <Toggle label="Remember playback position" defaultChecked />
          </Section>

          <Section title="Subtitles">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-foreground mb-2">Subtitle Language</p>
              <div className="flex flex-wrap gap-2">
                {["English", "Spanish", "French", "German", "Portuguese", "Off"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSubtitleLang(lang)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={subtitleLang === lang ? {
                      background: "hsl(112,100%,54%)",
                      color: "black",
                      boxShadow: "0 0 6px hsl(112 100% 54% / 0.3)",
                    } : { background: "hsl(220,14%,15%)", color: "hsl(0,0%,55%)" }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <Toggle label="Enable subtitles by default" />
            <Toggle label="Auto-sync subtitles" defaultChecked />
          </Section>

          <Section title="Network">
            <SettingRow icon={Wifi} label="Stream over cellular" value="Wi-Fi only" />
            <Toggle label="Download on Wi-Fi only" defaultChecked />
          </Section>

          <Section title="Privacy">
            <Toggle label="Save watch history" defaultChecked />
            <Toggle label="Personalized recommendations" defaultChecked />
            <div className="px-4 py-3">
              <button
                onClick={() => {
                  localStorage.removeItem("energytv_history");
                  alert("Watch history cleared");
                }}
                className="flex items-center gap-2 text-xs text-destructive hover:opacity-80 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Watch History
              </button>
            </div>
          </Section>

          <Section title="About">
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Creator</span>
                <span className="text-sm text-foreground font-medium">F1FTYCAL</span>
              </div>
            </div>
            <div
              className="mx-4 mb-3 p-3 rounded-xl border flex items-start gap-3"
              style={{ background: "hsl(112 100% 54% / 0.05)", borderColor: "hsl(112 100% 54% / 0.15)" }}
            >
              <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(112,100%,54%)" }} />
              <p className="text-xs text-muted-foreground leading-relaxed">
                NRGTV is a web streaming interface. Metadata is sourced from TMBD, while the media itself is sourced by 111Movies
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
