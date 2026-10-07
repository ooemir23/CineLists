jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    toWatch: { findMany: jest.fn() },
    watched: { findMany: jest.fn() },
    favoritePerson: { findMany: jest.fn() },
  },
}));
jest.mock("@/lib/tmdb", () => ({
  tmdb: {
    getTVShow: jest.fn(),
    getDetails: jest.fn(),
    getSeasonDetails: jest.fn(),
    getPersonCombinedCredits: jest.fn(),
  },
}));
jest.mock("@/lib/i18n/server", () => ({
  getServerLocale: async () => "en",
  getDictionary: () => en,
}));
import { en } from "@/lib/i18n/dictionaries/en";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getPersonalCalendarReleases } from "@/lib/personal-calendar";
import {
  calendarToday,
  calendarDaysLeft,
  matchesCalendarFilter,
} from "@/lib/calendar-dates";

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date("2026-10-07T12:00:00Z"));
  (auth as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
  (prisma.toWatch.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.watched.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.favoritePerson.findMany as jest.Mock).mockResolvedValue([]);
  (tmdb.getSeasonDetails as jest.Mock).mockResolvedValue({ episodes: [] });
});
afterEach(() => jest.useRealTimers());

test("day boundaries are date-only and use the same Istanbul clock on client and server", () => {
  expect(calendarToday(new Date("2026-10-07T21:30:00Z"))).toBe("2026-10-08");
  expect(calendarDaysLeft("2026-10-15", "2026-10-07")).toBe(8);
  expect(calendarDaysLeft("2026-02-30", "2026-10-07")).toBeNull();
});
test("awaiting is strictly over seven days; today/week follow calendar boundaries", () => {
  const today = "2026-10-07";
  expect(matchesCalendarFilter("2026-10-14", "awaiting", today)).toBe(false);
  expect(matchesCalendarFilter("2026-10-15", "awaiting", today)).toBe(true);
  expect(matchesCalendarFilter(today, "today", today)).toBe(true);
  expect(matchesCalendarFilter("2026-10-08", "today", today)).toBe(false);
  expect(matchesCalendarFilter("2026-10-11", "week", today)).toBe(true);
  expect(matchesCalendarFilter("2026-10-12", "week", today)).toBe(false);
  expect(matchesCalendarFilter("2026-10-06", "week", today)).toBe(false);
  expect(matchesCalendarFilter(null, "awaiting", today)).toBe(false);
  expect(matchesCalendarFilter("2027-01-03", "week", "2026-12-31")).toBe(true);
});
test("includes today's aired episode, other scheduled episodes and favorite directors without duplicates", async () => {
  const media = {
    id: "show-1",
    tmdbId: 1,
    type: "TV",
    title: "Old TR title",
    posterPath: null,
    voteAverage: 0,
  };
  (prisma.toWatch.findMany as jest.Mock).mockResolvedValue([
    { mediaId: media.id, media, status: "WATCHING", addedAt: new Date() },
  ]);
  (prisma.watched.findMany as jest.Mock).mockResolvedValue([
    { mediaId: media.id, media, watchedAt: new Date() },
  ]);
  (tmdb.getTVShow as jest.Mock).mockResolvedValue({
    name: "Localized show",
    last_episode_to_air: {
      air_date: "2026-10-07",
      season_number: 1,
      episode_number: 1,
    },
    next_episode_to_air: {
      air_date: "2026-10-08",
      season_number: 1,
      episode_number: 2,
    },
  });
  (tmdb.getSeasonDetails as jest.Mock).mockResolvedValue({
    episodes: [
      { air_date: "2026-10-08", season_number: 1, episode_number: 2 },
      { air_date: "2026-10-11", season_number: 1, episode_number: 3 },
      { air_date: "2026-10-15", season_number: 1, episode_number: 4 },
    ],
  });
  (prisma.favoritePerson.findMany as jest.Mock).mockResolvedValue([
    { tmdbId: 7, name: "Actor" },
    { tmdbId: 8, name: "Director" },
  ]);
  (tmdb.getPersonCombinedCredits as jest.Mock).mockResolvedValue({
    cast: [
      {
        id: 1,
        name: "Localized show",
        media_type: "tv",
        first_air_date: "2026-10-07",
      },
    ],
    crew: [
      {
        id: 4,
        title: "Director's film",
        job: "Director",
        media_type: "movie",
        release_date: "2026-10-20",
      },
      {
        id: 5,
        title: "Editing job",
        job: "Editor",
        media_type: "movie",
        release_date: "2026-10-20",
      },
      {
        id: 6,
        title: "Past film",
        job: "Director",
        media_type: "movie",
        release_date: "2026-10-06",
      },
    ],
  });
  const items = await getPersonalCalendarReleases("TR");
  expect(items).toHaveLength(5);
  expect(items.filter((i) => i.showId === 1)).toHaveLength(4);
  expect(items.find((i) => i.nextEpisodeNumber === 1)?.favoritePeople).toEqual([
    "Actor",
    "Director",
  ]);
  expect(items.find((i) => i.showId === 4)?.favoritePeople).toEqual([
    "Actor",
    "Director",
  ]);
  expect(items[0].showTitle).toBe("Localized show");
  expect(items[0].statusType).toBe("watching");
});
test("an older watched series beyond the former 25-item cap remains in the calendar", async () => {
  (prisma.watched.findMany as jest.Mock).mockResolvedValue(
    Array.from({ length: 31 }, (_, i) => ({
      mediaId: String(i),
      watchedAt: new Date(),
      media: { id: String(i), tmdbId: i, type: "TV", title: `Show ${i}` },
    })),
  );
  (tmdb.getTVShow as jest.Mock).mockImplementation(async (id) =>
    id === "30"
      ? {
          name: "Older watched show",
          next_episode_to_air: {
            air_date: "2026-10-20",
            season_number: 2,
            episode_number: 1,
          },
        }
      : { status: "Ended" },
  );
  const items = await getPersonalCalendarReleases();
  expect(items.map((i) => i.showId)).toEqual([30]);
});
test("unauthenticated requests never query private library or favorites", async () => {
  (auth as jest.Mock).mockResolvedValue(null);
  expect(await getPersonalCalendarReleases()).toEqual([]);
  expect(prisma.toWatch.findMany).not.toHaveBeenCalled();
});
