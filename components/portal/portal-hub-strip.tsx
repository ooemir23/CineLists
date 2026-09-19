import Link from "next/link";
import { ArrowRight, Film, Layers } from "lucide-react";
import Image from "next/image";

const HUBS = [
  {
    name: "Netflix Yapımları",
    providerId: "8",
    count: "2.400+ Film & Dizi",
    badge: "Popüler",
    gradient: "from-red-600/30 to-slate-900",
    border: "border-red-500/20 hover:border-red-500/40",
  },
  {
    name: "Prime Video",
    providerId: "119",
    count: "1.800+ Film & Dizi",
    badge: "Fırsat",
    gradient: "from-sky-600/30 to-slate-900",
    border: "border-sky-500/20 hover:border-sky-500/40",
  },
  {
    name: "Disney+ Evreni",
    providerId: "337",
    count: "1.200+ Yapım",
    badge: "Marvel & SW",
    gradient: "from-blue-600/30 to-slate-900",
    border: "border-blue-500/20 hover:border-blue-500/40",
  },
  {
    name: "BluTV Özel",
    providerId: "344",
    count: "650+ Yerli & Yabancı",
    badge: "Yerli",
    gradient: "from-amber-600/30 to-slate-900",
    border: "border-amber-500/20 hover:border-amber-500/40",
  },
];

export function PortalHubStrip() {
  return (
    <section className="p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <h2 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          Platform & Yayın Hub'ları
        </h2>
        <Link
          href="/search"
          className="text-xs sm:text-sm font-bold text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors group"
        >
          Tüm Platformlar
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {HUBS.map((hub) => (
          <Link
            key={hub.name}
            href={`/?provider=${hub.providerId}`}
            className={`group p-3.5 rounded-xl border bg-gradient-to-br ${hub.gradient} ${hub.border} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between min-h-[90px]`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white">
                {hub.badge}
              </span>
              <Film className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-400 transition-colors" />
            </div>

            <div>
              <strong className="block text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
                {hub.name}
              </strong>
              <small className="block text-xs text-neutral-400 mt-0.5 font-medium">
                {hub.count}
              </small>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
