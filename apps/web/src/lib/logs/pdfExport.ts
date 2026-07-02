import type { LogEntry } from "./types"
import {
  buildLogFilename,
  formatDuration,
  formatLogDateTime,
  getLogLevelLabel,
  getLogModuleLabel,
  getLogStatusLabel
} from "./logFormatter"

function html(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function printDocument(logs: readonly LogEntry[], title: string) {
  const rows = logs.map((log) => `
    <tr>
      <td>${html(formatLogDateTime(log.createdAt))}</td>
      <td>${html(log.title)}</td>
      <td>${html(getLogModuleLabel(log.module))}</td>
      <td>${html(getLogLevelLabel(log.level))}</td>
      <td>${html(getLogStatusLabel(log.status))}</td>
      <td>${html(log.actor.name)}</td>
      <td>${html(log.ipAddress)}</td>
      <td>${html(log.metadata.requestId)}</td>
      <td>${html(log.metadata.endpoint)}</td>
      <td>${html(log.metadata.method)}</td>
      <td>${html(formatDuration(log.metadata.duration))}</td>
    </tr>
  `).join("")

  const popup = window.open("", "_blank", "noopener,noreferrer")
  if (!popup) return

  popup.document.write(`<!doctype html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>${html(title)}</title>
        <style>
          body { color: #111827; font-family: Inter, Arial, sans-serif; margin: 0; padding: 32px; }
          h1 { font-size: 22px; margin: 0 0 6px; }
          p { color: #64748b; margin: 0 0 20px; }
          table { border-collapse: collapse; font-size: 11px; width: 100%; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f8fafc; color: #334155; font-size: 10px; text-transform: uppercase; }
          @media print { body { padding: 18mm; } button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${html(title)}</h1>
        <p>DreamInvoice Enterprise Logs & Audit Center</p>
        <table>
          <thead>
            <tr>
              <th>Datum</th><th>Titel</th><th>Modul</th><th>Level</th><th>Status</th><th>Benutzer</th><th>IP</th><th>Request-ID</th><th>Endpoint</th><th>Methode</th><th>Dauer</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.addEventListener("load", () => window.print());</script>
      </body>
    </html>`)
  popup.document.close()
  popup.focus()
}

export function exportLogsToPdf(logs: readonly LogEntry[], filename = buildLogFilename("dreaminvoice-logs", "pdf")) {
  printDocument(logs, filename.replace(/\.pdf$/i, ""))
}

export function exportSingleLogToPdf(log: LogEntry, filename = buildLogFilename(`dreaminvoice-log-${log.id}`, "pdf", new Date(log.createdAt))) {
  printDocument([log], filename.replace(/\.pdf$/i, ""))
}

export const openLogsPdf = exportLogsToPdf
