"use server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./access";
import { isAdminId } from "./policy";
import { REMOVED_COMMENTS } from "./format";
import { revalidatePath } from "next/cache";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { z } from "zod";
const inputSchema = z.object({
  action: z.enum(["suspend", "activate", "redact-comment", "redact-review"]),
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
      ["suspend", "activate"].includes(action) &&
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
