/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    CONTROL_API_URL: process.env.CONTROL_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_CONTROL_API_URL: process.env.NEXT_PUBLIC_CONTROL_API_URL || ''
  }
};

export default nextConfig;
