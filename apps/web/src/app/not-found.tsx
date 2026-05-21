import { Button, EmptyState } from "@dream-invoice/ui"

export default function NotFound() {
  return (
    <EmptyState
      title="Seite nicht gefunden"
      description="Die angeforderte Seite existiert nicht oder wurde verschoben."
      action={
        <a href="/dashboard">
          <Button>Zurück zum Dashboard</Button>
        </a>
      }
    />
  )
}
