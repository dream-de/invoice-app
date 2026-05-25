import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"

export const dynamic = "force-dynamic"

const fallbackCompanySettings = {
  id: "demo-company-settings",
  company: "Dream Ledger GmbH",
  owner: "Lena Falk",
  street: "Lindenallee 42",
  zip: "10115",
  city: "Koeln",
  country: "Deutschland",
  email: "office@dream-ledger.example",
  phone: "+49 30 1234567",
  website: "www.dream-ledger.example",
  taxNumber: "12/345/67890",
  vatId: "DE123456789",
  iban: "DE12 1005 0000 1234 5678 90",
  bic: "BELA DE BE XXX",
  bankName: "Koelner Sparkasse",
  registerCourt: "Amtsgericht Charlottenburg HRB 12345",
  logoUrl: null
}


export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(fallbackCompanySettings)
  }

  try {
    const settings = await prisma.companySettings.findFirst({
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(settings ?? fallbackCompanySettings)
  } catch (err) {
    console.error(err)
    return NextResponse.json(fallbackCompanySettings)
  }
}
