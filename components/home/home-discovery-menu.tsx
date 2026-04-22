import Link from "next/link";
import { Film, Tv, TrendingUp, Star, Check, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type MenuType = "movie" | "tv";
type MenuCategory = "trending" | "popular" | "top_rated" | "upcoming" | "discover";

type HomeDiscoveryMenuProps = {
  activeType: MenuType;
  activeCategory: MenuCategory;
};

const categoryOptions = [
  { id: "trending", label: "Trend", icon: TrendingUp },
  { id: "popular", label: "Populer", icon: Star },
  { id: "top_rated", label: "En Iyiler", icon: Check },
  { id: "upcoming", label: "Yakinda", icon: Calendar },
  { id: "discover", label: "Kesfet", icon: Filter },
] as const;

export function HomeDiscoveryMenu({ activeType, activeCategory }: HomeDiscoveryMenuProps) {
  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 mt-2 md:mt-3">
      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl w-full xl:w-auto">
          <Link
            href={`/?homeType=movie&homeCategory=${activeCategory}#home-discover`}
            className={cn(
              "flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-[1.5rem] text-sm font-black transition-all uppercase tracking-tight",
              activeType === "movie"
                ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20"
                : "text-neutral-500 hover:text-white"
            )}
          >
            <Film size={18} />
            Film
          </Link>
          <Link
            href={`/?homeType=tv&homeCategory=${activeCategory}#home-discover`}
            className={cn(
              "flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-[1.5rem] text-sm font-black transition-all uppercase tracking-tight",
              activeType === "tv"
                ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20"
                : "text-neutral-500 hover:text-white"
            )}
          >
            <Tv size={18} />
            Dizi
          </Link>
        </div>

        <div className="flex-1 flex bg-white/5 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar">
          {categoryOptions.map((opt, index) => (
            <Link
              key={opt.id}
              href={`/?homeType=${activeType}&homeCategory=${opt.id}#home-discover`}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest whitespace-nowrap",
                activeCategory === opt.id
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-neutral-500 hover:text-white"
              )}
            >
              <opt.icon size={14} className={activeCategory === opt.id ? "text-amber-400" : ""} />
              {opt.label}
            </Link>
          ))}
        </div>

        <Link
          href={`/explore/${activeType}/${activeCategory}`}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all bg-white/10 text-white hover:bg-white/20"
        >
          <Filter size={16} />
          Filtrele
        </Link>
      </div>
    </div>
  );
}
