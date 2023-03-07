/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    WEBSOCKET_URL: process.env.WEBSOCKET_URL,
  },
}

module.exports = nextConfig
