"use client";

import { useState } from "react";
import { removeFromList, updateList, deleteList } from "@/lib/list-actions";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Film,
  Tv,
  Star,
  Trash2,
  Settings,
  X,
  Loader2,
  GripVertical,
  Globe,
  Lock,
} from "lucide-react";

interface ListItem {
  id: string;
  order: number;
  note: string | null;
  media: {
    id: string;
    title: string;
    posterPath: string | null;
    type: string;
    voteAverage: number | null;
    releaseDate: Date | null;
    genres: string[];
  };
}

interface ListDetailClientProps {
  listId: string;
  items: ListItem[];
  isOwner: boolean;
  listTitle: string;
  listDescription: string | null;
  isPublic: boolean;
}

export function ListDetailClient({
  listId,
  items: initialItems,
  isOwner,
  listTitle: initialTitle,
  listDescription: initialDescription,
  isPublic: initialIsPublic,
}: ListDetailClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || "");
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleRemove = async (mediaId: string, itemTitle: string) => {
    if (!confirm(`"${itemTitle}" listeden kaldırılsın mı?`)) return;

    setRemoving(mediaId);
    try {
      await removeFromList(listId, mediaId);
      setItems((prev) => prev.filter((i) => i.media.id !== mediaId));
    } catch (err) {
      alert("Bir hata oluştu.");
    } finally {
      setRemoving(null);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateList(listId, {
        title: title.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      setShowSettings(false);
      router.refresh();
    } catch (err) {
      alert("Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteList = async () => {
    if (!confirm("Bu liste silinecek. Emin misiniz? Bu işlem geri alınamaz.")) return;

    setDeleting(true);
    try {
      await deleteList(listId);
      router.push("/lists");
    } catch (err) {
      alert("Bir hata oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Owner Actions */}
      {isOwner && (
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white bg-white/5 px-4 py-2 rounded-xl transition-all hover:bg-white/10"
          >
            <Settings size={16} />
            Listeyi Düzenle
          </button>
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-neutral-600" />
          </div>
          <p className="text-neutral-400">Bu liste boş</p>
          <p className="text-neutral-500 text-sm mt-1">
            Film veya dizi detay sayfasından bu listeye içerik ekleyebilirsin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="group flex items-center gap-4 bg-white/5 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all"
            >
              {/* Order Number */}
              <span className="text-neutral-600 font-bold text-sm w-6 text-center shrink-0">
                {index + 1}
              </span>

              {/* Poster */}
              <Link
                href={`/${item.media.type === "MOVIE" ? "movie" : "tv"}/${item.media.id}`}
                className="shrink-0"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-neutral-800 relative">
                  {item.media.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${item.media.posterPath}`}
                      alt={item.media.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.media.type === "MOVIE" ? (
                        <Film className="w-4 h-4 text-neutral-700" />
                      ) : (
                        <Tv className="w-4 h-4 text-neutral-700" />
                      )}
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <Link
                href={`/${item.media.type === "MOVIE" ? "movie" : "tv"}/${item.media.id}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm truncate group-hover:text-primary transition-colors">
                    {item.media.title}
                  </h3>
                  {item.media.type === "TV" && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                      DİZİ
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {item.media.voteAverage && (
                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      {item.media.voteAverage.toFixed(1)}
                    </span>
                  )}
                  {item.media.genres.length > 0 && (
                    <span className="text-xs text-neutral-500 truncate">
                      {item.media.genres.slice(0, 3).join(", ")}
                    </span>
                  )}
                </div>
                {item.note && (
                  <p className="text-xs text-neutral-500 mt-1 italic">
                    {item.note}
                  </p>
                )}
              </Link>

              {/* Remove Button */}
              {isOwner && (
                <button
                  onClick={() => handleRemove(item.media.id, item.media.title)}
                  disabled={removing === item.media.id}
                  className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all p-2 shrink-0 disabled:opacity-50"
                  title="Listeden kaldır"
                >
                  {removing === item.media.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Listeyi Düzenle</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Liste Başlığı
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Açıklama
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Görünürlük
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      isPublic
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-white/5 border-white/10 text-neutral-400"
                    }`}
                  >
                    <Globe size={16} /> Herkese Açık
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      !isPublic
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-white/5 border-white/10 text-neutral-400"
                    }`}
                  >
                    <Lock size={16} /> Özel
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving || !title.trim()}
                  className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    "Kaydet"
                  )}
                </button>
              </div>

              {/* Delete */}
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleDeleteList}
                  disabled={deleting}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  {deleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Listeyi Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
