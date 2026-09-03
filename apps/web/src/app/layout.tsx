import type { Metadata } from "next"
import { LocalizedNavigationShell } from "@/components/LocalizedNavigationShell"
import { PageTranslationBridge } from "@/components/PageTranslationBridge"
import { getCurrentUser } from "@/lib/auth/service"
import { demoSessionUser, isPublicDemoMode } from "@/lib/demo-mode"
import "./globals.css"

export const metadata: Metadata = {
  applicationName: "DreamInvoice",
  title: {
    default: "DreamInvoice",
    template: "%s · DreamInvoice"
  },
  description: "SMART • SIMPLE • SECURE",
  keywords: ["DreamInvoice", "invoicing", "premium workspace", "business management"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/favicon.svg",
    apple: "/brand/app-icon.svg"
  }
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const currentUser = isPublicDemoMode() ? demoSessionUser : await getCurrentUser().catch(() => null)
  const shellUser = currentUser
    ? {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        status: currentUser.status,
        permissions: currentUser.permissions
      }
    : null

  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <LocalizedNavigationShell initialUser={shellUser}>{children}</LocalizedNavigationShell>
        <PageTranslationBridge />
      </body>
    </html>
  )
}
