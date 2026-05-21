export * from "./license/routes"

export const serverApiProfile = {
  id: "server-api",
  label: "Dream Invoice Server API",
  plannedDomains: ["license", "sync", "public-api"]
} as const
