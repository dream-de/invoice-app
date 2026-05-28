type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitOptions = {
  key: string
  windowMs: number
  maxAttempts: number
  now?: () => number
}

const store = new Map<string, RateLimitEntry>()

export class RateLimitError extends Error {
  retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super("rate_limited")
    this.name = "RateLimitError"
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
}

export function assertRateLimit({ key, windowMs, maxAttempts, now = Date.now }: RateLimitOptions) {
  const currentTime = now()
  const current = store.get(key)

  if (!current || current.resetAt <= currentTime) {
    store.set(key, { count: 1, resetAt: currentTime + windowMs })
    return
  }

  if (current.count >= maxAttempts) {
    throw new RateLimitError(Math.ceil((current.resetAt - currentTime) / 1000))
  }

  current.count += 1
}

export function clearRateLimit(key: string) {
  store.delete(key)
}
