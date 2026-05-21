"use client"

import {
  Badge,
  Button,
  ContentCard,
  Currency,
  PageShell,
  StatCard
} from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

const focusCard =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"

export default function HomePage() {
  const { language } = useLanguage()
  const isEnglish = language === "en"

  const quickLinks = [
    {
      href: "/customers",
      label: isEnglish ? "Customers" : "Kunden",
      title: isEnglish ? "Open customer management" : "Kundenverwaltung oeffnen"
    },
    {
      href: "/documents",
      label: isEnglish ? "Documents" : "Dokumente",
      title: isEnglish ? "Manage invoices" : "Rechnungen verwalten"
    },
    {
      href: "/finance",
      label: isEnglish ? "Finance" : "Finanzen",
      title: isEnglish ? "View finance overview" : "Finanzuebersicht ansehen"
    },
    {
      href: "/settings/system",
      label: isEnglish ? "Settings" : "Einstellungen",
      title: isEnglish ? "Configure platform" : "Plattform konfigurieren"
    }
  ]

  return (
    <PageShell
      title="Dream Invoice"
      description={isEnglish ? "Professional invoicing and accounting platform" : "Professionelle Rechnungs- und Buchhaltungsplattform"}
    >
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <StatCard
              label={isEnglish ? "Net" : "Netto"}
              value={<Currency value={975} />}
              helper={isEnglish ? "Current preview" : "Aktuelle Vorschau"}
            />

            <StatCard
              label={isEnglish ? "Tax" : "Steuer"}
              value={<Currency value={185.25} />}
              helper={isEnglish ? "VAT" : "Umsatzsteuer"}
            />

            <StatCard
              label={isEnglish ? "Gross" : "Brutto"}
              value={<Currency value={1160.25} />}
              helper={isEnglish ? "Total amount" : "Gesamtbetrag"}
            />
          </div>

          <ContentCard
            title={isEnglish ? "Welcome back" : "Willkommen zurueck"}
            description={isEnglish ? "Jump straight into the most important platform areas" : "Starte direkt mit den wichtigsten Bereichen der Plattform"}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {quickLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl border border-neutral-200 bg-neutral-50 p-5 no-underline transition hover:bg-white hover:shadow-md ${focusCard}`}
                >
                  <p className="text-sm font-medium text-neutral-500">{item.label}</p>
                  <p className="mt-2 text-xl font-bold text-neutral-900">
                    {item.title}
                  </p>
                </a>
              ))}
            </div>
          </ContentCard>
        </div>

        <div className="space-y-6">
          <ContentCard
            title={isEnglish ? "System" : "System"}
            description={isEnglish ? "Active platform modules" : "Aktuelle Plattformmodule"}
          >
            <div className="flex flex-wrap gap-2">
              <Badge>{isEnglish ? "Monorepo active" : "Monorepo aktiv"}</Badge>
              <Badge>Shared UI</Badge>
              <Badge>Invoice Core</Badge>
            </div>
          </ContentCard>

          <ContentCard
            title={isEnglish ? "Quick Start" : "Schnellstart"}
            description={isEnglish ? "Continue working directly" : "Direkt weiterarbeiten"}
          >
            <div className="space-y-3">
              <Button className="min-h-11 w-full rounded-xl">
                {isEnglish ? "Create new invoice" : "Neue Rechnung erstellen"}
              </Button>

              <Button variant="secondary" className="min-h-11 w-full rounded-xl">
                {isEnglish ? "Add customer" : "Kunden anlegen"}
              </Button>

              <Button variant="secondary" className="min-h-11 w-full rounded-xl">
                {isEnglish ? "Open settings" : "Einstellungen oeffnen"}
              </Button>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
