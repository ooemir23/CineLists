import {
  csvCell,
  isAdminId,
  pagination,
  safeInternalRedirect,
} from "@/lib/admin/policy";
import {
  analyticsCountry,
  analyticsDevice,
  analyticsPath,
  analyticsOriginAllowed,
} from "@/lib/admin/analytics";

describe("admin authorization and exports", () => {
  test("requires exact allowlisted ID and defaults to no access", () => {
    expect(isAdminId("user", "")).toBe(false);
    expect(isAdminId(undefined, "user")).toBe(false);
    expect(isAdminId("user", "other-user")).toBe(false);
    expect(isAdminId("user", " other, user ")).toBe(true);
  });
  test.each(["=CMD()", "+1", "-2", "@SUM(A1)", "  =1", "\tformula"])(
    "neutralizes spreadsheet formulas: %s",
    (input) => {
      expect(csvCell(input)).toMatch(/^"'/);
    },
  );
  test("quotes embedded commas and quotes", () =>
    expect(csvCell('a,"b')).toBe('"a,""b"'));
  test.each(["//evil.test", "/\\evil.test", "https://evil.test", "/\nfoo"])(
    "rejects unsafe callback: %s",
    (value) => expect(safeInternalRedirect(value)).toBe("/"),
  );
  test("keeps internal admin callback", () =>
    expect(safeInternalRedirect("/admin?tab=users")).toBe("/admin?tab=users"));
  test.each(["NaN", "Infinity", "-1", "1.2", "0"])(
    "normalizes invalid page %s",
    (value) => expect(pagination(value).page).toBe(1),
  );
});

describe("analytics accuracy and minimization", () => {
  test("uses the public origin behind a TLS-terminating reverse proxy", () => {
    expect(
      analyticsOriginAllowed(
        "https://cinelists.com",
        "http://internal:3000/api/analytics/pageview",
        "https://cinelists.com",
      ),
    ).toBe(true);
    expect(
      analyticsOriginAllowed(
        "https://other.test",
        "http://internal:3000/api/analytics/pageview",
        "https://cinelists.com",
      ),
    ).toBe(false);
    expect(analyticsOriginAllowed(null, "http://localhost:3100", "")).toBe(
      false,
    );
  });
  test("does not infer country from language or untrusted headers", () => {
    expect(
      analyticsCountry(
        new Headers({ "accept-language": "tr-TR", "cf-ip-country": "TR" }),
        "",
      ),
    ).toBe("ZZ");
    expect(
      analyticsCountry(new Headers({ "cf-ip-country": "de" }), "cf-ip-country"),
    ).toBe("DE");
    expect(
      analyticsCountry(new Headers({ "cf-ip-country": "XX" }), "cf-ip-country"),
    ).toBe("ZZ");
  });
  test("redacts identifiers and excludes account and admin pages", () => {
    expect(analyticsPath("/profile/private-user")).toBe("/profile/[id]");
    expect(analyticsPath("/messages/private-user")).toBe("/messages/[id]");
    expect(analyticsPath("/tv/10/s/2/e/1")).toBe("/tv/[id]/episode");
    for (const path of [
      "/admin",
      "/login",
      "/reset-password",
      "/search?q=private",
      "/unknown-path",
    ])
      expect(analyticsPath(path)).toBeNull();
  });
  test("excludes bots and classifies devices", () => {
    expect(analyticsDevice("Googlebot")).toBeNull();
    expect(analyticsDevice("iPhone Mobile")).toBe("mobile");
    expect(analyticsDevice("iPad")).toBe("tablet");
  });
});
