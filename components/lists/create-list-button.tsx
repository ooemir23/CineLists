"use client";

import { useState } from "react";
import { createList } from "@/lib/list-actions";
import { Plus, X, Globe, Lock, Loader2 } from "lucide-react";

export function CreateListButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Liste başlığı gerekli.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createList({
        title: title.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      setTitle("");
      setDescription("");
      setIsPublic(true);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
      >
        <Plus size={20} />
        Yeni Liste Oluştur
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Yeni Liste</h2>
          <button
            onClick={() => {
              setIsOpen(false);
              setError("");
            }}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Liste Başlığı *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ör: En İyi Korku Filmleri"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
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
              placeholder="Bu liste ne hakkında?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
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
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <Globe size={16} />
                Herkese Açık
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                  !isPublic
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <Lock size={16} />
                Özel
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError("");
              }}
              className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                "Oluştur"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
