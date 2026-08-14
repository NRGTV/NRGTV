import { Gamepad2, ExternalLink, Monitor, Smartphone } from "lucide-react";

interface GameEntry {
  id: string;
  title: string;
  blurb: string;
  url: string;
  accent?: string;
}

const windowsGames: GameEntry[] = [
  {
    id: "bo2",
    title: "Call of Duty: Black Ops 2",
    blurb: "Play online via Plutonium — free dedicated servers, mod support & more.",
    url: "https://linkmix.co/56657252",
  },
  {
    id: "fortnite",
    title: "Fortnite",
    blurb: "Free-to-play battle royale from Epic Games.",
    url: "https://www.fortnite.com/",
  },
  {
    id: "warzone",
    title: "Call of Duty: Warzone",
    blurb: "Free-to-play battle royale from Call of Duty.",
    url: "https://www.callofduty.com/warzone",
  },
  {
    id: "apex",
    title: "Apex Legends",
    blurb: "Free-to-play hero shooter on Steam.",
    url: "https://store.steampowered.com/app/1172470/Apex_Legends/",
  },
  {
    id: "tf2",
    title: "Team Fortress 2",
    blurb: "Free-to-play classic class-based shooter on Steam.",
    url: "https://store.steampowered.com/app/440/Team_Fortress_2/",
  },
  {
    id: "poe",
    title: "Path of Exile",
    blurb: "Free-to-play action RPG on Steam.",
    url: "https://store.steampowered.com/app/238960/Path_of_Exile/",
  },
];

const androidGames: GameEntry[] = [
 {
    id: "btd6",
    title: "Bloons TD6",
    blurb: "Bloons TD6 (APK) — download from APKVision.",
    url: "https://apkvision.org/games/strategy/bloons-td-6-27971/",
 },
  {
    id: "gta3",
    title: "Grand Theft Auto III (Definitive Edition)",
    blurb: "GTA III (APK) — download from APKVision.",
    url: "https://apkvision.org/games/action/gta-iii-definitive-115254/",
 },
  {
    id: "gtasa",
    title: "Grand Theft Auto: San Andreas (Definitive Edition)",
    blurb: "GTA: SA (APK) — download from APKVision.",
    url: "https://apkvision.org/games/action/gta-san-andreas-definitive-115251/",
 },
  {
    id: "gtavc",
    title: "Grand Theft Auto: Vice City (Definitive Edition)",
    blurb: "GTA: VC (APK) — download from APKVision.",
    url: "https://apkvision.org/games/action/gta-vice-city-definitive-115249/",
 },
  {
    id: "minecraft",
    title: "Minecraft: Pocket Edition",
    blurb: "Minecraft PE (APK) — download from APKVision.",
    url: "https://apkvision.org/games/arcade/minecraft-pe-apk-55409/",
 },
  {
    id: "rdr1",
    title: "Red Dead Redemption",
    blurb: "Red Dead Redemption (APK) — download from APKVision.",
    url: "https://apkvision.org/games/action/red-dead-redemption-28496/",
  },
{
    id: "stardew",
    title: "Stardew Valley",
    blurb: "Stardew Valley (APK) — download from APKVision.",
    url: "https://apkvision.org/games/role-playing/stardew-valley-40176/",
 },
{
    id: "terraria",
    title: "Terraria",
    blurb: "Terraria (APK) — download from APKVision.",
    url: "https://apkvision.org/games/role-playing/terraria-apk-51597/",
 },
];

function GameCard({ game }: { game: GameEntry }) {
  return (
    <a
      href={game.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col justify-between rounded-2xl p-4 transition-all"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        minHeight: "148px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid rgba(57,255,20,0.25)";
        e.currentTarget.style.boxShadow =
          "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 20px rgba(57,255,20,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.05)";
      }}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-bold text-foreground leading-tight">{game.title}</h3>
          <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/40 group-hover:text-[hsl(112,100%,54%)] transition-colors" />
        </div>
        <p className="text-xs text-muted-foreground/60 leading-relaxed">{game.blurb}</p>
      </div>
      <span
        className="mt-3 self-start text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
        style={{
          background: "rgba(57,255,20,0.08)",
          border: "1px solid rgba(57,255,20,0.15)",
          color: "hsl(112,100%,54%)",
        }}
      >
        Play
      </span>
    </a>
  );
}

export default function Games() {
  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="px-4 md:px-6 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="w-4 h-4" style={{ color: "hsl(112,100%,54%)" }} />
          <h1 className="text-lg font-black text-foreground">Games</h1>
        </div>
        <p className="text-xs text-muted-foreground/50 mb-6">
          Free-to-play picks and multiplayer clients you can jump into.
        </p>

        {/* Windows section */}
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-3.5 h-3.5 text-muted-foreground/50" />
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">
            Windows
          </h2>
        </div>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}
        >
          {windowsGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        {/* Android section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-3.5 h-3.5 text-muted-foreground/50" />
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">
              Android
            </h2>
          </div>

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}
          >
            {androidGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
