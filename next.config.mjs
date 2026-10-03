// 'unsafe-eval' is only required by the webpack dev server (source maps / HMR).
// No application or client dependency calls eval() or new Function(), so it is
// omitted from the production policy to keep script-src XSS protection meaningful.
const isProduction = process.env.NODE_ENV === 'production';
const scriptSrc = isProduction
  ? "'self' 'unsafe-inline' https://challenges.cloudflare.com"
  : "'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com";

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
  async headers() {
    return [
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
            value: 'max-age=63072000; includeSubDomains; preload',
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
            value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';`,
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
  // 301 Redirect for Domain Consistency: route www to non-www
  async redirects() {
    return [
      {
        source: '/stories',
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

export default nextConfig;
