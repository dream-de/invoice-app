"use client"

import { Field, IconButton, SettingCard, SoftInput } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

export default function PortalSettingsPage() {
  const { t } = useLanguage()

  return (
    <SettingsLayout
      title={t("settings.portal.title")}
      description={t("settings.portal.description")}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <SettingCard title={t("settings.portal.offer.title")}>
          <div className="space-y-4">
            <p className="text-sm font-medium leading-6 text-[#64748b]">
              {t("settings.portal.offer.description")}
            </p>

            <Field label={t("settings.portal.fields.baseUrl")}>
              <SoftInput defaultValue="https://portal.invoice.local" />
            </Field>

            <p className="text-sm font-medium text-[#64748b]">
              {t("settings.portal.hint")}
            </p>

            <Field label={t("settings.portal.fields.apiKey")}>
              <SoftInput type="password" defaultValue="" placeholder={t("settings.portal.placeholders.apiKey")} />
            </Field>

            <IconButton>{t("settings.portal.testConnection")}</IconButton>
          </div>
        </SettingCard>

        <SettingCard title={t("settings.portal.archive.title")}>
          <div className="space-y-5">
            <div className="rounded-[22px] border border-[#e5eaf0] bg-[#f8fafc] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#94a3b8]">
                {t("settings.portal.archive.accessLabel")}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#111827]">
                {t("settings.portal.archive.accessDescription")}
              </p>
            </div>

            <section className="rounded-[22px] border border-[#e5eaf0] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#111827]">{t("settings.portal.archive.paperless.title")}</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-[#64748b]">
                    {t("settings.portal.archive.paperless.description")}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  API
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <Field label={t("settings.portal.archive.fields.paperlessUrl")}>
                  <SoftInput placeholder="https://paperless.example.com" />
                </Field>
                <Field label={t("settings.portal.archive.fields.paperlessToken")}>
                  <SoftInput type="password" placeholder={t("settings.portal.archive.placeholders.token")} />
                </Field>
                <Field label={t("settings.portal.archive.fields.tags")}>
                  <SoftInput placeholder="dream-invoice, invoices" />
                </Field>
              </div>
            </section>

            <section className="rounded-[22px] border border-[#e5eaf0] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#111827]">{t("settings.portal.archive.nextcloud.title")}</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-[#64748b]">
                    {t("settings.portal.archive.nextcloud.description")}
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                  WebDAV
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <Field label={t("settings.portal.archive.fields.webdavUrl")}>
                  <SoftInput placeholder="https://cloud.example.com/remote.php/dav/files/user" />
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label={t("settings.portal.archive.fields.username")}>
                    <SoftInput placeholder={t("settings.portal.archive.placeholders.username")} />
                  </Field>
                  <Field label={t("settings.portal.archive.fields.appPassword")}>
                    <SoftInput type="password" placeholder={t("settings.portal.archive.placeholders.appPassword")} />
                  </Field>
                </div>
                <Field label={t("settings.portal.archive.fields.folder")}>
                  <SoftInput placeholder="/Dream Invoice/Rechnungen/{year}" />
                </Field>
              </div>
            </section>

            <div className="flex flex-col gap-3 rounded-[22px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#111827]">{t("settings.portal.archive.actions.title")}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-[#64748b]">
                  {t("settings.portal.archive.actions.description")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <IconButton>{t("settings.portal.archive.actions.test")}</IconButton>
                <IconButton kind="success">{t("settings.portal.archive.actions.export")}</IconButton>
              </div>
            </div>
          </div>
        </SettingCard>
      </div>
    </SettingsLayout>
  )
}
