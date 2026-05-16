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

export default function NewProjectPage() {
  return (
    <PageShell
      title="Neues Projekt"
      description="Kundenprojekt, Budget, Status und Beschreibung anlegen."
    >
      <div className="mb-2">
        <Link
          href="/projects"
          className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 no-underline shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Zurück zu Projekten
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <ContentCard
          title="Projektdaten"
          description="Projektinformationen und Kundenzuordnung."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="PROJEKTNAME" placeholder="Website Relaunch" />

            <Select
              label="KUNDE"
              defaultValue="muster"
              options={[
                { label: "Muster GmbH", value: "muster" },
                { label: "Beispiel AG", value: "beispiel" },
                { label: "Nord Solutions", value: "nord" }
              ]}
            />

            <Input label="BUDGET" placeholder="8.500,00 €" />
            <Input label="PROJEKTNUMMER" placeholder="PR-1004" />

            <Select
              label="STATUS"
              defaultValue="planung"
              options={[
                { label: "Planung", value: "planung" },
                { label: "Aktiv", value: "aktiv" },
                { label: "Review", value: "review" },
                { label: "Abgeschlossen", value: "abgeschlossen" }
              ]}
            />

            <Select
              label="PRIORITÄT"
              defaultValue="normal"
              options={[
                { label: "Niedrig", value: "low" },
                { label: "Normal", value: "normal" },
                { label: "Hoch", value: "high" }
              ]}
            />
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-black text-slate-950">
              Beschreibung
            </h3>

            <div className="mt-5">
              <Textarea
                label="PROJEKTBESCHREIBUNG"
                placeholder="Projektziele, Umfang, Leistungen und Hinweise..."
              />
            </div>
          </div>

          <FormActions>
            <Link href="/projects" className="no-underline">
              <Button variant="secondary">Abbrechen</Button>
            </Link>

            <Button>Projekt erstellen</Button>
          </FormActions>
        </ContentCard>

        <div className="space-y-6">
          <ContentCard
            title="Projekt Setup"
            description="Vorbereitung für spätere Funktionen."
          >
            <div className="space-y-4">
              {[
                ["Kundenzuordnung", "Das Projekt wird einem Kunden zugeordnet."],
                ["Budget", "Budget und Fortschritt werden später in der Finanzübersicht genutzt."],
                ["Dokumente", "Rechnungen und Angebote können später direkt mit dem Projekt verbunden werden."]
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
                Neues Projekt
              </p>
              <p className="mt-3 text-3xl font-black">
                Planung
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
