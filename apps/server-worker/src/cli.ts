import { pathToFileURL } from "node:url"
import { runServerWorkerCli } from "./runtime/server-worker-cli"

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { exitCode } = await runServerWorkerCli()
  process.exitCode = exitCode
}
