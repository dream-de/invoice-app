"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Settings } from "lucide-react"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/lib/i18n"
import { legacySettingsNav } from "@/lib/settings-nav"

export function SettingsLayout({
  title,
  description,
  children,
  action,
  status
}: {
  title: string
  description?: string
  children: ReactNode
  action?: () => void
  status?: string
}) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const isPremium = pathname?.startsWith("/dashboard-v2/settings/")
  const rootStyle = isPremium ? ({
    ["--settings-panel" as string]: "color-mix(in srgb, var(--panel) 84%, transparent)",
    ["--settings-surface" as string]: "color-mix(in srgb, var(--panel-strong) 94%, transparent)",
    ["--settings-subtle" as string]: "color-mix(in srgb, var(--panel-strong) 72%, transparent)",
    ["--settings-line" as string]: "var(--line)",
    ["--settings-title" as string]: "var(--text)",
    ["--settings-muted" as string]: "var(--muted)",
    ["--settings-label" as string]: "var(--faint)",
    ["--settings-placeholder" as string]: "var(--faint)",
    ["--settings-input-bg" as string]: "color-mix(in srgb, var(--panel-strong) 78%, transparent)",
    ["--settings-input-focus-bg" as string]: "var(--panel-strong)",
    ["--settings-input-border" as string]: "var(--line-strong)",
    ["--settings-input-shadow" as string]: "0 8px 20px color-mix(in srgb, var(--shadow-color) 6%, transparent)",
    ["--settings-accent" as string]: "var(--violet-2)",
    ["--settings-accent-soft" as string]: "color-mix(in srgb, var(--violet) 18%, transparent)",
    ["--settings-accent-strong" as string]: "#0f172a",
    ["--settings-toggle-off" as string]: "color-mix(in srgb, var(--line-strong) 90%, transparent)",
    ["--settings-card-shadow" as string]: "0 18px 36px color-mix(in srgb, var(--shadow-color) 10%, transparent)"
  }) : ({
    ["--settings-panel" as string]: "#f8f9fb",
    ["--settings-surface" as string]: "#ffffff",
    ["--settings-subtle" as string]: "#f8fafc",
    ["--settings-line" as string]: "#e5eaf0",
    ["--settings-title" as string]: "#1d2433",
    ["--settings-muted" as string]: "#64748b",
    ["--settings-label" as string]: "#64748b",
    ["--settings-placeholder" as string]: "#94a3b8",
    ["--settings-input-bg" as string]: "#f7f9fc",
    ["--settings-input-focus-bg" as string]: "#ffffff",
    ["--settings-input-border" as string]: "#e1e7ef",
    ["--settings-input-shadow" as string]: "0 6px 18px rgba(15,23,42,0.04)",
    ["--settings-accent" as string]: "#111827",
    ["--settings-accent-soft" as string]: "rgba(17,24,39,0.1)",
    ["--settings-accent-strong" as string]: "#111827",
    ["--settings-toggle-off" as string]: "#dfe6ee",
    ["--settings-card-shadow" as string]: "0 12px 30px rgba(15,23,42,0.04)"
  })

  if (isPremium) {
    return (
      <div className="space-y-3" style={rootStyle}>
        <div className="rounded-lg border border-[var(--settings-line)] bg-[var(--settings-panel)] shadow-[var(--settings-card-shadow)] backdrop-blur">
          <div className="border-b border-[var(--settings-line)] px-4 py-4 sm:px-5">
            <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--settings-title)]">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 max-w-3xl text-[13px] font-medium leading-5 text-[var(--settings-muted)]">
                {description}
              </p>
            ) : null}
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            {children}
          </div>

          <div
            className="sticky bottom-0 z-20 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--settings-line)] px-4 py-3 backdrop-blur sm:px-5"
            style={{ background: "color-mix(in srgb, var(--settings-surface) 88%, transparent)" }}
          >
            {status ? (
              <span className="mr-auto text-xs font-bold text-[var(--settings-muted)]">{status}</span>
            ) : null}
            {action ? (
              <button
                type="button"
                onClick={action}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--settings-accent-strong)] px-4 py-2 text-sm font-extrabold text-white shadow-[var(--settings-card-shadow)] transition hover:-translate-y-0.5"
              >
                <Settings className="h-4 w-4" />
                {t("settings.save")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100dvh-60px)] overflow-hidden rounded-[36px] border border-[var(--settings-line)] bg-[var(--settings-panel)] shadow-[var(--settings-card-shadow)]" style={rootStyle}>
      <div className="grid min-h-[760px] grid-cols-[315px_1fr]">
        <aside className="border-r border-[var(--settings-line)] p-7">
          <h2 className="mb-7 text-[34px] font-extrabold tracking-tight text-[var(--settings-title)]">
            {t("settings.title")}
          </h2>

          <div className="space-y-3">
            {legacySettingsNav.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/")
              const Icon = item.icon

              return (
                <Link key={item.href} href={item.href} className="block no-underline">
                  <div
                    className={`group flex items-center gap-4 rounded-[28px] px-4 py-3.5 transition-all duration-200 ${
                      active
                        ? "translate-x-1 bg-[var(--settings-surface)] text-[var(--settings-title)] shadow-[var(--settings-card-shadow)] active:ring-2 active:ring-[var(--settings-accent)] focus-within:ring-2 focus-within:ring-[var(--settings-accent)]"
                        : "text-[var(--settings-muted)] hover:-translate-y-0.5 hover:bg-[var(--settings-surface)] hover:text-[var(--settings-title)] hover:shadow-[var(--settings-card-shadow)] active:ring-2 active:ring-[var(--settings-accent)] focus-within:ring-2 focus-within:ring-[var(--settings-accent)]"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition ${
                        active
                          ? "bg-[var(--settings-accent-strong)] text-white shadow-[var(--settings-card-shadow)]"
                          : "bg-[var(--settings-subtle)] text-[var(--settings-muted)] group-hover:bg-[var(--settings-accent-strong)] group-hover:text-white group-hover:shadow-[var(--settings-card-shadow)]"
                      }`}
                    >
                      <Icon className="h-5 w-5 stroke-[2.3]" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-extrabold">
                        {item.title}
                      </p>
                      <p className={`mt-0.5 line-clamp-2 text-xs font-semibold transition ${
                        active ? "text-[var(--settings-placeholder)]" : "text-[var(--settings-placeholder)] group-hover:text-[var(--settings-muted)]"
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

        </aside>

        <main className="p-8">
          <div className="mb-7">
            <h1 className="text-[34px] font-extrabold tracking-tight text-[var(--settings-title)]">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[var(--settings-muted)]">
                {description}
              </p>
            ) : null}
          </div>

          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>

      <div
        className="sticky bottom-0 z-20 flex justify-end border-t border-[var(--settings-line)] p-6 backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--settings-surface) 85%, transparent)" }}
      >
        {status ? (
          <span className="mr-4 self-center text-sm font-bold text-[var(--settings-muted)]">{status}</span>
        ) : null}
        <button
          type="button"
          onClick={action}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--settings-accent-strong)] px-8 py-3 font-extrabold text-white shadow-[var(--settings-card-shadow)] transition hover:-translate-y-0.5"
        >
          <Settings className="h-4 w-4" />
          {t("settings.save")}
        </button>
      </div>
    </div>
  )
}
