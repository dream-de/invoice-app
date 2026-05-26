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
    <main className={designTokens.admin.centeredPage}>
      <div className={designTokens.admin.errorCard}>
        <h1 className={designTokens.admin.errorTitle}>
          Fehler
        </h1>

        <p className={designTokens.admin.errorText}>
          {error.message}
        </p>

        <button
          onClick={() => reset()}
          className={designTokens.admin.errorButton}
        >
          Neu laden
        </button>
      </div>
    </main>
  )
}
