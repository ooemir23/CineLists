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

export const env = envSchema.parse(process.env);