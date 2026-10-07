"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { revalidatePath } from "next/cache";
import { mediaKey, parseMediaKey } from "@/lib/media-key";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";

export async function toggleFavoriteMedia(
  tmdbId: number | string,
  type: "movie" | "tv" = "movie",
  title?: string,
  posterPath?: string | null,
  backdropPath?: string | null,
): Promise<{
  error?: string;
  success?: boolean;
  isFavorite?: boolean;
  favoritesCount?: number;
  favorites?: string[];
}> {
  const dict = getDictionary(await getServerLocale());
  const session = await auth();
  if (!session?.user?.id) return { error: dict.onboarding.signInRequired };
  const userId = session.user.id;
  const identity = parseMediaKey(mediaKey(tmdbId, type));
  if (!identity) return { error: dict.common.errorOccurred };
  try {
    const details = title ? null : await tmdb.getDetails(type, String(tmdbId));
    const media = await prisma.mediaItem.upsert({
      where: {
        type_tmdbId: {
          type: type === "movie" ? "MOVIE" : "TV",
          tmdbId: identity.id,
        },
      },
      update: {},
      create: {
        tmdbId: identity.id,
        type: type === "movie" ? "MOVIE" : "TV",
        title: title || details?.title || details?.name || dict.common.appName,
        posterPath: posterPath || details?.poster_path,
        backdropPath: backdropPath || details?.backdrop_path,
      },
    });
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      const key = { userId: userId, mediaId: media.id };
      const existing = await tx.favoriteMedia.findUnique({
        where: { userId_mediaId: key },
      });
      if (existing)
        await tx.favoriteMedia.delete({ where: { userId_mediaId: key } });
      else {
        await tx.favoriteMedia.updateMany({
          where: { userId: userId },
          data: { position: { increment: 1 } },
        });
        await tx.favoriteMedia.create({ data: key });
      }
      const favorites = await tx.favoriteMedia.findMany({
        where: { userId: userId },
        include: { media: { select: { tmdbId: true, type: true } } },
        orderBy: { position: "asc" },
      });
      const keys = favorites.map((f) => mediaKey(f.media.tmdbId, f.media.type));
      // Retain unresolved legacy IDs for a manual migration; never guess their type.
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { favoriteMediaIds: true },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          favoriteMediaIds: [
            ...keys,
            ...(user?.favoriteMediaIds.filter((k) => /^\d+$/.test(k)) || []),
          ],
        },
      });
      return {
        success: true,
        isFavorite: !existing,
        favoritesCount: keys.length,
        favorites: keys,
      };
    });
    revalidatePath("/profile");
    revalidatePath(`/profile/${userId}`);
    revalidatePath(`/${type}/${tmdbId}`);
    return result;
  } catch {
    return { error: dict.common.errorOccurred };
  }
}

export async function getIsFavoriteMedia(
  tmdbId: number | string,
  type: "movie" | "tv" = "movie",
) {
  const session = await auth();
  if (!session?.user?.id) return false;
  const userId = session.user.id;
  const identity = parseMediaKey(mediaKey(tmdbId, type));
  if (!identity) return false;
  return !!(await prisma.favoriteMedia.findFirst({
    where: {
      userId: userId,
      media: { tmdbId: identity.id, type: type === "movie" ? "MOVIE" : "TV" },
    },
    select: { mediaId: true },
  }));
}

export async function updateFavoriteMediaList(keys: string[]) {
  const dict = getDictionary(await getServerLocale());
  const session = await auth();
  if (!session?.user?.id) return { error: dict.onboarding.signInRequired };
  const userId = session.user.id;
  if (
    !Array.isArray(keys) ||
    keys.length > 100 ||
    keys.some((k) => typeof k !== "string" || !parseMediaKey(k)) ||
    new Set(keys).size !== keys.length
  )
    return { error: dict.common.errorOccurred };
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      const current = await tx.favoriteMedia.findMany({
        where: { userId: userId },
        include: { media: true },
      });
      if (
        keys.some(
          (k) =>
            !current.some((f) => mediaKey(f.media.tmdbId, f.media.type) === k),
        )
      )
        throw new Error("Invalid favorite selection");
      await tx.favoriteMedia.deleteMany({
        where: {
          userId: userId,
          mediaId: {
            notIn: current
              .filter((f) =>
                keys.includes(mediaKey(f.media.tmdbId, f.media.type)),
              )
              .map((f) => f.mediaId),
          },
        },
      });
      for (const [position, key] of keys.entries()) {
        const favorite = current.find(
          (f) => mediaKey(f.media.tmdbId, f.media.type) === key,
        )!;
        await tx.favoriteMedia.update({
          where: {
            userId_mediaId: { userId: userId, mediaId: favorite.mediaId },
          },
          data: { position },
        });
      }
      await tx.user.update({
        where: { id: userId },
        data: {
          favoriteMediaIds: [
            ...keys,
            ...((
              await tx.user.findUnique({
                where: { id: userId },
                select: { favoriteMediaIds: true },
              })
            )?.favoriteMediaIds.filter((k) => /^\d+$/.test(k)) || []),
          ],
        },
      });
    });
    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { error: dict.common.errorOccurred };
  }
}
