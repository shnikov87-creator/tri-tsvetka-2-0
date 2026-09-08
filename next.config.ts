import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Content Security Policy — разрешаем unsafe-eval, чтобы игра работала
  // на хостингах с строгим CSP (Netlify, Cloudflare, корпоративные сети).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; media-src 'self' data: blob:; object-src 'none'; frame-src 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
