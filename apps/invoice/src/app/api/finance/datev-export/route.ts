export async function GET() {
  return new Response("DATEV Export\nNoch keine echten Buchungsdaten verbunden.\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="datev-export.txt"'
    }
  })
}
