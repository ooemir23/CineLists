"use client";

import { useState, useEffect } from "react";
import { getListsForMedia, quickToggleMediaInList, createList } from "@/lib/list-actions";
import { ListPlus, Check, Plus, X, Loader2, Globe, Lock } from "lucide-react";

interface AddToListButtonProps {
  mediaId: string;
}

export function AddToListButton({ mediaId }: AddToListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<
    { id: string; title: string; hasItem: boolean }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [togglingListId, setTogglingListId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
  }, [isOpen]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const data = await getListsForMedia(mediaId);
      setLists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (listId: string) => {
    setTogglingListId(listId);
    try {
      const result = await quickToggleMediaInList(listId, mediaId);
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId ? { ...l, hasItem: result.added } : l
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingListId(null);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const newList = await createList({ title: newTitle.trim() });
      await quickToggleMediaInList(newList.id, mediaId);
      setNewTitle("");
      setShowCreate(false);
      loadLists();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all text-sm font-medium"
        title="Listeye Ekle"
      >
        <ListPlus size={18} />
        <span className="hidden sm:inline">Listeye Ekle</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 sm:rounded-3xl rounded-t-3xl p-5 w-full sm:max-w-sm shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Listeye Ekle</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreate(false);
                }}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Create New */}
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 w-full bg-primary/10 text-primary px-4 py-3 rounded-xl mb-3 hover:bg-primary/20 transition-all text-sm font-medium"
              >
                <Plus size={16} />
                Yeni Liste Oluştur
              </button>
            ) : (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Liste adı..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
                  maxLength={100}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newTitle.trim()}
                  className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Oluştur"
                  )}
                </button>
              </div>
            )}

            {/* Lists */}
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-neutral-500" size={24} />
                </div>
              ) : lists.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-8">
                  Henüz listen yok. Yukarıdan yeni bir liste oluştur.
                </p>
              ) : (
                lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleToggle(list.id)}
                    disabled={togglingListId === list.id}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all text-sm ${
                      list.hasItem
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-white/5 text-white hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    <span className="font-medium truncate">{list.title}</span>
                    {togglingListId === list.id ? (
                      <Loader2 size={14} className="animate-spin shrink-0" />
                    ) : list.hasItem ? (
                      <Check size={16} className="shrink-0" />
                    ) : (
                      <Plus size={16} className="shrink-0 text-neutral-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
