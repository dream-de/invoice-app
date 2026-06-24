import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["@dream-invoice/premium"]
}

export default nextConfig
