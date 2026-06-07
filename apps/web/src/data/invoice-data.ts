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
    number: "DI-2026-2101",
    customer: "Aurora Labs GmbH",
    customerEmail: "billing@aurora-labs.example",
    customerStreet: "Sonnenallee 18",
    customerZip: "10179",
    customerCity: "Berlin",
    type: "Rechnung",
    status: "Bezahlt",
    issueDate: "2026-05-06T00:00:00.000Z",
    dueDate: "2026-05-20T00:00:00.000Z",
    amount: 719.05,
    items: [
      {
        title: "UI-Konzept Dashboard",
        description: "Struktur, Komponenten und visuelle Abstimmung",
        quantity: 1,
        netPrice: 420.24
      },
      {
        title: "Frontend-Feinschliff",
        description: "Interaktionen, Abstände und responsive Anpassungen",
        quantity: 4,
        netPrice: 46
      }
    ]
  },
  {
    id: "2",
    number: "DI-2026-2102",
    customer: "Urban Commerce AG",
    customerEmail: "office@urban-commerce.example",
    customerStreet: "Hafenweg 7",
    customerZip: "20457",
    customerCity: "Hamburg",
    type: "Rechnung",
    status: "Offen",
    issueDate: "2026-05-10T00:00:00.000Z",
    dueDate: "2026-05-24T00:00:00.000Z",
    amount: 528.99,
    items: [
      {
        title: "Prozessberatung",
        description: "Workshop und Ablaufanalyse",
        quantity: 3,
        netPrice: 95
      },
      {
        title: "Schnittstellen-Konzept",
        description: "Technische Dokumentation und Integrationsplan",
        quantity: 1,
        netPrice: 159.53
      }
    ]
  },
  {
    id: "3",
    number: "DI-2026-2103",
    customer: "Polar Digital GmbH",
    customerEmail: "hello@polar-digital.example",
    customerStreet: "Nordring 24",
    customerZip: "24103",
    customerCity: "Kiel",
    type: "Rechnung",
    status: "Überfällig",
    issueDate: "2026-04-28T00:00:00.000Z",
    dueDate: "2026-05-12T00:00:00.000Z",
    amount: 1147,
    items: [
      {
        title: "Serverwartung",
        description: "Updates, Prüfung und Fehlerbehebung",
        quantity: 6,
        netPrice: 120
      },
      {
        title: "Monitoring Einrichtung",
        description: "Benachrichtigungen und Basis-Monitoring",
        quantity: 1,
        netPrice: 243.8655462184874
      }
    ]
  },
  {
    id: "4",
    number: "OF-2026-5001",
    customer: "Meridian Studio GmbH",
    customerEmail: "team@meridian-studio.example",
    customerStreet: "Atelierhof 3",
    customerZip: "50672",
    customerCity: "Koeln",
    type: "Angebot",
    status: "Entwurf",
    issueDate: "2026-05-14T00:00:00.000Z",
    dueDate: "2026-05-28T00:00:00.000Z",
    amount: 1320,
    items: [
      {
        title: "Corporate Template Set",
        description: "Rechnung, Angebot und Briefpapier",
        quantity: 1,
        netPrice: 950
      },
      {
        title: "Design-Abstimmung",
        description: "Zwei Korrekturrunden",
        quantity: 4,
        netPrice: 80
      }
    ]
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
