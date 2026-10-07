import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export function visibleUserWhere(
  viewerId: string | undefined,
  feature: "showStats" | "showActivities",
): Prisma.UserWhereInput {
  return {
    isSuspended: false,
    OR: [
      ...(viewerId ? [{ id: viewerId }] : []),
      {
        [feature]: true,
        OR: [
          { isPrivate: false },
          ...(viewerId
            ? [{ followedBy: { some: { followerId: viewerId } } }]
            : []),
        ],
      },
    ],
  };
}

export async function accessibleProfileId(
  targetId: string | undefined,
  feature: "showStats" | "showActivities" = "showStats",
) {
  const session = await auth();
  const viewerId = session?.user?.id;
  const id = targetId || viewerId;
  if (!id || id.length > 128) return null;
  const user = await prisma.user.findFirst({
    where: { id, ...visibleUserWhere(viewerId, feature) },
    select: { id: true },
  });
  return user?.id ?? null;
}
