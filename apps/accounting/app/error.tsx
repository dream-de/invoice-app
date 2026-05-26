"use client"

import { designTokens } from "@dream-invoice/ui"

export default function ErrorPage({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className={designTokens.utility.u6b1c3b20f7}>
      <div className={designTokens.utility.u794af4e5bc}>
        <h1 className={designTokens.utility.u432ca38431}>
          Fehler
        </h1>

        <p className={designTokens.utility.ud54a74882f}>
          {error.message}
        </p>

        <button
          onClick={() => reset()}
          className={designTokens.utility.uc8fb474da8}
        >
          Neu laden
        </button>
      </div>
    </main>
  )
}
