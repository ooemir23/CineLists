export default function Loading() {
  return (
    <div
      role="status"
      className="mx-auto max-w-6xl animate-pulse space-y-5 p-8"
    >
      <p className="text-slate-400">Yönetim verileri yükleniyor…</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-36 rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-white/5" />
    </div>
  );
}
