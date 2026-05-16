export async function GET() {
  return new Response("Finanzbericht\nNoch keine echten Finanzdaten verbunden.\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="finanzbericht.txt"'
    }
  })
}
