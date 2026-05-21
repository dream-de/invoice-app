"use client"

import { Button, ErrorState } from "@dream-invoice/ui"

export default function Error({
  reset
}: {
  reset: () => void
}) {
  return (
    <ErrorState
      title="Seite konnte nicht geladen werden"
      description="Beim Laden von Dream Invoice ist ein Fehler aufgetreten."
      action={<Button onClick={() => reset()}>Erneut versuchen</Button>}
    />
  )
}
