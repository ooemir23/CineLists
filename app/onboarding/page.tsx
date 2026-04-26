import { auth } from "@/auth";
import { tmdb } from "@/lib/tmdb";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

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

    const [movieGenres, tvGenres] = await Promise.all([
        tmdb.getGenres("movie"),
        tmdb.getGenres("tv"),
    ]);

    // Merge and unique genres
    const allGenres = Array.from(
        new Map([...movieGenres.genres, ...tvGenres.genres].map((g: any) => [g.id, g])).values()
    ).sort((a: any, b: any) => a.name.localeCompare(b.name)) as { id: number; name: string }[];

    const platforms = [
        { id: "netflix", name: "Netflix", icon: "https://www.google.com/s2/favicons?domain=netflix.com&sz=64" },
        { id: "disney", name: "Disney+", icon: "https://www.google.com/s2/favicons?domain=disneyplus.com&sz=64" },
        { id: "prime", name: "Prime Video", icon: "https://www.google.com/s2/favicons?domain=primevideo.com&sz=64" },
        { id: "blutv", name: "BluTV", icon: "https://www.google.com/s2/favicons?domain=blutv.com&sz=64" },
        { id: "mubi", name: "MUBI", icon: "https://www.google.com/s2/favicons?domain=mubi.com&sz=64" },
        { id: "apple", name: "Apple TV+", icon: "https://www.google.com/s2/favicons?domain=tv.apple.com&sz=64" },
    ];

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
                />
            </div>
        </div>
    );
}
