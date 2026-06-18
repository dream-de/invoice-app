"use client"

import { Download, RotateCcw, SettingCard } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { LanguageSettings } from "./LanguageSettings"
import { useLanguage } from "@/lib/i18n"

export default function SystemSettingsPage() {
  const { t } = useLanguage()

  const systemStatus = [
    ["Sprache", "Lokalisierung und Anzeigeoptionen sind im Systembereich gebuendelt.", "Aktiv"],
    ["Audit-Protokoll", "Audit-Ereignisse werden im Premium-Auditbereich angezeigt.", "Aktiv"],
    ["Backup", "Backup-Aktionen bleiben vorbereitet, solange keine echte Infrastruktur angebunden ist.", "Vorbereitet"],
    ["Wiederherstellung", "Restore bleibt als vorbereiteter Systembereich markiert.", "Vorbereitet"]
  ]

  return (
    <SettingsLayout
      title={t("settings.system.title")}
      description={t("settings.system.description")}
    >
      <LanguageSettings />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SettingCard title="Systemstatus" description="Zentrale Systembereiche mit ehrlichem Aktiv- oder Vorbereitet-Status.">
          <div className="space-y-3">
            {systemStatus.map(([title, detail, status]) => {
              const isActive = status === "Aktiv"

              return (
                <div key={title} className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-3">
                  <div>
                    <p className="text-sm font-extrabold text-[var(--settings-title)]">{title}</p>
                    <p className="mt-1 text-xs font-medium text-[var(--settings-muted)]">{detail}</p>
                  </div>
                  <span className={isActive ? "rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[11px] font-extrabold text-emerald-700" : "rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]"}>
                    {status}
                  </span>
                </div>
              )
            })}
          </div>
        </SettingCard>

        <SettingCard title={t("settings.audit.title")} description={t("settings.audit.description")}>
          <div className="grid gap-3">
            {[
              [t("settings.audit.verify"), "Audit-Daten im Premium-Auditbereich pruefen", "Aktiv"],
              [t("settings.audit.export"), "Export nur ueber vorhandene Audit-Exportlogik", "Teilweise aktiv"]
            ].map(([title, detail, status]) => (
              <div key={title} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-[var(--settings-title)]">{title}</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-[var(--settings-muted)]">{detail}</p>
                  </div>
                  <span className="rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[11px] font-extrabold text-emerald-700">{status}</span>
                </div>
              </div>
            ))}
          </div>
        </SettingCard>
      </div>

      <SettingCard title={t("settings.backup.title")} description="Backup und Wiederherstellung werden modern angezeigt, aber nicht als produktiv ausgefuehrt, solange keine echte Backup-Infrastruktur angebunden ist.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-[var(--settings-title)]">{t("settings.backup.createTitle")}</h4>
                <p className="mt-1 text-sm font-medium leading-6 text-[var(--settings-muted)]">{t("settings.backup.createDescription")}</p>
              </div>
              <span className="rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]">Vorbereitet</span>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--settings-line)] bg-[var(--settings-surface)] px-4 py-2 text-sm font-extrabold text-[var(--settings-muted)]">
              <Download className="h-4 w-4" />
              {t("settings.backup.create")}
            </div>
          </div>

          <div className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-[var(--settings-title)]">{t("settings.backup.restoreTitle")}</h4>
                <p className="mt-1 text-sm font-medium leading-6 text-[var(--settings-muted)]">{t("settings.backup.restoreDescription")}</p>
              </div>
              <span className="rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]">Vorbereitet</span>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--settings-line)] bg-[var(--settings-surface)] px-4 py-2 text-sm font-extrabold text-[var(--settings-muted)]">
              <RotateCcw className="h-4 w-4" />
              {t("settings.backup.restore")}
            </div>
          </div>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
