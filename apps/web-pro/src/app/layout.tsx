import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  applicationName: "DreamInvoice Web Pro",
  title: {
    default: "DreamInvoice Web Pro",
    template: "%s · DreamInvoice Web Pro"
  },
  description: "Premium runtime preparation for DreamInvoice."
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
