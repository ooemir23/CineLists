"use client";

import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomList {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  isPublic: boolean;
  createdAt?: Date;
}

interface CustomListsPreviewProps {
  lists?: CustomList[];
  maxDisplay?: number;
}

export function CustomListsPreview({
  lists = [],
  maxDisplay = 4,
}: CustomListsPreviewProps) {
  if (!lists || lists.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              Listelerim
            </h2>
          </div>
          <Link
            href="/lists/new"
            className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Yeni
          </Link>
        </div>

        <div className="bg-white/[0.02] border border-white/5 border-dashed rounded-xl p-6 text-center">
          <BookOpen className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-xs text-neutral-500 font-medium">
            Henüz liste oluşturmadın
          </p>
          <Link
            href="/lists/new"
            className="mt-3 inline-block px-4 py-2 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/30 transition-all"
          >
            İlk Listemizi Oluştur
          </Link>
        </div>
      </section>
    );
  }

  const displayed = lists.slice(0, maxDisplay);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-white tracking-tight uppercase">
            Listelerim ({lists.length})
          </h2>
        </div>
        <Link
          href="/lists"
          className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          Tümü
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        {displayed.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.id}`}
            className="group bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 hover:border-primary/30 rounded-lg p-3 transition-all active:scale-95"
          >
            <div className="flex items-start justify-between mb-2">
              <BookOpen className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              {!list.isPublic && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 font-bold uppercase">
                  Gizli
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
              {list.name}
            </h3>

            {list.description && (
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                {list.description}
              </p>
            )}

            <div className="text-xs text-neutral-500 font-medium mt-2 pt-2 border-t border-white/5">
              {list.itemCount} {list.itemCount === 1 ? "içerik" : "içerik"}
            </div>
          </Link>
        ))}

        {/* Create New List Card */}
        <Link
          href="/lists/new"
          className="bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 hover:border-primary/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 min-h-[130px]"
        >
          <Plus className="w-6 h-6 text-primary" />
          <span className="text-xs font-bold text-primary text-center">Yeni Liste</span>
        </Link>
      </div>
    </section>
  );
}
