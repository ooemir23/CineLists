"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n/i18n-context";
export function useAdminDetails<T>(url: string | null) {
  const { dict } = useTranslation(),
    [attempt, setAttempt] = useState(0),
    [state, setState] = useState<{
      url: string | null;
      attempt: number;
      data?: T;
      error?: string;
    }>({ url: null, attempt: 0 });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    let alive = true;
    const timeout = setTimeout(() => controller.abort(), 20_000);
    void fetch(url, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || dict.admin.loadError);
        return body as T;
      })
      .then((data) => {
        if (alive) setState({ url, attempt, data });
      })
      .catch((error) => {
        if (alive)
          setState({
            url,
            attempt,
            error:
              error instanceof Error && error.name !== "AbortError"
                ? error.message
                : dict.admin.loadError,
          });
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      alive = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [url, attempt, dict.admin.loadError]);
  const current = state.url === url && state.attempt === attempt;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: !!url && (!current || (!state.data && !state.error)),
    retry: () => setAttempt((n) => n + 1),
  };
}
export function DetailsDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { dict } = useTranslation(),
    ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    else if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-4 text-white backdrop:bg-black/75 sm:p-6"
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <h2 id={id} className="text-lg font-bold">
          {title}
        </h2>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label={dict.admin.close}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-2"
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
