# Finance Module Structure

Datum: 2026-06-16

## Ziel

Nur Architektur vorbereiten.  
Keine Aktivierung.  
Keine APIs.  
Keine UI.  
Keine Datenbankaenderung.

## Registry-Vorschlag

Spaetere Finance-Registry:

- Bankkonten
- Zahlungsarten
- QR-Rechnung
- PayPal
- Stripe
- Open Banking
- Zahlungsabgleich

## Empfohlene Struktur

```text
apps/web/src/modules/finance/
  config.ts
  README.md
  registry/
    bank-accounts.ts
    payment-methods.ts
    qr-billing.ts
    paypal.ts
    stripe.ts
    open-banking.ts
    reconciliation.ts
```

## Minimaler Registry-Typ

```ts
type FinanceCapability = {
  key: string
  label: string
  status: "planned" | "prepared" | "active"
  requiresLicense?: boolean
  requiresServerSetup?: boolean
}
```

## Erstbelegung

- `bank-accounts` -> `prepared`
- `payment-methods` -> `prepared`
- `qr-billing` -> `prepared`
- `paypal` -> `planned`
- `stripe` -> `planned`
- `open-banking` -> `planned`
- `reconciliation` -> `planned`

## Wichtig

In CORE-1 wurde bewusst keine Aktivierung umgesetzt:

- keine Zahlungsprovider
- keine Banking-Anbindung
- keine API-Routen
- keine neue UI
- keine Migration

## Ergebnis

Finance ist fuer eine spaetere modulare Erweiterung sauber beschrieben, aber absichtlich noch nicht aktiv.
