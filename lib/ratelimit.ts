interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const MAX_STORE_ENTRIES = 5000;
const rateLimitStore = new Map<string, RateLimitEntry>();
let lastCleanupTime = Date.now();
const CLEANUP_INTERVAL_MS = 60 * 1000; // Cleanup every 1 minute

function cleanupExpiredEntries(now: number) {
    // Only cleanup periodically or if map reaches capacity
    if (now - lastCleanupTime < CLEANUP_INTERVAL_MS && rateLimitStore.size < MAX_STORE_ENTRIES) {
        return;
    }

    lastCleanupTime = now;
    for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetTime) {
            rateLimitStore.delete(k);
        }
    }


}

export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    cleanupExpiredEntries(now);

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        if (rateLimitStore.size >= MAX_STORE_ENTRIES && !entry) {
            return { allowed: false, remaining: 0, resetTime: now + windowMs };
        }
        // First request or window expired
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
    }

    if (entry.count >= limit) {
        return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    entry.count++;
    return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime };
}
