/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint is available via `npm run lint`; don't block production builds on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
