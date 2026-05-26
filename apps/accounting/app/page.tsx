import { designTokens } from "@dream-invoice/ui"
import Link from "next/link"

export default function HomePage() {
  return (
    <main className={designTokens.utility.ua4d0f420b7}>
      <div className={designTokens.utility.u32a71e64be}>
        <h1 className={designTokens.utility.ue4de0bd191}>
          Accounting Platform
        </h1>

        <p className={designTokens.utility.udfe74d797c}>
          Professionelle Buchhaltung und Finanzverwaltung
        </p>

        <div className={designTokens.utility.uaf6ac64dff}>
          <Link
            href="/dashboard"
            className={designTokens.utility.u08f466f9c5}
          >
            <h2 className={designTokens.utility.uba964cf8cf}>
              Dashboard
            </h2>

            <p className={designTokens.utility.u34e85d341c}>
              Finanzübersicht und KPIs
            </p>
          </Link>

          <Link
            href="/journal"
            className={designTokens.utility.u08f466f9c5}
          >
            <h2 className={designTokens.utility.uba964cf8cf}>
              Journal
            </h2>

            <p className={designTokens.utility.u34e85d341c}>
              Buchungen und Journaleinträge
            </p>
          </Link>

          <Link
            href="/accounts"
            className={designTokens.utility.u08f466f9c5}
          >
            <h2 className={designTokens.utility.uba964cf8cf}>
              Kontenplan
            </h2>

            <p className={designTokens.utility.u34e85d341c}>
              Verwaltung aller Sachkonten
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
