export default function Loading() {
  return (
    <div role="status" aria-label="Sayfa yükleniyor" className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 py-6 md:py-12">
      <span className="sr-only">Sayfa yükleniyor…</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-xl bg-white/10" />
        <div className="h-44 sm:h-64 rounded-2xl bg-white/5 border border-white/10" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="aspect-[2/3] rounded-xl bg-white/5" />)}
        </div>
      </div>
    </div>
  );
}
