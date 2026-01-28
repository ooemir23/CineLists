import { GenreStats } from "@/lib/detailed-stats-actions";

interface GenreChartProps {
    genres: GenreStats[];
}

export default function GenreChart({ genres }: GenreChartProps) {
    if (genres.length === 0) {
        return (
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
                <p className="text-neutral-500">Henüz tür verisi yok</p>
            </div>
        );
    }

    const maxCount = Math.max(...genres.map(g => g.count));

    return (
        <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 p-6 rounded-2xl backdrop-blur-sm shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-2xl">🎭</span>
                En Çok İzlenen Türler
            </h3>
            <div className="space-y-4">
                {genres.map((genre, index) => {
                    const widthPercentage = (genre.count / maxCount) * 100;
                    const colors = [
                        'from-pink-500 to-rose-500',
                        'from-purple-500 to-indigo-500',
                        'from-blue-500 to-cyan-500',
                        'from-green-500 to-emerald-500',
                        'from-yellow-500 to-orange-500',
                        'from-red-500 to-pink-500',
                        'from-indigo-500 to-purple-500',
                        'from-cyan-500 to-blue-500',
                        'from-emerald-500 to-teal-500',
                        'from-orange-500 to-red-500'
                    ];
                    const gradient = colors[index % colors.length];

                    return (
                        <div key={genre.genre} className="group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-white/90">{genre.genre}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-white/60">{genre.count} içerik</span>
                                    <span className="text-sm font-bold text-white min-w-[3rem] text-right">
                                        %{genre.percentage}
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`bg-gradient-to-r ${gradient} h-full rounded-full transition-all duration-700 ease-out group-hover:scale-105 origin-left`}
                                    style={{ width: `${widthPercentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
