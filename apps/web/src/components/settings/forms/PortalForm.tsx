"use client"

import { useState } from "react"

export function PortalForm() {
  const [message, setMessage] = useState("")

  return (
    <div className="space-y-8">

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Offer Portal
        </h1>

        <p className="text-sm text-neutral-500">
          Portal Einstellungen verwalten
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-black text-white px-4 py-2 text-sm">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* deine Inputs bleiben hier unverändert */}
      </div>

      <div className="flex gap-3">
        <button
          className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm shadow-md hover:shadow-xl transition"
          onClick={() => setMessage("Gespeichert")}
        >
          Speichern
        </button>

        <button
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm"
          onClick={() => setMessage("")}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
