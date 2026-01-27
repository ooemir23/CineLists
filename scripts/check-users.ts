import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, hasCompletedOnboarding: true, favoriteGenres: true, platforms: true }
    });
    console.log("USERS_JSON:" + JSON.stringify(users));
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
