import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
export function ensureMediaItem({
  data,
}: {
  data: Prisma.MediaItemUncheckedCreateInput;
}) {
  if (
    !Number.isSafeInteger(data.tmdbId) ||
    data.tmdbId < 1 ||
    !["MOVIE", "TV", "PERSON"].includes(data.type)
  )
    throw new Error("Invalid media identity");
  return prisma.mediaItem.upsert({
    where: { type_tmdbId: { type: data.type, tmdbId: data.tmdbId } },
    create: data,
    update: {},
  });
}
