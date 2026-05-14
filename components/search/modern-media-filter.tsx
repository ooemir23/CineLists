import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar, Star, Play, Tag, X, Filter } from "lucide-react";



const COUNTRIES = [
    { code: "TR", name: "Türkiye", flag: "🇹🇷" },
    { code: "US", name: "Amerika", flag: "🇺🇸" },
    { code: "GB", name: "İngiltere", flag: "🇬🇧" },
    { code: "FR", name: "Fransa", flag: "🇫🇷" },
    { code: "DE", name: "Almanya", flag: "🇩🇪" },
    { code: "JP", name: "Japonya", flag: "🇯🇵" },
    { code: "KR", name: "Güney Kore", flag: "🇰🇷" },
    { code: "IN", name: "Hindistan", flag: "🇮🇳" },
    { code: "IT", name: "İtalya", flag: "🇮🇹" },
    { code: "ES", name: "İspanya", flag: "🇪🇸" },
];

const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

import { GENRE_MAP } from "@/lib/genres";

const MOVIE_GENRE_IDS = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
const TV_GENRE_IDS = [10759, 16, 35, 80, 99, 18, 10751, 10762, 9648, 10763, 10764, 10765, 10766, 10767, 10768, 37];

const MOVIE_GENRES = MOVIE_GENRE_IDS.map(id => ({ id, name: GENRE_MAP[id] }));
const TV_GENRES = TV_GENRE_IDS.map(id => ({ id, name: GENRE_MAP[id] }));

export function ModernMediaFilter({
  type,
  setType,
  year,
  setYear,
  minRating,
  setMinRating,
  provider,
  setProvider,
  genre,
  setGenre,
  country,
  setCountry,
  onClear
}: {
  type: "movie" | "tv";
  setType: (type: "movie" | "tv") => void;
  year: string;
  setYear: (year: string) => void;
  minRating: string;
  setMinRating: (rating: string) => void;
  provider: string;
  setProvider: (provider: string) => void;
  genre: string;
  setGenre: (genre: string) => void;
  country: string;
  setCountry: (country: string) => void;
  onClear: () => void;
}) {
  const genres = type === "movie" ? MOVIE_GENRES : TV_GENRES;
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProviders() {
      setProviders([]);
      const res = await fetch(`/api/watch-providers?type=${type}&country=${country}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(Array.isArray(data.results) ? data.results : []);
      }
    }
    fetchProviders();
  }, [type, country]);

  return (
    <div className="flex flex-row flex-wrap gap-3 justify-center items-center bg-card/70 border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl overflow-x-auto scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-transparent min-w-0">
      <div className="flex gap-2 bg-white/5 rounded-xl p-1">
        <button onClick={() => setType("movie")} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", type === "movie" ? "bg-primary text-black shadow" : "text-neutral-400 hover:text-white")}>Film</button>
        <button onClick={() => setType("tv")} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", type === "tv" ? "bg-primary text-black shadow" : "text-neutral-400 hover:text-white")}>Dizi</button>
      </div>
      <select value={country} onChange={e => setCountry(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
      </select>
      <select value={provider} onChange={e => setProvider(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
        <option value="">İzleme Servisi</option>
        {Array.isArray(providers) && providers.map((p: any) => <option key={p.provider_id} value={p.provider_id}>{p.provider_name}</option>)}
      </select>
      <select value={genre} onChange={e => setGenre(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
        <option value="">Tür</option>
        {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <select value={year} onChange={e => setYear(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
        <option value="">Yıl</option>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={minRating} onChange={e => setMinRating(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
        <option value="">Puan</option>
        {[9,8,7,6,5,4,3,2,1].map(r => <option key={r} value={r}>{r}+</option>)}
      </select>
      <button onClick={onClear} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"><X className="w-5 h-5" /></button>
    </div>
  );
}
