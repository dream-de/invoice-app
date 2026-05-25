# License Tools

Dieser Ordner enthaelt die Werkzeuge und technischen Notizen fuer Dream-Invoice-Lizenzschluessel.
Das Haupt-README bleibt bewusst schlank; Details zur Lizenzlogik bleiben hier gebuendelt.

## Zweck

- Lizenzschluessel lokal erzeugen
- private Schluessel konsequent ausserhalb des Repositorys halten
- Public-Key-Pruefung in der App dokumentieren
- Sicherheits- und Workflow-Regeln nachvollziehbar halten

## Struktur

```text
tools/
  license/
    README.md
    generate-license-key.mjs
    docs/
      license-model.md
      reference-comparison.md
      security.md
      workflow.md
```

## Lizenzschluessel erzeugen

Die App prueft Lizenzschluessel mit einem Public Key ueber `LICENSE_PUBLIC_KEY`.
Der passende Private Key bleibt ausschliesslich beim Anbieter und darf nicht in GitHub,
Docker Images oder Kundeninstallationen gespeichert werden.

Beispiel:

```bash
LICENSE_PRIVATE_KEY="$(cat private-license-key.pem)" node tools/license/generate-license-key.mjs \
  --plan=pro \
  --billing=yearly \
  --days=365 \
  --customer="Demo Kunde"
```

Unterstuetzte Plaene:

`free`, `starter`, `pro`, `team`, `business`, `enterprise`, `unlimited`

## Sicherheitsregeln

- Private Keys werden niemals committed.
- Echte Kundenschluessel gehoeren nicht in Tests, Screenshots oder Demo-Daten.
- Nur Public-Key-Konfiguration darf in Deployments sichtbar sein.
- Lizenzdetails werden in der App validiert, aber sensible Signierdaten bleiben extern.

## Weitere Dokumente

- [Lizenzmodell](./docs/license-model.md)
- [Sicherheit](./docs/security.md)
- [Workflow](./docs/workflow.md)
- [Referenz-Abgleich](./docs/reference-comparison.md)
