/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strip console.* calls from production builds (keep error + warn).
  // This is the cheapest, safest way to silence the 170+ scattered console
  // statements without rewriting every file.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/vi/**'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**'
      }
    ]
  }
}

export default nextConfig
