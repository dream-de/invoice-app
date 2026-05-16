"use client"

import { Field, IconButton, SettingCard, SoftInput, Trash2 } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"

export default function CategoriesSettingsPage() {
  const categories = ["Speisen", "Getränke", "Dessert", "Menü"]

  return (
    <SettingsLayout
      title="Kategorien"
      description="Kategorien für Produkte & Leistungen. Änderungen können beim Speichern automatisch in Artikeln übernommen werden."
    >
      <SettingCard title="Kategorien">
        <div className="mb-4 flex justify-end">
          <IconButton kind="success">+ Kategorie</IconButton>
        </div>

        <div className="space-y-3">
          {categories.map((name, index) => (
            <div key={name} className="grid grid-cols-[64px_1fr_auto] items-end gap-3 rounded-[22px] border border-[#edf2f7] bg-[#f8fafc] p-4">
              <div className="pb-3 text-sm font-extrabold text-[#94a3b8]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <Field label="Name">
                <SoftInput defaultValue={name} />
              </Field>
              <button className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
