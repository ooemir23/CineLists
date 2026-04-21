import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserLists } from "@/lib/list-actions";
import { Plus, List, Lock, Globe, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CreateListButton } from "@/components/lists/create-list-button";

export default async function ListsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lists = await getUserLists(session.user.id);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-6 md:mb-10">
        <div className="flex items-center gap-3">
          <List className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            Listelerim
          </h1>
        </div>
        <p className="text-neutral-500 text-xs md:text-sm font-medium pb-1 md:pb-1.5">
          Kendi koleksiyonlarını oluştur ve paylaş.
        </p>
      </div>

      {/* Create List Button */}
      <div className="mb-8">
        <CreateListButton />
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <List className="w-10 h-10 text-neutral-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Henüz listen yok</h2>
          <p className="text-neutral-400 mb-6 max-w-sm">
            İlk listeni oluştur ve favori film/dizilerini koleksiyonlara ayır.
          </p>
          <CreateListButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list: any) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Poster Grid */}
              <div className="grid grid-cols-2 gap-0.5 h-40 bg-neutral-900">
                {list.items.length > 0 ? (
                  <>
                    {list.items.slice(0, 4).map((item: any, idx: number) => (
                      <div key={idx} className="relative overflow-hidden">
                        {item.media.posterPath ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w300${item.media.posterPath}`}
                            alt=""
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                            <Film className="w-6 h-6 text-neutral-700" />
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Fill empty slots */}
                    {Array.from({ length: Math.max(0, 4 - list.items.length) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="w-full h-full bg-neutral-800/50" />
                    ))}
                  </>
                ) : (
                  <div className="col-span-2 flex items-center justify-center">
                    <List className="w-10 h-10 text-neutral-700" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate group-hover:text-primary transition-colors">
                      {list.title}
                    </h3>
                    {list.description && (
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                        {list.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {list.isPublic ? (
                      <Globe className="w-3.5 h-3.5 text-neutral-500" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                  <span>{list._count.items} içerik</span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {list._count.likes}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Film({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
      <line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  );
}
