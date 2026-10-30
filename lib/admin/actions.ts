"use server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./access";
import { isAdminId } from "./policy";
import { REMOVED_COMMENTS } from "./format";
import { revalidatePath } from "next/cache";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { evaluateAccountBotSignals } from "@/lib/bot-protection";
import { z } from "zod";
const inputSchema = z.object({
  action: z.enum([
    "suspend",
    "activate",
    "revoke-sessions",
    "redact-comment",
    "redact-review",
    "purge-expired",
    "purge-bots",
  ]),
  targetId: z.string().trim().min(1).max(150),
  reason: z.string().trim().min(5).max(500),
});
export async function performAdminAction(input: z.infer<typeof inputSchema>) {
  const t = getDictionary(await getServerLocale()).admin;
  try {
    const admin = await requireAdmin();
    if (!checkRateLimit(`admin-action:${admin.id}`, 30, 60_000).allowed)
      return { error: t.rateLimited };
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { error: t.invalidInput };
    const { action, targetId, reason } = parsed.data;
    if (
      ["suspend", "activate", "revoke-sessions"].includes(action) &&
      (targetId === admin.id || isAdminId(targetId))
    )
      return { error: t.protectedAdmin };
    const changed = await prisma.$transaction(async (tx) => {
      let count: number;
      if (action === "suspend" || action === "activate") {
        const result = await tx.user.updateMany({
          where: { id: targetId, isSuspended: action === "activate" },
          data: {
            isSuspended: action === "suspend",
            suspendedAt: action === "suspend" ? new Date() : null,
            sessionVersion: { increment: 1 },
          },
        });
        count = result.count;
        if (count && action === "suspend")
          await tx.session.deleteMany({ where: { userId: targetId } });
      } else if (action === "revoke-sessions") {
        const result = await tx.user.updateMany({
          where: { id: targetId },
          data: { sessionVersion: { increment: 1 } },
        });
        count = result.count;
        if (count)
          await tx.session.deleteMany({ where: { userId: targetId } });
      } else if (action === "purge-expired") {
        const now = new Date();
        const [sessions, tokens, limits] = await Promise.all([
          tx.session.deleteMany({ where: { expires: { lt: now } } }),
          tx.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
          tx.authRateLimit.deleteMany({ where: { expires: { lt: now } } }),
        ]);
        count = sessions.count + tokens.count + limits.count;
      } else if (action === "purge-bots") {
        const candidates = await tx.user.findMany({
          where: {
            hasCompletedOnboarding: false,
            watched: { none: {} },
            watchedEpisodes: { none: {} },
            toWatch: { none: {} },
            comments: { none: {} },
            activities: { none: {} },
            accounts: { none: {} },
            sentMessages: { none: {} },
            receivedMessages: { none: {} },
            OR: [{ adminProfile: null }, { adminProfile: { totalMinutes: 0 } }],
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            hasCompletedOnboarding: true,
            accounts: { select: { provider: true } },
            adminProfile: { select: { lastSeenAt: true, totalMinutes: true } },
            _count: {
              select: {
                watched: true,
                watchedEpisodes: true,
                toWatch: true,
                comments: true,
                activities: true,
              },
            },
          },
        });
        const botIds = candidates
          .filter(
            (u) =>
              !isAdminId(u.id) &&
              u.id !== admin.id &&
              evaluateAccountBotSignals(u).verdict !== "human",
          )
          .map((u) => u.id);
        if (botIds.length > 0) {
          const deleted = await tx.user.deleteMany({
            where: { id: { in: botIds } },
          });
          count = deleted.count;
        } else {
          count = 0;
        }
      } else if (action === "redact-comment") {
        const result = await tx.comment.updateMany({
          where: { id: targetId, content: { notIn: REMOVED_COMMENTS } },
          data: { content: REMOVED_COMMENTS[0] },
        });
        count = result.count;
      } else {
        const result = await tx.activity.updateMany({
          where: { id: targetId, review: { not: null } },
          data: { review: null },
        });
        count = result.count;
      }
      if (!count) return false;
      await tx.adminAuditLog.create({
        data: {
          actorId: admin.id,
          actorName: admin.username,
          action,
          targetId,
          reason,
        },
      });
      return true;
    });
    if (!changed) return { error: t.alreadyApplied };
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { error: t.actionError };
  }
}
