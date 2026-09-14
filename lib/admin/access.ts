import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminId } from "./policy";

export async function getAdmin() {
  const session = await auth();
  if (!isAdminId(session?.user?.id)) return null;
  // Always validate the current DB record; never trust client-supplied roles.
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    select: { id: true, name: true, username: true, isSuspended: true },
  });
  return user && !user.isSuspended ? user : null;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Bu işlem için yönetici yetkisi gerekiyor.");
  return admin;
}
