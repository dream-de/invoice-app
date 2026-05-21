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
} from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

export default function NewArticlePage() {
  const { t } = useLanguage()

  return (
    <PageShell
      title={t("articles.new.title")}
      description={t("articles.new.description")}
    >
      <div className="mb-2">
        <Link
          href="/articles"
          className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 no-underline shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          {t("articles.new.back")}
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <ContentCard
          title={t("articles.new.articleData.title")}
          description={t("articles.new.articleData.description")}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input label={t("articles.new.fields.name")} placeholder={t("articles.new.placeholders.name")} />
            <Input label={t("articles.new.fields.number")} placeholder={t("articles.new.placeholders.number")} />

            <Select
              label={t("articles.new.fields.category")}
              defaultValue="dienstleistung"
              options={[
                { label: t("articles.categories.serviceWork"), value: "dienstleistung" },
                { label: t("articles.categories.service"), value: "service" },
                { label: t("articles.categories.projectWork"), value: "projektarbeit" },
                { label: t("articles.categories.product"), value: "produkt" }
              ]}
            />

            <Select
              label={t("articles.new.fields.unit")}
              defaultValue="stk"
              options={[
                { label: t("articles.units.piece"), value: "stk" },
                { label: t("articles.units.hour"), value: "std" },
                { label: t("articles.units.day"), value: "tag" },
                { label: t("articles.units.flat"), value: "pauschal" }
              ]}
            />

            <Input label={t("articles.new.fields.netPrice")} placeholder={t("articles.new.placeholders.netPrice")} />

            <Select
              label={t("articles.new.fields.vat")}
              defaultValue="19"
              options={[
                { label: "19 %", value: "19" },
                { label: "7 %", value: "7" },
                { label: "0 %", value: "0" }
              ]}
            />

            <Select
              label={t("articles.new.fields.status")}
              defaultValue="active"
              options={[
                { label: t("articles.status.active"), value: "active" },
                { label: t("articles.status.inactive"), value: "inactive" }
              ]}
            />

            <Input label={t("articles.new.fields.costCenter")} placeholder={t("articles.new.placeholders.costCenter")} />
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-black text-slate-950">
              {t("articles.new.articleDescription.title")}
            </h3>

            <div className="mt-5">
              <Textarea
                label={t("articles.new.fields.description")}
                placeholder={t("articles.new.placeholders.description")}
              />
            </div>
          </div>

          <FormActions>
            <Link href="/articles" className="no-underline">
              <Button variant="secondary">{t("articles.actions.cancel")}</Button>
            </Link>

            <Button>{t("articles.new.actions.create")}</Button>
          </FormActions>
        </ContentCard>

        <div className="space-y-6">
          <ContentCard
            title={t("articles.new.setup.title")}
            description={t("articles.new.setup.description")}
          >
            <div className="space-y-4">
              {[
                [t("articles.new.setup.priceLogic.title"), t("articles.new.setup.priceLogic.copy")],
                [t("articles.new.setup.invoiceTemplates.title"), t("articles.new.setup.invoiceTemplates.copy")],
                [t("articles.new.setup.categories.title"), t("articles.new.setup.categories.copy")]
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
            title={t("articles.new.statusCard.title")}
            description={t("articles.new.statusCard.description")}
          >
            <div className="rounded-[24px] bg-blue-600 p-6 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-blue-100">
                {t("articles.new.statusCard.eyebrow")}
              </p>
              <p className="mt-3 text-3xl font-black">
                {t("articles.status.active")}
              </p>
              <p className="mt-2 text-sm font-semibold text-blue-100">
                {t("articles.new.statusCard.copy")}
              </p>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
