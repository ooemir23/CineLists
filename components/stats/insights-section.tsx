import { PersonalInsights } from "@/lib/detailed-stats-actions";
import { Sparkles, Heart, Users, TrendingUp, Calendar, Star } from "lucide-react";

interface InsightsSectionProps {
    insights: PersonalInsights;
}

export default function InsightsSection({ insights }: InsightsSectionProps) {
    const insightCards = [
        {
            icon: <Heart className="w-5 h-5" />,
            label: "En Sevdiğin Tür",
            value: insights.favoriteGenre,
            detail: `${insights.favoriteGenreCount} içerik izledin`,
            gradient: "from-pink-600/20 to-rose-600/10",
            borderColor: "border-pink-500/20"
        },
        {
            icon: <TrendingUp className="w-5 h-5" />,
            label: "Puan Verme Eğilimin",
            value: insights.averageRatingTendency,
            detail: insights.averageRatingTendency === 'Cömert' ? 'Yüksek puanlar veriyorsun' :
                insights.averageRatingTendency === 'Dengeli' ? 'Dengeli puanlar veriyorsun' :
                    'Seçici puanlar veriyorsun',
            gradient: "from-yellow-600/20 to-orange-600/10",
            borderColor: "border-yellow-500/20"
        },
        {
            icon: <Users className="w-5 h-5" />,
            label: "En Çok Birlikte İzlediğin",
            value: insights.mostWatchedWithPerson,
            detail: "İzleme arkadaşın",
            gradient: "from-blue-600/20 to-cyan-600/10",
            borderColor: "border-blue-500/20"
        },
        {
            icon: <Star className="w-5 h-5" />,
            label: "En Çok Tavsiye Eden",
            value: insights.mostRecommendedByPerson,
            detail: "Sana en çok öneri yapan",
            gradient: "from-purple-600/20 to-indigo-600/10",
            borderColor: "border-purple-500/20"
        },
        {
            icon: <Calendar className="w-5 h-5" />,
            label: "Aktif Gün Sayısı",
            value: `${insights.totalDaysActive} gün`,
            detail: "Platform kullanım süren",
            gradient: "from-green-600/20 to-emerald-600/10",
            borderColor: "border-green-500/20"
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            label: "Favori Platform",
            value: insights.mostUsedPlatform,
            detail: "En çok kullandığın platform",
            gradient: "from-indigo-600/20 to-violet-600/10",
            borderColor: "border-indigo-500/20"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-yellow-400" />
                <h2 className="text-2xl font-black text-white">Kişisel İçgörüler</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insightCards.map((card, index) => (
                    <div
                        key={index}
                        className={`bg-gradient-to-br ${card.gradient} border ${card.borderColor} p-5 rounded-2xl backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-300 group`}
                    >
                        <div className="flex items-center gap-2 text-white/70 mb-3">
                            {card.icon}
                            <span className="text-xs font-semibold uppercase tracking-wide">
                                {card.label}
                            </span>
                        </div>
                        <p className="text-2xl font-black text-white mb-1 group-hover:scale-105 transition-transform">
                            {card.value}
                        </p>
                        <p className="text-xs text-white/60">{card.detail}</p>
                    </div>
                ))}
            </div>

            {/* Fun Facts Section */}
            <div className="bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-orange-600/10 border border-purple-500/20 p-6 rounded-2xl backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    İlginç Bilgiler
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">🎬</span>
                        <div>
                            <p className="text-white/90 font-semibold">
                                {insights.favoriteGenre} türünde uzmanlaşıyorsun!
                            </p>
                            <p className="text-white/60 text-xs mt-1">
                                Bu türde {insights.favoriteGenreCount} içerik izledin
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⏱️</span>
                        <div>
                            <p className="text-white/90 font-semibold">
                                {insights.totalDaysActive} gündür platformdasın
                            </p>
                            <p className="text-white/60 text-xs mt-1">
                                Harika bir izleme yolculuğu!
                            </p>
                        </div>
                    </div>
                    {insights.mostWatchedWithPerson !== 'Yalnız' && (
                        <div className="flex items-start gap-3">
                            <span className="text-xl">👥</span>
                            <div>
                                <p className="text-white/90 font-semibold">
                                    {insights.mostWatchedWithPerson} ile en çok izliyorsun
                                </p>
                                <p className="text-white/60 text-xs mt-1">
                                    Harika bir izleme partneri!
                                </p>
                            </div>
                        </div>
                    )}
                    {insights.averageRatingTendency === 'Cömert' && (
                        <div className="flex items-start gap-3">
                            <span className="text-xl">⭐</span>
                            <div>
                                <p className="text-white/90 font-semibold">
                                    Cömert bir izleyicisin!
                                </p>
                                <p className="text-white/60 text-xs mt-1">
                                    Genelde yüksek puanlar veriyorsun
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
