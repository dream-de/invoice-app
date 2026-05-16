import type { Metadata } from "next"
import { NavigationShell } from "@invoice-platform/ui"
import "./globals.css"

export const metadata: Metadata = {
  title: "Invoice Platform",
  description: "Invoice Platform"
}

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/customers", label: "Kunden", icon: "♙" },
  { href: "/projects", label: "Projekte", icon: "◇" },
  { href: "/documents", label: "Dokumente", icon: "□" },
  { href: "/finance", label: "Finanzen", icon: "⌁" },
  { href: "/articles", label: "Artikel", icon: "▣" }
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
          title="Invoice"
          items={navigationItems}
          variant="light"
        >
          {children}
        </NavigationShell>
      </body>
    </html>
  )
}
