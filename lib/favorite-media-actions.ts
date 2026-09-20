"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { revalidatePath } from "next/cache";

export async function toggleFavoriteMedia(
  tmdbId: number | string,
  type: "movie" | "tv" = "movie",
  title?: string,
  posterPath?: string | null,
  backdropPath?: string | null
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Favorilere eklemek için giriş yapmalısınız." };
  }

  const userId = session.user.id;
  const strId = String(tmdbId);
  const numId = Number(tmdbId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { favoriteMediaIds: true },
    });

    if (!user) {
      return { error: "Kullanıcı bulunamadı." };
    }

    const currentFavorites = user.favoriteMediaIds || [];
    const isAlreadyFavorite = currentFavorites.includes(strId);
    let newFavorites: string[];

    if (isAlreadyFavorite) {
      newFavorites = currentFavorites.filter((id) => id !== strId);
    } else {
      // Add to favorites (place newest first)
      newFavorites = [strId, ...currentFavorites.filter((id) => id !== strId)];

      // Ensure MediaItem exists in DB with backdropPath for the profile cover photo
      if (!isNaN(numId)) {
        try {
          let media = await prisma.mediaItem.findUnique({
            where: { tmdbId: numId },
          });

          if (!media) {
            let fetchedBackdrop = backdropPath;
            let fetchedPoster = posterPath;
            let fetchedTitle = title || "";

            if (!fetchedBackdrop || !fetchedTitle) {
              const details = await tmdb.getDetails(type, strId).catch(() => null);
              if (details) {
                fetchedTitle = details.title || details.name || fetchedTitle;
                fetchedBackdrop = details.backdrop_path || fetchedBackdrop;
                fetchedPoster = details.poster_path || fetchedPoster;
              }
            }

            await prisma.mediaItem.create({
              data: {
                tmdbId: numId,
                type: type === "tv" ? "TV" : "MOVIE",
                title: fetchedTitle || "İçerik",
                posterPath: fetchedPoster,
                backdropPath: fetchedBackdrop,
              },
            });
          } else if (backdropPath && !media.backdropPath) {
            await prisma.mediaItem.update({
              where: { id: media.id },
              data: { backdropPath },
            });
          }
        } catch (mediaErr) {
          console.warn("MediaItem upsert error in toggleFavoriteMedia:", mediaErr);
        }
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { favoriteMediaIds: newFavorites },
    });

    revalidatePath("/profile");
    revalidatePath(`/profile/${userId}`);
    revalidatePath(`/${type}/${tmdbId}`);

    return {
      success: true,
      isFavorite: !isAlreadyFavorite,
      favoritesCount: newFavorites.length,
    };
  } catch (error: any) {
    console.error("toggleFavoriteMedia error:", error);
    return { error: error?.message || "İşlem sırasında bir hata oluştu." };
  }
}

export async function getIsFavoriteMedia(tmdbId: number | string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { favoriteMediaIds: true },
    });

    return !!user?.favoriteMediaIds?.includes(String(tmdbId));
  } catch {
    return false;
  }
}

export async function updateFavoriteMediaList(newFavoriteIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Giriş yapmalısınız." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { favoriteMediaIds: newFavoriteIds },
    });

    revalidatePath("/profile");
    revalidatePath(`/profile/${session.user.id}`);
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || "Güncelleme başarısız." };
  }
}
