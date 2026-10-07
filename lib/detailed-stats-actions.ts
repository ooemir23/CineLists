"use server";
import { accessibleProfileId } from "@/lib/profile-access";
import * as data from "@/lib/detailed-stats-data";
export type { DetailedStats, ViewingTimeStats, ContentAnalysisStats, SocialStats, GenreStats, TemporalStats, PersonalInsights, MonthlyActivity, WeeklyPattern } from "@/lib/detailed-stats-data";

export async function getDetailedUserStats(userId?: string) {
    const id = await accessibleProfileId(userId);
    return id ? data.getDetailedUserStats(id) : null;
}
export async function getViewingTimeStats(userId: string) {
    return await accessibleProfileId(userId) ? data.getViewingTimeStats(userId) : (await data.localizedDefaultStats()).viewingTime;
}
export async function getContentAnalysisStats(userId: string) {
    return await accessibleProfileId(userId) ? data.getContentAnalysisStats(userId) : (await data.localizedDefaultStats()).contentAnalysis;
}
export async function getSocialStats(userId: string) {
    return await accessibleProfileId(userId) ? data.getSocialStats(userId) : (await data.localizedDefaultStats()).socialStats;
}
export async function getGenreBreakdown(userId: string) {
    return await accessibleProfileId(userId) ? data.getGenreBreakdown(userId) : [];
}
export async function getTemporalStats(userId: string) {
    return await accessibleProfileId(userId) ? data.getTemporalStats(userId) : (await data.localizedDefaultStats()).temporalStats;
}
export async function getPersonalInsights(userId: string) {
    return await accessibleProfileId(userId) ? data.getPersonalInsights(userId) : (await data.localizedDefaultStats()).personalInsights;
}
