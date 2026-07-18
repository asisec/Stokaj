const nextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "/api/index",
      },
    ];
  },
}

module.exports = nextConfig
