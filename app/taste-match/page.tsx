import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyTasteProfile, getTopTasteMatches } from "@/lib/taste-match-actions";
import { Heart, Users, Film, Tv, Star, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function TasteMatchPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [profile, topMatches] = await Promise.all([
    getMyTasteProfile(),
    getTopTasteMatches(session.user.id, 20),
  ]);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8">
      <div className="flex items-center gap-2.5 mb-6 sm:mb-8">
        <Heart className="w-8 h-8 text-pink-400" />
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Zevk İkizleri</h1>
          <p className="text-xs sm:text-sm text-neutral-400">Sana benzer zevklere sahip kullanıcılar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-neutral-400 font-medium">Toplam İzlenen</span>
          </div>
          <p className="text-2xl font-black text-white">{profile.totalWatched}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {profile.movieCount} film • {profile.tvCount} dizi
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-neutral-400 font-medium">Ortalama Puan</span>
          </div>
          <p className="text-2xl font-black text-white">{profile.averageRating}</p>
          <p className="text-xs text-neutral-500 mt-1">{profile.totalRated} içerik puanlandı</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-neutral-400 font-medium">Favori Türler</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.favoriteGenres.slice(0, 3).map((g) => (
              <span
                key={g.genre}
                className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md font-bold"
              >
                {g.genre}
              </span>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-pink-400" />
        Senin Gibi İnsanlar
      </h2>

      {topMatches.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">Henüz zevk uyumu bulunamadı.</p>
          <p className="text-neutral-500 text-sm mt-1">
            Daha fazla içerik izledikçe benzer zevkli kullanıcılar bulunacak.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topMatches.map((match) => (
            <Link
              key={match.userId}
              href={`/profile/${match.userId}`}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                  {match.image ? (
                    <Image
                      src={match.image}
                      alt={match.name || "Kullanıcı"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 font-bold">
                      {(match.name || "K")[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate group-hover:text-primary transition-colors">
                    {match.name || "İsimsiz Kullanıcı"}
                  </p>
                  <p className="text-xs text-neutral-500">Zevk uyumu</p>
                </div>

                <div className="shrink-0">
                  <div
                    className={`text-xl font-black ${
                      match.score >= 80
                        ? "text-green-400"
                        : match.score >= 60
                          ? "text-emerald-400"
                          : match.score >= 40
                            ? "text-amber-400"
                            : "text-orange-400"
                    }`}
                  >
                    %{match.score}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}