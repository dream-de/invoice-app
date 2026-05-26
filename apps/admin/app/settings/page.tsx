import { designTokens, PageHeader } from "@dream-invoice/ui"
export default function AdminSettingsPage() {
  return (
    <main className={designTokens.utility.ua4d0f420b7}>
      <div className={designTokens.utility.u623e052301}>
        <PageHeader
          title="Einstellungen"
          description="Plattformweite Konfigurationen verwalten"
        />

        <div className={designTokens.utility.u15a5615a4b}>
          <div className={designTokens.utility.u0cf3524e8a}>
            <h2 className={designTokens.utility.u8588407212}>
              Allgemein
            </h2>

            <div className={designTokens.utility.uc52b72f5ca}>
              <div>
                <label className={designTokens.utility.uf556221233}>
                  Plattform Name
                </label>

                <input
                  defaultValue="Dream Invoice"
                  className={designTokens.utility.ue75104fa5d}
                />
              </div>

              <div>
                <label className={designTokens.utility.uf556221233}>
                  Support E-Mail
                </label>

                <input
                  defaultValue="support@example.com"
                  className={designTokens.utility.ue75104fa5d}
                />
              </div>
            </div>
          </div>

          <div className={designTokens.utility.u0cf3524e8a}>
            <h2 className={designTokens.utility.u8588407212}>
              Sicherheit
            </h2>

            <div className={designTokens.utility.uedb2e65dce}>
              <div>
                <p className={designTokens.utility.u2689f39580}>
                  Zwei Faktor Authentifizierung
                </p>

                <p className={designTokens.utility.u3554eb81da}>
                  Zusätzliche Sicherheit aktivieren
                </p>
              </div>

              <button className={designTokens.utility.ucc70d0093a}>
                Aktivieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
