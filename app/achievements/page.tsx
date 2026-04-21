import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserAchievements } from "@/lib/achievement-actions";
import { Award } from "lucide-react";
import { AchievementGrid } from "@/components/achievements/achievement-grid";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getUserAchievements(session.user.id);

  if (!data) return null;

  const { achievements, totalUnlocked, totalPossible } = data;

  // Kategorilere göre grupla
  const categories = {
    watch: { label: "İzleme", items: achievements.filter((a) => a.category === "watch") },
    rate: { label: "Puanlama & İnceleme", items: achievements.filter((a) => a.category === "rate") },
    social: { label: "Sosyal", items: achievements.filter((a) => a.category === "social") },
    list: { label: "Listeler", items: achievements.filter((a) => a.category === "list") },
    special: { label: "Özel", items: achievements.filter((a) => a.category === "special") },
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-6 md:mb-10">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            Rozetlerim
          </h1>
        </div>
        <p className="text-neutral-500 text-xs md:text-sm font-medium pb-1 md:pb-1.5">
          İzleme serüvenindeki başarılarını keşfet.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-white">
            {totalUnlocked} / {totalPossible} Rozet
          </span>
          <span className="text-sm font-bold text-amber-400">
            %{Math.round((totalUnlocked / totalPossible) * 100)}
          </span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000"
            style={{
              width: `${(totalUnlocked / totalPossible) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          {totalPossible - totalUnlocked} rozet daha kazanabilirsin!
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-12">
        {Object.entries(categories).map(([key, category]) => (
          <div key={key}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              {category.label}
              <span className="text-xs text-neutral-500 font-normal">
                ({category.items.filter((i) => i.unlocked).length}/{category.items.length})
              </span>
            </h2>
            <AchievementGrid achievements={category.items} />
          </div>
        ))}
      </div>
    </div>
  );
}
