jest.mock("@/lib/tmdb", () => ({ tmdb: { fetch: jest.fn() } }));
jest.mock("@/lib/country", () => ({ getServerCountry: jest.fn() }));
import { tmdb } from "@/lib/tmdb";
import { getServerCountry } from "@/lib/country";
import { getAppPlatforms } from "@/lib/platforms";

beforeEach(() => {
  (getServerCountry as jest.Mock).mockResolvedValue("DE");
});

test("provider outages return a usable fallback", async () => {
  (tmdb.fetch as jest.Mock).mockResolvedValue(null);
  expect(await getAppPlatforms()).toEqual([expect.objectContaining({ id: "8", name: "Netflix" })]);
});

test("provider requests and priority ordering follow the detected country", async () => {
  (tmdb.fetch as jest.Mock).mockResolvedValue({ results: [
    { provider_id: 11, provider_name: "MUBI", logo_path: "/mubi.png", display_priorities: { DE: 2, TR: 1 } },
    { provider_id: 337, provider_name: "Disney+", logo_path: "/disney.png", display_priorities: { DE: 1, TR: 2 } },
  ] });
  const platforms = await getAppPlatforms();
  expect(tmdb.fetch).toHaveBeenCalledWith("/watch/providers/movie", { params: { watch_region: "DE" } });
  expect(tmdb.fetch).toHaveBeenCalledWith("/watch/providers/tv", { params: { watch_region: "DE" } });
  expect(platforms.map(platform => platform.id)).toEqual(["8", "337", "11"]);
});
