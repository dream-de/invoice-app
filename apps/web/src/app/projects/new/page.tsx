"use client"

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
import { useLanguage } from "@/lib/i18n"

export default function NewProjectPage() {
  const { t } = useLanguage()

  return (
    <PageShell
      title={t("projects.new.title")}
      description={t("projects.new.description")}
    >
      <div className="mb-2">
        <Link
          href="/projects"
          className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 no-underline shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          {t("projects.new.back")}
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <ContentCard
          title={t("projects.new.projectData.title")}
          description={t("projects.new.projectData.description")}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input label={t("projects.new.fields.projectName")} placeholder={t("projects.new.placeholders.projectName")} />

            <Select
              label={t("projects.new.fields.customer")}
              defaultValue="muster"
              options={[
                { label: "Aurora Labs GmbH", value: "muster" },
                { label: "Urban Commerce AG", value: "beispiel" },
                { label: "Polar Digital GmbH", value: "nord" }
              ]}
            />

            <Input label={t("projects.new.fields.budget")} placeholder={t("projects.new.placeholders.budget")} />
            <Input label={t("projects.new.fields.projectNumber")} placeholder={t("projects.new.placeholders.projectNumber")} />

            <Select
              label={t("projects.new.fields.status")}
              defaultValue="planung"
              options={[
                { label: t("projects.status.planning"), value: "planung" },
                { label: t("projects.status.active"), value: "aktiv" },
                { label: t("projects.status.review"), value: "review" },
                { label: t("projects.status.completed"), value: "abgeschlossen" }
              ]}
            />

            <Select
              label={t("projects.new.fields.priority")}
              defaultValue="normal"
              options={[
                { label: t("projects.priority.low"), value: "low" },
                { label: t("projects.priority.normal"), value: "normal" },
                { label: t("projects.priority.high"), value: "high" }
              ]}
            />
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-black text-slate-950">
              {t("projects.new.projectDescription.title")}
            </h3>

            <div className="mt-5">
              <Textarea
                label={t("projects.new.fields.description")}
                placeholder={t("projects.new.placeholders.description")}
              />
            </div>
          </div>

          <FormActions>
            <Link href="/projects" className="no-underline">
              <Button variant="secondary">{t("projects.actions.cancel")}</Button>
            </Link>

            <Button>{t("projects.new.actions.create")}</Button>
          </FormActions>
        </ContentCard>

        <div className="space-y-6">
          <ContentCard
            title={t("projects.new.setup.title")}
            description={t("projects.new.setup.description")}
          >
            <div className="space-y-4">
              {[
                [t("projects.new.setup.customer.title"), t("projects.new.setup.customer.copy")],
                [t("projects.new.setup.budget.title"), t("projects.new.setup.budget.copy")],
                [t("projects.new.setup.documents.title"), t("projects.new.setup.documents.copy")]
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
            title={t("projects.new.statusCard.title")}
            description={t("projects.new.statusCard.description")}
          >
            <div className="rounded-[24px] bg-blue-600 p-6 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-blue-100">
                {t("projects.new.statusCard.eyebrow")}
              </p>
              <p className="mt-3 text-3xl font-black">
                {t("projects.status.planning")}
              </p>
              <p className="mt-2 text-sm font-semibold text-blue-100">
                {t("projects.new.statusCard.copy")}
              </p>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
