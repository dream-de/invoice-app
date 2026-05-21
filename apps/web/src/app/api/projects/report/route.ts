export async function GET() {
  return new Response("Projektbericht\nNoch keine Projektdaten verbunden.\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="projektbericht.txt"'
    }
  })
}
