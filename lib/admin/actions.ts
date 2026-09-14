"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./access";
import { isAdminId } from "./policy";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const inputSchema = z.object({
  action: z.enum(["suspend", "activate", "redact-comment", "redact-review"]),
  targetId: z.string().min(1).max(150),
  reason: z
    .string()
    .trim()
    .min(5, "En az 5 karakterlik bir işlem nedeni yazın.")
    .max(500),
});

export async function performAdminAction(input: z.infer<typeof inputSchema>) {
  try {
    const admin = await requireAdmin();
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const { action, targetId, reason } = parsed.data;
    if (
      (action === "suspend" || action === "activate") &&
      (targetId === admin.id || isAdminId(targetId))
    ) {
      return { error: "Yönetici hesaplarının durumu panelden değiştirilemez." };
    }
    await prisma.$transaction(async (tx) => {
      if (action === "suspend" || action === "activate") {
        await tx.user.update({
          where: { id: targetId },
          data: {
            isSuspended: action === "suspend",
            suspendedAt: action === "suspend" ? new Date() : null,
          },
        });
        if (action === "suspend")
          await tx.session.deleteMany({ where: { userId: targetId } });
      } else if (action === "redact-comment") {
        await tx.comment.update({
          where: { id: targetId },
          data: { content: "[Bu yorum yönetici tarafından kaldırıldı.]" },
        });
      } else {
        await tx.activity.update({
          where: { id: targetId },
          data: { review: null },
        });
      }
      await tx.adminAuditLog.create({
        data: {
          actorId: admin.id,
          actorName: admin.username,
          action,
          targetId,
          reason,
        },
      });
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return {
      error:
        "İşlem tamamlanamadı. Yetkinizi ve bağlantıyı kontrol edip tekrar deneyin.",
    };
  }
}
