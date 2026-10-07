"use server";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import { withUserTransaction } from "@/lib/user-transaction";
import { ensureMediaItem } from "@/lib/media-item";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { tmdb } from "./tmdb";
import { GENRE_MAP } from "./genres";
import { checkAndUnlockAchievements } from "@/lib/achievement-actions";

async function resolveUserId(session: any): Promise<string | null> {
  if (!session?.user?.id) return null;
  const userId = session.user.id;
  const exists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (exists) return exists.id;
  return null;
}

export async function markEpisodeAsWatched(
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  title: string,
  overview: string,
  stillPath: string | null,
  airDate: string | null,
) {
  try {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };
    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
      return { success: true };
    }

    const userId = await resolveUserId(session);
    if (!userId) return { error: dict.common.errorOccurred };

    // 1. Ensure MediaItem exists and has correct info
    let media = await prisma.mediaItem.findUnique({
      where: { type_tmdbId: { type: "TV", tmdbId } },
    });

    if (!media || media.title === "TV Show") {
      const tvDetails = await tmdb
        .getDetails("tv", String(tmdbId))
        .catch(() => null);

      if (!media) {
        media = await ensureMediaItem({
          data: {
            tmdbId,
            type: "TV",
            title: tvDetails?.name || "TV Show",
            posterPath: tvDetails?.poster_path,
            backdropPath: tvDetails?.backdrop_path,
            overview: tvDetails?.overview,
            voteAverage: tvDetails?.vote_average,
            genres:
              tvDetails?.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) ||
              [],
          },
        });
      } else if (media.title === "TV Show" && tvDetails) {
        media = await prisma.mediaItem.update({
          where: { id: media.id },
          data: {
            title: tvDetails.name,
            posterPath: tvDetails.poster_path,
            backdropPath: tvDetails.backdrop_path,
            overview: tvDetails.overview,
            voteAverage: tvDetails.vote_average,
            genres:
              tvDetails.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) ||
              [],
          },
        });
      }
    }

    // 2. Ensure Episode exists
    let episode = await prisma.episode.findUnique({
      where: {
        mediaId_seasonNumber_episodeNumber: {
          mediaId: media.id,
          seasonNumber,
          episodeNumber,
        },
      },
    });

    if (!episode) {
      episode = await prisma.episode.upsert({
        where: {
          mediaId_seasonNumber_episodeNumber: {
            mediaId: media.id,
            seasonNumber,
            episodeNumber,
          },
        },
        update: {},
        create: {
          mediaId: media.id,
          seasonNumber,
          episodeNumber,
          title,
          overview,
          stillPath,
          airDate: airDate ? new Date(airDate) : null,
        },
      });
    }

    await withUserTransaction(userId, async (tx) => {
      // 3. Mark as Watched
      await tx.watchedEpisode.upsert({
        where: {
          userId_episodeId: {
            userId,
            episodeId: episode!.id,
          },
        },
        update: { watchedAt: new Date() },
        create: {
          userId,
          episodeId: episode!.id,
          watchedAt: new Date(),
        },
      });

      // 4. Activity
      const existingActivity = await tx.activity.findFirst({
        where: {
          userId,
          mediaId: media!.id,
          episodeId: episode!.id,
          type: "WATCHED",
        },
      });

      if (existingActivity) {
        await tx.activity.update({
          where: { id: existingActivity.id },
          data: { watchedAt: new Date(), createdAt: new Date() },
        });
      } else {
        await tx.activity.create({
          data: {
            userId,
            mediaId: media!.id,
            episodeId: episode!.id,
            type: "WATCHED",
            watchedAt: new Date(),
          },
        });
      }

      // 5. Global Status
      const existingGlobalWatch = await tx.watched.findUnique({
        where: { userId_mediaId: { userId, mediaId: media!.id } },
      });

      if (!existingGlobalWatch) {
        await tx.toWatch.deleteMany({ where: { userId, mediaId: media!.id } });
        await tx.watched.create({
          data: { userId, mediaId: media!.id, watchedAt: new Date() },
        });

        // Global Show Activity
        const showActivity = await tx.activity.findFirst({
          where: {
            userId,
            mediaId: media!.id,
            type: "WATCHED",
            episodeId: null,
          },
        });

        if (!showActivity) {
          await tx.activity.create({
            data: {
              userId,
              mediaId: media!.id,
              type: "WATCHED",
              watchedAt: new Date(),
            },
          });
        }
      }
    });
    revalidatePath(`/tv/${tmdbId}`);
    revalidatePath("/profile");
    revalidatePath("/watched");
    revalidatePath("/watchlist");
    revalidatePath("/feed");
    return { success: true };
  } catch (error: any) {
    console.error("Mark episode error:", error);
    return {
      error: getDictionary(await getServerLocale()).common.errorOccurred,
    };
  }
}

export async function markSeasonAsWatched(
  tmdbId: number,
  seasonNumber: number,
) {
  try {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };
    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
      return { success: true };
    }

    const userId = await resolveUserId(session);
    if (!userId) return { error: dict.common.errorOccurred };

    // Get season data from TMDB
    const seasonData = await tmdb.getSeasonDetails(
      String(tmdbId),
      seasonNumber,
    );
    if (!seasonData?.episodes) return { error: dict.common.errorOccurred };

    // Ensure MediaItem
    let media = await prisma.mediaItem.findUnique({
      where: { type_tmdbId: { type: "TV", tmdbId } },
    });
    if (!media || media.title === "TV Show" || media.title === "Dizi") {
      const tvDetails = await tmdb
        .getDetails("tv", String(tmdbId))
        .catch(() => null);
      if (!media) {
        media = await ensureMediaItem({
          data: {
            tmdbId,
            type: "TV",
            title: tvDetails?.name || seasonData.name || "Dizi",
            posterPath: tvDetails?.poster_path,
            backdropPath: tvDetails?.backdrop_path,
            overview: tvDetails?.overview,
            voteAverage: tvDetails?.vote_average,
            genres:
              tvDetails?.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) ||
              [],
          },
        });
      } else if (tvDetails) {
        media = await prisma.mediaItem.update({
          where: { id: media.id },
          data: {
            title: tvDetails.name,
            posterPath: tvDetails.poster_path,
            backdropPath: tvDetails.backdrop_path,
            overview: tvDetails.overview,
            voteAverage: tvDetails.vote_average,
            genres:
              tvDetails.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) ||
              [],
          },
        });
      }
    }

    const mediaId = media.id;

    // Check if all episodes are already watched - if so, unmark them all
    const allEpisodeIds: string[] = [];
    for (const ep of seasonData.episodes) {
      let dbEp = await prisma.episode.findUnique({
        where: {
          mediaId_seasonNumber_episodeNumber: {
            mediaId,
            seasonNumber,
            episodeNumber: ep.episode_number,
          },
        },
      });

      if (!dbEp) {
        dbEp = await prisma.episode.upsert({
          where: {
            mediaId_seasonNumber_episodeNumber: {
              mediaId,
              seasonNumber,
              episodeNumber: ep.episode_number,
            },
          },
          update: {},
          create: {
            mediaId,
            seasonNumber,
            episodeNumber: ep.episode_number,
            title: ep.name,
            overview: ep.overview,
            stillPath: ep.still_path,
            airDate: ep.air_date ? new Date(ep.air_date) : null,
          },
        });
      }
      allEpisodeIds.push(dbEp.id);
    }

    await withUserTransaction(userId, async (tx) => {
      // Check how many are watched
      const watchedCount = await tx.watchedEpisode.count({
        where: {
          userId,
          episodeId: { in: allEpisodeIds },
        },
      });

      const allWatched = watchedCount === allEpisodeIds.length;

      if (allWatched) {
        // UNMARK ALL - Remove all watched episodes and activities
        await tx.watchedEpisode.deleteMany({
          where: {
            userId,
            episodeId: { in: allEpisodeIds },
          },
        });

        await tx.activity.deleteMany({
          where: {
            userId,
            mediaId,
            episodeId: { in: allEpisodeIds },
            type: { in: ["WATCHED", "RATED"] },
          },
        });
      } else {
        // MARK ALL - Use batch operations for better performance

        // 1. Batch upsert watched episodes
        const watchedEpisodesToCreate = [];
        const existingWatched = await tx.watchedEpisode.findMany({
          where: {
            userId,
            episodeId: { in: allEpisodeIds },
          },
          select: { episodeId: true },
        });

        const existingWatchedIds = new Set(
          existingWatched.map((w) => w.episodeId),
        );

        for (const episodeId of allEpisodeIds) {
          if (!existingWatchedIds.has(episodeId)) {
            watchedEpisodesToCreate.push({
              userId,
              episodeId,
              watchedAt: new Date(),
            });
          }
        }

        if (watchedEpisodesToCreate.length > 0) {
          await tx.watchedEpisode.createMany({
            data: watchedEpisodesToCreate,
            skipDuplicates: true,
          });

          checkAndUnlockAchievements(userId).catch(console.error);
        }

        // Update existing ones
        if (existingWatchedIds.size > 0) {
          await tx.watchedEpisode.updateMany({
            where: {
              userId,
              episodeId: { in: Array.from(existingWatchedIds) },
            },
            data: { watchedAt: new Date() },
          });
        }

        // 2. Batch create WATCHED activities
        const existingActivities = await tx.activity.findMany({
          where: {
            userId,
            mediaId,
            episodeId: { in: allEpisodeIds },
            type: "WATCHED",
          },
          select: { episodeId: true },
        });

        const existingActivityIds = new Set(
          existingActivities.map((a) => a.episodeId),
        );
        const activitiesToCreate = [];

        for (const episodeId of allEpisodeIds) {
          if (!existingActivityIds.has(episodeId)) {
            activitiesToCreate.push({
              userId,
              mediaId,
              episodeId,
              type: "WATCHED" as const,
              watchedAt: new Date(),
            });
          }
        }

        if (activitiesToCreate.length > 0) {
          await tx.activity.createMany({
            data: activitiesToCreate,
            skipDuplicates: true,
          });
        }

        // 3. Global Show Status
        await tx.watched.upsert({
          where: { userId_mediaId: { userId, mediaId } },
          update: { watchedAt: new Date() },
          create: { userId, mediaId, watchedAt: new Date() },
        });

        await tx.toWatch.deleteMany({ where: { userId, mediaId } });
      }
    });
    revalidatePath(`/tv/${tmdbId}`);
    revalidatePath("/profile");
    revalidatePath("/watched");
    revalidatePath("/watchlist");
    revalidatePath("/feed");

    return { success: true };
  } catch (error: any) {
    console.error("Mark season error:", error);
    return {
      error: getDictionary(await getServerLocale()).common.errorOccurred,
    };
  }
}

export async function removeEpisodeWatch(
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
) {
  try {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };
    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
      return { success: true };
    }

    const userId = await resolveUserId(session);
    if (!userId) return { error: dict.common.errorOccurred };

    const media = await prisma.mediaItem.findUnique({
      where: { type_tmdbId: { type: "TV", tmdbId } },
    });
    if (!media) return { error: dict.common.errorOccurred };

    const episode = await prisma.episode.findUnique({
      where: {
        mediaId_seasonNumber_episodeNumber: {
          mediaId: media.id,
          seasonNumber,
          episodeNumber,
        },
      },
    });

    if (!episode) return { error: dict.common.errorOccurred };

    await withUserTransaction(userId, async (tx) => {
      await tx.watchedEpisode.deleteMany({
        where: { userId, episodeId: episode.id },
      });
      await tx.activity.deleteMany({
        where: { userId, episodeId: episode.id, type: "WATCHED" },
      });
    });

    revalidatePath(`/tv/${tmdbId}`);
    revalidatePath("/feed");
    return { success: true };
  } catch (error: any) {
    return {
      error: getDictionary(await getServerLocale()).common.errorOccurred,
    };
  }
}

export async function getWatchedEpisodes(tmdbId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const media = await prisma.mediaItem.findUnique({
      where: { type_tmdbId: { type: "TV", tmdbId } },
    });
    if (!media) return [];

    const watched = await prisma.watchedEpisode.findMany({
      where: {
        userId: session.user.id,
        episode: { mediaId: media.id },
      },
      include: {
        episode: { select: { seasonNumber: true, episodeNumber: true } },
      },
    });

    return watched.map((w) => ({
      s: w.episode.seasonNumber,
      e: w.episode.episodeNumber,
    }));
  } catch (_error) {
    return [];
  }
}

export async function ensureEpisodeExists(params: {
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview: string;
  stillPath: string | null;
  airDate: string | null;
}) {
  const session = await auth();
  const dict = getDictionary(await getServerLocale());
  if (!session?.user?.id) throw new Error(dict.onboarding.signInRequired);
  const {
    tmdbId,
    seasonNumber,
    episodeNumber,
    title,
    overview,
    stillPath,
    airDate,
  } = params;
  if (
    ![tmdbId, seasonNumber, episodeNumber].every(Number.isSafeInteger) ||
    tmdbId < 1 ||
    seasonNumber < 0 ||
    episodeNumber < 1
  )
    throw new Error(dict.common.errorOccurred);

  let media = await prisma.mediaItem.findUnique({
    where: { type_tmdbId: { type: "TV", tmdbId } },
  });
  if (!media || media.title === "TV Show") {
    const tvDetails = await tmdb
      .getDetails("tv", String(tmdbId))
      .catch(() => null);
    if (!media) {
      media = await ensureMediaItem({
        data: {
          tmdbId,
          type: "TV",
          title: tvDetails?.name || "TV Show",
          posterPath: tvDetails?.poster_path,
          backdropPath: tvDetails?.backdrop_path,
          overview: tvDetails?.overview,
          voteAverage: tvDetails?.vote_average,
          genres:
            tvDetails?.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) || [],
        },
      });
    } else if (tvDetails) {
      media = await prisma.mediaItem.update({
        where: { id: media.id },
        data: {
          title: tvDetails.name,
          posterPath: tvDetails.poster_path,
          backdropPath: tvDetails.backdrop_path,
          overview: tvDetails.overview,
          voteAverage: tvDetails.vote_average,
          genres:
            tvDetails.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) || [],
        },
      });
    }
  }

  let episode = await prisma.episode.findUnique({
    where: {
      mediaId_seasonNumber_episodeNumber: {
        mediaId: media.id,
        seasonNumber,
        episodeNumber,
      },
    },
  });

  if (!episode) {
    episode = await prisma.episode.upsert({
      where: {
        mediaId_seasonNumber_episodeNumber: {
          mediaId: media.id,
          seasonNumber,
          episodeNumber,
        },
      },
      update: {},
      create: {
        mediaId: media.id,
        seasonNumber,
        episodeNumber,
        title,
        overview,
        stillPath,
        airDate: airDate ? new Date(airDate) : null,
      },
    });
  }
  return episode;
}

export async function rateEpisode(params: {
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  rating: number;
  title: string;
  overview: string;
  stillPath: string | null;
  airDate: string | null;
}) {
  try {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };
    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
      return { success: true };
    }

    const userId = await resolveUserId(session);
    if (!userId) return { error: dict.common.errorOccurred };

    if (
      !Number.isFinite(params.rating) ||
      params.rating < 0 ||
      params.rating > 10
    )
      return { error: dict.common.errorOccurred };
    const episode = await ensureEpisodeExists(params);

    await withUserTransaction(userId, async (tx) => {
      const existingRating = await tx.activity.findFirst({
        where: {
          userId,
          mediaId: episode.mediaId,
          episodeId: episode!.id,
          type: "RATED",
        },
      });

      if (existingRating) {
        if (existingRating.rating === params.rating) {
          await tx.activity.delete({ where: { id: existingRating.id } });
        } else {
          await tx.activity.update({
            where: { id: existingRating.id },
            data: { rating: params.rating, createdAt: new Date() },
          });
        }
      } else {
        await tx.activity.create({
          data: {
            userId,
            mediaId: episode.mediaId,
            episodeId: episode!.id,
            type: "RATED",
            rating: params.rating,
            watchedAt: new Date(),
          },
        });
      }
    });
    revalidatePath(`/tv/${params.tmdbId}`);
    return { success: true };
  } catch (error: any) {
    return {
      error: getDictionary(await getServerLocale()).common.errorOccurred,
    };
  }
}
