import { getDictionary, getServerLocale } from "@/lib/i18n/server";
export default async function Loading() {
  const t = getDictionary(await getServerLocale()).admin;
  return (
    <div
      role="status"
      className="mx-auto max-w-6xl animate-pulse space-y-5 p-4"
    >
      <p className="text-slate-400">{t.loading}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-36 rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-white/5" />
    </div>
  );
}
