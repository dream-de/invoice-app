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
      <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-red-600">
          Fehler
        </h1>

        <p className="mt-4 text-sm text-neutral-600">
          {error.message}
        </p>

        <button
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Neu laden
        </button>
      </div>
    </main>
  )
}
