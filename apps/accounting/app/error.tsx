"use client"

export default function ErrorPage({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-10">
      <div className="max-w-md rounded-xl border border-red-900 bg-red-950/40 p-8">
        <h1 className="text-2xl font-bold text-red-400">
          Fehler
        </h1>

        <p className="mt-4 text-sm text-slate-300">
          {error.message}
        </p>

        <button
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Neu laden
        </button>
      </div>
    </main>
  )
}
