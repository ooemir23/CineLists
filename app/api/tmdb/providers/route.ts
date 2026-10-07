import { validateTmdbRequest, tmdbErrorResponse } from "@/lib/api-budget";
import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { detectUserCountry } from "@/lib/country";

type Provider = {
    provider_id: number;
    provider_name: string;
    logo_path?: string | null;
    display_priorities?: Record<string, number>;
};

export async function GET(request: NextRequest) {
  const rejected = validateTmdbRequest(request);
  if (rejected) return rejected;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") === "tv" ? "tv" : "movie";
    const country = (searchParams.get("country") || detectUserCountry(request.headers, request.cookies)).toUpperCase();

    try {
        const data = await tmdb.fetch(`/watch/providers/${type}`, { params: { watch_region: country } });

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
                    "Cache-Control": "private, max-age=86400",
                    "Vary": "Cookie",
                },
            }
        );
    } catch (error) {
        console.error("Error fetching providers:", error);
        return tmdbErrorResponse(error, request);
    }
}
