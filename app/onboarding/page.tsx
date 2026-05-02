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

    const [movieGenres, tvGenres, movieProviders, tvProviders] = await Promise.all([
        tmdb.getGenres("movie"),
        tmdb.getGenres("tv"),
        tmdb.fetch("/watch/providers/movie", { params: { watch_region: "TR" } }),
        tmdb.fetch("/watch/providers/tv", { params: { watch_region: "TR" } }),
    ]);

    // Merge and unique genres
    const allGenres = Array.from(
        new Map([...(movieGenres.genres || []), ...(tvGenres.genres || [])].map((g: any) => [g.id, g])).values()
    ).sort((a: any, b: any) => a.name.localeCompare(b.name)) as { id: number; name: string }[];

    // Format providers from TMDB
    const providerMap = new Map();
    [...(movieProviders.results || []), ...(tvProviders.results || [])].forEach((p: any) => {
        providerMap.set(p.provider_id, {
            id: p.provider_id.toString(),
            name: p.provider_name,
            icon: `https://image.tmdb.org/t/p/original${p.logo_path}`
        });
    });

    // Most common providers in Turkey to keep the list clean
    const commonProviderNames = ["Netflix", "Disney Plus", "Amazon Prime Video", "BluTV", "MUBI", "Apple TV Plus", "Gain", "Exxen", "TV+"];
    const platforms = Array.from(providerMap.values())
        .filter(p => commonProviderNames.some(cn => p.name.toLowerCase().replace(/[\s\+]/g, "").includes(cn.toLowerCase().replace(/[\s\+]/g, ""))))
        .sort((a, b) => a.name.localeCompare(b.name));

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
