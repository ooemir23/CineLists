import Link from "next/link";
import { MessageSquare, Flame, Trophy, Sparkles } from "lucide-react";
import type { PulseComment, PulseReaction } from "@/lib/community-pulse";

type CommunityPulseProps = {
  activeUsersCount?: number;
  dailyReviewsCount?: number;
  activeListsCount?: number;
  topContributorName?: string | null;
  recentReactions?: PulseReaction[];
  recentComments?: PulseComment[];
  focusTitle?: string;
  focusId?: number;
  focusType?: "movie" | "tv";
};

export function PortalCommunityPulse({
  activeUsersCount = 0,
  dailyReviewsCount = 0,
  activeListsCount = 0,
  topContributorName = null,
  recentReactions = [],
  recentComments = [],
  focusTitle = "Dune: Part Two",
  focusId = 693134,
  focusType = "movie",
}: CommunityPulseProps) {
  return (
    <section className="p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
      {/* Title with Live Indicator */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            CineLists Nabzı
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Canlı
          </span>
        </div>
        <Link
          href="/community"
          className="text-xs sm:text-sm font-bold text-neutral-400 hover:text-amber-400 transition-colors"
        >
          Topluluk Sayfası →
        </Link>
      </div>

      {/* Stats Grid (Merlin'in Kazanı style: green, cyan, purple, gold) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-6">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
          <strong className="text-xl sm:text-2xl font-black text-emerald-400 leading-none">
            {activeUsersCount}
          </strong>
          <span className="text-xs font-semibold text-neutral-300 mt-1">
            Aktif sinefil
          </span>
          <small className="text-[11px] text-neutral-500 truncate mt-0.5">
            Son 24 saat
          </small>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
          <strong className="text-xl sm:text-2xl font-black text-sky-400 leading-none">
            {dailyReviewsCount}
          </strong>
          <span className="text-xs font-semibold text-neutral-300 mt-1">
            Puan & inceleme
          </span>
          <small className="text-[11px] text-neutral-500 truncate mt-0.5">
            Son 24 saat
          </small>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
          <strong className="text-xl sm:text-2xl font-black text-amber-400 leading-none">
            {activeListsCount}
          </strong>
          <span className="text-xs font-semibold text-neutral-300 mt-1">
            Aktif liste
          </span>
          <small className="text-[11px] text-neutral-500 truncate mt-0.5">
            Kürasyonlar
          </small>
        </div>

        <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 flex flex-col justify-center">
          <strong className="text-xs sm:text-sm font-black text-amber-400 truncate leading-none">
            {topContributorName || "Henüz yok"}
          </strong>
          <span className="text-xs font-semibold text-neutral-300 mt-1 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Günün Sinefili
          </span>
          <small className="text-[11px] text-neutral-500 truncate mt-0.5">
            En aktif katkı
          </small>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
          <Link
            href={`/${focusType}/${focusId}`}
            className="group block truncate"
          >
            <strong className="text-xs sm:text-sm font-black text-white group-hover:text-amber-400 transition-colors truncate block leading-none">
              {focusTitle}
            </strong>
            <span className="text-xs font-semibold text-neutral-400 mt-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              Topluluk Odağı
            </span>
            <small className="text-[11px] text-neutral-500 truncate mt-0.5 block">
              En çok konuşulan
            </small>
          </Link>
        </div>
      </div>

      {/* Body: Son Okur Tepkileri + Son Yorumlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
        {/* Son Okur Tepkileri */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Son İzleyici Tepkileri
          </h3>
          <div className="space-y-2">
            {recentReactions.length === 0 && (
              <p className="text-xs text-neutral-500 p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10">
                Henüz puanlama yok. İlk puanı sen ver!
              </p>
            )}
            {recentReactions.map((item, idx) => (
              <Link
                key={idx}
                href={`/${item.type}/${item.id}`}
                className="group flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-base shrink-0">
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate block leading-tight">
                    {item.title}
                  </strong>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                    <span className="text-amber-400 font-semibold">{item.reaction}</span>
                    <span>·</span>
                    <span>{item.author}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Son Yorumlar */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-sky-400" />
            Son İnceleme & Yorumlar
          </h3>
          <div className="space-y-2">
            {recentComments.length === 0 && (
              <p className="text-xs text-neutral-500 p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10">
                Henüz inceleme yazılmamış.
              </p>
            )}
            {recentComments.map((item, idx) => (
              <Link
                key={idx}
                href={`/${item.type}/${item.id}`}
                className="group flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/30">
                  {item.avatarInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                      {item.author}
                    </span>
                    <span className="text-xs text-neutral-500 truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-300 font-normal line-clamp-1 mt-0.5">
                    &ldquo;{item.comment}&rdquo;
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
