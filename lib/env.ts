import { z } from "zod";

const envSchema = z.object({
    TMDB_API_KEY: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    AUTH_APPLE_ID: z.string().optional(),
    AUTH_APPLE_SECRET: z.string().optional(),
    AUTH_SECRET: z.string().min(1),
    DATABASE_URL: z.string().min(1),
});

function getEnv() {
    if (typeof window !== "undefined") return {} as z.infer<typeof envSchema>;

    try {
        return envSchema.parse(process.env);
    } catch {
        // During build time, env vars might not be available
        // Return a partial object to avoid build failures
        return process.env as unknown as z.infer<typeof envSchema>;
    }
}

export const env = getEnv();
