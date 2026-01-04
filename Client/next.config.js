/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Explicitly configure to avoid conflicts
  distDir: '.next',
};

export default nextConfig;

