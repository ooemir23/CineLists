"use client";

import { useState, useEffect } from "react";
import { calculateTasteMatch } from "@/lib/taste-match-actions";
import { Heart, Film, Tv, Loader2 } from "lucide-react";

interface TasteMatchCardProps {
  currentUserId: string;
  profileUserId: string;
  profileUserName: string;
}

export function TasteMatchCard({
  currentUserId,
  profileUserId,
  profileUserName,
}: TasteMatchCardProps) {
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (!match) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-neutral-400 text-sm">
          Zevk uyumu hesaplamak için yeterli veri yok.
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
    if (score >= 80) return "Mükemmel Uyum! 🔥";
    if (score >= 60) return "Çok Benzer ✨";
    if (score >= 40) return "Orta Uyum 👍";
    if (score >= 20) return "Biraz Farklı 🤔";
    return "Tamamen Farklı 😅";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-400 to-emerald-500";
    if (score >= 60) return "from-emerald-400 to-teal-500";
    if (score >= 40) return "from-amber-400 to-yellow-500";
    if (score >= 20) return "from-orange-400 to-amber-500";
    return "from-red-400 to-orange-500";
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-pink-400" />
        <h3 className="font-bold text-white">Zevk Uyumu</h3>
      </div>

      {/* Score */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
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
              stroke="url(#scoreGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(match.overallScore / 100) * 264} 264`}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={match.overallScore >= 60 ? "#34d399" : match.overallScore >= 40 ? "#fbbf24" : "#f87171"} />
                <stop offset="100%" stopColor={match.overallScore >= 60 ? "#14b8a6" : match.overallScore >= 40 ? "#f59e0b" : "#fb923c"} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-black ${getScoreColor(match.overallScore)}`}>
              %{match.overallScore}
            </span>
          </div>
        </div>

        <div>
          <p className={`font-bold text-sm ${getScoreColor(match.overallScore)}`}>
            {getScoreLabel(match.overallScore)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {match.totalCommon} ortak izlenen
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Sen: {match.myTotalWatched} • {profileUserName}: {match.theirTotalWatched}
          </p>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <Film className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-xs text-neutral-400">Film Uyumu</p>
          <p className="text-lg font-bold text-white">%{match.movieScore}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <Tv className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <p className="text-xs text-neutral-400">Dizi Uyumu</p>
          <p className="text-lg font-bold text-white">%{match.tvScore}</p>
        </div>
      </div>

      {/* Genre Overlap */}
      {match.genreOverlap.length > 0 && (
        <div>
          <p className="text-xs text-neutral-400 mb-2 font-medium">
            Ortak Türler
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.genreOverlap.slice(0, 6).map((g: any) => (
              <span
                key={g.genre}
                className="text-[10px] bg-white/10 text-neutral-300 px-2 py-1 rounded-full font-medium"
              >
                {g.genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
