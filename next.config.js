/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用standalone模式（Docker部署必需）
    output: 'standalone',
  typescript: { ignoreBuildErrors: true },

  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'junyuecaihong.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'junyuecaihong.com',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 性能优化（针对2核4G服务器）
  compress: true,
  poweredByHeader: false,
  
  // 实验性功能
  experimental: {
    // 减少内存使用
    optimizePackageImports: ['lucide-react'],
    // 启用Turbo
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // 环境变量
  env: {
    BAIDU_MAP_AK: process.env.BAIDU_MAP_AK,
    SITE_URL: process.env.SITE_URL,
    SITE_DOMAIN: process.env.SITE_DOMAIN,
    API_BASE_URL: process.env.API_BASE_URL,
  },
  
  // 静态文件缓存和安全头
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
    ];
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },
  
  // Webpack配置优化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 生产环境优化
    if (!dev && !isServer) {
      // 减少bundle大小
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // 将React相关库打包到一起
          react: {
            name: 'react',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 20,
          },
          // 将UI库打包到一起
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/,
            priority: 15,
          },
          // 其他第三方库
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
          },
        },
      };
    }
    
    return config;
  },
}

module.exports = nextConfig 