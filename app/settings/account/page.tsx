import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getAppPlatforms } from "@/lib/platforms";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/profile/settings-content";

export default async function AccountSettingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) redirect("/login");

    const [movieGenres, tvGenres, allPlatforms] = await Promise.all([
        tmdb.getGenres("movie"),
        tmdb.getGenres("tv"),
        getAppPlatforms()
    ]);

    const allGenres = Array.from(
        new Map([...movieGenres.genres, ...tvGenres.genres].map((g: any) => [g.id, g])).values()
    ).sort((a: any, b: any) => a.name.localeCompare(b.name));

    const userData = {
        ...user,
        favoriteGenres: user.favoriteGenres || [],
        platforms: user.platforms || [],
        allGenres,
        allPlatforms,
    };

    return <SettingsContent user={userData as any} activeTab="account" />;
}
