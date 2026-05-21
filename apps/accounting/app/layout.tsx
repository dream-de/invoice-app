import type { Metadata } from "next"
import { NavigationShell } from "@dream-invoice/ui"
import "./globals.css"

export const metadata: Metadata = {
  title: "Accounting Platform",
  description: "Doppelte Buchhaltung und Finanzverwaltung"
}

const navItems = [
  { href: "/", label: "Start" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/journal", label: "Journal" },
  { href: "/accounts", label: "Kontenplan" }
]

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <NavigationShell
          title="Accounting"
          items={navItems}
          variant="dark"
        >
          {children}
        </NavigationShell>
      </body>
    </html>
  )
}
