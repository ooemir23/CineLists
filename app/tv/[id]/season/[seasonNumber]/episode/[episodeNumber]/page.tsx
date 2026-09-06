import { tmdb } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, Clock, Star, MessageSquare, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import { CommentsSection } from "@/components/media/comments";
export default async function EpisodePage({ params }: { params: Promise<{ id: string, seasonNumber: string, episodeNumber: string }> }) {
    const { id, seasonNumber, episodeNumber } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    const [episode, mediaDetails, dbMedia] = await Promise.all([
        tmdb.getEpisodeDetails(id, Number(seasonNumber), Number(episodeNumber)),
        tmdb.getDetails("tv", id),
        prisma.mediaItem.findUnique({
            where: { tmdbId: Number(id) },
            include: {
                episodes: {
                    where: {
                        seasonNumber: Number(seasonNumber),
                        episodeNumber: Number(episodeNumber)
                    },
                    include: {
                        activities: {
                            where: { type: "RATED" },
                            include: { user: true }
                        },
                        comments: {
                            include: { user: true },
                            orderBy: { createdAt: "desc" }
                        }
                    }
                }
            }
        })
    ]);

    if (!episode) notFound();

    const dbEpisode = dbMedia?.episodes[0];
    const comments = dbEpisode?.comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        isSpoiler: c.isSpoiler,
        votes: c.votes || 0,
        userId: c.userId,
        user: { name: c.user.name, image: c.user.image },
        replies: [] // Add replies logic later if needed
    })) || [];

    const communityRating = dbEpisode?.activities.length 
        ? dbEpisode.activities.reduce((acc: number, a: any) => acc + (a.rating || 0), 0) / dbEpisode.activities.length 
        : null;

    return (
        <div className="min-h-screen bg-[#070c16] text-white">
            {/* HERO SECTION */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                {episode.still_path ? (
                    <Image
                        src={`https://image.tmdb.org/t/p/original${episode.still_path}`}
                        alt={episode.name || ""}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <Play size={80} className="text-white/10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070c16] via-[#070c16]/40 to-transparent" />
                
                <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
                    <Link 
                        href={`/tv/${id}?tab=heatmap`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-black/40 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                        Haritaya Dön
                    </Link>
                </div>

                <div className="absolute bottom-12 left-8 md:left-12 right-8 z-20 max-w-5xl space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="px-4 py-1.5 bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl italic">
                            Sezon {seasonNumber} • Bölüm {episodeNumber}
                        </span>
                        {episode.vote_average && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 text-amber-400 border border-white/10 font-black text-xs rounded-xl backdrop-blur-md">
                                <Star size={12} fill="currentColor" /> {episode.vote_average.toFixed(1)} <span className="opacity-40 text-[10px] ml-1">TMDB</span>
                            </span>
                        )}
                        {communityRating && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 text-amber-400 border border-amber-400/30 font-black text-xs rounded-xl backdrop-blur-md shadow-lg shadow-amber-400/10">
                                <Star size={12} fill="currentColor" /> {communityRating.toFixed(1)} <span className="opacity-60 text-[10px] ml-1">TOPLULUK</span>
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter italic leading-[0.9]">
                        {episode.name}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/40 font-black uppercase tracking-widest italic">
                        {mediaDetails?.name}
                    </p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-start">
                    {/* DETAILS COLUMN */}
                    <div className="space-y-12">
                        <div className="flex flex-wrap items-center gap-8 text-xs font-black text-neutral-500 uppercase tracking-[0.3em]">
                            {episode.air_date && (
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-amber-400" />
                                    <span>{new Date(episode.air_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            )}
                            {episode.runtime && (
                                <div className="flex items-center gap-3">
                                    <Clock size={18} className="text-amber-400" />
                                    <span>{episode.runtime} Dakika</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="w-16 h-1.5 bg-amber-400 rounded-full" />
                            <p className="text-xl md:text-3xl text-white/80 leading-relaxed font-medium">
                                {episode.overview || "Bu bölüm için henüz bir özet girilmemiş."}
                            </p>
                        </div>

                        {/* Interactive Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
                                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">Topluluk Puanı</p>
                                <div className="flex items-end gap-3">
                                    <span className="text-5xl font-black text-amber-400 italic leading-none">{communityRating ? communityRating.toFixed(1) : "-"}</span>
                                    <span className="text-xs font-bold text-neutral-500 pb-1">/ 10.0</span>
                                </div>
                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{dbEpisode?.activities.length || 0} Kişi puanladı</p>
                            </div>
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
                                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">Tartışma Sayısı</p>
                                <div className="flex items-end gap-3">
                                    <span className="text-5xl font-black text-white italic leading-none">{comments.length}</span>
                                    <MessageSquare size={24} className="text-neutral-500 mb-1" />
                                </div>
                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Aktif bölüm tartışması</p>
                            </div>
                        </div>
                    </div>

                    {/* COMMENTS COLUMN */}
                    <div className="w-full">
                        <CommentsSection 
                            mediaId={Number(id)}
                            type="tv"
                            initialComments={comments}
                            mediaTitle={`${mediaDetails?.name} - S${seasonNumber} E${episodeNumber}`}
                            mediaPosterPath={episode.still_path}
                            currentUserId={userId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
