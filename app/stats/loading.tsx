
export default function StatsLoading() {
    return (
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center gap-3 mb-6 sm:mb-10">
                <div className="w-9 h-9 rounded-xl bg-white/10" />
                <div className="h-8 w-48 bg-white/10 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
                <div className="lg:col-span-2 space-y-6">
                    {/* Big Hero Card */}
                    <div className="h-56 rounded-3xl bg-white/5 border border-white/10 p-6" />

                    {/* Stats 4-Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/5" />
                        ))}
                    </div>

                    {/* Social Stats */}
                    <div className="h-44 rounded-2xl bg-white/5 border border-white/5" />

                    {/* Charts */}
                    <div className="h-64 rounded-2xl bg-white/5 border border-white/5" />
                    <div className="h-64 rounded-2xl bg-white/5 border border-white/5" />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="h-96 rounded-2xl bg-white/5 border border-white/10" />
                    <div className="h-40 rounded-2xl bg-white/5 border border-white/5" />
                </div>
            </div>
        </div>
    );
}
