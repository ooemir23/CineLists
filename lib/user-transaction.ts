import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
export async function withUserTransaction<T>(
  userId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    return work(tx);
  });
}
