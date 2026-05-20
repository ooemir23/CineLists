import { PrismaClient } from "@prisma/client";
import { checkAndUnlockAchievements, getUserAchievements } from "../lib/achievement-actions";

const prisma = new PrismaClient();

async function main() {
    const userId = process.argv[2];
    
    if (!userId) {
        const users = await prisma.user.findMany({ take: 5, select: { id: true, email: true, name: true } });
        console.log("Kullanıcılar:");
        users.forEach(u => console.log(`  ${u.email} - ID: ${u.id}`));
        console.log("\nKullanım: npx tsx scripts/test-achievements.ts <userId>");
        return;
    }

    console.log(`\n🎯 Kullanıcı ID: ${userId}\n`);
    
    // Rozet kontrolü tetikle
    const newAchievements = await checkAndUnlockAchievements(userId);
    console.log(`✨ Yeni kazanılan rozetler: ${newAchievements.length > 0 ? newAchievements.join(", ") : "Yok"}`);
    
    // Mevcut rozetleri göster
    const data = await getUserAchievements(userId);
    console.log(`📊 Toplam: ${data.totalUnlocked} / ${data.totalPossible} rozet\n`);
    
    // Kategorilere göre göster
    const categories = ["watch", "rate", "social", "special"];
    for (const cat of categories) {
        const items = data.achievements.filter((a: any) => a.category === cat);
        const unlocked = items.filter((a: any) => a.unlocked).length;
        console.log(`${cat.toUpperCase()}: ${unlocked}/${items.length}`);
    }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());