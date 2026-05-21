export type LandingFeature = {
  title: string
  description: string
}

export type LandingMetric = {
  label: string
  value: string
}

export type LandingScreenshot = {
  title: string
  description: string
  src: string
}

export type LandingContent = {
  productName: string
  eyebrow: string
  headline: string
  subline: string
  primaryCta: string
  secondaryCta: string
  demoUrl: string
  appUrl: string
  metrics: LandingMetric[]
  screenshots: LandingScreenshot[]
  features: LandingFeature[]
  workflow: LandingFeature[]
  audience: string[]
  roadmap: string[]
}

export const landingContent: LandingContent = {
  "productName": "Dream Invoice",
  "eyebrow": "Digital Billing Workspace",
  "headline": "Billing, documents and finance in one calm workspace.",
  "subline": "Dream Invoice brings invoices, templates, customers, articles, finance imports and PDF downloads into one focused web app for daily business work.",
  "primaryCta": "Open public demo",
  "secondaryCta": "Open app",
  "demoUrl": "https://demo.dream-invoice.com",
  "appUrl": "https://app.dream-invoice.com",
  "metrics": [
    {
      "label": "Workspaces",
      "value": "8+"
    },
    {
      "label": "Exports",
      "value": "PDF / CSV"
    },
    {
      "label": "Languages",
      "value": "DE / EN"
    }
  ],
  "screenshots": [
    {
      "title": "Dashboard",
      "description": "Quick actions, metrics and notifications at the start of the workflow.",
      "src": "./assets/screenshots/dashboard.png"
    },
    {
      "title": "Documents",
      "description": "Invoices, document status, export actions and clean selection flows.",
      "src": "./assets/screenshots/documents.png"
    },
    {
      "title": "Template editor",
      "description": "A4 templates with properties, layers, live editing and preview controls.",
      "src": "./assets/screenshots/template-editor.png"
    }
  ],
  "features": [
    {
      "title": "Documents without friction",
      "description": "Invoices, offers and templates stay in one workspace with live previews and PDF output."
    },
    {
      "title": "Reusable business data",
      "description": "Customers, projects, articles, number ranges and language settings are prepared once and reused everywhere."
    },
    {
      "title": "Import and export foundation",
      "description": "CSV imports, finance account import, document export and browser-safe downloads are built as app primitives."
    }
  ],
  "workflow": [
    {
      "title": "Prepare",
      "description": "Set company data, customers, articles, number ranges and language."
    },
    {
      "title": "Create",
      "description": "Edit documents with live preview and export them as polished PDF files."
    },
    {
      "title": "Automate",
      "description": "Server worker foundation for reminders, recurring invoices and scheduled maintenance."
    }
  ],
  "audience": [
    "Freelancers and small teams",
    "Agencies and service providers",
    "Product and goods invoices"
  ],
  "roadmap": [
    "Public demo with fictional data",
    "Separated app, demo and landing domains",
    "Desktop foundation prepared later without breaking the web app"
  ]
}
