import Link from "next/link"

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-10">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white">
          404
        </h1>

        <p className="mt-4 text-slate-400">
          Seite nicht gefunden
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Zurück zum Dashboard
        </Link>
      </div>
    </main>
  )
}
