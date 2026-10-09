import {
  acquisitionProfile,
  discoveryAnswer,
  normalizeAcquisition,
  readAcquisition,
  signAcquisition,
  ACQUISITION_MAX_AGE,
} from "@/lib/acquisition";
import { acquisitionLabel } from "@/lib/acquisition-format";
import { en } from "@/lib/i18n/dictionaries/en";
import { tr } from "@/lib/i18n/dictionaries/tr";
beforeEach(() => {
  process.env.AUTH_SECRET = "acquisition-test-secret";
});
test("keeps only referring hostname and valid campaign tags", () => {
  const data = normalizeAcquisition(
    {
      referrer:
        "https://www.instagram.com/private/path?email=secret@example.com",
      source: "IG",
      medium: "social",
      campaign: "launch_2026",
    },
    "https://cinelists.com",
    1000,
  )!;
  expect(data).toEqual({
    source: "instagram",
    medium: "social",
    campaign: "launch_2026",
    referrerHost: "instagram.com",
    capturedAt: 1000,
  });
  expect(JSON.stringify(data)).not.toContain("secret");
});
test.each([
  "https://cinelists.com/register",
  "https://www.cinelists.com/login",
])("internal navigation %s does not fabricate direct arrival", (referrer) => {
  expect(
    normalizeAcquisition({ referrer }, "https://cinelists.com"),
  ).toBeNull();
});
test("campaign on internal navigation still identifies a tagged arrival", () => {
  expect(
    normalizeAcquisition(
      { referrer: "https://cinelists.com/", source: "newsletter" },
      "https://cinelists.com",
    )?.source,
  ).toBe("newsletter");
});
test("missing referrer is distinct from an uncaptured historical registration", () => {
  expect(normalizeAcquisition({}, "https://cinelists.com")?.source).toBe(
    "direct",
  );
  expect(acquisitionProfile(null)).toEqual({});
  expect(acquisitionLabel(null, en.acquisition)).toBe("Unknown");
});
test.each([
  "https://127.0.0.1/private",
  "https://[::1]/",
  "https://name:password@instagram.com/",
  "javascript:alert(1)",
])("never stores private or invalid referrer %s", (referrer) => {
  expect(
    normalizeAcquisition({ referrer }, "https://cinelists.com")?.referrerHost,
  ).toBeNull();
});
test("drops URLs, emails, control characters and oversized tags", () => {
  const data = normalizeAcquisition(
    {
      source: "user@example.com",
      medium: "https://secret.test/",
      campaign: "x".repeat(81),
    },
    "https://cinelists.com",
  )!;
  expect(data).toMatchObject({
    source: "direct",
    medium: null,
    campaign: null,
  });
});
test("signed first-touch survives redirect and rejects tampering, expiry and future dates", () => {
  const data = normalizeAcquisition(
    { source: "instagram" },
    "https://cinelists.com",
    1000,
  )!;
  const token = signAcquisition(data)!;
  expect(readAcquisition(token, 2000)).toEqual(data);
  expect(readAcquisition(token + "bad", 2000)).toBeNull();
  expect(
    readAcquisition(token, 1000 + ACQUISITION_MAX_AGE * 1000 + 1),
  ).toBeNull();
  expect(readAcquisition(token, 999)).toBeNull();
});
test("survey values are bounded and labels support both languages", () => {
  expect(discoveryAnswer("friend")).toBe("friend");
  expect(discoveryAnswer("free text")).toBeNull();
  expect(acquisitionLabel("friend", tr.acquisition)).toBe("Arkadaş / Tavsiye");
  expect(acquisitionLabel("friend", en.acquisition)).toBe(
    "Friend / Recommendation",
  );
});
