"use client";
import { useId, useRef, useState, useTransition } from "react";
import { performAdminAction } from "@/lib/admin/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/i18n-context";
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
  const { dict } = useTranslation(),
    t = dict.admin,
    dialog = useRef<HTMLDialogElement>(null),
    id = useId();
  const [reason, setReason] = useState(""),
    [pending, startTransition] = useTransition(),
    router = useRouter();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setReason("");
          dialog.current?.showModal();
        }}
        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/10"
      >
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={id}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 text-white backdrop:bg-black/70"
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pending) return;
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
                toast.success(t.saved);
                dialog.current?.close();
                setReason("");
                router.refresh();
              } catch {
                toast.error(t.actionError);
              }
            });
          }}
        >
          <h2 id={id} className="text-xl font-bold">
            {label}
          </h2>
          <p className="mt-3 text-sm text-slate-400">{description}</p>
          <label className="mt-5 block text-sm">
            {t.reason}
            <textarea
              autoFocus
              required
              minLength={5}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={pending}
              className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-slate-950 p-3 focus:border-amber-400"
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">{t.reasonHint}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => dialog.current?.close()}
              className="px-3 py-2 text-sm"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={pending || reason.trim().length < 5}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"
            >
              {pending ? t.saving : t.save}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
