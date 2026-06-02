import type { NextConfig } from "next"

function allowedDevOrigins() {
  const origins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  if (!origins) return undefined

  const parsed = origins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  return parsed.length ? parsed : undefined
}

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: allowedDevOrigins()
}

export default nextConfig
