/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Disable Turbopack for production builds (Cloudflare Workers compatibility)
  experimental: {},
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [],
  },
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  webpack: (config) => config,
  generateBuildId: async () => {
    return process.env.GITHUB_SHA || `build-${Date.now()}`;
  },
  /** Allow same-origin audio assets through media-src; no external audio host is needed. */
  async headers() {
    return [
      {
        source: '/:path*.(avif|webp|png|jpg|jpeg|gif|svg|ico|mp3|wav)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/((?!api|_next).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            // Cloudflare terminates TLS and overwrites this value with the zone HSTS
            // setting, whose max-age is capped at 12 months (31536000). Keep this
            // declaration identical to the served policy so the two cannot diverge.
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },

          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '') + " https://challenges.cloudflare.com https://www.googletagmanager.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.pexels.com https://www.google-analytics.com; connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com; frame-src 'self' https://challenges.cloudflare.com; media-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com; frame-ancestors 'self';",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          }],
      },
    ];
  },
  // Permanent redirects: legacy map aliases and domain consistency.
  async redirects() {
    return [
      {
        source: '/stories',
        destination: '/map',
        permanent: true,
      },
      // Both legacy URLs serve the same map page as /map (SEO audit finding
      // F-H1). Consolidate them on the canonical URL instead of letting a
      // duplicate 200 response inherit the homepage title.
      {
        source: '/lucky-map-of-canada',
        destination: '/map',
        permanent: true,
      },
      {
        source: '/where-luck-has-been-found-in-canada',
        destination: '/map',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.luckypickcanada.ca',
          },
        ],
        destination: 'https://luckypickcanada.ca/:path*',
        permanent: true,
      },
    ];
  },
};

nextConfig.env = {
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
};

export default nextConfig;
