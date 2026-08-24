"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Compass, Search, Star, Play, Settings, Bell, ChevronRight, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  overview?: string;
}

interface HomeClientProps {
  session: any;
  trendingMovies: { results: MovieItem[] };
  trendingTV: { results: MovieItem[] };
  popularMovies: { results: MovieItem[] };
  upcomingMovies: { results: MovieItem[] };
  popularTV: { results: MovieItem[] };
  personalizedMovies?: { results: MovieItem[] } | null;
}

export function HomeClient({
  session,
  trendingMovies,
  trendingTV,
  popularMovies,
  upcomingMovies,
  popularTV,
  personalizedMovies,
}: HomeClientProps) {
  const isLoggedIn = !!session?.user;

  // Screen State: 'landing' (only for guests initially) or 'app'
  const [screen, setScreen] = useState<"landing" | "app">(isLoggedIn ? "app" : "landing");
  // Active Filter Chip
  const [activeChip, setActiveChip] = useState("Tümü");

  // Chips list from redesign html
  const chips = ["Tümü", "Film", "Dizi", "Trend", "Popüler", "Vizyonda"];

  // Featured Item (Günün En Gözdesi) - Pick first item from trending movies
  const featured = useMemo(() => {
    const list = trendingMovies?.results || [];
    if (list.length > 0) {
      const item = list[0];
      const title = item.title || item.name || "Bir Koyun Polisiyesi";
      const rating = item.vote_average ? item.vote_average.toFixed(1) : "7.8";
      const dateStr = item.release_date || item.first_air_date;
      const year = dateStr ? new Date(dateStr).getFullYear() : 2026;
      const type = item.media_type === "tv" ? "Dizi" : "Film";
      const overview = item.overview || "Film ve dizileri takip et, arkadaşlarınla paylaş, puanla ve keşfet.";
      return {
        id: item.id,
        title,
        rating,
        meta: `${type} · ${year}`,
        overview,
        backdrop: item.backdrop_path 
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` 
          : "linear-gradient(150deg,#4a1622,#1c0a10)",
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        type: item.media_type || "movie",
      };
    }
    return {
      id: 0,
      title: "Bir Koyun Polisiyesi",
      rating: "7.8",
      meta: "Film · 2026",
      overview: "Dedektif romanları okuyan bir çobanın koyunları, çiftliği sarsan gizemli bir olayın ardından kendi soruşturmalarını başlatır.",
      backdrop: "linear-gradient(150deg,#4a1622,#1c0a10)",
      poster: null,
      type: "movie",
    };
  }, [trendingMovies]);

  // Recommendations list (Sizin İçin Seçtiklerimiz)
  const recos = useMemo(() => {
    const rawList = personalizedMovies?.results?.length 
      ? personalizedMovies.results 
      : (popularMovies?.results || []).slice(0, 10);

    return rawList.map((item) => {
      const title = item.title || item.name || "Saplantı";
      const rating = item.vote_average ? item.vote_average.toFixed(1) : "7.9";
      const dateStr = item.release_date || item.first_air_date;
      const year = dateStr ? new Date(dateStr).getFullYear() : 2026;
      const type = item.media_type === "tv" || !item.release_date ? "Dizi" : "Film";
      return {
        id: item.id,
        title,
        rating,
        meta: `${type} · ${year}`,
        poster: item.poster_path 
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
          : "linear-gradient(150deg,#26306b,#0d1024)",
        type: item.media_type || (item.release_date ? "movie" : "tv"),
      };
    });
  }, [personalizedMovies, popularMovies]);

  // General Filtered Films list for explore grid
  const filteredFilms = useMemo(() => {
    let list: MovieItem[] = [];
    if (activeChip === "Tümü" || activeChip === "Trend") {
      // Interleave trending movies & TV
      const m = trendingMovies?.results || [];
      const t = trendingTV?.results || [];
      const maxLength = Math.max(m.length, t.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < m.length) list.push({ ...m[i], media_type: "movie" });
        if (i < t.length) list.push({ ...t[i], media_type: "tv" });
      }
    } else if (activeChip === "Film") {
      list = (popularMovies?.results || []).map(item => ({ ...item, media_type: "movie" }));
    } else if (activeChip === "Dizi") {
      list = (popularTV?.results || []).map(item => ({ ...item, media_type: "tv" }));
    } else if (activeChip === "Popüler") {
      list = [
        ...(popularMovies?.results || []).map(item => ({ ...item, media_type: "movie" })),
        ...(popularTV?.results || []).map(item => ({ ...item, media_type: "tv" }))
      ].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (activeChip === "Vizyonda") {
      list = (upcomingMovies?.results || []).map(item => ({ ...item, media_type: "movie" }));
    }

    // Map to normalized structure
    return list.slice(0, 16).map((item) => {
      const title = item.title || item.name || "Severance";
      const rating = item.vote_average ? item.vote_average.toFixed(1) : "8.5";
      const dateStr = item.release_date || item.first_air_date;
      const year = dateStr ? new Date(dateStr).getFullYear() : 2026;
      const type = item.media_type === "tv" ? "Dizi" : "Film";
      return {
        id: item.id,
        title,
        rating,
        meta: `${type} · ${year}`,
        poster: item.poster_path 
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
          : "linear-gradient(150deg,#28323f,#0d1117)",
        kind: type,
        type: item.media_type || "movie",
      };
    });
  }, [activeChip, trendingMovies, trendingTV, popularMovies, popularTV, upcomingMovies]);

  // Render Landing View
  if (screen === "landing") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-7 bg-radial from-[#11182b] to-[#06080e] font-hanken">
        <div className="w-[393px] h-[840px] max-h-[calc(100vh-40px)] relative overflow-hidden bg-[#020617] rounded-[42px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.8),_0_0_0_10px_#0a0e18] text-[#f1f5f9] animate-fade-in flex flex-col justify-between">
          
          {/* Featured Backdrop */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000" 
            style={{ 
              backgroundImage: featured.backdrop.startsWith("http") ? `url(${featured.backdrop})` : featured.backdrop,
              height: "560px"
            }}
          >
            {/* Soft Ambient Radial and Linear Gradients */}
            <div className="absolute inset-0 bg-radial-to-t from-transparent via-[#020617]/25 to-white/5 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/55 via-transparent to-[#020617] h-[560px]" />
          </div>

          {/* Landing Header */}
          <div className="relative z-10 p-6 pt-12 flex items-center justify-between">
            <div className="flex items-baseline gap-0.5">
              <span className="font-bricolage font-extrabold text-2xl tracking-tight text-white">cinelists</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block ml-1"></span>
            </div>
            <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase">tr · beta</span>
          </div>

          {/* Landing Bottom Content */}
          <div className="relative z-10 p-6 flex flex-col justify-end h-full">
            <div className="mb-2">
              <div className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase mb-2 font-bold font-mono">Günün En Gözdesi</div>
              <h1 className="font-bricolage font-bold text-3xl sm:text-4xl line-clamp-2 leading-tight tracking-tight mb-2 text-white">{featured.title}</h1>
              <div className="flex items-center gap-2.5 font-mono text-[11px] text-slate-300 mb-3">
                <span className="flex items-center gap-1 text-primary font-bold">
                  <Star size={12} fill="currentColor" /> {featured.rating}
                </span>
                <span className="opacity-40">·</span>
                <span>{featured.meta}</span>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-slate-400 line-clamp-3 mb-5 max-w-[320px]">{featured.overview}</p>
              
              <button 
                onClick={() => setScreen("app")}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-lg active:scale-95"
              >
                <Play size={14} fill="currentColor" /> Fragmanı İzle
              </button>
            </div>

            {/* Redesign Description and Buttons */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <h2 className="font-bricolage font-bold text-xl sm:text-2xl leading-snug tracking-tight mb-2 text-white">
                İzlediğin her şeyi takip et,<br />
                <span className="text-primary">arkadaşlarınla paylaş.</span>
              </h2>
              <p className="text-xs sm:text-[13.5px] leading-relaxed text-slate-400 mb-6">
                Film ve dizileri puanla, listeler oluştur, sana özel önerileri keşfet ve arkadaşlarının ne izlediğini gör.
              </p>

              <div className="flex flex-col gap-2.5">
                <Link 
                  href="/register"
                  className="w-full bg-primary hover:bg-primary/95 text-[#1a1206] py-3.5 rounded-2xl text-[15px] font-extrabold tracking-tight text-center active:scale-[0.98] transition-all shadow-xl shadow-primary/10"
                >
                  Kayıt Ol — Ücretsiz
                </Link>
                <Link 
                  href="/login"
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 rounded-2xl text-[15px] font-bold text-center active:scale-[0.98] transition-all"
                >
                  Giriş Yap
                </Link>
              </div>
              
              <button 
                onClick={() => setScreen("app")}
                className="w-full mt-4 text-xs text-slate-500 hover:text-slate-400 font-bold transition-colors text-center block"
              >
                Önce keşfetmek istiyorum →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render App Explore View
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-7 bg-radial from-[#11182b] to-[#06080e] font-hanken">
      <div className="w-[393px] h-[840px] max-h-[calc(100vh-40px)] relative overflow-hidden bg-[#020617] rounded-[42px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.8),_0_0_0_10px_#0a0e18] text-[#f1f5f9] animate-fade-in flex flex-col">
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          
          {/* Header Sticky */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-[#020617] via-[#020617]/95 to-transparent px-5 pt-12 pb-3 flex items-center justify-between">
            <div 
              onClick={() => !isLoggedIn && setScreen("landing")}
              className="flex items-baseline gap-0.5 cursor-pointer active:scale-95 transition-transform"
            >
              <span className="font-bricolage font-extrabold text-2xl tracking-tight text-white">cinelists</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block ml-1"></span>
            </div>
            
            <div className="flex gap-2">
              <Link 
                href="/search"
                className="w-[38px] h-[38px] rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Search size={18} className="text-slate-300" />
              </Link>
              <Link 
                href={isLoggedIn ? "/notifications" : "/login"}
                className="w-[38px] h-[38px] rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative"
              >
                <Bell size={18} className="text-slate-300" />
                {isLoggedIn && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary border-2 border-[#020617]"></span>}
              </Link>
            </div>
          </div>

          {/* Filter Chips Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 py-2.5">
            {chips.map((c) => {
              const active = c === activeChip;
              return (
                <button
                  key={c}
                  onClick={() => setActiveChip(c)}
                  className={cn(
                    "flex-none px-4 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95",
                    active 
                      ? "bg-primary text-[#1a1206] font-bold border-primary shadow-lg shadow-primary/10" 
                      : "bg-white/5 text-slate-300 border-white/5 hover:bg-white/10"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Hero Featured Card (Explore Hero) */}
          <div className="mx-5 my-4.5 relative rounded-2xl overflow-hidden h-[212px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] group border border-white/5">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ 
                backgroundImage: featured.backdrop.startsWith("http") ? `url(${featured.backdrop})` : featured.backdrop,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/10 to-transparent" />
            <div className="absolute top-3 left-3 font-mono text-[9px] tracking-widest uppercase text-primary bg-[#020617]/70 backdrop-blur-md px-2.5 py-1 rounded-md font-bold font-mono">
              Günün En Gözdesi
            </div>
            
            <Link 
              href={`/${featured.type}/${featured.id}`}
              className="absolute inset-x-0 bottom-0 p-4.5 flex flex-col justify-end"
            >
              <div className="font-bricolage font-bold text-xl tracking-tight mb-1 group-hover:text-primary transition-colors text-white line-clamp-1">
                {featured.title}
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <span className="flex items-center gap-0.5 text-primary font-bold font-mono">
                  <Star size={11} fill="currentColor" /> {featured.rating}
                </span>
                <span className="opacity-40">·</span>
                <span>{featured.meta}</span>
              </div>
            </Link>
          </div>

          {/* Recommendations Strip (Sizin İçin Seçtiklerimiz) */}
          <div className="flex items-center justify-between px-5 pt-4.5 pb-3">
            <h3 className="font-bricolage font-bold text-lg text-white tracking-tight">Sizin İçin Seçtiklerimiz</h3>
            <Link 
              href={isLoggedIn ? "/recommendations" : "/login"}
              className="text-xs text-slate-500 hover:text-slate-400 font-bold transition-colors"
            >
              Tümü
            </Link>
          </div>
          
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-5 pb-7">
            {recos.map((film, index) => (
              <Link
                key={`${film.id}-${index}`}
                href={`/${film.type}/${film.id}`}
                className="flex-none w-[122px] group"
              >
                <div 
                  className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-cover bg-center shadow-[0_10px_26px_rgba(0,0,0,0.5)] border border-white/5 flex items-center justify-center text-center p-3"
                  style={{ 
                    backgroundImage: film.poster.startsWith("http") ? `url(${film.poster})` : film.poster,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Star size={24} className="text-primary" fill="currentColor" />
                  </div>
                  {!film.poster.startsWith("http") && (
                    <span className="font-bricolage font-bold text-sm leading-tight text-white/90">{film.title}</span>
                  )}
                  
                  {/* Rating Badge */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-[#020617]/72 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/5">
                    <Star size={9} className="text-primary" fill="currentColor" />
                    <span className="font-mono text-[9px] font-bold text-primary font-mono">{film.rating}</span>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-slate-500 mt-2 tracking-wide font-bold group-hover:text-slate-400 transition-colors line-clamp-1">
                  {film.title}
                </div>
              </Link>
            ))}
          </div>

          {/* Trend Grid */}
          <div className="px-5 pt-3.5 pb-3">
            <h3 className="font-bricolage font-bold text-lg text-white tracking-tight">Trend Olanlar</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3.5 px-5 pb-5">
            {filteredFilms.map((film, index) => (
              <Link
                key={`${film.id}-${index}`}
                href={`/${film.type}/${film.id}`}
                className="group"
              >
                <div 
                  className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-cover bg-center shadow-[0_8px_22px_rgba(0,0,0,0.45)] border border-white/5 flex items-center justify-center p-4 text-center"
                  style={{ 
                    backgroundImage: film.poster.startsWith("http") ? `url(${film.poster})` : film.poster,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Star size={28} className="text-primary" fill="currentColor" />
                  </div>
                  
                  {!film.poster.startsWith("http") && (
                    <span className="font-bricolage font-bold text-base leading-tight text-white/80">{film.title}</span>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 font-mono text-[9px] text-slate-200 bg-[#020617]/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/5 font-bold uppercase tracking-wider font-mono">
                    {film.kind}
                  </div>
                  
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-[#020617]/72 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/5">
                    <Star size={9} className="text-primary" fill="currentColor" />
                    <span className="font-mono text-[9px] font-bold text-primary font-mono">{film.rating}</span>
                  </div>
                </div>
                
                <div className="font-mono text-[10px] text-slate-500 mt-2 tracking-wide font-bold group-hover:text-slate-400 transition-colors line-clamp-1">
                  {film.title}
                </div>
              </Link>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
