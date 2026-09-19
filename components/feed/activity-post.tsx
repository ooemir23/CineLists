"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Star,
  CheckCircle2,
  User,
  X,
  Copy,
  Smile,
  Loader2,
  Film,
  Tv,
  ChevronRight,
  Share2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { addActivityComment, getActivityComments } from "@/lib/comment-actions";
import { voteActivity } from "@/lib/activity-actions";
import { toggleToWatch } from "@/lib/actions";
import { toast } from "sonner";

type ActivityPostProps = {
  activity: {
    id: string;
    type: "WATCHED" | "RATED" | "REVIEWED";
    createdAt: Date;
    rating: number | null;
    review: string | null;
    watchedWith: string | null;
    recommendedByText: string | null;
    votes: number;
    recommendedBy?: {
      id: string;
      name: string | null;
    } | null;
    platform?: string | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    media: {
      tmdbId: number;
      title: string;
      posterPath: string | null;
      backdropPath: string | null;
      type: "MOVIE" | "TV" | "PERSON";
      runtime?: number | null;
      releaseDate?: Date | string | null;
      voteAverage?: number | null;
    };
    episode?: {
      id: string;
      seasonNumber: number;
      episodeNumber: number;
      title: string;
    } | null;
    episodeRange?: {
      seasonNumber: number;
      fromEpisode: number;
      toEpisode: number;
      count: number;
    } | null;
    _count: {
      comments: number;
    };
  };
};

export function ActivityPost({ activity }: ActivityPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(activity.votes || 0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(activity._count?.comments || 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLabel, setTimeLabel] = useState("");

  useEffect(() => {
    setTimeLabel(
      formatDistanceToNow(new Date(activity.createdAt), {
        addSuffix: true,
        locale: tr,
      })
    );
  }, [activity.createdAt]);

  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    await voteActivity(activity.id, nextState ? 1 : -1);
  };

  const handleMediaDoubleClick = () => {
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
    if (!isLiked) {
      handleLike();
    }
  };

  const handleToggleWatchlist = async () => {
    try {
      const type = activity.media.type === "TV" ? "tv" : "movie";
      const res = await toggleToWatch(
        activity.media.tmdbId,
        type,
        activity.media.title,
        activity.media.posterPath
      );
      if (res && "inWatchlist" in res) {
        setIsSaved(Boolean(res.inWatchlist));
        toast.success(
          res.inWatchlist
            ? "İzleme listene kaydedildi"
            : "İzleme listenden çıkarıldı"
        );
      } else {
        setIsSaved(!isSaved);
        toast.success(!isSaved ? "Kaydedildi" : "Kaydedilenlerden çıkarıldı");
      }
    } catch {
      setIsSaved(!isSaved);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || submittingComment) return;

    setSubmittingComment(true);
    const res = await addActivityComment(activity.id, commentInput.trim());
    setSubmittingComment(false);

    if (res.success) {
      setCommentInput("");
      setCommentsCount((prev) => prev + 1);
      setShowComments(true);
      fetchComments();
      toast.success("Yorumun paylaşıldı");
    } else {
      toast.error(res.error || "Yorum gönderilemedi");
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    const data = await getActivityComments(activity.id);
    setComments(data || []);
    setLoadingComments(false);
  };

  const toggleCommentsSection = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const copyPostLink = () => {
    const url = `${window.location.origin}/${activity.media.type.toLowerCase()}/${activity.media.tmdbId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Bağlantı kopyalandı");
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  const shareOnWhatsapp = () => {
    const url = `${window.location.origin}/${activity.media.type.toLowerCase()}/${activity.media.tmdbId}`;
    const text = encodeURIComponent(`CineLists'te ${activity.user.name}'in paylaşımına bak: ${activity.media.title} - ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShowShareModal(false);
  };

  const getAvatarGradient = (name: string) => {
    const gradients = [
      "linear-gradient(135deg,#f472b6,#be185d)",
      "linear-gradient(135deg,#38bdf8,#1d4ed8)",
      "linear-gradient(135deg,#34d399,#047857)",
      "linear-gradient(135deg,#fbbf24,#b45309)",
      "linear-gradient(135deg,#a78bfa,#6d28d9)",
    ];
    let sum = 0;
    for (let i = 0; i < (name || "U").length; i++) sum += (name || "U").charCodeAt(i);
    return gradients[sum % gradients.length];
  };

  const avatarGradient = getAvatarGradient(activity.user.name || "");
  const initial = (activity.user.name || "U").substring(0, 1).toUpperCase();

  // Media Visual
  const imageSrc = activity.media.backdropPath
    ? `https://image.tmdb.org/t/p/w780${activity.media.backdropPath}`
    : activity.media.posterPath
    ? `https://image.tmdb.org/t/p/w500${activity.media.posterPath}`
    : null;

  const yearMeta = activity.media.releaseDate
    ? new Date(activity.media.releaseDate).getFullYear()
    : "";
  const typeMeta = activity.media.type === "MOVIE" ? "Film" : "Dizi";

  const actionText =
    activity.type === "REVIEWED"
      ? "inceleme yazdı"
      : activity.rating
      ? `izledi ve ${activity.rating}★ verdi`
      : "izledi";

  return (
    <article className="bg-slate-900/90 border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/20 relative font-hanken">
      {/* ─── 1. POST HEADER (Instagram Style) ─── */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3 min-w-0">
          {/* User Avatar */}
          <Link
            href={`/profile/${activity.user.id}`}
            className="relative shrink-0 p-[1.5px] rounded-full ring-1 ring-white/20 hover:ring-amber-400 transition-all"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden relative bg-slate-950">
              {activity.user.image ? (
                <Image
                  src={activity.user.image}
                  alt={activity.user.name || "Kullanıcı"}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-black text-xs text-white"
                  style={{ background: avatarGradient }}
                >
                  {initial}
                </div>
              )}
            </div>
          </Link>

          {/* User info & action subtitle */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 flex-wrap leading-none">
              <Link
                href={`/profile/${activity.user.id}`}
                className="font-black text-xs sm:text-sm text-white hover:text-amber-400 transition-colors truncate"
              >
                {activity.user.name}
              </Link>
              <span className="text-[11px] text-neutral-400 font-medium">
                {actionText}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-neutral-500 font-medium">
              <span>{timeLabel}</span>
              {activity.platform && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">{activity.platform}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Right Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Seçenekler"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-44 bg-slate-950/95 border border-white/15 rounded-2xl shadow-2xl p-1.5 z-40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <Link
                href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-200 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Yapıma Git</span>
              </Link>
              <button
                onClick={copyPostLink}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-200 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-colors text-left"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Bağlantıyı Kopyala</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowShareModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-neutral-200 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-colors text-left"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Paylaş</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. MAIN VISUAL (Instagram Large Image Area with Double-Tap) ─── */}
      <div
        className="relative w-full aspect-video max-h-[320px] bg-slate-950 overflow-hidden select-none cursor-pointer group/image"
        onDoubleClick={handleMediaDoubleClick}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={activity.media.title}
            fill
            sizes="(max-width: 768px) 100vw, 470px"
            priority={false}
            className="object-cover object-center group-hover/image:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            {activity.media.type === "MOVIE" ? (
              <Film className="w-16 h-16 text-neutral-700" />
            ) : (
              <Tv className="w-16 h-16 text-neutral-700" />
            )}
          </div>
        )}

        {/* Subtle cinematic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 pointer-events-none" />

        {/* Double-tap animated heart pop ❤️ */}
        {showHeartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in-50 duration-200">
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-[0_10px_30px_rgba(244,63,94,0.8)] scale-110" />
          </div>
        )}

        {/* Top-Right Badge: User or TMDB Rating */}
        {(activity.rating || activity.media.voteAverage) && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 shadow-lg">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-black text-white">
              {activity.rating ? activity.rating.toFixed(1) : activity.media.voteAverage?.toFixed(1)}
            </span>
          </div>
        )}

        {/* Bottom Overlay Info Banner: Title, Year, Episode badge */}
        <Link
          href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`}
          className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4 z-10 flex items-end justify-between gap-3 group/link"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase tracking-wider shadow-sm">
                {typeMeta}
              </span>
              {yearMeta && (
                <span className="text-[11px] font-bold text-neutral-300 drop-shadow">
                  {yearMeta}
                </span>
              )}

              {/* TV Episode Tag */}
              {activity.episodeRange && (
                <>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-500/80 text-white backdrop-blur-sm">
                    S{activity.episodeRange.seasonNumber} • B{activity.episodeRange.fromEpisode} - B{activity.episodeRange.toEpisode}
                  </span>
                  {activity.episodeRange.count > 1 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 backdrop-blur-sm">
                      {activity.episodeRange.count} Bölüm
                    </span>
                  )}
                </>
              )}
              {activity.episode && !activity.episodeRange && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-500/80 text-white backdrop-blur-sm">
                  S{activity.episode.seasonNumber} B{activity.episode.episodeNumber}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug group-hover/link:text-amber-400 transition-colors drop-shadow-md truncate">
              {activity.media.title}
            </h3>

            {activity.episode?.title && (
              <p className="text-xs text-neutral-300 font-medium line-clamp-1 drop-shadow mt-0.5">
                "{activity.episode.title}"
              </p>
            )}
          </div>

          <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover/link:bg-amber-400 group-hover/link:text-slate-950 transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* ─── 3. ACTION BAR (Instagram Icons: Like, Comment, Share, Bookmark) ─── */}
      <div className="p-3.5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Heart / Like button */}
            <button
              onClick={handleLike}
              className={cn(
                "transition-transform active:scale-125 focus:outline-none",
                isLiked ? "text-rose-500 scale-105" : "text-white hover:text-rose-400"
              )}
              aria-label={isLiked ? "Beğenmekten vazgeç" : "Beğen"}
            >
              <Heart
                className={cn(
                  "w-6 h-6 transition-all",
                  isLiked ? "fill-current text-rose-500" : "stroke-[2]"
                )}
              />
            </button>

            {/* Comment button */}
            <button
              onClick={toggleCommentsSection}
              className="text-white hover:text-amber-400 transition-colors active:scale-95 focus:outline-none"
              aria-label="Yorum yap"
            >
              <MessageCircle className="w-6 h-6 stroke-[2]" />
            </button>

            {/* Direct Send / Share button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="text-white hover:text-amber-400 transition-colors active:scale-95 focus:outline-none"
              aria-label="Paylaş"
            >
              <Send className="w-6 h-6 stroke-[2] -rotate-12" />
            </button>
          </div>

          {/* Bookmark / Watchlist button */}
          <button
            onClick={handleToggleWatchlist}
            className={cn(
              "transition-transform active:scale-125 focus:outline-none",
              isSaved ? "text-amber-400" : "text-white hover:text-amber-400"
            )}
            aria-label="Kaydet"
          >
            <Bookmark
              className={cn(
                "w-6 h-6 transition-all",
                isSaved ? "fill-current text-amber-400" : "stroke-[2]"
              )}
            />
          </button>
        </div>

        {/* Likes Count */}
        <div className="mt-2 text-xs sm:text-sm font-black text-white">
          {likesCount > 0 ? (
            <span>
              {likesCount.toLocaleString("tr-TR")} beğenme
            </span>
          ) : (
            <span className="text-neutral-400 font-medium">İlk beğenen sen ol</span>
          )}
        </div>

        {/* ─── 4. CAPTION & REVIEW (Instagram Style) ─── */}
        <div className="mt-2 text-xs sm:text-sm leading-relaxed text-neutral-200">
          <Link
            href={`/profile/${activity.user.id}`}
            className="font-black text-white hover:underline mr-2 inline"
          >
            {activity.user.name}
          </Link>

          {activity.review ? (
            <span className="font-medium text-neutral-200">
              {isExpanded || activity.review.length <= 130
                ? activity.review
                : `${activity.review.substring(0, 130)}... `}
              {activity.review.length > 130 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="font-bold text-neutral-400 hover:text-white inline-block ml-1"
                >
                  {isExpanded ? "daha az" : "devamını oku"}
                </button>
              )}
            </span>
          ) : (
            <span className="text-neutral-400">
              {activity.media.title} yapımını izledi.
            </span>
          )}

          {activity.watchedWith && (
            <div className="text-[11px] font-semibold text-amber-400 mt-1">
              👥 {activity.watchedWith} ile birlikte izlendi
            </div>
          )}
        </div>

        {/* Comments Toggle Trigger */}
        {commentsCount > 0 && !showComments && (
          <button
            onClick={toggleCommentsSection}
            className="mt-1.5 text-xs text-neutral-400 hover:text-neutral-200 font-medium block"
          >
            {commentsCount} yorumun tümünü gör
          </button>
        )}

        {/* ─── 5. COMMENTS LIST (When Opened) ─── */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5 animate-in fade-in duration-200">
            {loadingComments ? (
              <div className="flex items-center justify-center py-4 text-xs text-neutral-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Yorumlar yükleniyor...</span>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-neutral-500 py-1">Henüz yorum yok. İlk yorumu sen yap!</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 text-xs">
                    <Link
                      href={`/profile/${c.user.id}`}
                      className="font-black text-white hover:underline shrink-0"
                    >
                      {c.user.name}
                    </Link>
                    <span className="text-neutral-200 font-normal flex-1">
                      {c.content}
                    </span>
                    <span className="text-[9px] text-neutral-500 shrink-0">
                      {formatDistanceToNow(new Date(c.createdAt), {
                        addSuffix: false,
                        locale: tr,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Date line */}
        <div className="mt-2 text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
          {timeLabel}
        </div>
      </div>

      {/* ─── 6. BOTTOM INLINE COMMENT INPUT (Instagram Quick Comment) ─── */}
      <form
        onSubmit={handleCommentSubmit}
        className="border-t border-white/5 px-3.5 py-2.5 flex items-center gap-2.5 bg-white/[0.01]"
      >
        <Smile className="w-5 h-5 text-neutral-400 shrink-0 pointer-events-none" />
        <input
          type="text"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          placeholder="Yorum ekle..."
          className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none font-medium"
        />
        <button
          type="submit"
          disabled={!commentInput.trim() || submittingComment}
          className={cn(
            "text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-0 shrink-0",
            commentInput.trim()
              ? "text-amber-400 hover:text-amber-300"
              : "text-neutral-500"
          )}
        >
          {submittingComment ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Paylaş"
          )}
        </button>
      </form>

      {/* ─── 7. SHARE MODAL ─── */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-400/20 border border-amber-400/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-white">Paylaş</h3>
              <p className="text-xs text-neutral-400 mt-1">{activity.media.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={shareOnWhatsapp}
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                  WhatsApp
                </span>
              </button>

              <button
                onClick={copyPostLink}
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </div>
                <span className="text-xs font-bold text-white group-hover:text-amber-300">
                  {copied ? "Kopyalandı" : "Linki Kopyala"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
