import {
  Badge,
  Button,
  ContentCard,
  Currency,
  PageShell,
  StatCard
} from "@invoice-platform/ui"

const focusCard =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"

export default function HomePage() {
  return (
    <PageShell
      title="Invoice Platform"
      description="Professionelle Rechnungs- und Buchhaltungsplattform"
    >
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <StatCard
              label="Netto"
              value={<Currency value={975} />}
              helper="Aktuelle Vorschau"
            />

            <StatCard
              label="Steuer"
              value={<Currency value={185.25} />}
              helper="Umsatzsteuer"
            />

            <StatCard
              label="Brutto"
              value={<Currency value={1160.25} />}
              helper="Gesamtbetrag"
            />
          </div>

          <ContentCard
            title="Willkommen zurück"
            description="Starte direkt mit den wichtigsten Bereichen der Plattform"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="/customers"
                className={`rounded-2xl border border-neutral-200 bg-neutral-50 p-5 no-underline transition hover:bg-white hover:shadow-md ${focusCard}`}
              >
                <p className="text-sm font-medium text-neutral-500">Kunden</p>
                <p className="mt-2 text-xl font-bold text-neutral-900">
                  Kundenverwaltung öffnen
                </p>
              </a>

              <a
                href="/documents"
                className={`rounded-2xl border border-neutral-200 bg-neutral-50 p-5 no-underline transition hover:bg-white hover:shadow-md ${focusCard}`}
              >
                <p className="text-sm font-medium text-neutral-500">Dokumente</p>
                <p className="mt-2 text-xl font-bold text-neutral-900">
                  Rechnungen verwalten
                </p>
              </a>

              <a
                href="/finance"
                className={`rounded-2xl border border-neutral-200 bg-neutral-50 p-5 no-underline transition hover:bg-white hover:shadow-md ${focusCard}`}
              >
                <p className="text-sm font-medium text-neutral-500">Finanzen</p>
                <p className="mt-2 text-xl font-bold text-neutral-900">
                  Finanzübersicht ansehen
                </p>
              </a>

              <a
                href="/settings/system"
                className={`rounded-2xl border border-neutral-200 bg-neutral-50 p-5 no-underline transition hover:bg-white hover:shadow-md ${focusCard}`}
              >
                <p className="text-sm font-medium text-neutral-500">Einstellungen</p>
                <p className="mt-2 text-xl font-bold text-neutral-900">
                  Plattform konfigurieren
                </p>
              </a>
            </div>
          </ContentCard>
        </div>

        <div className="space-y-6">
          <ContentCard
            title="System"
            description="Aktuelle Plattformmodule"
          >
            <div className="flex flex-wrap gap-2">
              <Badge>Monorepo aktiv</Badge>
              <Badge>Shared UI</Badge>
              <Badge>Invoice Core</Badge>
            </div>
          </ContentCard>

          <ContentCard
            title="Schnellstart"
            description="Direkt weiterarbeiten"
          >
            <div className="space-y-3">
              <Button className="min-h-11 w-full rounded-xl">
                Neue Rechnung erstellen
              </Button>

              <Button variant="secondary" className="min-h-11 w-full rounded-xl">
                Kunden anlegen
              </Button>

              <Button variant="secondary" className="min-h-11 w-full rounded-xl">
                Einstellungen öffnen
              </Button>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
