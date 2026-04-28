import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ActivityTimeline } from "@/components/profile/activity-timeline";

interface ActivitiesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ActivitiesDetailPage({ params }: ActivitiesPageProps) {
  const { id } = await params;
  const session = await auth();
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      activities: {
        take: 300,
        orderBy: { createdAt: "desc" },
        include: { media: true }
      }
    }
  });

  if (!user) {
    notFound();
  }

  // Check privacy settings
  if (!user.showActivities && session?.user?.id !== user.id) {
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
              <h1 className="text-lg sm:text-2xl font-bold text-white">Aktivite Geçmişi</h1>
              <p className="text-xs sm:text-sm text-neutral-400">@{user.username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <ActivityTimeline
          activities={user.activities}
          showActivities={user.showActivities}
        />
      </div>
    </div>
  );
}
