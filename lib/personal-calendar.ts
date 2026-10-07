"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import { calendarToday, calendarDaysLeft } from "@/lib/calendar-dates";
import type { UpcomingEpisode } from "@/lib/calendar-types";

// Process cached upstream details in small batches rather than enqueueing the
// user's entire library at once against the global TMDB request budget.
async function batches<T, R>(
  items: T[],
  load: (item: T) => Promise<R>,
): Promise<R[]> {
  const result: R[] = [];
  for (let start = 0; start < items.length; start += 4) {
    result.push(
      ...(await Promise.all(items.slice(start, start + 4).map(load))),
    );
  }
  return result;
}

function releaseKey(item: UpcomingEpisode): string {
  return `${item.mediaType}:${item.showId}:${item.nextEpisodeDate}:${item.nextEpisodeSeason ?? ""}:${item.nextEpisodeNumber ?? ""}`;
}

function mergeReleases(
  items: UpcomingEpisode[],
  today: string,
): UpcomingEpisode[] {
  const unique = new Map<string, UpcomingEpisode>();
  for (const item of items) {
    const days = calendarDaysLeft(item.nextEpisodeDate, today);
    if (days === null || days < 0) continue;
    // A premiere from person credits can describe the same film/first episode
    // already in the library. Keep the tracked, country-specific release card.
    const tracked =
      item.releaseKind === "premiere"
        ? [...unique.values()].filter(
            (existing) =>
              existing.releaseKind !== "premiere" &&
              existing.mediaType === item.mediaType &&
              existing.showId === item.showId &&
              (item.mediaType === "movie" ||
                existing.nextEpisodeDate === item.nextEpisodeDate),
          )
        : [];
    if (tracked.length) {
      for (const existing of tracked)
        existing.favoritePeople = [
          ...new Set([
            ...(existing.favoritePeople ?? []),
            ...(item.favoritePeople ?? []),
          ]),
        ];
      continue;
    }
    const key = releaseKey(item),
      previous = unique.get(key);
    if (previous)
      previous.favoritePeople = [
        ...new Set([
          ...(previous.favoritePeople ?? []),
          ...(item.favoritePeople ?? []),
        ]),
      ];
    else unique.set(key, { ...item, daysLeft: days });
  }
  return [...unique.values()].sort(
    (a, b) =>
      a.daysLeft! - b.daysLeft! || a.showTitle.localeCompare(b.showTitle),
  );
}

async function trackedReleases(
  userId: string,
  country: string,
  today: string,
): Promise<UpcomingEpisode[]> {
  const locale = await getServerLocale(),
    dict = getDictionary(locale);
  const [following, watched] = await Promise.all([
    prisma.toWatch.findMany({
      where: { userId },
      include: { media: true },
      orderBy: { addedAt: "desc" },
    }),
    prisma.watched.findMany({
      where: {
        userId,
        OR: [
          { media: { type: "TV" } },
          {
            media: {
              type: "MOVIE",
              releaseDate: { gte: new Date(`${today}T00:00:00Z`) },
            },
          },
        ],
      },
      include: { media: true },
      orderBy: { watchedAt: "desc" },
    }),
  ]);
  const unique = new Map<
    string,
    {
      media: (typeof following)[number]["media"];
      statusType?: "watching" | "plan_to_watch";
      addedAt: Date;
    }
  >();
  for (const item of following)
    unique.set(item.mediaId, {
      media: item.media,
      statusType: item.status === "WATCHING" ? "watching" : "plan_to_watch",
      addedAt: item.addedAt,
    });
  for (const item of watched)
    if (!unique.has(item.mediaId))
      unique.set(item.mediaId, { media: item.media, addedAt: item.watchedAt });

  return (
    await batches([...unique.values()], async (item) => {
      try {
        const isMovie = item.media.type === "MOVIE";
        if (!isMovie && item.media.type !== "TV") return [];
        const details = isMovie
          ? await tmdb.getDetails("movie", String(item.media.tmdbId), {
              append_to_response: "release_dates,watch/providers",
            })
          : await tmdb.getTVShow(String(item.media.tmdbId));
        const providers = details?.["watch/providers"]?.results?.[country];
        const providerList =
          providers?.flatrate || providers?.buy || details?.networks || [];
        const base: UpcomingEpisode = {
          showId: item.media.tmdbId,
          showTitle: details?.title || details?.name || item.media.title,
          posterPath: details?.poster_path || item.media.posterPath,
          voteAverage: details?.vote_average || item.media.voteAverage || 0,
          mediaType: isMovie ? "movie" : "tv",
          statusType: item.statusType,
          addedAt: item.addedAt,
          nextEpisodeDate: null,
          platforms: providerList.map((p: any) => p.provider_name || p.name),
          platformLogos: providerList.map((p: any) => ({
            name: p.provider_name || p.name,
            logoPath: p.logo_path || null,
          })),
        };
        if (isMovie) {
          const releases =
            details?.release_dates?.results?.find(
              (r: any) => r.iso_3166_1 === country,
            )?.release_dates || [];
          const local = releases
            .filter((r: any) => [2, 3].includes(r.type))
            .sort((a: any, b: any) =>
              a.release_date.localeCompare(b.release_date),
            )[0];
          const date =
            local?.release_date?.slice(0, 10) || details?.release_date;
          return [
            {
              ...base,
              nextEpisodeDate: date || null,
              isTheatrical: true,
              releaseKind: "theatrical" as const,
              platforms: [dict.calendarUi.theatres],
              platformLogos: [],
            },
          ];
        }
        const next = details?.next_episode_to_air;
        const scheduled = [details?.last_episode_to_air, next].filter(
          (e) =>
            e?.air_date && (calendarDaysLeft(e.air_date, today) ?? -1) >= 0,
        );
        // Include every announced episode in the next season, not just the one
        // next_episode_to_air exposes (daily shows can air several times a week).
        if (next?.season_number && next?.air_date) {
          const season = await tmdb
            .getSeasonDetails(String(item.media.tmdbId), next.season_number)
            .catch(() => null);
          scheduled.push(
            ...(season?.episodes || []).filter(
              (e: any) =>
                e?.air_date && (calendarDaysLeft(e.air_date, today) ?? -1) >= 0,
            ),
          );
        }
        return scheduled.map((e) => ({
          ...base,
          nextEpisodeDate: e.air_date,
          nextEpisodeTitle: e.name || null,
          nextEpisodeSeason: e.season_number,
          nextEpisodeNumber: e.episode_number,
          releaseKind: "episode" as const,
        }));
      } catch {
        return [];
      }
    })
  ).flat();
}

async function favoriteReleases(
  userId: string,
  today: string,
): Promise<UpcomingEpisode[]> {
  const persons = await prisma.favoritePerson.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
  });
  return (
    await batches(persons, async (person) => {
      try {
        const credits = await tmdb.getPersonCombinedCredits(
          String(person.tmdbId),
        );
        // Cast credits cover actors; only Director crew credits count for directors.
        const projects = [
          ...(credits.cast || []),
          ...(credits.crew || []).filter((c: any) => c.job === "Director"),
        ];
        return projects
          .filter(
            (p: any) =>
              ["movie", "tv"].includes(p.media_type) &&
              (calendarDaysLeft(p.release_date || p.first_air_date, today) ??
                -1) >= 0,
          )
          .map(
            (p: any): UpcomingEpisode => ({
              showId: p.id,
              showTitle: p.title || p.name,
              mediaType: p.media_type,
              nextEpisodeDate: p.release_date || p.first_air_date,
              posterPath: p.poster_path || null,
              voteAverage: p.vote_average || 0,
              platforms: [],
              favoritePeople: [person.name],
              releaseKind: "premiere",
            }),
          );
      } catch {
        return [];
      }
    })
  ).flat();
}

export async function getTrackedCalendarReleases(
  countryCode = "TR",
): Promise<UpcomingEpisode[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const today = calendarToday();
  return mergeReleases(
    await trackedReleases(
      session.user.id,
      countryCode === "UK" ? "GB" : countryCode.toUpperCase(),
      today,
    ),
    today,
  );
}

export async function getPersonalCalendarReleases(
  countryCode = "TR",
): Promise<UpcomingEpisode[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const today = calendarToday();
  const [tracked, favorites] = await Promise.all([
    trackedReleases(
      session.user.id,
      countryCode === "UK" ? "GB" : countryCode.toUpperCase(),
      today,
    ),
    favoriteReleases(session.user.id, today),
  ]);
  return mergeReleases([...tracked, ...favorites], today);
}
