export async function GET() {
  return new Response("Dokumentenexport\nNoch keine Dokumentdaten verbunden.\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dokumenten-export.txt"'
    }
  })
}
