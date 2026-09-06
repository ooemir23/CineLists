import { NextRequest, NextResponse } from "next/server";
import { getEnvVar } from "@/lib/env";

const TMDB_API_KEY = getEnvVar("TMDB_API_KEY");
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type Provider = {
    provider_id: number;
    provider_name: string;
    logo_path?: string | null;
    display_priorities?: Record<string, number>;
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "movie";
    const country = searchParams.get("country") || "TR";

    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/watch/providers/${type}?api_key=${TMDB_API_KEY}&watch_region=${country}`
        );

        const data = await response.json();

        // Format providers with logo URLs and filter by region availability
        const providers = (data.results as Provider[] | undefined)?.filter((provider) => {
            // STRICT FILTERING: Only show providers that explicitly have a priority for this country.
            if (provider.display_priorities && provider.display_priorities[country] !== undefined) {
                return true;
            }
            return false;
        }).map((provider) => ({
            id: provider.provider_id.toString(),
            name: provider.provider_name,
            logo: provider.logo_path
                ? `https://image.tmdb.org/t/p/original${provider.logo_path}`
                : "",
            // Use TMDB priority by default
            priority: provider.display_priorities?.[country] ?? 999,
            rawName: provider.provider_name // Keep raw name for custom sorting checks
        })) || [];

        // Custom sorting for Turkey based on user request
        // Using partial matching logic below, so "Disney" matches "Disney+"
        const trCustomOrder = [
            "BluTV",
            "Netflix",
            "Prime Video", // Amazon Prime Video
            "Disney", // Matches Disney+
            "MUBI",
            "YouTube Premium",
            "Exxen"
        ];

        // Sort by priority (lower number = higher popularity)
        const sortedProviders = providers.sort((a, b) => {
            // Special sorting for TR
            if (country === "TR") {
                const indexA = trCustomOrder.findIndex(key => a.name.includes(key));
                const indexB = trCustomOrder.findIndex(key => b.name.includes(key));

                // If both are in custom list, sort by custom order
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                // If only A is in custom list, A comes first
                if (indexA !== -1) return -1;
                // If only B is in custom list, B comes first
                if (indexB !== -1) return 1;
            }

            // Default sorting for others (or if not in custom list)
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json(
            { providers: sortedProviders },
            {
                headers: {
                    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                },
            }
        );
    } catch (error) {
        console.error("Error fetching providers:", error);
        return NextResponse.json({ providers: [] }, { status: 500 });
    }
}
