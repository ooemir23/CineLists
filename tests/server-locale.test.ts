jest.mock("next/headers", () => ({ cookies: jest.fn(), headers: jest.fn() }));
import { cookies, headers } from "next/headers";
import { getServerLocale } from "@/lib/i18n/server";

beforeEach(() => {
  (cookies as jest.Mock).mockResolvedValue({ get: jest.fn() });
  (headers as jest.Mock).mockResolvedValue(new Headers());
});
test.each([["TR", "tr"], ["US", "en"], ["DE", "en"]])(
  "server rendering uses %s country locale",
  async (country, expected) => {
    (headers as jest.Mock).mockResolvedValue(new Headers({ "x-country-code": country }));
    expect(await getServerLocale()).toBe(expected);
  },
);
test("explicit locale is available without geographic headers", async () => {
  (cookies as jest.Mock).mockResolvedValue({ get: (name: string) => name === "NEXT_LOCALE" ? { value: "en" } : undefined });
  expect(await getServerLocale()).toBe("en");
  expect(headers).not.toHaveBeenCalled();
});
test("outside a request the default remains safe for build-time callers", async () => {
  (cookies as jest.Mock).mockRejectedValue(new Error("outside request"));
  expect(await getServerLocale()).toBe("tr");
});
