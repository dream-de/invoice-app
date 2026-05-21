import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer } from "node:http"
import { extname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(fileURLToPath(new URL("..", import.meta.url)))
const port = Number(process.env.PORT || 4174)

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`)
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname
  const target = normalize(join(root, requestedPath))

  if (!target.startsWith(root)) {
    response.writeHead(403)
    response.end("Forbidden")
    return
  }

  try {
    const file = await stat(target)

    if (!file.isFile()) throw new Error("Not a file")

    response.writeHead(200, {
      "Content-Type": contentTypes[extname(target)] || "application/octet-stream"
    })
    createReadStream(target).pipe(response)
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
    response.end("Not found")
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Dream Invoice landing page running at http://0.0.0.0:${port}`)
})
