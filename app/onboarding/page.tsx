import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getAppPlatforms } from "@/lib/platforms";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { GENRE_MAP } from "@/lib/genres";

export default async function OnboardingPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    // Guest users bypass onboarding entirely
    if ((session.user as any).isGuest) {
        redirect("/");
    }

    // If already completed, redirect to home
    if ((session.user as any).hasCompletedOnboarding) {
        redirect("/");
    }

    const [movieGenres, tvGenres, dbUser] = await Promise.all([
        tmdb.getGenres("movie"),
        tmdb.getGenres("tv"),
        prisma.user.findUnique({ where: { id: session.user.id }, select: { username: true } })
    ]);

    // Merge and unique genres from TMDB
    const rawGenres = Array.from(
        new Map([...(movieGenres.genres || []), ...(tvGenres.genres || [])].map((g: any) => [g.id, g])).values()
    );

    // Filter and normalize
    const allGenres = rawGenres.map((g: any) => ({
        id: g.id,
        name: GENRE_MAP[g.id] || g.name
    })).sort((a, b) => a.name.localeCompare(b.name, "tr"));

    // We can also prioritize certain genres to match "previous" experience if needed,
    // but alphabetical is usually safest unless a specific order is requested.
    // The current logic in onboarding-form.tsx shows first 8, then the rest on click.

    const platforms = await getAppPlatforms();

    return (
        <div className=" bg-[#020617] py-12 md:py-20 px-4 md:px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-amber-400/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <OnboardingForm 
                    genres={allGenres} 
                    platforms={platforms}
                    defaultUsername={dbUser?.username || ""}
                />
            </div>
        </div>
    );
}

