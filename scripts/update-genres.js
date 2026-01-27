const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

async function fetchTMDB(endpoint, params = {}) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append("api_key", API_KEY);
    url.searchParams.append("language", "tr-TR");

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
    return res.json();
}

async function updateGenres() {
    const mediaItems = await prisma.mediaItem.findMany();

    console.log(`Checking ${mediaItems.length} media items...`);

    for (const item of mediaItems) {
        if (item.genres && item.genres.length > 0 && item.voteAverage) {
            console.log(`${item.title} already has genres and voteAverage`);
            continue;
        }

        try {
            const details = await fetchTMDB(`/${item.type.toLowerCase()}/${item.tmdbId}`);
            const genres = details.genres?.map(g => g.name) || [];
            const voteAverage = details.vote_average || 0;

            await prisma.mediaItem.update({
                where: { id: item.id },
                data: { genres, voteAverage }
            });

            console.log(`Updated ${item.title}: ${genres.join(', ')}, vote: ${voteAverage}`);
        } catch (error) {
            console.error(`Error updating ${item.title}:`, error.message);
        }
    }

    console.log('Done!');
    await prisma.$disconnect();
}

updateGenres().catch(console.error);