export default function MediaDetailLoading() {
  return (
    <div className="relative min-h-screen animate-pulse">
      {/* ── BACKGROUND BANNER SKELETON ── */}
      <div className="absolute top-0 left-0 right-0 h-[480px] z-0 pointer-events-none overflow-hidden bg-gradient-to-b from-slate-900/60 via-slate-950/80 to-[#070c16]" />

      {/* ── LAYOUT ── */}
      <div className="relative z-10">
        {/* ════ TOP HEADER ════ */}
        <div className="px-3.5 sm:px-6 lg:px-10 pt-3 md:pt-6 pb-6 border-b border-white/[0.05]">
          {/* Mobile only skeleton */}
          <div className="md:hidden space-y-3">
            <div className="w-full rounded-2xl bg-white/5 border border-white/10 aspect-[16/8]" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-white/10" />
              <div className="h-5 w-20 rounded-full bg-white/10" />
            </div>
            <div className="h-8 w-3/4 rounded-xl bg-white/10" />
            <div className="h-4 w-1/2 rounded-lg bg-white/5" />
            <div className="flex gap-2 pt-2">
              <div className="h-10 flex-1 rounded-xl bg-white/10" />
              <div className="h-10 flex-1 rounded-xl bg-white/10" />
            </div>
          </div>

          {/* Desktop header skeleton */}
          <div className="hidden md:flex gap-6 lg:gap-10 items-start">
            {/* Poster Skeleton */}
            <div className="w-48 lg:w-60 flex-shrink-0 aspect-[2/3] rounded-2xl bg-white/5 border border-white/10 shadow-2xl" />

            {/* Main Info Skeleton */}
            <div className="flex-1 space-y-4 pt-2">
              {/* Genre chips */}
              <div className="flex gap-2 items-center">
                <div className="h-5 w-16 rounded-full bg-amber-400/20" />
                <div className="h-5 w-20 rounded-full bg-white/10" />
                <div className="h-5 w-24 rounded-full bg-white/10" />
              </div>

              {/* Title */}
              <div className="h-9 w-2/3 rounded-xl bg-white/10" />
              <div className="h-4 w-1/3 rounded-lg bg-white/5" />

              {/* Rating & meta row */}
              <div className="flex items-center gap-3 pt-1">
                <div className="h-6 w-16 rounded-lg bg-amber-400/15" />
                <div className="h-4 w-20 rounded-md bg-white/10" />
                <div className="h-4 w-16 rounded-md bg-white/10" />
                <div className="h-4 w-24 rounded-md bg-white/10" />
              </div>

              {/* Overview lines */}
              <div className="space-y-2 max-w-2xl pt-2">
                <div className="h-3.5 w-full rounded bg-white/5" />
                <div className="h-3.5 w-5/6 rounded bg-white/5" />
                <div className="h-3.5 w-2/3 rounded bg-white/5" />
              </div>

              {/* Action buttons row */}
              <div className="flex items-center gap-3 pt-3">
                <div className="h-10 w-32 rounded-xl bg-amber-500/20" />
                <div className="h-10 w-28 rounded-xl bg-white/10" />
                <div className="h-10 w-28 rounded-xl bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* ════ BOTTOM TABS SKELETON ════ */}
        <div className="px-3.5 sm:px-6 lg:px-10 pt-6 pb-12 bg-[#070c16] space-y-6">
          <div className="flex gap-4 border-b border-white/10 pb-3">
            <div className="h-7 w-24 rounded-lg bg-white/10" />
            <div className="h-7 w-24 rounded-lg bg-white/5" />
            <div className="h-7 w-24 rounded-lg bg-white/5" />
          </div>

          {/* Cast cards row skeleton */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[3/4] rounded-xl bg-white/5 border border-white/5" />
                <div className="h-3 w-3/4 rounded bg-white/10 mx-auto" />
                <div className="h-2.5 w-1/2 rounded bg-white/5 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
