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
        source: '/((?!api).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  // 301 Redirect for Domain Consistency: route www to non-www
  async redirects() {
    return [
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
