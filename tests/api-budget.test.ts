jest.mock("@/lib/ratelimit", () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true }),
}));
import { validateTmdbRequest } from "@/lib/api-budget";
import { checkRateLimit } from "@/lib/ratelimit";

test("discovery accepts the actual multi-select filter format", () => {
  const request = new Request(
    "http://localhost/api/tmdb/home-discover?type=all&genre=28%7C18&year=2024,2025&country=TR,DE&language=tr,en&provider=8%7C337",
  );
  expect(validateTmdbRequest(request)).toBeNull();
});
test.each([
  "limit=NaN",
  "limit=0",
  "type=../config",
  "page=999999",
  "sortBy=unknown",
  "q=" + "a".repeat(201),
])("malformed query is rejected before upstream work: %s", (query) => {
  expect(
    validateTmdbRequest(
      new Request(`http://localhost/api/tmdb/search?${query}`),
    )?.status,
  ).toBe(400);
});
test("quota exhaustion returns a retryable response", () => {
  (checkRateLimit as jest.Mock).mockReturnValueOnce({ allowed: false });
  const response = validateTmdbRequest(
    new Request("http://localhost/api/tmdb/search?q=film"),
  );
  expect(response?.status).toBe(429);
  expect(response?.headers.get("Retry-After")).toBe("60");
});
