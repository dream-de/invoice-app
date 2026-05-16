import Link from "next/link"
import {
  Button,
  ContentCard,
  FormActions,
  Input,
  PageShell,
  Select,
  Textarea
} from "@invoice-platform/ui"

export default function NewArticlePage() {
  return (
    <PageShell
      title="Neuer Artikel"
      description="Produkt, Dienstleistung oder abrechenbare Position erstellen."
    >
      <div className="mb-2">
        <Link
          href="/articles"
          className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 no-underline shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Zurück zu Artikeln
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <ContentCard
          title="Artikeldaten"
          description="Name, Kategorie, Einheit, Preis und Steuer definieren."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="ARTIKELNAME" placeholder="Beratung" />
            <Input label="ARTIKELNUMMER" placeholder="AR-1004" />

            <Select
              label="KATEGORIE"
              defaultValue="dienstleistung"
              options={[
                { label: "Dienstleistung", value: "dienstleistung" },
                { label: "Service", value: "service" },
                { label: "Projektarbeit", value: "projektarbeit" },
                { label: "Produkt", value: "produkt" }
              ]}
            />

            <Select
              label="EINHEIT"
              defaultValue="stk"
              options={[
                { label: "Stück", value: "stk" },
                { label: "Stunde", value: "std" },
                { label: "Tag", value: "tag" },
                { label: "Pauschal", value: "pauschal" }
              ]}
            />

            <Input label="NETTOPREIS" placeholder="120,00" />

            <Select
              label="MWST"
              defaultValue="19"
              options={[
                { label: "19 %", value: "19" },
                { label: "7 %", value: "7" },
                { label: "0 %", value: "0" }
              ]}
            />

            <Select
              label="STATUS"
              defaultValue="active"
              options={[
                { label: "Aktiv", value: "active" },
                { label: "Inaktiv", value: "inactive" }
              ]}
            />

            <Input label="KOSTENSTELLE" placeholder="Optional" />
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-black text-slate-950">
              Beschreibung
            </h3>

            <div className="mt-5">
              <Textarea
                label="BESCHREIBUNG"
                placeholder="Beschreibung für Rechnungstext, Angebot oder interne Hinweise..."
              />
            </div>
          </div>

          <FormActions>
            <Link href="/articles" className="no-underline">
              <Button variant="secondary">Abbrechen</Button>
            </Link>

            <Button>Artikel erstellen</Button>
          </FormActions>
        </ContentCard>

        <div className="space-y-6">
          <ContentCard
            title="Artikel Setup"
            description="Vorbereitung für Rechnungen."
          >
            <div className="space-y-4">
              {[
                ["Preislogik", "Netto, MwSt. und Brutto werden später automatisch berechnet."],
                ["Rechnungsvorlagen", "Artikel können später direkt in Rechnungen eingefügt werden."],
                ["Kategorien", "Kategorien helfen bei Auswertungen und Preislisten."]
              ].map((item) => (
                <div key={item[0]} className="rounded-[22px] bg-slate-50 p-4">
                  <p className="font-black text-slate-950">{item[0]}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {item[1]}
                  </p>
                </div>
              ))}
            </div>
          </ContentCard>

          <ContentCard
            title="Status"
            description="Neuer Datensatz."
          >
            <div className="rounded-[24px] bg-blue-600 p-6 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-blue-100">
                Neuer Artikel
              </p>
              <p className="mt-3 text-3xl font-black">
                Aktiv
              </p>
              <p className="mt-2 text-sm font-semibold text-blue-100">
                Wird aktuell als UI vorbereitet.
              </p>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
