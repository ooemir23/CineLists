import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { InsightsCard } from "@/components/profile/insights-card";

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
  if (!user.showStats && session?.user?.id !== user.id) {
    notFound();
  }

  // Calculate stats
  const watched = user.watched || [];
  const averageRating = watched.length > 0
    ? watched.reduce((sum, w) => sum + (w.rating || 0), 0) / watched.length
    : 0;

  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthCount = watched.filter((w) => new Date(w.watchedAt) >= thisMonth).length;

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
          totalHours={0}
          streakDays={0}
          averageRating={averageRating}
          thisMonthCount={thisMonthCount}
          userId={user.id}
        />
      </div>
    </div>
  );
}
