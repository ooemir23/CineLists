"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Star, MessageSquare, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { TmdbImage as Image } from "@/components/ui/tmdb-image";

export type TrendingTopicItem = {
  id: number;
  rank: number;
  title: string;
  heat: number; // 0 - 100
  heatStatus: "Çok sıcak" | "Sıcak" | "Yükseliyor" | "Yeni";
  media_type: "movie" | "tv";
};

export type ReviewRecommendationItem = {
  id: number;
  title: string;
  poster_path: string | null;
  score: number; // 0 - 100
  category: string;
  media_type: "movie" | "tv";
};

type PortalRightRailProps = {
  trendingTopics: TrendingTopicItem[];
  recommendations: ReviewRecommendationItem[];
};

export function PortalRightRail({
  trendingTopics,
  recommendations,
}: PortalRightRailProps) {
  // Poll state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [pollVotes, setPollVotes] = useState([
    { id: 1, text: "Haftalık bölüm bekleyerek izlerim", votes: 42, pct: 28 },
    { id: 2, text: "Tüm sezon bitince bir oturuşta (binge)", votes: 94, pct: 62 },
    { id: 3, text: "Rastgele vakit buldukça", votes: 15, pct: 10 },
  ]);

  const handlePollVote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnswer || hasVoted) return;
    setPollVotes((prev) => {
      const updated = prev.map((item) =>
        item.id === selectedAnswer ? { ...item, votes: item.votes + 1 } : item
      );
      const total = updated.reduce((acc, curr) => acc + curr.votes, 0);
      return updated.map((item) => ({
        ...item,
        pct: Math.round((item.votes / total) * 100),
      }));
    });
    setHasVoted(true);
  };

  return (
    <aside className="space-y-5" aria-label="Topluluk & Trend Alanı">
      {/* 1. Şu An Konuşulanlar (Merlin'in Kazanı style with heat bar & ranking) */}
      <section className="p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-white/10">
          <h2 className="text-xs sm:text-sm font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            Şu An Konuşulanlar
          </h2>
          <Link
            href="/search?sort=popularity"
            className="text-[11px] font-bold text-neutral-400 hover:text-amber-400 transition-colors"
          >
            Tümü →
          </Link>
        </div>

        <ol className="space-y-3">
          {trendingTopics.slice(0, 7).map((topic) => {
            const isScorching = topic.heatStatus === "Çok sıcak";
            const isHot = topic.heatStatus === "Sıcak";
            const isRising = topic.heatStatus === "Yükseliyor";

            const tagColor = isScorching
              ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
              : isHot
              ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
              : isRising
              ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

            return (
              <li key={topic.id} className="group">
                <Link
                  href={`/${topic.media_type}/${topic.id}`}
                  className="block space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 font-black text-xs text-neutral-500 group-hover:text-amber-400 transition-colors shrink-0">
                        #{topic.rank}
                      </span>
                      <strong className="text-xs font-bold text-neutral-200 group-hover:text-white transition-colors truncate">
                        {topic.title}
                      </strong>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${tagColor}`}
                    >
                      {topic.heatStatus}
                    </span>
                  </div>

                  {/* Heat Bar Track & Fill */}
                  <div className="heat-bar-track">
                    <div
                      className="heat-bar-fill"
                      style={{ width: `${topic.heat}%` }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 2. Ne İzleyebiliriz? (Puanlı Öneriler) */}
      <section className="p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-white/10">
          <h2 className="text-xs sm:text-sm font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            Ne İzleyebiliriz?
          </h2>
          <Link
            href="/?category=top_rated"
            className="text-[11px] font-bold text-neutral-400 hover:text-amber-400 transition-colors"
          >
            Tümü →
          </Link>
        </div>

        <ol className="space-y-2.5">
          {recommendations.slice(0, 5).map((rec) => {
            const scorePillClass =
              rec.score >= 85
                ? "score-pill-gold"
                : rec.score >= 75
                ? "score-pill-emerald"
                : "score-pill-sky";

            const posterUrl = rec.poster_path
              ? `https://image.tmdb.org/t/p/w185${rec.poster_path}`
              : "/placeholder.jpg";

            return (
              <li
                key={rec.id}
                className="group flex items-center justify-between gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <Link
                  href={`/${rec.media_type}/${rec.id}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1"
                >
                  <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                    {rec.poster_path ? (
                      <Image
                        src={posterUrl}
                        alt={rec.title}
                        fill
                        sizes="40px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-200 group-hover:text-amber-400 transition-colors truncate">
                      {rec.title}
                    </p>
                    <small className="text-[10px] text-neutral-400 block mt-0.5">
                      {rec.category}
                    </small>
                  </div>
                </Link>

                <span className={`score-pill ${scorePillClass} shrink-0`}>
                  {rec.score}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 3. Haftanın Anketi (Interactive Poll Widget) */}
      <section className="p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-white/10">
          <h2 className="text-xs sm:text-sm font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Haftanın Anketi
          </h2>
          <span className="text-[10px] font-bold text-neutral-500">Topluluk</span>
        </div>

        <form onSubmit={handlePollVote} className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-200 leading-snug">
            Dizileri nasıl izlemeyi tercih ediyorsunuz?
          </h3>

          <div className="space-y-2">
            {pollVotes.map((option) => (
              <label
                key={option.id}
                className={`block p-2.5 rounded-xl border transition-all cursor-pointer ${
                  selectedAnswer === option.id
                    ? "bg-amber-400/10 border-amber-400/40 text-white"
                    : "bg-white/[0.02] border-white/5 hover:border-white/15 text-neutral-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="poll"
                      value={option.id}
                      checked={selectedAnswer === option.id}
                      onChange={() => setSelectedAnswer(option.id)}
                      disabled={hasVoted}
                      className="accent-amber-400 w-3.5 h-3.5"
                    />
                    <span className="text-xs font-semibold">{option.text}</span>
                  </div>
                  {hasVoted && (
                    <span className="font-mono text-xs font-bold text-amber-400">
                      %{option.pct}
                    </span>
                  )}
                </div>

                {hasVoted && (
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${option.pct}%` }}
                    />
                  </div>
                )}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <small className="text-[10px] text-neutral-500">
              {hasVoted ? "Oyunuz kaydedildi." : "Seçimini yap ve oy ver."}
            </small>
            {!hasVoted ? (
              <button
                type="submit"
                disabled={!selectedAnswer}
                className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black text-xs transition-transform active:scale-95 shadow-sm shadow-amber-400/20"
              >
                Oy Ver
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Katıldınız
              </span>
            )}
          </div>
        </form>
      </section>

      {/* 4. Geri Bildirim & Katkı Kartı */}
      <section className="p-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <strong className="block text-xs font-bold text-white">
              CineLists'i Birlikte Büyütelim
            </strong>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
              Eksik film, çeviri hatası veya önerilerini ekibe ilet.
            </p>
            <Link
              href="/feedback"
              className="mt-2.5 inline-block text-[11px] font-bold text-amber-400 hover:underline"
            >
              Geri Bildirim Bildir →
            </Link>
          </div>
        </div>
      </section>
    </aside>
  );
}
