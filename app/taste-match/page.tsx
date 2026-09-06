import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyTasteProfile, getTopTasteMatches } from "@/lib/taste-match-actions";
import { Heart, Users, Film, Star, Flame, Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function TasteMatchPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let profile: any = null;
  let topMatches: any[] = [];

  try {
    [profile, topMatches] = await Promise.all([
      getMyTasteProfile(),
      getTopTasteMatches(session.user.id, 20),
    ]);
  } catch (error) {
    console.error("TasteMatch database query error:", error);
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-4 text-pink-400">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Veritabanına Bağlanılamadı</h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto mb-6">
          Zevk ikizleri ve profil verilerine erişilemedi. Lütfen veritabanı bağlantınızı kontrol edin.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-rose-500/10 border border-pink-500/25 flex items-center justify-center text-pink-400 shadow-lg shadow-pink-500/10">
            <Heart className="w-5 h-5 fill-pink-500/30" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Zevk İkizleri
              <span className="px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 text-[10px] font-black border border-pink-500/20">
                AI Match
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-medium">Sana en çok benzeyen sinema zevkine sahip kullanıcılar</p>
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Film className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">İzleme Hafızası</span>
          </div>
          <p className="text-2xl font-black text-white">{profile.totalWatched}</p>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            {profile.movieCount} film • {profile.tvCount} dizi
          </p>
        </div>

        <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Ortalama Puan</span>
          </div>
          <p className="text-2xl font-black text-white">{profile.averageRating}</p>
          <p className="text-xs text-neutral-500 font-medium mt-1">{profile.totalRated} içerik değerlendirildi</p>
        </div>

        <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Favori Türlerin</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.favoriteGenres.slice(0, 3).map((g: { genre: string }) => (
              <span
                key={g.genre}
                className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/25 px-2.5 py-0.5 rounded-full font-black tracking-wide"
              >
                {g.genre}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── MATCHES LIST ── */}
      <div className="space-y-4">
        <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Users className="w-4 h-4 text-pink-400" />
          En Yüksek Eşleşmeler ({topMatches.length})
        </h2>

        {topMatches.length === 0 ? (
          <div className="bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 border-dashed rounded-3xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-neutral-500">
              <Compass size={24} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">Henüz zevk ikizi bulunamadı</h3>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
              Daha fazla film ve dizi puanlayıp izledikçe ortak zevke sahip kullanıcılar burada otomatik listelenecektir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {topMatches.map((match: any) => {
              const ringColor = match.score >= 80 ? "text-emerald-400" : match.score >= 60 ? "text-amber-400" : "text-rose-400";
              const badgeBg = match.score >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : match.score >= 60 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20";

              return (
                <Link
                  key={match.userId}
                  href={`/profile/${match.userId}`}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] hover:border-white/20 transition-all group flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-neutral-800 ring-1 ring-white/10 shrink-0">
                      {match.image ? (
                        <Image
                          src={match.image}
                          alt={match.name || "Kullanıcı"}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 font-black text-sm">
                          {(match.name || "K")[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-black text-white truncate group-hover:text-amber-400 transition-colors">
                        {match.name || "İsimsiz Kullanıcı"}
                      </p>
                      <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-0.5 ${badgeBg}`}>
                        {match.score >= 80 ? "Zevk İkizi" : match.score >= 60 ? "Yüksek Uyum" : "Benzer Zevk"}
                      </span>
                    </div>
                  </div>

                  {/* Circular Score Ring */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/10"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={ringColor}
                        strokeDasharray={`${match.score}, 100`}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-white">%{match.score}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}