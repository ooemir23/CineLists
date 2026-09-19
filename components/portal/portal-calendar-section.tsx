import { auth } from "@/auth";
import Link from "next/link";
import { Calendar, ChevronRight, Sparkles, Tv } from "lucide-react";
import { getWatchedShowsNextEpisodes, UpcomingEpisode } from "@/lib/hero-personalization-actions";
import { UpcomingEpisodesCarousel } from "@/components/home/carousels/upcoming-episodes-carousel";
import { getServerLocale } from "@/lib/i18n/server";
import { getServerCountry } from "@/lib/country";

export async function PortalCalendarSection() {
  const session = await auth();
  const locale = await getServerLocale();
  const userCountry = await getServerCountry();

  let upcomingEpisodes: UpcomingEpisode[] = [];
  if (session?.user?.id) {
    try {
      upcomingEpisodes = await getWatchedShowsNextEpisodes(userCountry);
    } catch {
      upcomingEpisodes = [];
    }
  }

  const validUpcomingEpisodes = upcomingEpisodes.filter((ep) => {
    if (!ep.nextEpisodeDate) return false;
    const date = new Date(ep.nextEpisodeDate);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)) >= 0;
  });

  if (validUpcomingEpisodes.length > 0) {
    return (
      <section className="relative z-20 backdrop-blur-md bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/80 rounded-2xl md:rounded-3xl p-3 md:p-4 border border-amber-400/20 shadow-xl shadow-amber-400/5">
        <UpcomingEpisodesCarousel episodes={validUpcomingEpisodes} />
      </section>
    );
  }

  // Teaser banner when no personal upcoming episodes
  return (
    <section className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-amber-950/20 p-3.5 sm:p-4 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                {locale === "en" ? "Release Calendar & Coming Soon" : "Yayın & Vizyon Takvimi"}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-2.5 h-2.5" />
                {locale === "en" ? "Updated" : "Güncel"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
              {locale === "en"
                ? "Discover movies coming to theatres and upcoming TV show seasons."
                : "Vizyona girecek filmleri ve platformlara eklenecek yeni sezonları keşfet."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-400/20 active:scale-95"
          >
            {locale === "en" ? "Open Calendar" : "Takvimi Aç"}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          {session?.user && (
            <Link
              href="/upcoming-episodes"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-bold transition-all"
            >
              <Tv className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">{locale === "en" ? "Episodes" : "Bölümler"}</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
