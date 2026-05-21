import { PageHeader } from "@invoice-platform/ui"
export default function AdminSettingsPage() {
  return (
    <main className="p-10">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Einstellungen"
          description="Plattformweite Konfigurationen verwalten"
        />

        <div className="mt-10 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Allgemein
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  Plattform Name
                </label>

                <input
                  defaultValue="Dream Invoice"
                  className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Support E-Mail
                </label>

                <input
                  defaultValue="support@example.com"
                  className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Sicherheit
            </h2>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Zwei Faktor Authentifizierung
                </p>

                <p className="text-sm text-neutral-500">
                  Zusätzliche Sicherheit aktivieren
                </p>
              </div>

              <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
                Aktivieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
