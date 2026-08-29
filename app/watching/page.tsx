
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WatchlistSearchBarWrapper from "@/components/watchlist/watchlist-search-wrapper";
import { Eye } from "lucide-react";

export default async function WatchingPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const isGuest = (session.user as any).isGuest || (session.user as any).id?.startsWith("guest_");
    if (isGuest) {
        return (
            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 ">
                <div className="flex items-center gap-3 mb-12">
                    <span className="w-12 h-12 flex items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/20 shadow-lg shadow-sky-500/10">
                        <Eye className="w-6 h-6" />
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">İzliyorum</h1>
                </div>
                <p className="text-neutral-400 text-center py-20">Takip ettiğin içerikleri görmek için giriş yapmalısın.</p>
            </div>
        );
    }

    let watchingList: any[] = [];
    try {
        watchingList = await prisma.toWatch.findMany({
            where: { 
                userId: session.user.id,
                status: "WATCHING"
            },
            include: { media: true },
            orderBy: { addedAt: "desc" },
        });
    } catch (error) {
        console.warn("[Watching] Database unavailable:", error);
    }

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 ">
            <div className="flex items-center gap-3 mb-12">
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/20 shadow-lg shadow-sky-500/10">
                    <Eye className="w-6 h-6" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase tracking-widest">Şu An İzliyorum</h1>
            </div>
            <WatchlistSearchBarWrapper watchlist={watchingList} />
        </div>
    );
}
