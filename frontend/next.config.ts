/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove the invalid experimental flag
  // experimental: {
  //   missingSuspenseWithCSRBailout: false,
  // },
  
  async rewrites() {
    return []
  },
  
  output: undefined ,
}

module.exports = nextConfig
