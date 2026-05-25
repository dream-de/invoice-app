"use client"

import Link from "next/link"
import { licensePlans, type LicensePlanKey } from "@/lib/license/plans"
import { useLanguage } from "@/lib/i18n"
import { LicenseActivationForm } from "./LicenseActivationForm"

type LicenseSummary = {
  activeUsers: number
  maxUsers: number
  remainingUsers: number
  limitReached: boolean
  plan: string
  billingCycle: string
  status: string
  validUntil: string | null
}

const licenseStepKeys = [
  "settings.users.license.steps.purchase",
  "settings.users.license.steps.generate",
  "settings.users.license.steps.enter",
  "settings.users.license.steps.verify"
] as const

const permissionGroups = [
  {
    titleKey: "settings.users.permissions.invoices.title",
    descriptionKey: "settings.users.permissions.invoices.description",
    itemKeys: [
      "settings.users.permissions.invoices.view",
      "settings.users.permissions.invoices.create",
      "settings.users.permissions.invoices.edit",
      "settings.users.permissions.invoices.delete",
      "settings.users.permissions.invoices.finalize",
      "settings.users.permissions.invoices.pdf"
    ] as const
  },
  {
    titleKey: "settings.users.permissions.customers.title",
    descriptionKey: "settings.users.permissions.customers.description",
    itemKeys: [
      "settings.users.permissions.customers.viewCustomers",
      "settings.users.permissions.customers.editCustomers",
      "settings.users.permissions.customers.viewProjects",
      "settings.users.permissions.customers.editProjects"
    ] as const
  },
  {
    titleKey: "settings.users.permissions.finance.title",
    descriptionKey: "settings.users.permissions.finance.description",
    itemKeys: [
      "settings.users.permissions.finance.viewArticles",
      "settings.users.permissions.finance.editArticles",
      "settings.users.permissions.finance.viewFinance"
    ] as const
  },
  {
    titleKey: "settings.users.permissions.admin.title",
    descriptionKey: "settings.users.permissions.admin.description",
    itemKeys: [
      "settings.users.permissions.admin.settings",
      "settings.users.permissions.admin.templates",
      "settings.users.permissions.admin.system",
      "settings.users.permissions.admin.userRights"
    ] as const
  }
] as const

export function UsersAndPermissionsClient({ licenseSummary }: { licenseSummary: LicenseSummary }) {
  const { t } = useLanguage()
  const planMeta: Record<LicensePlanKey, { billing: string; note: string }> = {
    free: {
      billing: t("settings.users.plans.free.billing"),
      note: t("settings.users.plans.free.note")
    },
    starter: {
      billing: t("settings.users.plans.starter.billing"),
      note: t("settings.users.plans.starter.note")
    },
    pro: {
      billing: t("settings.users.plans.pro.billing"),
      note: t("settings.users.plans.pro.note")
    },
    team: {
      billing: t("settings.users.plans.team.billing"),
      note: t("settings.users.plans.team.note")
    },
    business: {
      billing: t("settings.users.plans.business.billing"),
      note: t("settings.users.plans.business.note")
    },
    enterprise: {
      billing: t("settings.users.plans.enterprise.billing"),
      note: t("settings.users.plans.enterprise.note")
    },
    unlimited: {
      billing: t("settings.users.plans.unlimited.billing"),
      note: t("settings.users.plans.unlimited.note")
    }
  }

  function formatUsers(maxUsers: number | null) {
    return maxUsers === null ? t("settings.users.planUsers.unlimited") : String(maxUsers)
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-6 py-8 text-[#1d2433]">
      <div className="mx-auto max-w-6xl">
        <Link href="/settings/categories" className="mb-6 inline-flex text-sm font-medium text-[#64748b] no-underline hover:text-[#111827]">
          {t("settings.users.back")}
        </Link>

        <div className="rounded-[36px] border border-[#e5eaf0] bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#94a3b8]">
                {t("settings.users.eyebrow")}
              </p>
              <h1 className="text-[32px] font-semibold tracking-tight text-[#1d2433]">
                {t("settings.users.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-[#64748b]">
                {t("settings.users.description").replace("{maxUsers}", String(licenseSummary.maxUsers))}
              </p>
            </div>

            <div className="rounded-[24px] border border-[#e5eaf0] bg-[#f8fafc] px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">{t("settings.users.currentLimit")}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[#94a3b8]">{licenseSummary.plan} · {licenseSummary.billingCycle}</p>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-[34px] font-medium leading-none text-[#111827]">{licenseSummary.activeUsers}</p>
                <p className="pb-1 text-sm font-medium text-[#64748b]">/ {licenseSummary.maxUsers} {t("settings.users.users")}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[28px] border border-[#e5eaf0] bg-[#f8fafc] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.10)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">{t("settings.users.license.eyebrow")}</p>
              <h2 className="mt-3 text-lg font-semibold text-[#111827]">{t("settings.users.license.title")}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#64748b]">
                {t("settings.users.license.description")}
              </p>

              <LicenseActivationForm />

              <div className="mt-5 rounded-[22px] border border-dashed border-[#cbd5e1] bg-white p-4">
                <p className="text-sm font-semibold text-[#111827]">{t("settings.users.license.checkTitle")}</p>
                <div className="mt-3 space-y-2">
                  {licenseStepKeys.map((stepKey, index) => (
                    <div key={stepKey} className="flex gap-3 text-sm font-medium text-[#64748b]">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef2f7] text-xs font-semibold text-[#111827]">
                        {index + 1}
                      </span>
                      <span>{t(stepKey)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-[#e5eaf0] bg-[#f8fafc] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.10)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">{t("settings.users.plans.title")}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {licensePlans.map((plan) => (
                  <div key={plan.name} className="rounded-[20px] border border-[#e5eaf0] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{plan.name}</p>
                        <p className="mt-1 text-xs font-medium text-[#94a3b8]">{planMeta[plan.key].billing}</p>
                        <p className="mt-2 text-xs font-medium text-[#64748b]">{planMeta[plan.key].note}</p>
                      </div>
                      <p className="text-lg font-medium text-[#111827]">{formatUsers(plan.maxUsers)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {permissionGroups.map((group) => (
              <section
                key={group.titleKey}
                className="rounded-[28px] border border-[#e5eaf0] bg-[#f8fafc] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.10)]"
              >
                <h2 className="text-lg font-semibold text-[#111827]">{t(group.titleKey)}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-[#64748b]">{t(group.descriptionKey)}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {group.itemKeys.map((itemKey) => (
                    <span
                      key={itemKey}
                      className="rounded-full border border-[#e5eaf0] bg-white px-3 py-1.5 text-xs font-medium text-[#475569]"
                    >
                      {t(itemKey)}
                    </span>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
