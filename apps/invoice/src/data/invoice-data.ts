export const customers = [
  {
    id: "1",
    name: "Muster GmbH",
    contact: "Erika Beispiel",
    email: "kontakt@muster.de",
    status: "Aktiv"
  },
  {
    id: "2",
    name: "Beispiel AG",
    contact: "Julia Becker",
    email: "office@beispiel.de",
    status: "Offen"
  },
  {
    id: "3",
    name: "Nord Solutions",
    contact: "Daniel Weber",
    email: "info@nord-solutions.de",
    status: "Aktiv"
  }
]

export const documents = [
  {
    id: "1",
    number: "RE-2026-1001",
    customer: "Muster GmbH",
    type: "Rechnung",
    status: "Offen",
    amount: 1160.25
  },
  {
    id: "2",
    number: "AN-2026-5001",
    customer: "Beispiel AG",
    type: "Angebot",
    status: "Entwurf",
    amount: 2450
  },
  {
    id: "3",
    number: "RE-2026-1002",
    customer: "Nord Solutions",
    type: "Rechnung",
    status: "Bezahlt",
    amount: 890
  }
]

export const articles = [
  {
    id: "1",
    name: "Beratung",
    category: "Dienstleistung",
    status: "Aktiv",
    price: 120
  },
  {
    id: "2",
    name: "Wartung",
    category: "Service",
    status: "Aktiv",
    price: 80
  },
  {
    id: "3",
    name: "Design",
    category: "Projektarbeit",
    status: "Aktiv",
    price: 85
  }
]

export const projects = [
  {
    id: "1",
    name: "Website Relaunch",
    customer: "Muster GmbH",
    status: "Aktiv",
    progress: "70 %",
    budget: "8.500,00 €"
  },
  {
    id: "2",
    name: "ERP Integration",
    customer: "Beispiel AG",
    status: "Planung",
    progress: "25 %",
    budget: "18.000,00 €"
  },
  {
    id: "3",
    name: "Portal Setup",
    customer: "Nord Solutions",
    status: "Review",
    progress: "90 %",
    budget: "4.200,00 €"
  }
]
