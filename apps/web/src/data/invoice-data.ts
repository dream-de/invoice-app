export const customers = [
  {
    id: "1",
    name: "Aurora Labs GmbH",
    contact: "Lea Novak",
    email: "billing@aurora-labs.example",
    status: "active"
  },
  {
    id: "2",
    name: "Urban Commerce AG",
    contact: "Mira Klein",
    email: "office@urban-commerce.example",
    status: "open"
  },
  {
    id: "3",
    name: "Polar Digital GmbH",
    contact: "Noah Richter",
    email: "hello@polar-digital.example",
    status: "active"
  },
  {
    id: "4",
    name: "Meridian Studio GmbH",
    contact: "Sofia Brandt",
    email: "team@meridian-studio.example",
    status: "active"
  },
  {
    id: "5",
    name: "Rheinwerk Consulting",
    contact: "Jonas Weber",
    email: "office@rheinwerk-consulting.example",
    status: "active"
  },
  {
    id: "6",
    name: "Linden Logistics GmbH",
    contact: "Amira Seidel",
    email: "billing@linden-logistics.example",
    status: "open"
  },
  {
    id: "7",
    name: "Atlas Kreativagentur",
    contact: "Timo Berger",
    email: "kontakt@atlas-kreativ.example",
    status: "inactive"
  },
  {
    id: "8",
    name: "Greenbyte Systems AG",
    contact: "Nora Falk",
    email: "finance@greenbyte-systems.example",
    status: "active"
  }
]

export const documents = [
  {
    id: "1",
    number: "DI-2026-1001",
    customer: "Aurora Labs GmbH",
    type: "Rechnung",
    status: "Offen",
    amount: 1160.25
  },
  {
    id: "2",
    number: "OF-2026-5001",
    customer: "Urban Commerce AG",
    type: "Angebot",
    status: "Entwurf",
    amount: 2450
  },
  {
    id: "3",
    number: "DI-2026-1002",
    customer: "Polar Digital GmbH",
    type: "Rechnung",
    status: "Bezahlt",
    amount: 890
  }
]

export const articles = [
  {
    id: "1",
    name: "Beratung",
    code: "AR-1001",
    category: "Dienstleistung",
    description: "Strategische Beratung und Prozessanalyse.",
    unit: "Std",
    tax: 19,
    status: "active",
    price: 120
  },
  {
    id: "2",
    name: "Wartung",
    code: "AR-1002",
    category: "Service",
    description: "Technische Pflege und kleinere Anpassungen.",
    unit: "Std",
    tax: 19,
    status: "active",
    price: 80
  },
  {
    id: "3",
    name: "Design Paket",
    code: "AR-1003",
    category: "Projektarbeit",
    description: "UI-Konzept, Layout und visuelle Abstimmung.",
    unit: "Pauschal",
    tax: 19,
    status: "active",
    price: 850
  },
  {
    id: "4",
    name: "Hosting Betreuung",
    code: "AR-1004",
    category: "Service",
    description: "Serverpflege, Monitoring und Updates.",
    unit: "Monat",
    tax: 19,
    status: "active",
    price: 140
  },
  {
    id: "5",
    name: "Dokumentenvorlage",
    code: "AR-1005",
    category: "Produkt",
    description: "Individuelle Rechnungsvorlage mit DIN A4 Layout.",
    unit: "Stk.",
    tax: 19,
    status: "active",
    price: 260
  }
]

export const projects = [
  {
    id: "1",
    name: "Portal Relaunch",
    customer: "Aurora Labs GmbH",
    status: "Aktiv",
    progress: "70 %",
    budget: "8.500,00 €"
  },
  {
    id: "2",
    name: "Operations Integration",
    customer: "Urban Commerce AG",
    status: "Planung",
    progress: "25 %",
    budget: "18.000,00 €"
  },
  {
    id: "3",
    name: "Client Portal Setup",
    customer: "Polar Digital GmbH",
    status: "Review",
    progress: "90 %",
    budget: "4.200,00 €"
  }
]
