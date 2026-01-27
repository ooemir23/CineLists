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

async function updateRuntime() {
    const mediaItems = await prisma.mediaItem.findMany({
        where: {
            type: 'MOVIE', // Only update movies since TV shows don't have single runtime
            runtime: null
        }
    });

    console.log(`Checking ${mediaItems.length} movie items for runtime...`);

    for (const item of mediaItems) {
        try {
            const details = await fetchTMDB(`/movie/${item.tmdbId}`);
            const runtime = details.runtime;

            if (runtime) {
                await prisma.mediaItem.update({
                    where: { id: item.id },
                    data: { runtime }
                });

                console.log(`Updated ${item.title}: runtime ${runtime} minutes`);
            } else {
                console.log(`${item.title}: no runtime data available`);
            }
        } catch (error) {
            console.error(`Error updating ${item.title}:`, error.message);
        }
    }

    console.log('Done!');
    await prisma.$disconnect();
}

updateRuntime().catch(console.error);