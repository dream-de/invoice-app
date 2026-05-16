export default function LoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

        <div>
          <h2 className="text-lg font-semibold text-white">
            Accounting lädt
          </h2>

          <p className="text-sm text-slate-400">
            Daten werden vorbereitet
          </p>
        </div>
      </div>
    </main>
  )
}
