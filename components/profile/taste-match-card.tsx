"use client";

import { useState, useEffect } from "react";
import { calculateTasteMatch } from "@/lib/taste-match-actions";
import { Heart, Film, Tv, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface TasteMatchCardProps {
  currentUserId: string;
  profileUserId: string;
  profileUserName: string;
  profileUserImage?: string | null;
}

export function TasteMatchCard({
  currentUserId,
  profileUserId,
  profileUserName,
  profileUserImage,
}: TasteMatchCardProps) {
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    loadMatch();
  }, [currentUserId, profileUserId]);

  const loadMatch = async () => {
    try {
      const result = await calculateTasteMatch(currentUserId, profileUserId);
      setMatch(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-500" size={20} />
      </div>
    );
  }

  if (!match || match.commonWatched < 1) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <Heart className="w-8 h-8 text-pink-400/50 mx-auto mb-3" />
        <p className="text-neutral-400 text-sm">
          Henüz ortak izlenen içerik yok. Birlikte izlediğiniz film veya diziler burada görünecek.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-emerald-400";
    if (score >= 40) return "text-amber-400";
    if (score >= 20) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Mükemmel Uyum!";
    if (score >= 60) return "Çok Benzer Zevkler";
    if (score >= 40) return "Orta Düzey Uyum";
    if (score >= 20) return "Biraz Farklı";
    return "Tamamen Farklı";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-400 to-emerald-500";
    if (score >= 60) return "from-emerald-400 to-teal-500";
    if (score >= 40) return "from-amber-400 to-yellow-500";
    if (score >= 20) return "from-orange-400 to-amber-500";
    return "from-red-400 to-orange-500";
  };

  const circumference = 2 * Math.PI * 42;
  const strokeDasharray = `${(match.score / 100) * circumference} ${circumference}`;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-pink-400" />
        <h3 className="font-black text-white uppercase tracking-wide text-sm">Zevk Uyumu</h3>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={`url(#gradient-${match.score})`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
            />
            <defs>
              <linearGradient id={`gradient-${match.score}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={match.score >= 60 ? "#34d399" : match.score >= 40 ? "#fbbf24" : "#f87171"} />
                <stop offset="100%" stopColor={match.score >= 60 ? "#14b8a6" : match.score >= 40 ? "#f59e0b" : "#fb923c"} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-black ${getScoreColor(match.score)}`}>
              %{match.score}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-bold ${getScoreColor(match.score)}`}>
            {getScoreLabel(match.score)}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-400">
            <span>{match.commonWatched} ortak içerik</span>
            {match.commonRated > 0 && (
              <span className="text-amber-400/70">{match.commonRated} ortak puan</span>
            )}
          </div>
        </div>
      </div>

      {match.genreMatches && match.genreMatches.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 font-bold">
            Ortak Türler
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.genreMatches.slice(0, 5).map((g: any) => (
              <span
                key={g.genre}
                className="text-[10px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 px-2 py-1 rounded-md font-bold"
              >
                {g.genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {match.commonMedia && match.commonMedia.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 font-bold">
            Birlikte İzlediğiniz
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 custom-scrollbar">
            {match.commonMedia.slice(0, 5).map((media: any) => (
              <div
                key={media.tmdbId}
                className="w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-neutral-800"
              >
                {media.posterPath ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w200${media.posterPath}`}
                    alt={media.title}
                    width={56}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-5 h-5 text-neutral-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {match.recommendations && match.recommendations.length > 0 && (
        <div>
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {showRecommendations ? "Önerileri Gizle" : `${profileUserName}'in Önerileri`}
          </button>

          {showRecommendations && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 custom-scrollbar">
              {match.recommendations.slice(0, 5).map((rec: any) => (
                <Link
                  key={rec.tmdbId}
                  href={`/${rec.type}/${rec.tmdbId}`}
                  className="shrink-0 group"
                >
                  <div className="w-16 h-24 rounded-lg overflow-hidden bg-neutral-800 border-2 border-transparent group-hover:border-purple-500/50 transition-all">
                    {rec.posterPath ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${rec.posterPath}`}
                        alt={rec.title}
                        width={64}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-5 h-5 text-neutral-600" />
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-neutral-400 mt-1 truncate max-w-16 text-center">
                    {rec.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}