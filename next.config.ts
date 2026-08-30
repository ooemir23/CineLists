import type { NextConfig } from "next";

function firstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  return undefined;
}

const deploymentId = firstEnv(
  "APP_DEPLOYMENT_ID",
  "APP_COMMIT_SHA",
  "SOURCE_COMMIT",
  "GITHUB_SHA",
  "COMMIT_SHA",
  "GIT_HASH"
);

// Bundle analyzer — enabled when ANALYZE=true (e.g. `npm run analyze`)
// Wrapped in a try/catch so the build never fails if the package is absent.
let withBundleAnalyzer = (config: NextConfig) => config;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const analyzer = require("@next/bundle-analyzer");
  withBundleAnalyzer = analyzer({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false,
  });
} catch {
  // @next/bundle-analyzer not installed — fall back to webpack-bundle-analyzer
  // via the existing `analyze` script which sets ANALYZE=true
}

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',

  deploymentId,

  generateBuildId: async () => deploymentId ?? null,

  // Image optimization
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      }
    ],
    formats: ['image/webp', 'image/avif'],
    qualities: [75, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@prisma/client'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/login',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Compression
  compress: true,

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default withBundleAnalyzer(nextConfig);
