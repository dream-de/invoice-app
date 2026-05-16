"use client"

import { Button, ErrorState } from "@invoice-platform/ui"

export default function Error({
  reset
}: {
  reset: () => void
}) {
  return (
    <ErrorState
      title="Seite konnte nicht geladen werden"
      description="Beim Laden der Invoice Platform ist ein Fehler aufgetreten."
      action={<Button onClick={() => reset()}>Erneut versuchen</Button>}
    />
  )
}
