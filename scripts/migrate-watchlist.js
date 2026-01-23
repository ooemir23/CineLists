const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Veri taşıma işlemi başlıyor...');

    // WatchlistItem tablosunun hala var olup olmadığını kontrol et (SQL ile)
    // prisma db push sonrası bu tablo silinebilir, o yüzden migration öncesi verileri çekmek lazım.
    // Ama şu an prisma db push yapmadım, sadece schema değişti.

    try {
        const items = await prisma.$queryRaw`SELECT * FROM "WatchlistItem"`;
        console.log(`${items.length} adet öğe bulundu.`);

        for (const item of items) {
            if (item.status === 'COMPLETED') {
                await prisma.watched.create({
                    data: {
                        userId: item.userId,
                        mediaId: item.mediaId,
                        addedAt: item.addedAt
                    }
                });
                console.log(`İzlendi Olarak Taşındı: ${item.mediaId}`);
            } else if (item.status === 'PLAN_TO_WATCH') {
                await prisma.toWatch.create({
                    data: {
                        userId: item.userId,
                        mediaId: item.mediaId,
                        addedAt: item.addedAt
                    }
                });
                console.log(`İzlenecek Olarak Taşındı: ${item.mediaId}`);
            }
        }
        console.log('Veri taşıma tamamlandı.');
    } catch (error) {
        console.error('Veri taşıma hatası (Tablo zaten silinmiş olabilir):', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
