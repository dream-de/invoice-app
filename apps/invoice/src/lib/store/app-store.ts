"use client";

export type Customer = {
  id: string;
  code: string;
  name: string;
  contact: string;
  email: string;
  projects: number;
  status: "active" | "inactive";
};

export type Article = {
  id: string;
  code: string;
  category: string;
  name: string;
  number: string;
  net: number;
  gross: number;
  unit: string;
};

export type Project = {
  id: string;
  name: string;
  code: string;
  customer: string;
  status: string;
  start: string;
};

export type DocumentItem = {
  id: string;
  number: string;
  date: string;
  due: string;
  amount: string;
  status: "Paid" | "Open" | "Overdue" | "Draft";
};

export type AppData = {
  customers: Customer[];
  articles: Article[];
  projects: Project[];
  documents: DocumentItem[];
};

const STORAGE_KEY = "invoice-app-data";

export const defaultData: AppData = {
  customers: [
    {
      id: "1",
      code: "MU",
      name: "Musterfirma GmbH",
      contact: "Erika Beispiel",
      email: "info@musterfirma.de",
      projects: 2,
      status: "active"
    }
  ],
  articles: [
    {
      id: "1",
      code: "SE",
      category: "Entwicklung",
      name: "Senior Entwicklung",
      number: "DEV-001",
      net: 120,
      gross: 142.8,
      unit: "Std"
    }
  ],
  projects: [
    {
      id: "1",
      name: "Website Relaunch 2026",
      code: "PRJ-2026-001",
      customer: "Musterfirma GmbH",
      status: "Aktiv",
      start: "12.01.2026"
    }
  ],
  documents: [
    {
      id: "1",
      number: "RE-2026-001",
      date: "15.10.2026",
      due: "29.10.2026",
      amount: "1.250,00 €",
      status: "Paid"
    }
  ]
};

export function loadAppData(): AppData {
  if (typeof window === "undefined") return defaultData;

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  }

  try {
    return JSON.parse(raw) as AppData;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  }
}

export function saveAppData(data: AppData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetAppData() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
}
