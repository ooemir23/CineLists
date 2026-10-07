"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";

// Use the CSRF-protected auth endpoint so an old tab can still sign out after
// a deployment changes the Server Action identifiers. Reload clears layout state.
export function SignOutButton({ className, compact = false }: {
  className?: string;
  compact?: boolean;
}) {
  const { dict } = useTranslation();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      await signOut({ redirectTo: "/" });
    } catch {
      setPending(false);
      toast.error(dict.common.errorOccurred);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
      aria-label={dict.nav.logout}
      title={dict.nav.logout}
      className={cn("flex items-center gap-2 rounded-xl text-rose-400 hover:bg-rose-500/10 disabled:opacity-50", className)}
    >
      {pending ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {!compact && <span>{dict.nav.logout}</span>}
    </button>
  );
}
