import type { Metadata } from "next"
import { NavigationShell } from "@dream-invoice/ui"
import "./globals.css"

export const metadata: Metadata = {
  title: "Admin Platform",
  description: "Administration von Dream Invoice"
}

const navItems = [
  { href: "/", label: "Start" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users", label: "Benutzer" },
  { href: "/settings", label: "Einstellungen" },
  { href: "/system", label: "System" }
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
          title="Admin"
          items={navItems}
        >
          {children}
        </NavigationShell>
      </body>
    </html>
  )
}
