// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração do Proxy Reverso
  async rewrites() {
    return [
      {
        source: '/api/backend-proxy/:path*',
        destination: 'http://localhost:3001/api/densidade-wifi/:path*',
      },
    ];
  },
};
export default nextConfig; 