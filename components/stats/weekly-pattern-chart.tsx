import { WeeklyPattern } from "@/lib/detailed-stats-actions";

interface WeeklyPatternChartProps {
    weeklyPattern: WeeklyPattern[];
}

export default function WeeklyPatternChart({ weeklyPattern }: WeeklyPatternChartProps) {
    if (weeklyPattern.length === 0) {
        return null;
    }

    const maxCount = Math.max(...weeklyPattern.map(w => w.count), 1);

    return (
        <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-sm shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Haftalık İzleme Alışkanlığı
            </h3>
            <div className="grid grid-cols-7 gap-2">
                {weeklyPattern.map((day, index) => {
                    const heightPercentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    const isWeekend = index === 0 || index === 6;

                    return (
                        <div key={day.day} className="flex flex-col items-center gap-2 group">
                            <div className="w-full h-32 bg-white/5 rounded-lg relative overflow-hidden flex items-end justify-center p-2">
                                <div
                                    className={`w-full ${isWeekend
                                            ? 'bg-gradient-to-t from-orange-500 to-pink-500'
                                            : 'bg-gradient-to-t from-emerald-500 to-teal-500'
                                        } rounded-md transition-all duration-700 ease-out group-hover:scale-105 flex items-start justify-center pt-2`}
                                    style={{ height: `${heightPercentage}%`, minHeight: day.count > 0 ? '20%' : '0%' }}
                                >
                                    {day.count > 0 && (
                                        <span className="text-xs font-bold text-white">
                                            {day.count}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-semibold text-white/90">
                                    {day.day.slice(0, 3)}
                                </p>
                                <p className="text-[10px] text-white/50 mt-0.5">
                                    {day.count}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <span className="text-white/70">Hafta içi</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-500 to-pink-500" />
                    <span className="text-white/70">Hafta sonu</span>
                </div>
            </div>
        </div>
    );
}
