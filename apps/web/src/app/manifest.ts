import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DreamInvoice",
    short_name: "DreamInvoice",
    description: "SMART • SIMPLE • SECURE",
    start_url: "/dashboard-v2",
    scope: "/",
    display: "standalone",
    background_color: "#f7f8fb",
    theme_color: "#0f172a",
    icons: [{ src: "/brand/app-icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" }]
  }
}
