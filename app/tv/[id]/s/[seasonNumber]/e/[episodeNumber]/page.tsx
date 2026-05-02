import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { tmdb } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";
import { getWatchedEpisodes } from "@/lib/tv-actions";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageSquare, Star, Calendar, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EpisodeInteraction } from "./episode-interaction";

type Props = {
    params: Promise<{ id: string; seasonNumber: string; episodeNumber: string }>;
};

export default async function EpisodePage(props: Props) {
    const params = await props.params;
    const { id, seasonNumber, episodeNumber } = params;
    const tvId = parseInt(id);
    const sNum = parseInt(seasonNumber);
    const eNum = parseInt(episodeNumber);

    const session = await auth();
    const isAuthenticated = !!session?.user?.id;

    const [data, showData, watchedEpisodes] = await Promise.all([
        tmdb.getEpisodeDetails(id, sNum, eNum),
        tmdb.getTVShow(id),
        getWatchedEpisodes(tvId)
    ]);

    if (!data) notFound();

    const media = await prisma.mediaItem.findUnique({ where: { tmdbId: tvId } });
    let dbEpisode = null;
    let ratings: any[] = [];
    let comments: any[] = [];

    if (media) {
        dbEpisode = await prisma.episode.findUnique({
            where: { mediaId_seasonNumber_episodeNumber: { mediaId: media.id, seasonNumber: sNum, episodeNumber: eNum } },
            include: {
                comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
                activities: { where: { type: "RATED" } }
            }
        });
        if (dbEpisode) {
            comments = dbEpisode.comments.map(c => ({
                id: c.id, content: c.content, createdAt: c.createdAt, isSpoiler: c.isSpoiler,
                user: { id: c.userId, name: c.user.name, image: c.user.image }
            }));
            ratings = dbEpisode.activities;
        }
    }

    const isWatched = watchedEpisodes.some(w => w.s === sNum && w.e === eNum);
    const userRating = ratings.find(r => r.userId === session?.user?.id)?.rating;
    const totalLikes = ratings.filter(r => r.rating === 1).length;
    const stillPath = data.still_path ? `https://image.tmdb.org/t/p/w500${data.still_path}` : null;

    return (
        /* 
           MOBILE (default): TopNav hidden, MobileHeader (64px) + MobileDock (80px) = 144px offset.
           DESKTOP (sm+): TopNav (72px) visible, MobileHeader/Dock hidden = 72px offset.
        */
        <div className="flex flex-col h-[calc(100vh-144px)] sm:h-[calc(100vh-72px)] bg-[#070c16] text-slate-200 overflow-hidden relative">
            {/* MINIMAL TOP HEADER */}
            <header className="shrink-0 bg-[#070c16] border-b border-white/5 px-4 h-14 flex items-center gap-4 z-50">
                <Link href={`/tv/${id}`} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                
                <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] italic truncate block">{showData?.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hidden xs:inline">SOHBET CANLI</span>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* CHAT / COMMENTS AREA (MAIN FRONT) */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0a0f1d] relative">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-5">
                        {comments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                                <MessageSquare size={48} className="mb-4" />
                                <p className="text-xs font-black uppercase tracking-[0.3em] italic">Henüz sohbet başlamadı.</p>
                            </div>
                        ) : (
                            comments.map((c: any) => (
                                <div 
                                    key={c.id} 
                                    className={cn(
                                        "flex gap-3 max-w-[90%] md:max-w-[75%]",
                                        c.user.id === session?.user?.id ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className="w-7 h-7 rounded-lg bg-slate-800 shrink-0 overflow-hidden ring-1 ring-white/10 mt-0.5">
                                        {c.user.image ? (
                                            <img src={c.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600 text-[9px]">
                                                {c.user.name?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={cn(
                                        "space-y-0.5",
                                        c.user.id === session?.user?.id ? "items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "flex items-center gap-2",
                                            c.user.id === session?.user?.id ? "flex-row-reverse" : ""
                                        )}>
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-tight">{c.user.name}</span>
                                            <span className="text-[7px] font-bold text-white/10">{new Date(c.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={cn(
                                            "p-3 rounded-2xl text-xs leading-relaxed font-medium shadow-xl border",
                                            c.user.id === session?.user?.id 
                                                ? "bg-amber-400 text-black border-amber-500 rounded-tr-none" 
                                                : "bg-[#1e293b] text-slate-200 border-white/5 rounded-tl-none",
                                            c.isSpoiler && "blur-md select-none cursor-help"
                                        )}>
                                            {c.content}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* INTERACTION & INPUT BAR - PINNED TO BOTTOM */}
                    <div className="shrink-0 p-3 bg-[#070c16] border-t border-white/5">
                        <EpisodeInteraction
                            tmdbId={tvId}
                            seasonNumber={sNum}
                            episodeNumber={eNum}
                            initialIsWatched={isWatched}
                            initialRating={userRating}
                            episodeName={data.name}
                            overview={data.overview}
                            stillPath={data.still_path}
                            airDate={data.air_date}
                            totalLikes={totalLikes}
                            isAuthenticated={isAuthenticated}
                        />
                    </div>
                </div>

                {/* SIDEBAR: EPISODE INFO & PHOTO */}
                <div className="hidden lg:block w-80 bg-[#070c16] border-l border-white/5 p-5 space-y-5 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3">
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl group">
                            {stillPath ? (
                                <Image src={stillPath} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600 text-[9px]">GÖRSEL YOK</div>
                            )}
                            {data.vote_average > 0 && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                                    <Star size={10} fill="currentColor" className="text-amber-400" />
                                    <span className="text-[9px] font-black text-amber-400">{data.vote_average.toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">SEZON {sNum} · BÖLÜM {eNum}</span>
                            <h1 className="text-base font-black text-white leading-tight uppercase italic tracking-tighter">{data.name}</h1>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/5">
                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Hakkında</h3>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            {data.overview || "Özet bulunmuyor."}
                        </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase">Yayın</span>
                            <span className="text-[9px] font-black text-white">{data.air_date ? new Date(data.air_date).toLocaleDateString('tr-TR') : "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase">Süre</span>
                            <span className="text-[9px] font-black text-white">{data.runtime || "-"} DK</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
