import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/access";
import { ShieldCheck, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Yönetim Merkezi",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fadmin");
  const admin = await getAdmin();
  if (!admin)
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="mt-6 text-2xl font-bold">Bu alan yöneticilere özel</h1>
        <p className="mt-3 text-sm text-slate-400">
          Bu hesabın yönetim paneline erişim yetkisi bulunmuyor.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950"
        >
          Ana sayfaya dön
        </Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 sm:py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-amber-400">
            <ShieldCheck size={16} /> cinelists / yönetim
          </p>
          <h1 className="mt-3 font-bricolage text-3xl font-black tracking-tight sm:text-4xl">
            Yönetim Merkezi
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Topluluğun nabzı, kullanıcılar ve platformun genel görünümü.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">@{admin.username}</span>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5"
          >
            Siteyi aç <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
