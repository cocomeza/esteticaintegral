/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración TypeScript (permisiva solo en desarrollo)
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // ESLint configuration (temporal: ignorar en build)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuración para permitir Replit preview (solo en desarrollo)  
  experimental: {
    ...(process.env.NODE_ENV === 'development' && {
      allowedHosts: ['*']
    })
  },

  
  // Configuración de headers más segura
  async headers() {
    return [
      {
        // Solo aplicar headers especiales en rutas de API
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
      {
        // Headers de seguridad para todas las páginas
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options", 
            value: "SAMEORIGIN",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },

  // Configuración para módulos externos en server components
  serverExternalPackages: ['nodemailer'],

  // Webpack config para resolver el problema de módulos
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };
    return config;
  },
};

module.exports = nextConfig;
