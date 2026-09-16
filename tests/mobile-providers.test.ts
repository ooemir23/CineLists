jest.mock("@/lib/watch-provider-cache", () => ({ cachedGetWatchProviders: jest.fn() }));
import { NextRequest } from "next/server";
import { GET } from "@/app/api/tmdb/providers-batch/route";
import { cachedGetWatchProviders } from "@/lib/watch-provider-cache";
const providers = cachedGetWatchProviders as jest.Mock;

beforeEach(() => providers.mockReset());
test.each(["", "movie:abc", "person:12", "movie:-2", Array(21).fill("movie:12").join(",")])(
  "rejects invalid or oversized batches without upstream work: %s", async items => {
    const response = await GET(new NextRequest(`https://example.com/api/tmdb/providers-batch?items=${encodeURIComponent(items)}`));
    expect(response.status).toBe(400);
    expect(providers).not.toHaveBeenCalled();
  }
);
test("deduplicates requests without mixing movie and TV IDs, and uses requested country", async () => {
  providers.mockImplementation(async (type: string) => ({ results: {
    DE: { flatrate: [{ provider_id: type === "tv" ? 2 : 1 }] },
    TR: { flatrate: [{ provider_id: 9 }] }
  } }));
  const response = await GET(new NextRequest("https://example.com/api/tmdb/providers-batch?items=movie:12,tv:12,movie:12&country=DE"));
  expect(providers).toHaveBeenCalledTimes(2);
  expect(await response.json()).toEqual({country: "DE", providers: {
    "movie:12": {flatrate: [{provider_id: 1}]}, "tv:12": {flatrate: [{provider_id: 2}]}
  }});
});
test("one upstream failure does not discard successful platform results", async () => {
  providers.mockRejectedValueOnce(new Error("timeout"));
  providers.mockResolvedValueOnce({results: {TR: {flatrate: [{provider_id: 8}]}}});
  const response = await GET(new NextRequest("https://example.com/api/tmdb/providers-batch?items=movie:12,tv:13&country=TR"));
  expect((await response.json()).providers).toEqual({"movie:12": null, "tv:13": {flatrate: [{provider_id: 8}]}});
});
