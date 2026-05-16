import Link from "next/link"

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold">
          404
        </h1>

        <p className="mt-4 text-neutral-500">
          Seite nicht gefunden
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Zurück
        </Link>
      </div>
    </main>
  )
}
