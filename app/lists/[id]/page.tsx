import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getListById, toggleListLike } from "@/lib/list-actions";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Globe,
  Lock,
  ArrowLeft,
  Trash2,
  Film,
  Tv,
  Star,
  Calendar,
} from "lucide-react";
import { ListDetailClient } from "@/components/lists/list-detail-client";

type ListDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const list = await getListById(id);

  if (!list) notFound();

  const isOwner = list.userId === session.user.id;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
      {/* Back Button */}
      <Link
        href="/lists"
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Listelere Dön</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-10">
        {/* Cover Image */}
        <div className="w-full md:w-48 h-32 md:h-72 rounded-2xl overflow-hidden bg-neutral-800 relative shrink-0">
          {list.coverImage ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${list.coverImage}`}
              alt={list.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-12 h-12 text-neutral-700" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {list.isPublic ? (
              <span className="flex items-center gap-1 text-xs text-neutral-400 bg-white/5 px-2 py-1 rounded-full">
                <Globe size={12} /> Herkese Açık
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                <Lock size={12} /> Özel
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">
            {list.title}
          </h1>

          {list.description && (
            <p className="text-neutral-400 text-sm md:text-base mb-4 max-w-2xl">
              {list.description}
            </p>
          )}

          {/* Owner */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 relative">
              {list.user.image ? (
                <Image
                  src={list.user.image}
                  alt={list.user.name || ""}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs">
                  👤
                </div>
              )}
            </div>
            <Link
              href={`/profile/${list.userId}`}
              className="text-sm font-medium text-white hover:text-primary transition-colors"
            >
              {list.user.name}
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">
              {list._count.items} içerik
            </span>
            <ListLikeButton
              listId={list.id}
              likeCount={list._count.likes}
              initialIsLiked={list.isLiked}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <ListDetailClient
        listId={list.id}
        items={list.items}
        isOwner={isOwner}
        listTitle={list.title}
        listDescription={list.description}
        isPublic={list.isPublic}
      />
    </div>
  );
}

function ListLikeButton({
  listId,
  likeCount,
  initialIsLiked,
}: {
  listId: string;
  likeCount: number;
  initialIsLiked: boolean;
}) {
  return (
    <form action={async () => {
      "use server";
      await toggleListLike(listId);
    }}>
      <button
        type="submit"
        className={`flex items-center gap-1.5 text-sm transition-colors ${
          initialIsLiked
            ? "text-red-400 hover:text-red-300"
            : "text-neutral-400 hover:text-white"
        }`}
      >
        <Heart
          size={16}
          className={initialIsLiked ? "fill-red-400" : ""}
        />
        {likeCount}
      </button>
    </form>
  );
}
