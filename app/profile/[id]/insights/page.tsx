import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { InsightsCard } from "@/components/profile/insights-card";
import { getViewingTimeStats } from "@/lib/detailed-stats-actions";
import { getFollowStatus } from "@/lib/social-actions";

function calculateStreakDays(watchedDates: Date[]): number {
  if (watchedDates.length === 0) return 0;

  const oneDayMs = 24 * 60 * 60 * 1000;
  const dayKeys = new Set(
    watchedDates.map((d) => {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      return day.getTime();
    }),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = today.getTime();
  if (!dayKeys.has(cursor)) {
    cursor -= oneDayMs;
    if (!dayKeys.has(cursor)) return 0;
  }

  let streak = 0;
  while (dayKeys.has(cursor)) {
    streak += 1;
    cursor -= oneDayMs;
  }
  return streak;
}

interface InsightsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InsightsDetailPage({ params }: InsightsPageProps) {
  const { id } = await params;
  const session = await auth();
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      watched: {
        select: { rating: true, watchedAt: true }
      }
    }
  });

  if (!user) {
    notFound();
  }

  // Check privacy settings
  const isOwnProfile = session?.user?.id === user.id;
  if (!isOwnProfile && !user.showStats) {
    notFound();
  }
  if (!isOwnProfile && user.isPrivate) {
    const isFollowing = session?.user?.id ? await getFollowStatus(user.id) : false;
    if (!isFollowing) notFound();
  }

  // Calculate stats
  const watched = user.watched || [];
  const ratedWatched = watched.filter((w) => w.rating != null);
  const averageRating = ratedWatched.length > 0
    ? ratedWatched.reduce((sum, w) => sum + (w.rating || 0), 0) / ratedWatched.length
    : 0;

  const thisMonth = new Date();
  thisMonth.setHours(0, 0, 0, 0);
  thisMonth.setDate(1);
  const thisMonthCount = watched.filter((w) => new Date(w.watchedAt) >= thisMonth).length;

  const streakDays = calculateStreakDays(watched.map((w) => w.watchedAt));
  const viewingTime = await getViewingTimeStats(user.id);

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/5 bg-background/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Öne Çıkanlar</h1>
              <p className="text-xs sm:text-sm text-neutral-400">@{user.username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <InsightsCard
          totalHours={viewingTime.estimatedHours}
          streakDays={streakDays}
          averageRating={averageRating}
          thisMonthCount={thisMonthCount}
          userId={user.id}
        />
      </div>
    </div>
  );
}
