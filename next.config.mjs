/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'accounts.google.com'
    ],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: '392195924334-3hdvc5ffufrbat8svngei114h6t64681.apps.googleusercontent.com',
  },
}

export default nextConfig
