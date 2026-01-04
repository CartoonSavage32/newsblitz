/** @type {import('next').NextConfig} */
const nextConfig = {
  turbo: false,
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Explicitly configure to avoid conflicts
  distDir: '.next',
};

export default nextConfig;

