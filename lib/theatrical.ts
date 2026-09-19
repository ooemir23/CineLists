export type TheatricalStatus = {
    isInTheaters: boolean;
    isUpcoming: boolean;
    releaseDate?: string;
};

/**
 * Determines whether a movie is currently playing in theaters (or releasing soon in theaters)
 * for a specific country based on TMDB release_dates.
 */
export function getTheatricalStatus(
    data: any,
    countryCode: string = "TR"
): TheatricalStatus {
    // Only movies can have theatrical releases
    if (!data || data.media_type === "tv" || data.number_of_seasons !== undefined) {
        return { isInTheaters: false, isUpcoming: false };
    }

    const activeCountry = (countryCode || "TR").toUpperCase();
    const releaseResults = data.release_dates?.results || [];

    // Find country-specific release dates
    const altCode = activeCountry === "UK" ? "GB" : activeCountry === "GB" ? "UK" : activeCountry;
    let countryReleases = releaseResults.find(
        (r: any) => r.iso_3166_1 === activeCountry || r.iso_3166_1 === altCode
    );
    if (!countryReleases) {
        countryReleases = releaseResults.find((r: any) => r.iso_3166_1 === "US");
    }

    const releases: any[] = countryReleases?.release_dates || [];
    // TMDB release types:
    // 1: Premiere
    // 2: Theatrical (limited)
    // 3: Theatrical
    // 4: Digital
    // 5: Physical
    // 6: TV
    const theatricalReleases = releases.filter((rd: any) => rd.type === 2 || rd.type === 3);
    const digitalOrPhysicalReleases = releases.filter((rd: any) => rd.type === 4 || rd.type === 5);

    // Identify target theatrical release date
    let theatricalDateStr: string | null =
        theatricalReleases[0]?.release_date ||
        (theatricalReleases.length === 0 && data.release_date ? data.release_date : null);

    if (!theatricalDateStr) {
        return { isInTheaters: false, isUpcoming: false };
    }

    const theatricalDate = new Date(theatricalDateStr);
    if (isNaN(theatricalDate.getTime())) {
        return { isInTheaters: false, isUpcoming: false };
    }

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const releaseMidnight = new Date(
        theatricalDate.getFullYear(),
        theatricalDate.getMonth(),
        theatricalDate.getDate()
    ).getTime();
    const diffDays = Math.floor((todayMidnight - releaseMidnight) / (1000 * 60 * 60 * 24));

    // If already released on digital/home streaming platform in the past, it's no longer exclusively in theaters
    const hasPassedDigital = digitalOrPhysicalReleases.some((rd: any) => {
        if (!rd.release_date) return false;
        const d = new Date(rd.release_date).getTime();
        return !isNaN(d) && d <= todayMidnight;
    });

    if (hasPassedDigital) {
        return { isInTheaters: false, isUpcoming: false };
    }

    // Active in theaters: released within the last 90 days
    if (diffDays >= 0 && diffDays <= 90) {
        return {
            isInTheaters: true,
            isUpcoming: false,
            releaseDate: theatricalDateStr,
        };
    }

    // Upcoming in theaters: releasing within the next 21 days
    if (diffDays >= -21 && diffDays < 0) {
        return {
            isInTheaters: true,
            isUpcoming: true,
            releaseDate: theatricalDateStr,
        };
    }

    return { isInTheaters: false, isUpcoming: false };
}
