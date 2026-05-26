import { designTokens } from "@dream-invoice/ui"
import Link from "next/link"

export default function NotFoundPage() {
  return (
    <main className={designTokens.utility.u6b1c3b20f7}>
      <div className={designTokens.utility.uca6bf63030}>
        <h1 className={designTokens.utility.u7890688d30}>
          404
        </h1>

        <p className={designTokens.utility.u0846dfd512}>
          Seite nicht gefunden
        </p>

        <Link
          href="/"
          className={designTokens.utility.u7793e4b914}
        >
          Zurück zum Dashboard
        </Link>
      </div>
    </main>
  )
}
