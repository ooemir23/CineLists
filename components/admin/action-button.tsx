"use client";

import { useRef, useState, useTransition } from "react";
import { performAdminAction } from "@/lib/admin/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Action = "suspend" | "activate" | "redact-comment" | "redact-review";
export function AdminActionButton({
  action,
  targetId,
  label,
  description,
}: {
  action: Action;
  targetId: string;
  label: string;
  description: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <>
      <button
        onClick={() => dialog.current?.showModal()}
        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/10"
      >
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={`action-${targetId}`}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl backdrop:bg-black/70"
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              try {
                const result = await performAdminAction({
                  action,
                  targetId,
                  reason,
                });
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success("İşlem kaydedildi.");
                dialog.current?.close();
                setReason("");
                router.refresh();
              } catch {
                toast.error("Bağlantı kurulamadı. Tekrar deneyin.");
              }
            });
          }}
        >
          <h2 id={`action-${targetId}`} className="text-xl font-bold">
            {label}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            {description}
          </p>
          <label className="mt-5 block text-sm">
            İşlem nedeni
            <textarea
              autoFocus
              required
              minLength={5}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={pending}
              className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-slate-950 p-3 outline-none focus:border-amber-400"
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">
            İşlem, yönetici geçmişine kaydedilir.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => dialog.current?.close()}
              className="px-3 py-2 text-sm text-slate-300"
            >
              Vazgeç
            </button>
            <button
              disabled={pending || reason.trim().length < 5}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"
            >
              {pending ? "Kaydediliyor…" : "İşlemi onayla"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
