import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PeriodStats } from "@/components/profile/period-stats";

interface StatsPageProps {
  params: {
    id: string;
  };
}

export default async function StatsDetailPage({ params }: StatsPageProps) {
  const session = await auth();
  
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      activities: {
        take: 100,
        orderBy: { createdAt: "desc" },
        include: { media: true }
      },
      watched: {
        select: { id: true, watchedAt: true }
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
              <h1 className="text-lg sm:text-2xl font-bold text-white">İstatistikler</h1>
              <p className="text-xs sm:text-sm text-neutral-400">@{user.username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <PeriodStats
          activities={user.activities}
          watchedItems={user.watched || []}
          userId={user.id}
        />
      </div>
    </div>
  );
}
