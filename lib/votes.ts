import "server-only";
import { prisma } from "@/lib/prisma";
import { visibleUserWhere } from "@/lib/profile-access";

export async function setVote(
  userId: string,
  targetId: string,
  value: number,
  kind: "activity" | "comment",
) {
  if (
    ![0, 1, -1].includes(value) ||
    typeof targetId !== "string" ||
    targetId.length > 128
  )
    return null;
  return prisma.$transaction(async (tx) => {
    if (kind === "activity") {
      await tx.$queryRaw`SELECT id FROM "Activity" WHERE id = ${targetId} FOR UPDATE`;
      const target = await tx.activity.findFirst({
        where: {
          id: targetId,
          user: visibleUserWhere(userId, "showActivities"),
        },
        select: { id: true },
      });
      if (!target) return null;
      const previous = await tx.activityVote.findUnique({
        where: { userId_activityId: { userId, activityId: targetId } },
      });
      if (value === 0)
        await tx.activityVote.deleteMany({
          where: { userId, activityId: targetId },
        });
      else
        await tx.activityVote.upsert({
          where: { userId_activityId: { userId, activityId: targetId } },
          create: { userId, activityId: targetId, value },
          update: { value },
        });
      const updated = await tx.activity.update({
        where: { id: targetId },
        data: { votes: { increment: value - (previous?.value ?? 0) } },
        select: { votes: true },
      });
      return updated.votes;
    }
    await tx.$queryRaw`SELECT id FROM "Comment" WHERE id = ${targetId} FOR UPDATE`;
    const target = await tx.comment.findFirst({
      where: {
        id: targetId,
        user: visibleUserWhere(userId, "showActivities"),
        OR: [
          { activityId: null },
          { activity: { user: visibleUserWhere(userId, "showActivities") } },
        ],
      },
      select: { id: true },
    });
    if (!target) return null;
    const previous = await tx.commentVote.findUnique({
      where: { userId_commentId: { userId, commentId: targetId } },
    });
    if (value === 0)
      await tx.commentVote.deleteMany({
        where: { userId, commentId: targetId },
      });
    else
      await tx.commentVote.upsert({
        where: { userId_commentId: { userId, commentId: targetId } },
        create: { userId, commentId: targetId, value },
        update: { value },
      });
    const updated = await tx.comment.update({
      where: { id: targetId },
      data: { votes: { increment: value - (previous?.value ?? 0) } },
      select: { votes: true },
    });
    return updated.votes;
  });
}
