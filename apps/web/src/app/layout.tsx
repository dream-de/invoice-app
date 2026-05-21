import type { Metadata } from "next"
import { LocalizedNavigationShell } from "@/components/LocalizedNavigationShell"
import { PageTranslationBridge } from "@/components/PageTranslationBridge"
import "./globals.css"

export const metadata: Metadata = {
  title: "Dream Invoice",
  description: "Dream Invoice"
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <LocalizedNavigationShell>{children}</LocalizedNavigationShell>
        <PageTranslationBridge />
      </body>
    </html>
  )
}
