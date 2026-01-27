
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WatchlistSearchBarWrapper from "@/components/watchlist/watchlist-search-wrapper";

export default async function WatchlistPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }
    const watchlist = await prisma.toWatch.findMany({
        where: { userId: session.user.id },
        include: { media: true },
        orderBy: { addedAt: "desc" },
    });

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
            <div className="flex items-center gap-3 mb-12">
                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white font-bold text-2xl">+</span>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">İzlenecekler</h1>
            </div>
            <WatchlistSearchBarWrapper watchlist={watchlist} />
        </div>
    );
}
