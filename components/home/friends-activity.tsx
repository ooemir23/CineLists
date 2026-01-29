import { getFriendsActivity } from "@/lib/feed-actions";
import { ActivityPost } from "@/components/feed/activity-post";
import { CompactActivityCard } from "@/components/feed/compact-activity-card";
import Link from "next/link";
import { Users, Search } from "lucide-react";

export async function FriendsActivity({ compact = false }: { compact?: boolean }) {
    const activities = await getFriendsActivity();

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="p-4 bg-white/5 rounded-full mb-4">
                    <Users className="w-8 h-8 text-neutral-500" />
                </div>
                <p className="text-neutral-400 text-sm mb-4">
                    Henüz bir aktivite yok. Arkadaşlarını takip ederek akışını canlandır!
                </p>
                <Link
                    href="/community"
                    className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
                >
                    <Search className="w-3 h-3" />
                    Arkadaş Bul
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 w-full">
            {activities.map((activity) => (
                <div key={activity.id}>
                    {compact ? (
                        <CompactActivityCard activity={activity as any} />
                    ) : (
                        <ActivityPost activity={activity as any} />
                    )}
                </div>
            ))}
        </div>
    );
}
