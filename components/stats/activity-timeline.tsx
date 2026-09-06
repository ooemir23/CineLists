import { MonthlyActivity } from "@/lib/detailed-stats-actions";
import { Calendar } from "lucide-react";

interface ActivityTimelineProps {
    monthlyActivity: MonthlyActivity[];
}

export default function ActivityTimeline({ monthlyActivity }: ActivityTimelineProps) {
    if (monthlyActivity.length === 0) {
        return (
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
                <Calendar className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-500">Henüz aktivite verisi yok</p>
            </div>
        );
    }

    const maxCount = Math.max(...monthlyActivity.map(m => m.count), 1);

    return (
        <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-blue-500/20 p-6 rounded-2xl backdrop-blur-sm shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-400" />
                Aylık Aktivite
            </h3>
            <div className="space-y-3">
                {monthlyActivity.map((activity, index) => {
                    const heightPercentage = (activity.count / maxCount) * 100;
                    const isRecent = index < 3;

                    return (
                        <div key={`${activity.year}-${activity.month}`} className="group">
                            <div className="flex items-center gap-4">
                                <div className="min-w-[120px]">
                                    <p className="text-sm font-semibold text-white/90">{activity.month}</p>
                                    <p className="text-xs text-white/50">{activity.year}</p>
                                </div>
                                <div className="flex-1 flex items-center gap-3">
                                    <div className="flex-1 bg-white/5 rounded-full h-8 overflow-hidden relative">
                                        <div
                                            className={`${isRecent
                                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                    : 'bg-gradient-to-r from-blue-600/60 to-cyan-600/60'
                                                } h-full rounded-full transition-all duration-700 ease-out group-hover:scale-105 origin-left flex items-center justify-end pr-3`}
                                            style={{ width: `${heightPercentage}%` }}
                                        >
                                            {heightPercentage > 15 && (
                                                <span className="text-xs font-bold text-white">
                                                    {activity.count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-white min-w-[3rem] text-right">
                                        {activity.count}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
