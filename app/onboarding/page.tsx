import { auth } from "@/auth";
import { tmdb } from "@/lib/tmdb";
import { redirect } from "next/navigation";
import { completeOnboarding } from "@/lib/onboarding-actions";
import { Film, Check } from "lucide-react";

export default async function OnboardingPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

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
    ).sort((a: any, b: any) => a.name.localeCompare(b.name));

    const platforms = [
        { id: "netflix", name: "Netflix", icon: "https://www.google.com/s2/favicons?domain=netflix.com&sz=64" },
        { id: "disney", name: "Disney+", icon: "https://www.google.com/s2/favicons?domain=disneyplus.com&sz=64" },
        { id: "prime", name: "Prime Video", icon: "https://www.google.com/s2/favicons?domain=primevideo.com&sz=64" },
        { id: "blutv", name: "BluTV", icon: "https://www.google.com/s2/favicons?domain=blutv.com&sz=64" },
        { id: "mubi", name: "MUBI", icon: "https://www.google.com/s2/favicons?domain=mubi.com&sz=64" },
        { id: "apple", name: "Apple TV+", icon: "https://www.google.com/s2/favicons?domain=tv.apple.com&sz=64" },
    ];

    return (
        <div className="min-h-screen bg-background py-16 px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
                        <Film className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        WatchGo'ya Hoş Geldin!
                    </h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                        Sana en uygun önerileri sunabilmemiz için zevklerini öğrenmek istiyoruz.
                    </p>
                </div>

                <form action={completeOnboarding} className="space-y-16">
                    {/* Genres Section */}
                    <section className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-bold text-white">Sevdiğin Türler</h2>
                            <p className="text-neutral-400">En az 3 tane seçmeni öneririz.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {allGenres.map((genre: any) => (
                                <label
                                    key={genre.id}
                                    className="relative group cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        name="genres"
                                        value={genre.id}
                                        className="peer sr-only"
                                    />
                                    <div className="h-full px-6 py-4 bg-card border border-white/5 rounded-2xl transition-all peer-checked:border-primary peer-checked:bg-primary/10 group-hover:bg-white/5 group-hover:border-white/10 peer-checked:ring-2 peer-checked:ring-primary/20">
                                        <span className="text-neutral-300 font-medium group-hover:text-white transition-colors peer-checked:text-white">
                                            {genre.name}
                                        </span>
                                        <div className="absolute top-3 right-3 opacity-0 peer-checked:opacity-100 transition-opacity">
                                            <div className="bg-primary p-1 rounded-full">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Platforms Section */}
                    <section className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-bold text-white">Kullandığın Platformlar</h2>
                            <p className="text-neutral-400">Sahip olduğun abonelikleri seç.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {platforms.map((platform) => (
                                <label
                                    key={platform.id}
                                    className="relative group cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        name="platforms"
                                        value={platform.id}
                                        className="peer sr-only"
                                    />
                                    <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-card border border-white/5 rounded-2xl transition-all peer-checked:border-primary peer-checked:bg-primary/10 group-hover:bg-white/5 group-hover:border-white/10 peer-checked:ring-2 peer-checked:ring-primary/20 p-4">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 border border-white/5 group-hover:scale-110 transition-transform">
                                            <img src={platform.icon} alt={platform.name} className="w-full h-full object-contain" />
                                        </div>
                                        <span className="text-xs text-neutral-400 font-bold group-hover:text-white transition-colors peer-checked:text-white text-center">
                                            {platform.name}
                                        </span>
                                        <div className="absolute top-3 right-3 opacity-0 peer-checked:opacity-100 transition-opacity">
                                            <div className="bg-primary p-1 rounded-full">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </section>

                    <div className="pt-8 flex justify-center">
                        <button
                            type="submit"
                            className="px-12 py-5 bg-primary text-white text-lg font-black rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
                        >
                            Hazırım, Başlayalım!
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
