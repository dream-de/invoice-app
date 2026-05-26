"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@dream-invoice/ui";
import { useLanguage } from "@/lib/i18n";

type TemplateRecord = {
  id: string;
  name: string;
  type: "invoice" | "offer";
  active?: boolean;
  updatedAt?: string;
};

export default function TemplatesPage() {
  const [tab, setTab] = useState<"invoice" | "offer">("invoice");
  const [items, setItems] = useState<TemplateRecord[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/templates?type=${tab}`, { cache: "no-store" });
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      }
    })();
  }, [tab]);

  return (
    <div className="rounded-[22px] border border-[#e3e9f1] bg-[#f8f9fb] p-6 shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1d2433]">{t("templates.overview.title")}</h1>
          <p className="mt-1 text-sm font-medium text-[#64748b]">{t("templates.overview.description")}</p>
        </div>

        <div className="inline-flex rounded-full bg-[#eceff3] p-1">
          <button
            className={`rounded-full px-5 py-2 text-sm font-extrabold ${tab === "invoice" ? "bg-white text-[#111827] shadow" : "text-[#7a879c]"}`}
            onClick={() => setTab("invoice")}
          >
            {t("templates.overview.tabs.invoices")}
          </button>
          <button
            className={`rounded-full px-5 py-2 text-sm font-extrabold ${tab === "offer" ? "bg-white text-[#111827] shadow" : "text-[#7a879c]"}`}
            onClick={() => setTab("offer")}
          >
            {t("templates.overview.tabs.offers")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href={tab === "invoice" ? "/documents/templates/new/invoice" : "/documents/templates/new/offer"}
          className="no-underline"
        >
          <div className="flex h-[220px] flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-[#d6dde8] bg-[#f3f6fa] transition hover:bg-[#edf2f8]">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-[#94a3b8] shadow">
              +
            </div>
            <p className="text-xl font-extrabold text-[#8b97aa]">
              {tab === "invoice" ? t("templates.overview.create.invoice") : t("templates.overview.create.offer")}
            </p>
          </div>
        </Link>

        {items.map((item) => (
          <div key={item.id} className="rounded-[18px] border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <div className="mb-3 inline-flex rounded-full bg-[#d8f63c] px-3 py-1 text-xs font-extrabold text-black">
              {item.active ? t("templates.overview.badge.active") : t("templates.overview.badge.template")}
            </div>
            <h3 className="text-xl font-black leading-tight text-[#1f2937]">{item.name}</h3>
            <p className="mt-1 text-sm text-[#64748b]">A4 • {item.type === "invoice" ? t("templates.overview.format.invoice") : t("templates.overview.format.offer")}</p>

            <div className="mt-6 flex gap-2">
              <Link href={`/documents/templates/default/edit?templateId=${item.id}`} className="no-underline">
                <Button variant="secondary">{t("templates.overview.actions.edit")}</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
