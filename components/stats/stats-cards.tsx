import { Film, Tv, Layers, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    gradient: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ title, value, icon, gradient, subtitle, trend }: StatCardProps) {
    const getTrendIcon = () => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
        if (trend === 'neutral') return <Minus className="w-4 h-4" />;
        return null;
    };

    return (
        <div className={`${gradient} border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-300`}>
            <div className="flex items-center gap-3 mb-3">
                {icon}
                <h3 className="font-bold text-sm opacity-90">{title}</h3>
            </div>
            <p className="text-4xl font-black text-white mb-1">{value}</p>
            {subtitle && (
                <div className="flex items-center gap-2 text-xs opacity-70">
                    {getTrendIcon()}
                    <span>{subtitle}</span>
                </div>
            )}
        </div>
    );
}

interface TimeStatCardProps {
    hours: number;
    minutes: number;
    label: string;
    gradient: string;
}

export function TimeStatCard({ hours, minutes, label, gradient }: TimeStatCardProps) {
    return (
        <div className={`${gradient} border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-300`}>
            <h3 className="font-bold text-sm opacity-90 mb-3">{label}</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white">{hours}</span>
                <span className="text-2xl font-bold opacity-70">saat</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-white/80">{minutes}</span>
                <span className="text-lg font-semibold opacity-60">dakika</span>
            </div>
        </div>
    );
}

interface ProgressCardProps {
    title: string;
    current: number;
    total?: number;
    percentage?: number;
    gradient: string;
    icon: React.ReactNode;
}

export function ProgressCard({ title, current, total, percentage, gradient, icon }: ProgressCardProps) {
    const calculatedPercentage = percentage || (total ? (current / total) * 100 : 0);

    return (
        <div className={`${gradient} border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-lg`}>
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h3 className="font-bold text-sm opacity-90">{title}</h3>
            </div>
            <div className="mb-3">
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-3xl font-black text-white">{current}</span>
                    {total && <span className="text-sm opacity-70">/ {total}</span>}
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-white/80 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(calculatedPercentage, 100)}%` }}
                    />
                </div>
            </div>
            <p className="text-xs opacity-70">{Math.round(calculatedPercentage)}% tamamlandı</p>
        </div>
    );
}

interface TrendCardProps {
    title: string;
    value: string | number;
    change: number;
    changeLabel: string;
    gradient: string;
    icon: React.ReactNode;
}

export function TrendCard({ title, value, change, changeLabel, gradient, icon }: TrendCardProps) {
    const isPositive = change > 0;
    const isNeutral = change === 0;

    return (
        <div className={`${gradient} border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-300`}>
            <div className="flex items-center gap-3 mb-3">
                {icon}
                <h3 className="font-bold text-sm opacity-90">{title}</h3>
            </div>
            <p className="text-4xl font-black text-white mb-2">{value}</p>
            <div className="flex items-center gap-2">
                {isNeutral ? (
                    <Minus className="w-4 h-4 text-gray-400" />
                ) : isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs font-semibold ${isNeutral ? 'text-gray-400' : isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive && '+'}{change}% {changeLabel}
                </span>
            </div>
        </div>
    );
}
