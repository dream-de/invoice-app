import { designTokens } from "@dream-invoice/ui"
import Link from "next/link"

export default function NotFoundPage() {
  return (
    <main className={designTokens.utility.u59ee6928dd}>
      <div className={designTokens.utility.uca6bf63030}>
        <h1 className={designTokens.utility.u22babeb684}>
          404
        </h1>

        <p className={designTokens.utility.u26a869e00c}>
          Seite nicht gefunden
        </p>

        <Link
          href="/"
          className={designTokens.utility.u04bf589a97}
        >
          Zurück
        </Link>
      </div>
    </main>
  )
}
