"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface DetailedStats {
    viewingTime: ViewingTimeStats;
    contentAnalysis: ContentAnalysisStats;
    socialStats: SocialStats;
    genreBreakdown: GenreStats[];
    temporalStats: TemporalStats;
    personalInsights: PersonalInsights;
}

export interface ViewingTimeStats {
    totalMinutes: number;
    movieMinutes: number;
    tvMinutes: number;
    averageDailyMinutes: number;
    estimatedHours: number;
}

export interface ContentAnalysisStats {
    movieCount: number;
    tvShowCount: number;
    episodeCount: number;
    completedShowsCount: number;
    averageMovieRating: number;
    averageTvRating: number;
    totalRatings: number;
}

export interface SocialStats {
    activitiesCount: number;
    recommendationsSent: number;
    recommendationsReceived: number;
    commentsCount: number;
    reviewsCount: number;
    followersCount: number;
    followingCount: number;
}

export interface GenreStats {
    genre: string;
    count: number;
    percentage: number;
}

export interface TemporalStats {
    monthlyActivity: MonthlyActivity[];
    weeklyPattern: WeeklyPattern[];
    mostActiveMonth: string;
    mostActiveDay: string;
}

export interface MonthlyActivity {
    month: string;
    count: number;
    year: number;
}

export interface WeeklyPattern {
    day: string;
    count: number;
}

export interface PersonalInsights {
    favoriteGenre: string;
    favoriteGenreCount: number;
    mostUsedPlatform: string;
    averageRatingTendency: string;
    mostWatchedWithPerson: string;
    mostRecommendedByPerson: string;
    totalDaysActive: number;
}

const defaultDetailedStats: DetailedStats = {
    viewingTime: {
        totalMinutes: 0,
        movieMinutes: 0,
        tvMinutes: 0,
        averageDailyMinutes: 0,
        estimatedHours: 0,
    },
    contentAnalysis: {
        movieCount: 0,
        tvShowCount: 0,
        episodeCount: 0,
        completedShowsCount: 0,
        averageMovieRating: 0,
        averageTvRating: 0,
        totalRatings: 0,
    },
    socialStats: {
        activitiesCount: 0,
        recommendationsSent: 0,
        recommendationsReceived: 0,
        commentsCount: 0,
        reviewsCount: 0,
        followersCount: 0,
        followingCount: 0,
    },
    genreBreakdown: [],
    temporalStats: {
        monthlyActivity: [],
        weeklyPattern: [
            { day: 'Pazar', count: 0 },
            { day: 'Pazartesi', count: 0 },
            { day: 'Salı', count: 0 },
            { day: 'Çarşamba', count: 0 },
            { day: 'Perşembe', count: 0 },
            { day: 'Cuma', count: 0 },
            { day: 'Cumartesi', count: 0 },
        ],
        mostActiveMonth: 'Tarih Bekleniyor',
        mostActiveDay: 'Tarih Bekleniyor',
    },
    personalInsights: {
        favoriteGenre: 'Tarih Bekleniyor',
        favoriteGenreCount: 0,
        mostUsedPlatform: 'Tarih Bekleniyor',
        averageRatingTendency: 'Tarih Bekleniyor',
        mostWatchedWithPerson: 'Yalnız',
        mostRecommendedByPerson: 'Tarih Bekleniyor',
        totalDaysActive: 1,
    }
};

export async function getDetailedUserStats(userId?: string): Promise<DetailedStats | null> {
    try {
        let targetUserId = userId;
        if (!targetUserId) {
            const session = await auth();
            targetUserId = session?.user?.id;
        }

        if (!targetUserId) return null;

        const [
            viewingTime,
            contentAnalysis,
            socialStats,
            genreBreakdown,
            temporalStats,
            personalInsights
        ] = await Promise.all([
            getViewingTimeStats(targetUserId),
            getContentAnalysisStats(targetUserId),
            getSocialStats(targetUserId),
            getGenreBreakdown(targetUserId),
            getTemporalStats(targetUserId),
            getPersonalInsights(targetUserId)
        ]);

        return {
            viewingTime,
            contentAnalysis,
            socialStats,
            genreBreakdown,
            temporalStats,
            personalInsights
        };
    } catch (error) {
        console.warn("[DetailedStats] Error in getDetailedUserStats:", error);
        return defaultDetailedStats;
    }
}

export async function getViewingTimeStats(userId: string): Promise<ViewingTimeStats> {
    try {
        // Film süreleri
        const watchedMovies = await prisma.watched.findMany({
            where: {
                userId,
                media: { type: "MOVIE" }
            },
            include: {
                media: {
                    select: { runtime: true }
                }
            }
        });

        const movieMinutes = watchedMovies.reduce((total, w) => {
            return total + (w.media?.runtime || 120); // Default 120 min if no runtime
        }, 0);

        // Dizi bölüm süreleri
        const watchedEpisodes = await prisma.watchedEpisode.count({
            where: { userId }
        });

        // Gerçek bölüm sürelerini DB'den al, yoksa 45 dk varsay
        const watchedTvEntries = await prisma.watched.findMany({
            where: {
                userId,
                media: { type: "TV" }
            },
            include: {
                media: { select: { runtime: true } }
            }
        });

        const avgTvRuntime = watchedTvEntries.length > 0
            ? watchedTvEntries.reduce((sum, w) => sum + (w.media?.runtime || 45), 0) / watchedTvEntries.length
            : 45;
        const tvMinutes = Math.round(watchedEpisodes * avgTvRuntime);

        const totalMinutes = movieMinutes + tvMinutes;

        // İlk aktivite tarihini bul
        const firstActivity = await prisma.activity.findFirst({
            where: { userId },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true }
        });

        const daysActive = firstActivity
            ? Math.max(1, Math.ceil((Date.now() - firstActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
            : 1;

        return {
            totalMinutes,
            movieMinutes,
            tvMinutes,
            averageDailyMinutes: Math.round(totalMinutes / daysActive),
            estimatedHours: Math.round(totalMinutes / 60)
        };
    } catch (error) {
        console.warn("[DetailedStats] Error in getViewingTimeStats:", error);
        return defaultDetailedStats.viewingTime;
    }
}

export async function getContentAnalysisStats(userId: string): Promise<ContentAnalysisStats> {
    try {
        const [movieCount, tvShowCount, episodeCount, ratings] = await Promise.all([
            prisma.watched.count({
                where: {
                    userId,
                    media: { type: "MOVIE" }
                }
            }),
            prisma.watched.count({
                where: {
                    userId,
                    media: { type: "TV" }
                }
            }),
            prisma.watchedEpisode.count({
                where: { userId }
            }),
            prisma.watched.findMany({
                where: {
                    userId,
                    rating: { not: null }
                },
                select: {
                    rating: true,
                    media: {
                        select: { type: true }
                    }
                }
            })
        ]);

        const movieRatings = ratings.filter(r => r.media?.type === "MOVIE" && r.rating);
        const tvRatings = ratings.filter(r => r.media?.type === "TV" && r.rating);

        const averageMovieRating = movieRatings.length > 0
            ? movieRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / movieRatings.length
            : 0;

        const averageTvRating = tvRatings.length > 0
            ? tvRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / tvRatings.length
            : 0;

        return {
            movieCount,
            tvShowCount,
            episodeCount,
            completedShowsCount: tvShowCount,
            averageMovieRating: Math.round(averageMovieRating * 10) / 10,
            averageTvRating: Math.round(averageTvRating * 10) / 10,
            totalRatings: ratings.length
        };
    } catch (error) {
        console.warn("[DetailedStats] Error in getContentAnalysisStats:", error);
        return defaultDetailedStats.contentAnalysis;
    }
}

export async function getSocialStats(userId: string): Promise<SocialStats> {
    try {
        const [
            activitiesCount,
            recommendationsSent,
            recommendationsReceived,
            commentsCount,
            reviewsCount,
            followersCount,
            followingCount
        ] = await Promise.all([
            prisma.activity.count({ where: { userId } }),
            prisma.recommendation.count({ where: { senderId: userId } }),
            prisma.recommendation.count({ where: { receiverId: userId } }),
            prisma.comment.count({ where: { userId } }),
            prisma.activity.count({ where: { userId, type: "REVIEWED" } }),
            prisma.follow.count({ where: { followingId: userId } }),
            prisma.follow.count({ where: { followerId: userId } })
        ]);

        return {
            activitiesCount,
            recommendationsSent,
            recommendationsReceived,
            commentsCount,
            reviewsCount,
            followersCount,
            followingCount
        };
    } catch (error) {
        console.warn("[DetailedStats] Error in getSocialStats:", error);
        return defaultDetailedStats.socialStats;
    }
}

export async function getGenreBreakdown(userId: string): Promise<GenreStats[]> {
    try {
        const watchedMedia = await prisma.watched.findMany({
            where: { userId },
            include: {
                media: {
                    select: { genres: true }
                }
            }
        });

        const genreCount: Record<string, number> = {};
        let totalGenres = 0;

        watchedMedia.forEach(w => {
            if (Array.isArray(w.media?.genres)) {
                w.media.genres.forEach(genre => {
                    if (genre) {
                        genreCount[genre] = (genreCount[genre] || 0) + 1;
                        totalGenres++;
                    }
                });
            }
        });

        const genreStats: GenreStats[] = Object.entries(genreCount)
            .map(([genre, count]) => ({
                genre,
                count,
                percentage: totalGenres > 0 ? Math.round((count / totalGenres) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 genres

        return genreStats;
    } catch (error) {
        console.warn("[DetailedStats] Error in getGenreBreakdown:", error);
        return [];
    }
}

export async function getTemporalStats(userId: string): Promise<TemporalStats> {
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    try {
        const activities = await prisma.activity.findMany({
            where: { userId },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' }
        });

        // Aylık aktivite
        const monthlyMap: Record<string, number> = {};
        const weeklyMap: Record<number, number> = {};

        activities.forEach(activity => {
            if (!activity?.createdAt) return;
            const date = new Date(activity.createdAt);
            if (isNaN(date.getTime())) return;

            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const dayOfWeek = date.getDay();

            monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
            weeklyMap[dayOfWeek] = (weeklyMap[dayOfWeek] || 0) + 1;
        });

        const monthlyActivity: MonthlyActivity[] = Object.entries(monthlyMap)
            .map(([key, count]) => {
                const [year, month] = key.split('-');
                return {
                    month: new Date(parseInt(year, 10), parseInt(month, 10) - 1).toLocaleDateString('tr-TR', { month: 'long' }),
                    count,
                    year: parseInt(year, 10)
                };
            })
            .slice(0, 12)
            .reverse();

        const weeklyPattern: WeeklyPattern[] = dayNames.map((day, index) => ({
            day,
            count: weeklyMap[index] || 0
        }));

        const mostActiveMonth = monthlyActivity.length > 0 && monthlyActivity.some(m => m.count > 0)
            ? monthlyActivity.reduce((max, curr) => curr.count > max.count ? curr : max).month
            : 'Tarih Bekleniyor';

        const mostActiveDay = weeklyPattern.some(w => w.count > 0)
            ? weeklyPattern.reduce((max, curr) => curr.count > max.count ? curr : max).day
            : 'Tarih Bekleniyor';

        return {
            monthlyActivity,
            weeklyPattern,
            mostActiveMonth,
            mostActiveDay
        };
    } catch (error) {
        console.warn("[DetailedStats] Error in getTemporalStats:", error);
        return defaultDetailedStats.temporalStats;
    }
}

export async function getPersonalInsights(userId: string): Promise<PersonalInsights> {
    try {
        const [genreBreakdown, activities] = await Promise.all([
            getGenreBreakdown(userId),
            prisma.activity.findMany({
                where: { userId },
                select: {
                    platform: true,
                    watchedWith: true,
                    recommendedByText: true,
                    rating: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'asc' }
            })
        ]);

        const favoriteGenre = genreBreakdown.length > 0 ? genreBreakdown[0].genre : 'Tarih Bekleniyor';
        const favoriteGenreCount = genreBreakdown.length > 0 ? genreBreakdown[0].count : 0;

        // Platform analizi
        const platformCount: Record<string, number> = {};
        activities.forEach(a => {
            if (a.platform) {
                platformCount[a.platform] = (platformCount[a.platform] || 0) + 1;
            }
        });
        const mostUsedPlatform = Object.keys(platformCount).length > 0
            ? Object.entries(platformCount).reduce((max, curr) => curr[1] > max[1] ? curr : max)[0]
            : 'Tarih Bekleniyor';

        // Puan verme eğilimi
        const ratings = activities.filter(a => a.rating).map(a => a.rating!);
        const avgRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;
        const averageRatingTendency = avgRating >= 4 ? 'Cömert' : avgRating >= 3 ? 'Dengeli' : avgRating > 0 ? 'Seçici' : 'Tarih Bekleniyor';

        // Kiminle izleme analizi
        const watchedWithCount: Record<string, number> = {};
        activities.forEach(a => {
            if (a.watchedWith) {
                try {
                    const parsed = JSON.parse(a.watchedWith);
                    const items = Array.isArray(parsed) ? parsed : [parsed];
                    items.forEach((item: unknown) => {
                        if (typeof item === 'string') {
                            watchedWithCount[item] = (watchedWithCount[item] || 0) + 1;
                        }
                    });
                } catch {
                    watchedWithCount[a.watchedWith] = (watchedWithCount[a.watchedWith] || 0) + 1;
                }
            }
        });

        let mostWatchedWithPerson = 'Yalnız';
        if (Object.keys(watchedWithCount).length > 0) {
            const topEntry = Object.entries(watchedWithCount).reduce((max, curr) => curr[1] > max[1] ? curr : max);
            const topPersonIdOrName = topEntry[0];

            // Eğer bir CUID veya ID gibi görünüyorsa kullanıcı adını bulmaya çalış
            if (topPersonIdOrName && topPersonIdOrName.length > 20 && !topPersonIdOrName.includes(" ")) {
                try {
                    const user = await prisma.user.findUnique({
                        where: { id: topPersonIdOrName },
                        select: { name: true }
                    });
                    mostWatchedWithPerson = user?.name || topPersonIdOrName;
                } catch {
                    mostWatchedWithPerson = topPersonIdOrName;
                }
            } else {
                mostWatchedWithPerson = topPersonIdOrName;
            }
        }

        // Tavsiye eden analizi
        const recommendedByCount: Record<string, number> = {};
        activities.forEach(a => {
            if (a.recommendedByText) {
                recommendedByCount[a.recommendedByText] = (recommendedByCount[a.recommendedByText] || 0) + 1;
            }
        });
        const mostRecommendedByPerson = Object.keys(recommendedByCount).length > 0
            ? Object.entries(recommendedByCount).reduce((max, curr) => curr[1] > max[1] ? curr : max)[0]
            : 'Tarih Bekleniyor';

        // Aktif gün sayısı
        const firstActivity = activities.length > 0
            ? activities[0].createdAt
            : new Date();
        const totalDaysActive = Math.max(1, Math.ceil((Date.now() - firstActivity.getTime()) / (1000 * 60 * 60 * 24)));

        return {
            favoriteGenre,
            favoriteGenreCount,
            mostUsedPlatform,
            averageRatingTendency,
            mostWatchedWithPerson,
            mostRecommendedByPerson,
            totalDaysActive
        };
    } catch (error) {
        console.warn("[DetailedStats] Error in getPersonalInsights:", error);
        return defaultDetailedStats.personalInsights;
    }
}
