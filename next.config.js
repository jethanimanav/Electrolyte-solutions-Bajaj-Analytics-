/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: '.next-app',
  experimental: {
    workerThreads: true,
  },
}

module.exports = nextConfig
