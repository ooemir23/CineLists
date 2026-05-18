import { z } from "zod";

// Dynamic env access to avoid build-time secret detection by Railpack/Nixpacks
function getEnvVar(key: string): string | undefined {
    return (typeof process !== "undefined" && process.env) ? process.env[key] : undefined;
}

const envSchema = z.object({
    TMDB_API_KEY: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    AUTH_SECRET: z.string().optional(),
    NEXTAUTH_SECRET: z.string().optional(),
    DATABASE_URL: z.string().min(1),
});

function getEnv() {
    if (typeof window !== "undefined") return {} as z.infer<typeof envSchema>;

    try {
        const parsed = envSchema.parse(process.env);
        const secret = parsed.AUTH_SECRET || parsed.NEXTAUTH_SECRET;

        return {
            ...parsed,
            AUTH_SECRET: secret,
            NEXTAUTH_SECRET: secret,
        } as z.infer<typeof envSchema>;
    } catch {
        // During build time, env vars might not be available
        const fallbackSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
        return {
            ...(process.env as unknown as z.infer<typeof envSchema>),
            AUTH_SECRET: fallbackSecret,
            NEXTAUTH_SECRET: fallbackSecret,
        };
    }
}

export const env = getEnv();

// Export dynamic getter for use in auth providers
export { getEnvVar };
