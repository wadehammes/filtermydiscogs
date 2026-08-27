import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const isVercelPreview = process.env.VERCEL_ENV === "preview";

// https://securityheaders.com
const scriptSrc = isProduction
  ? [
      "'self'",
      "'unsafe-inline'",
      "*.googletagmanager.com",
      "*.google.com",
      ...(isVercelPreview ? ["vercel.live"] : []),
    ]
  : [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      "polyfill.io",
      "*.googletagmanager.com",
    ];

const connectSrc = isProduction
  ? [
      "'self'",
      "*.googletagmanager.com",
      "*.google-analytics.com",
      "*.analytics.google.com",
      "*.google.com",
      "https://www.discogs.com",
      "https://api.discogs.com",
    ]
  : ["*"];

const youtubeFrameSrc = ["*.youtube.com", "*.youtube-nocookie.com"];

const frameSrc = isProduction
  ? ["'self'", ...youtubeFrameSrc, "*.google.com", "*.googletagmanager.com"]
  : ["*"];

const ContentSecurityPolicy = `
  default-src 'self';
  script-src ${scriptSrc.join(" ")};
  child-src ${youtubeFrameSrc.join(" ")} *.google.com;
  style-src 'self' 'unsafe-inline' *.googleapis.com *.google.com *.googletagmanager.com;
  img-src 'self' blob: data: https://i.discogs.com https://img.discogs.com https://placehold.co;
  object-src 'none';
  media-src 'self';
  connect-src ${connectSrc.join(" ")};
  frame-src ${frameSrc.join(" ")};
  font-src 'self' data: fonts.gstatic.com;
  worker-src 'self' *.vercel.app;
  manifest-src 'self' *.vercel.app;
`;

const securityHeaders = [
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\n/g, ""),
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: {
    compilationMode: "annotation",
  },
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  // Native module — must stay external so Vercel traces linux sharp binaries.
  serverExternalPackages: ["sharp"],
  // Faker 10+ is ESM-only; Next’s Jest SWC pipeline must transpile it (see next/dist/build/jest/jest.js).
  transpilePackages: [
    "@faker-js/faker",
    "@tanstack/react-table",
    "@tanstack/table-core",
    "@tanstack/charts",
    "@tanstack/charts-scales",
    "@tanstack/react-charts",
  ],
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
  env: {
    DISCOGS_CONSUMER_KEY: process.env.DISCOGS_CONSUMER_KEY,
    DISCOGS_CALLBACK_URL:
      process.env.DISCOGS_CALLBACK_URL ||
      "http://localhost:6767/api/auth/callback",
    NEXT_PUBLIC_APP_BUILD_VERSION:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.VERCEL_DEPLOYMENT_ID ??
      "development",
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "development",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "i.discogs.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: isProduction ? 60 * 60 * 24 * 30 : 0,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 80, 85, 90, 95, 100],
  },
  experimental: {
    optimizePackageImports: [
      "@tanstack/react-query",
      "@tanstack/react-table",
      "@tanstack/react-charts",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "sonner",
    ],
  },
  trailingSlash: false,
  turbopack: {
    rules: {
      "*.svg": {
        as: "*.js",
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              ref: true,
              svgoConfig: {
                plugins: [
                  {
                    active: false,
                    name: "removeViewBox",
                  },
                ],
              },
              titleProp: true,
            },
          },
        ],
      },
    },
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=1, stale-while-revalidate",
          },
          ...securityHeaders,
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          ...securityHeaders,
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=1, stale-while-revalidate",
          },
          ...securityHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;
