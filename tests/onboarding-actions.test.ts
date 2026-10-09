jest.mock("@/lib/i18n/server", () => ({
  getServerLocale: jest.fn(async () => "en"),
  getDictionary: (locale: "tr" | "en") => locale === "tr"
    ? tr
    : en,
}));
jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: { user: { update: jest.fn(), findFirst: jest.fn() } } }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => { throw new Error("NEXT_REDIRECT"); }),
}));

import { getServerLocale } from "@/lib/i18n/server";
import { en } from "@/lib/i18n/dictionaries/en";
import { tr } from "@/lib/i18n/dictionaries/tr";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { completeOnboarding, skipOnboarding } from "@/lib/onboarding-actions";

beforeEach(() => {
  jest.resetAllMocks();
  (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  (getServerLocale as jest.Mock).mockResolvedValue("en");
  (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
  (auth as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
  (prisma.user.update as jest.Mock).mockResolvedValue({});
});

test("postponing profile completion returns home without marking it complete", async () => {
  await expect(skipOnboarding()).rejects.toThrow("NEXT_REDIRECT");
  expect(redirect).toHaveBeenCalledWith("/");
  expect(prisma.user.update).not.toHaveBeenCalled();
});

test("saving preferences completes the profile and refreshes the header", async () => {
  const form = new FormData();
  form.set("username", "filmsever");
  form.append("genres", "28");
  form.append("platforms", "8");
  await expect(completeOnboarding(form)).rejects.toThrow("NEXT_REDIRECT");
  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: "user-1" },
    data: {
      username: "filmsever",
      favoriteGenres: ["28"],
      platforms: ["8"],
      hasCompletedOnboarding: true,
    },
  });
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  expect(redirect).toHaveBeenCalledWith("/");
});

test("skipping without a session redirects to login", async () => {
  (auth as jest.Mock).mockResolvedValue(null);
  await expect(skipOnboarding()).rejects.toThrow("NEXT_REDIRECT");
  expect(redirect).toHaveBeenCalledWith("/login");
});

test.each(["tr", "en"] as const)("unauthenticated save reports an error in %s", async locale => {
  (auth as jest.Mock).mockResolvedValue(null);
  (getServerLocale as jest.Mock).mockResolvedValue(locale);
  expect(await completeOnboarding(new FormData())).toEqual({ error: (locale === "tr" ? tr : en).onboarding.signInRequired });
  expect(prisma.user.update).not.toHaveBeenCalled();
});

test.each(["!!!", "ali veli", "a".repeat(31)])("invalid username %s never writes preferences", async username => {
  const form = new FormData();
  form.set("username", username);
  expect(await completeOnboarding(form)).toEqual({ error: en.onboarding.invalidUsername });
  expect(prisma.user.update).not.toHaveBeenCalled();
});

test("a case-insensitive username conflict is shown instead of silently completing onboarding", async () => {
  (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: "other-user" });
  const form = new FormData();
  form.set("username", "FilmSever");
  expect(await completeOnboarding(form)).toEqual({ error: en.onboarding.usernameTaken });
  expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { OR: [{ username: { equals: "filmsever", mode: "insensitive" } }, { usernameAliases: { some: { username: { equals: "filmsever", mode: "insensitive" } } } }] }, select: { id: true } });
  expect(prisma.user.update).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
});

test("a username race returns a recoverable error without retrying or marking completion", async () => {
  (prisma.user.update as jest.Mock).mockRejectedValue({ code: "P2002" });
  const form = new FormData();
  form.set("username", "filmsever");
  expect(await completeOnboarding(form)).toEqual({ error: en.onboarding.usernameTaken });
  expect(prisma.user.update).toHaveBeenCalledTimes(1);
  expect(revalidatePath).not.toHaveBeenCalled();
});

test("blank username keeps the current username and favorite titles", async () => {
  await expect(completeOnboarding(new FormData())).rejects.toThrow("NEXT_REDIRECT");
  const data = (prisma.user.update as jest.Mock).mock.calls[0][0].data;
  expect(data).not.toHaveProperty("username");
  expect(data).not.toHaveProperty("favoriteMediaIds");
});

test("forged provider values are rejected", async () => {
  const form = new FormData();
  form.append("platforms", "invalid-provider");
  expect(await completeOnboarding(form)).toEqual({ error: en.onboarding.invalidPreferences });
  expect(prisma.user.update).not.toHaveBeenCalled();
});

test.each([{ id: "guest_123" }, { id: "guest", isGuest: true }])("guests bypass persistence", async user => {
  (auth as jest.Mock).mockResolvedValue({ user });
  await expect(completeOnboarding(new FormData())).rejects.toThrow("NEXT_REDIRECT");
  expect(prisma.user.update).not.toHaveBeenCalled();
});

test('optional survey answer is saved with preferences without changing arrival attribution',async()=>{
 const form=new FormData();form.set('discoveryAnswer','friend');
 await expect(completeOnboarding(form)).rejects.toThrow('NEXT_REDIRECT');
 expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({adminProfile:{upsert:{create:{discoveryAnswer:'friend'},update:{discoveryAnswer:'friend'}}}})}));
});
test('invalid survey answer never writes preferences',async()=>{
 const form=new FormData();form.set('discoveryAnswer','unbounded arbitrary answer');
 expect(await completeOnboarding(form)).toEqual({error:en.acquisition.invalidAnswer});expect(prisma.user.update).not.toHaveBeenCalled();
});
