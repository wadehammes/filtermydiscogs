module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  outputFileTracing: false,
  compiler: {
    // ssr and displayName are configured by default
    styledComponents: true,
    reactRemoveProperties: false,
  },
  images: {
    domains: ["placehold.jp", "i.discogs.com"],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
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
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=1, stale-while-revalidate",
          },
          ...securityHeaders,
        ],
      },
      {
        source: "/fonts/averta-font/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate",
          },
          ...securityHeaders,
        ],
      },
      {
        source: "/fonts/fontface.css",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate",
          },
          ...securityHeaders,
        ],
      },
    ];
  },
};

// https://securityheaders.com
const scriptSrc = [
  "'self'",
  "'unsafe-eval'",
  "'unsafe-inline'",
  "polyfill.io",
  "*.googletagmanager.com",
];

const ContentSecurityPolicy = `
  default-src 'self';
  script-src ${scriptSrc.join(" ")};
  child-src *.youtube.com *.google.com;
  style-src 'self' 'unsafe-inline' *.googleapis.com *.google.com *.googletagmanager.com;
  img-src * blob: data: i.discogs.com;
  object-src * blob: data:;
  media-src 'self';
  connect-src *;
  frame-src * 'self' blob: data:;
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
