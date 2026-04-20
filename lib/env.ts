import { z } from "zod";

// Dynamic env access to avoid build-time secret detection by Railpack/Nixpacks
function getEnvVar(key: string): string | undefined {
    return (typeof process !== "undefined" && process.env) ? process.env[key] : undefined;
}

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
        return process.env as unknown as z.infer<typeof envSchema>;
    }
}

export const env = getEnv();

// Export dynamic getter for use in auth providers
export { getEnvVar };
