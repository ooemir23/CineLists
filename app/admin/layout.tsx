import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/access";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import { AdminRefreshButton } from "@/components/admin/refresh-button";
import { ShieldCheck } from "lucide-react";
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: getDictionary(await getServerLocale()).admin.title,
    robots: { index: false, follow: false },
  };
}
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = getDictionary(await getServerLocale()).admin;
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fadmin");
  const admin = await getAdmin();
  if (!admin)
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="mt-6 text-2xl font-bold">{t.restricted}</h1>
        <p className="mt-3 text-sm text-slate-400">{t.restrictedHint}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950"
        >
          {t.home}
        </Link>
      </div>
    );
  return (
    <div className="mx-auto min-w-0 max-w-[1440px] px-4 py-8 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs text-amber-400">
            <ShieldCheck size={16} />
            {t.admin}
          </p>
          <h1 className="mt-3 text-3xl font-black">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="break-all text-sm text-slate-500">
            @{admin.username}
          </span>
          <AdminRefreshButton />
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-3 py-2 text-sm"
          >
            {t.openSite} ↗
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
