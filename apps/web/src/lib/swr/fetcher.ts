"use client"

export async function jsonFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const listCacheOptions = {
  dedupingInterval: 60_000,
  keepPreviousData: true,
  revalidateOnFocus: false
} as const
